from django.db.models import Count
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError

from apps.accounts.exceptions import success_response
from apps.accounts.permissions import IsStaffUser
from apps.gr.models import Application, ExamCentre
from apps.notifications.services import queue_notification
from apps.workflow.services import start_case

from .models import (
    Correspondence,
    ExamType,
    Marksheet,
    MeritList,
    PreExamReport,
    QuotaRoster,
    ScheduleSlot,
    UEMExamInstance,
    UEMRequisition,
)
from .serializers import (
    CorrespondenceSerializer,
    ExamTypeSerializer,
    MarksheetSerializer,
    MeritListSerializer,
    PreExamReportSerializer,
    QuotaRosterSerializer,
    ScheduleSlotSerializer,
    UEMExamInstanceSerializer,
    UEMRequisitionSerializer,
)


class StaffModelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaffUser]

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        return success_response(self.get_serializer(qs, many=True).data)

    def retrieve(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_object()).data)

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj = ser.save()
        return success_response(self.get_serializer(obj).data, "Created", 201)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        ser = self.get_serializer(instance, data=request.data, partial=partial)
        ser.is_valid(raise_exception=True)
        ser.save()
        return success_response(ser.data, "Updated")


class ExamTypeViewSet(StaffModelViewSet):
    queryset = ExamType.objects.all()
    serializer_class = ExamTypeSerializer


class UEMExamInstanceViewSet(StaffModelViewSet):
    queryset = UEMExamInstance.objects.select_related("exam_type").all()
    serializer_class = UEMExamInstanceSerializer
    filterset_fields = ["exam_type", "current_stage"]

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        exam_type = ser.validated_data["exam_type"]
        stages = exam_type.stages or ["START", "END"]
        obj = ser.save(current_stage=stages[0])
        case = start_case(
            workflow_code="UEM_GENERIC",
            reference_type="UEMExamInstance",
            reference_id=obj.pk,
            title=obj.title,
            created_by=request.user,
            metadata={"exam_type": exam_type.code},
        )
        obj.case = case
        obj.save(update_fields=["case"])
        return success_response(UEMExamInstanceSerializer(obj).data, "Created", 201)

    @action(detail=True, methods=["post"])
    def advance_stage(self, request, pk=None):
        inst = self.get_object()
        stages = inst.exam_type.stages or []
        if inst.current_stage not in stages:
            raise ValidationError("Current stage not in exam type definition.")
        idx = stages.index(inst.current_stage)
        if idx >= len(stages) - 1:
            raise ValidationError("Already at final stage.")
        inst.current_stage = stages[idx + 1]
        inst.save(update_fields=["current_stage"])
        return success_response(UEMExamInstanceSerializer(inst).data, "Stage advanced")

    @action(detail=True, methods=["get"])
    def statistics(self, request, pk=None):
        inst = self.get_object()
        ad_id = inst.advertisement_id
        apps = Application.objects.filter(advertisement_id=ad_id) if ad_id else Application.objects.none()
        data = {
            "exam": UEMExamInstanceSerializer(inst).data,
            "requisitions": inst.requisitions.count(),
            "applications": apps.count(),
            "fee_paid": apps.filter(fee_paid=True).count(),
            "shortlisted": apps.filter(status="SHORTLISTED").count(),
            "marksheets": inst.marksheets.count(),
            "schedule_slots": inst.schedule_slots.count(),
            "by_status": list(apps.values("status").annotate(c=Count("id"))),
        }
        return success_response(data)

    @action(detail=True, methods=["post"])
    def generate_pre_exam_reports(self, request, pk=None):
        """UEM-3.5: generate centre/batch/timetable/hall/attendance packs."""
        inst = self.get_object()
        centres = list(ExamCentre.objects.values("code", "name", "city", "capacity"))
        apps = []
        if inst.advertisement_id:
            apps = list(
                Application.objects.filter(advertisement=inst.advertisement)
                .select_related("candidate", "centre")
                .values(
                    "tracking_id",
                    "roll_number",
                    "candidate__username",
                    "centre__code",
                    "status",
                    "fee_paid",
                )
            )
        created = []
        packs = [
            (
                PreExamReport.ReportType.CENTRE_STATEMENT,
                "Centre-wise candidate statement",
                {"centres": centres, "applications": apps},
            ),
            (
                PreExamReport.ReportType.TIMETABLE,
                "Examination timetable",
                {
                    "slots": list(
                        inst.schedule_slots.values(
                            "slot_type", "scheduled_at", "venue"
                        )
                    )
                },
            ),
            (
                PreExamReport.ReportType.HALL_ALLOCATION,
                "Hall allocation",
                {
                    "allocation": [
                        {
                            "centre": a.get("centre__code") or "UNASSIGNED",
                            "roll": a.get("roll_number"),
                            "candidate": a.get("candidate__username"),
                        }
                        for a in apps
                    ]
                },
            ),
            (
                PreExamReport.ReportType.ATTENDANCE,
                "Attendance sheet",
                {
                    "rows": [
                        {
                            "roll": a.get("roll_number"),
                            "name": a.get("candidate__username"),
                            "present": None,
                        }
                        for a in apps
                        if a.get("fee_paid")
                    ]
                },
            ),
            (
                PreExamReport.ReportType.ADMIT_SUMMARY,
                "Admission certificates summary",
                {
                    "issued": sum(1 for a in apps if a.get("roll_number")),
                    "pending": sum(1 for a in apps if a.get("fee_paid") and not a.get("roll_number")),
                },
            ),
        ]
        for rtype, title, payload in packs:
            rep = PreExamReport.objects.create(
                exam_instance=inst,
                report_type=rtype,
                title=f"{inst.title} — {title}",
                payload=payload,
                generated_by=request.user,
            )
            created.append(PreExamReportSerializer(rep).data)
        return success_response(created, "Pre-exam reports generated", 201)

    @action(detail=True, methods=["post"])
    def build_merit_list(self, request, pk=None):
        inst = self.get_object()
        sheets = (
            Marksheet.objects.filter(exam_instance=inst)
            .select_related("application__candidate")
            .order_by("-total")
        )
        rows = []
        for i, ms in enumerate(sheets, start=1):
            rows.append(
                {
                    "merit": i,
                    "tracking_id": ms.application.tracking_id,
                    "candidate": ms.application.candidate.get_full_name()
                    or ms.application.candidate.username,
                    "total": float(ms.total),
                    "application_id": ms.application_id,
                }
            )
        ml = MeritList.objects.create(
            exam_instance=inst,
            title=f"Merit List — {inst.title}",
            rows=rows,
            is_final=bool(request.data.get("is_final")),
        )
        return success_response(MeritListSerializer(ml).data, "Merit list built", 201)

    @action(detail=True, methods=["post"])
    def broadcast_intimation(self, request, pk=None):
        """UEM-3.8 intimations to all fee-paid applicants."""
        inst = self.get_object()
        subject = request.data.get("subject", f"Update: {inst.title}")
        body = request.data.get(
            "body",
            f"Please check the FPSC portal for updates on {inst.title}.",
        )
        channel = request.data.get("channel", "EMAIL")
        sent = 0
        if not inst.advertisement_id:
            raise ValidationError("Link an advertisement to this UEM exam first.")
        apps = Application.objects.filter(
            advertisement=inst.advertisement, fee_paid=True
        ).select_related("candidate")
        for app in apps:
            queue_notification(
                user=app.candidate,
                channel=channel,
                template_code="UEM_INTIMATION",
                subject=subject,
                body=body,
                context={"exam": inst.title, "tracking_id": app.tracking_id},
            )
            Correspondence.objects.create(
                exam_instance=inst,
                application=app,
                template_code="UEM_INTIMATION",
                subject=subject,
                body=body,
                channel=channel,
                created_by=request.user,
            )
            sent += 1
        return success_response({"sent": sent}, f"Intimations queued for {sent} candidates")


