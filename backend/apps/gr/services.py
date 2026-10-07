from __future__ import annotations

import uuid
from datetime import date, time, timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.accounts.services import write_audit
from apps.integrations.adapters import get_payment_adapter, get_sms_adapter
from apps.notifications.services import queue_notification
from apps.workflow.services import start_case, transition_case

from .models import AdmitCard, Advertisement, Application, ExamCentre, Requisition

STATUS_FLOW = [
    Requisition.Status.DRAFT,
    Requisition.Status.UNDER_RR,
    Requisition.Status.COMMISSION,
    Requisition.Status.SYLLABUS,
    Requisition.Status.ADVERTISED,
    Requisition.Status.APPLICATIONS,
    Requisition.Status.PRE_EXAM,
    Requisition.Status.EXAM,
    Requisition.Status.RESULT,
    Requisition.Status.SCRUTINY,
    Requisition.Status.NOMINATION,
    Requisition.Status.CLOSED,
]

STATUS_TO_STATE = {
    Requisition.Status.DRAFT: "REQ_RECEIVED",
    Requisition.Status.UNDER_RR: "RR_CHECK",
    Requisition.Status.COMMISSION: "COMMISSION",
    Requisition.Status.SYLLABUS: "SYLLABUS",
    Requisition.Status.ADVERTISED: "ADVERTISED",
    Requisition.Status.APPLICATIONS: "APPLICATIONS",
    Requisition.Status.PRE_EXAM: "PRE_EXAM",
    Requisition.Status.EXAM: "EXAM",
    Requisition.Status.RESULT: "RESULT",
    Requisition.Status.SCRUTINY: "SCRUTINY",
    Requisition.Status.NOMINATION: "NOMINATION",
    Requisition.Status.CLOSED: "CLOSED",
}


@transaction.atomic
def create_requisition(*, data: dict, user) -> Requisition:
    req = Requisition.objects.create(**data, created_by=user)
    case = start_case(
        workflow_code="GR_LIFECYCLE",
        reference_type="Requisition",
        reference_id=req.pk,
        title=f"{req.case_number}: {req.post_title}",
        created_by=user,
    )
    req.case = case
    req.save(update_fields=["case"])
    write_audit(
        actor=user,
        action="CREATE",
        entity_type="Requisition",
        entity_id=req.pk,
        detail={"case_number": req.case_number},
    )
    return req


@transaction.atomic
def advance_requisition(*, requisition: Requisition, user, note: str = "") -> Requisition:
    try:
        idx = STATUS_FLOW.index(requisition.status)
    except ValueError as exc:
        raise ValidationError("Unknown status") from exc
    if idx >= len(STATUS_FLOW) - 1:
        raise ValidationError("Already at terminal status.")
    next_status = STATUS_FLOW[idx + 1]
    if requisition.case:
        transition_case(
            case=requisition.case,
            to_state_code=STATUS_TO_STATE[next_status],
            actor=user,
            note=note,
        )
    requisition.status = next_status
    if next_status == Requisition.Status.UNDER_RR:
        # Auto-flag simple mismatches
        flags = []
        if requisition.bps < 16:
            flags.append("BPS below GR threshold (16+)")
        if not requisition.domicile_required:
            flags.append("Domicile not specified")
        requisition.rr_mismatch_flags = flags
        requisition.recruitment_rules_ok = len(flags) == 0
    requisition.save()
    write_audit(
        actor=user,
        action="ADVANCE",
        entity_type="Requisition",
        entity_id=requisition.pk,
        detail={"status": next_status, "note": note},
    )
    return requisition


@transaction.atomic
def submit_application(*, candidate, advertisement_id: int, requisition_id=None, documents=None) -> Application:
    ad = Advertisement.objects.filter(pk=advertisement_id, is_published=True).first()
    if not ad:
        raise ValidationError("Advertisement not found or not published.")
    if ad.close_date and ad.close_date < date.today():
        raise ValidationError("Application deadline has passed.")
    req = None
    if requisition_id:
        req = Requisition.objects.filter(pk=requisition_id).first()
    tracking = f"APP-{uuid.uuid4().hex[:10].upper()}"
    app, created = Application.objects.get_or_create(
        advertisement=ad,
        candidate=candidate,
        requisition=req,
        defaults={
            "tracking_id": tracking,
            "status": Application.Status.FEE_PENDING,
            "documents": documents or {},
            "submitted_at": timezone.now(),
        },
    )
    if not created:
        raise ValidationError("You have already applied for this post.")
    queue_notification(
        user=candidate,
        channel="EMAIL",
        template_code="APP_SUBMITTED",
        subject="Application received",
        body=f"Your application {app.tracking_id} was received. Please pay the fee.",
        context={"tracking_id": app.tracking_id},
    )
    return app


