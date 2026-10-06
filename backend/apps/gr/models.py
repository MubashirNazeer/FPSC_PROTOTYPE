"""Module 1 — General Recruitment (GR)."""
from __future__ import annotations

from django.conf import settings
from django.db import models


class Requisition(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        UNDER_RR = "UNDER_RR", "Under R&R"
        COMMISSION = "COMMISSION", "Commission Review"
        SYLLABUS = "SYLLABUS", "Syllabus Prep"
        ADVERTISED = "ADVERTISED", "Advertised"
        APPLICATIONS = "APPLICATIONS", "Applications Open"
        PRE_EXAM = "PRE_EXAM", "Pre-Exam"
        EXAM = "EXAM", "Exam Conduct"
        RESULT = "RESULT", "Result"
        SCRUTINY = "SCRUTINY", "Scrutiny/Interview"
        NOMINATION = "NOMINATION", "Nomination"
        CLOSED = "CLOSED", "Closed"

    case_number = models.CharField(max_length=32, unique=True)
    ministry = models.CharField(max_length=255)
    department = models.CharField(max_length=255, blank=True)
    post_title = models.CharField(max_length=255)
    bps = models.PositiveSmallIntegerField()
    vacancies = models.PositiveIntegerField(default=1)
    domicile_required = models.CharField(max_length=64, blank=True)
    quota_notes = models.TextField(blank=True)
    recruitment_rules_ok = models.BooleanField(default=False)
    rr_mismatch_flags = models.JSONField(default=list, blank=True)
    syllabus_mcq = models.TextField(blank=True)
    syllabus_descriptive = models.TextField(blank=True)
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.DRAFT
    )
    received_at = models.DateField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.SET_NULL,
        related_name="requisitions_created",
    )
    case = models.ForeignKey(
        "workflow.CaseInstance",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="requisitions",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.case_number} — {self.post_title}"


class Advertisement(models.Model):
    class Kind(models.TextChoices):
        GR = "GR", "General Recruitment"
        CE = "CE", "Competitive Examination"
        UEM = "UEM", "Unified Examination"

    ref_number = models.CharField(max_length=64, unique=True)
    title = models.CharField(max_length=255)
    kind = models.CharField(max_length=8, choices=Kind.choices, default=Kind.GR)
    consolidated_html = models.TextField(blank=True)
    publish_date = models.DateField(null=True, blank=True)
    close_date = models.DateField(null=True, blank=True)
    is_published = models.BooleanField(default=False)
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    requisitions = models.ManyToManyField(
        Requisition, blank=True, related_name="advertisements"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.ref_number


class ExamCentre(models.Model):
    code = models.CharField(max_length=16, unique=True)
    name = models.CharField(max_length=128)
    city = models.CharField(max_length=64)
    capacity = models.PositiveIntegerField(default=100)
    address = models.TextField(blank=True)

    def __str__(self) -> str:
        return f"{self.code} — {self.city}"


class Application(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SUBMITTED = "SUBMITTED", "Submitted"
        FEE_PENDING = "FEE_PENDING", "Fee Pending"
        FEE_PAID = "FEE_PAID", "Fee Paid"
        UNDER_SCRUTINY = "UNDER_SCRUTINY", "Under Scrutiny"
        ELIGIBLE = "ELIGIBLE", "Eligible"
        REJECTED = "REJECTED", "Rejected"
        SHORTLISTED = "SHORTLISTED", "Shortlisted"
        INTERVIEW = "INTERVIEW", "Interview"
        NOMINATED = "NOMINATED", "Nominated"

    advertisement = models.ForeignKey(
        Advertisement, on_delete=models.CASCADE, related_name="applications"
    )
    requisition = models.ForeignKey(
        Requisition,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="applications",
    )
    candidate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="applications",
    )
    tracking_id = models.CharField(max_length=32, unique=True)
    roll_number = models.CharField(max_length=32, blank=True)
    centre = models.ForeignKey(
        ExamCentre, null=True, blank=True, on_delete=models.SET_NULL
    )
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.DRAFT
    )
    fee_paid = models.BooleanField(default=False)
    payment_ref = models.CharField(max_length=64, blank=True)
    score = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    scrutiny_score = models.DecimalField(
        max_digits=7, decimal_places=2, null=True, blank=True
    )
    scrutiny_notes = models.TextField(blank=True)
    documents = models.JSONField(default=dict, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("advertisement", "candidate", "requisition")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.tracking_id


class AdmitCard(models.Model):
    application = models.OneToOneField(
        Application, on_delete=models.CASCADE, related_name="admit_card"
    )
    exam_date = models.DateField()
    exam_time = models.TimeField()
    centre = models.ForeignKey(ExamCentre, on_delete=models.PROTECT)
    hall = models.CharField(max_length=64, blank=True)
    instructions = models.TextField(blank=True)
    issued_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Admit:{self.application.roll_number}"


class InterviewPanel(models.Model):
    requisition = models.ForeignKey(
        Requisition, on_delete=models.CASCADE, related_name="interview_panels"
    )
    name = models.CharField(max_length=128)
    members = models.JSONField(default=list)
    scheduled_at = models.DateTimeField(null=True, blank=True)


class Nomination(models.Model):
    requisition = models.ForeignKey(
        Requisition, on_delete=models.CASCADE, related_name="nominations"
    )
    application = models.OneToOneField(
        Application, on_delete=models.CASCADE, related_name="nomination"
    )
    letter_ref = models.CharField(max_length=64)
    issued_at = models.DateField()
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