class UEMRequisitionViewSet(StaffModelViewSet):
    queryset = UEMRequisition.objects.all()
    serializer_class = UEMRequisitionSerializer
    filterset_fields = ["status", "exam_instance"]
    search_fields = ["ref_number", "post_title", "requesting_dept"]


class QuotaRosterViewSet(StaffModelViewSet):
    queryset = QuotaRoster.objects.all()
    serializer_class = QuotaRosterSerializer


class PreExamReportViewSet(StaffModelViewSet):
    queryset = PreExamReport.objects.select_related("exam_instance").all()
    serializer_class = PreExamReportSerializer
    filterset_fields = ["exam_instance", "report_type"]
    http_method_names = ["get", "post", "head", "options"]

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj = ser.save(generated_by=request.user)
        return success_response(self.get_serializer(obj).data, "Created", 201)


class MarksheetViewSet(StaffModelViewSet):
    queryset = Marksheet.objects.select_related(
        "application__candidate", "exam_instance"
    ).all()
    serializer_class = MarksheetSerializer
    filterset_fields = ["exam_instance", "recount_requested"]

    @action(detail=True, methods=["post"])
    def request_recount(self, request, pk=None):
        ms = self.get_object()
        ms.recount_requested = True
        ms.recount_notes = request.data.get("notes", "")
        ms.save(update_fields=["recount_requested", "recount_notes"])
        return success_response(MarksheetSerializer(ms).data, "Recount requested")


class ScheduleSlotViewSet(StaffModelViewSet):
    queryset = ScheduleSlot.objects.prefetch_related("candidates").all()
    serializer_class = ScheduleSlotSerializer
    filterset_fields = ["exam_instance", "slot_type"]


class MeritListViewSet(StaffModelViewSet):
    queryset = MeritList.objects.all()
    serializer_class = MeritListSerializer
    filterset_fields = ["exam_instance", "is_final"]
    http_method_names = ["get", "post", "patch", "head", "options"]


class CorrespondenceViewSet(StaffModelViewSet):
    queryset = Correspondence.objects.all().order_by("-created_at")
    serializer_class = CorrespondenceSerializer
    filterset_fields = ["exam_instance", "channel", "template_code"]

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj = ser.save(created_by=request.user)
        if obj.application_id:
            queue_notification(
                user=obj.application.candidate,
                channel=obj.channel,
                template_code=obj.template_code or "CORRESPONDENCE",
                subject=obj.subject,
                body=obj.body,
            )
        return success_response(self.get_serializer(obj).data, "Correspondence sent", 201)