@transaction.atomic
def pay_application_fee(*, application: Application, user) -> Application:
    if application.candidate_id != user.pk and not user.is_staff:
        raise ValidationError("Not your application.")
    if application.fee_paid:
        raise ValidationError("Fee already paid.")
    amount = application.advertisement.fee_amount
    adapter = get_payment_adapter()
    result = adapter.charge(
        amount=float(amount),
        reference=application.tracking_id,
        payer_cnic=user.cnic or user.username,
    )
    application.fee_paid = True
    application.payment_ref = result["transaction_id"]
    application.status = Application.Status.FEE_PAID
    application.save()
    get_sms_adapter().send(
        phone=user.phone or "03000000000",
        message=f"FPSC fee paid for {application.tracking_id}. Ref {application.payment_ref}",
    )
    queue_notification(
        user=user,
        channel="SMS",
        template_code="FEE_PAID",
        subject="Fee paid",
        body=f"Payment confirmed: {application.payment_ref}",
        context=result,
    )
    return application


@transaction.atomic
def assign_roll_and_admit(*, application: Application, centre: ExamCentre | None = None) -> AdmitCard:
    if not application.fee_paid:
        raise ValidationError("Fee not paid.")
    if not application.roll_number:
        application.roll_number = f"R{application.pk:06d}"
    centre = centre or ExamCentre.objects.first()
    if not centre:
        raise ValidationError("No exam centre configured.")
    application.centre = centre
    application.status = Application.Status.ELIGIBLE
    application.save()
    card, _ = AdmitCard.objects.update_or_create(
        application=application,
        defaults={
            "exam_date": date.today() + timedelta(days=21),
            "exam_time": time(9, 0),
            "centre": centre,
            "hall": "Hall A",
            "instructions": "Bring original CNIC. Reporting time 08:30.",
        },
    )
    return card


def run_scrutiny(*, application: Application, user) -> Application:
    """
    Rule-based automated scrutiny (GR-1.7 / UEM-3.6 / CC-03).
    Configurable weights via advertisement metadata or defaults.
    """
    profile = getattr(application.candidate, "candidate_profile", None)
    docs = application.documents or {}
    rules = {
        "education": 20,
        "experience": 15,
        "domicile": 10,
        "quota": 5,
        "cnic_doc": 10,
        "degree_doc": 15,
        "age_ok": 10,
        "base": 15,
    }
    ad_meta = {}
    if application.advertisement_id:
        # optional future: store rules on advertisement
        ad_meta = getattr(application.advertisement, "metadata", None) or {}
    if isinstance(ad_meta, dict) and ad_meta.get("scrutiny_weights"):
        rules.update(ad_meta["scrutiny_weights"])

    score = float(rules.get("base", 15))
    notes: list[str] = []
    fails: list[str] = []

    if profile and profile.education_summary:
        score += rules["education"]
        notes.append("Education summary present")
    else:
        fails.append("Missing education summary")

    if profile and profile.experience_summary:
        score += rules["experience"]
        notes.append("Experience summary present")
    else:
        fails.append("Missing experience")

    if profile and profile.domicile:
        score += rules["domicile"]
        notes.append(f"Domicile: {profile.domicile}")
    else:
        fails.append("Domicile not declared")

    if profile and profile.quota:
        score += rules["quota"]
        notes.append(f"Quota: {profile.quota}")

    if docs.get("cnic") or docs.get("CNIC"):
        score += rules["cnic_doc"]
        notes.append("CNIC document uploaded")
    else:
        fails.append("CNIC document missing")

    if docs.get("degree") or docs.get("Degree"):
        score += rules["degree_doc"]
        notes.append("Degree document uploaded")
    else:
        fails.append("Degree document missing")

    # Age gate: if DOB present and age between 18–40 (configurable stub)
    if profile and profile.date_of_birth:
        from datetime import date as date_cls

        today = date_cls.today()
        age = (
            today.year
            - profile.date_of_birth.year
            - (
                (today.month, today.day)
                < (profile.date_of_birth.month, profile.date_of_birth.day)
            )
        )
        if 18 <= age <= 40:
            score += rules["age_ok"]
            notes.append(f"Age OK ({age})")
        else:
            fails.append(f"Age out of range ({age})")

    # CNIC format check on user
    cnic = (application.candidate.cnic or "").replace("-", "")
    if len(cnic) == 13 and cnic.isdigit():
        notes.append("CNIC format valid")
    else:
        fails.append("Invalid CNIC format")
        score = max(0, score - 10)

    application.scrutiny_score = min(score, 100)
    application.scrutiny_notes = (
        "PASS: " + "; ".join(notes) if notes else "No positives"
    )
    if fails:
        application.scrutiny_notes += " | FAIL: " + "; ".join(fails)
    application.status = (
        Application.Status.SHORTLISTED
        if application.scrutiny_score >= 60 and not (
            "Invalid CNIC format" in fails and application.scrutiny_score < 70
        )
        else Application.Status.REJECTED
        if application.scrutiny_score < 60
        else Application.Status.SHORTLISTED
    )
    application.save()
    write_audit(
        actor=user,
        action="SCRUTINY",
        entity_type="Application",
        entity_id=application.pk,
        detail={
            "score": float(application.scrutiny_score),
            "status": application.status,
            "fails": fails,
        },
    )
    return application
