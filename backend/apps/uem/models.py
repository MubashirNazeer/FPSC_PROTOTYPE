"""Module 3 — Unified Examination Module (full RFP UEM-3.1–3.8)."""
from __future__ import annotations

from django.conf import settings
from django.db import models


class ExamType(models.Model):
    code = models.CharField(max_length=32, unique=True)
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True)
    stages = models.JSONField(default=list)
    config = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.name


class UEMExamInstance(models.Model):
    exam_type = models.ForeignKey(
        ExamType, on_delete=models.PROTECT, related_name="instances"
    )
    title = models.CharField(max_length=255)
    current_stage = models.CharField(max_length=64)
    advertisement = models.ForeignKey(
        "gr.Advertisement",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="uem_instances",
    )
    case = models.ForeignKey(
        "workflow.CaseInstance",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.title


class UEMRequisition(models.Model):
    """UEM-3.2 requisition registration & status tracking."""

    exam_instance = models.ForeignKey(
        UEMExamInstance,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="requisitions",
    )
    ref_number = models.CharField(max_length=64, unique=True)
    requesting_dept = models.CharField(max_length=255)
    post_title = models.CharField(max_length=255)
    vacancies = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=64, default="REGISTERED")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class QuotaRoster(models.Model):
    """UEM-3.4 / GR quota roster management."""

    name = models.CharField(max_length=128)
    exam_instance = models.ForeignKey(
        UEMExamInstance,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="quotas",
    )
    advertisement = models.ForeignKey(
        "gr.Advertisement",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="quotas",
    )
    rules = models.JSONField(
        default=dict,
        help_text='e.g. {"open_merit":60,"punjab":20,"sindh_u":10,"kpk":5,"balochistan":5}',
    )
    created_at = models.DateTimeField(auto_now_add=True)


class PreExamReport(models.Model):
    """UEM-3.5 centre/batch statements, timetable, hall allocation."""

    class ReportType(models.TextChoices):
        CENTRE_STATEMENT = "CENTRE_STATEMENT", "Centre-wise statement"
        BATCH_STATEMENT = "BATCH_STATEMENT", "Batch-wise statement"
        TIMETABLE = "TIMETABLE", "Timetable"
        HALL_ALLOCATION = "HALL_ALLOCATION", "Hall allocation"
        ATTENDANCE = "ATTENDANCE", "Attendance sheet"
        ADMIT_SUMMARY = "ADMIT_SUMMARY", "Admission certificate summary"

    exam_instance = models.ForeignKey(
        UEMExamInstance, on_delete=models.CASCADE, related_name="pre_exam_reports"
    )
    report_type = models.CharField(max_length=32, choices=ReportType.choices)
    title = models.CharField(max_length=255)
    payload = models.JSONField(default=dict, blank=True)
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)


class Marksheet(models.Model):
    """UEM-3.7 marksheet generation."""

    exam_instance = models.ForeignKey(
        UEMExamInstance, on_delete=models.CASCADE, related_name="marksheets"
    )
    application = models.ForeignKey(
        "gr.Application", on_delete=models.CASCADE, related_name="marksheets"
    )
    marks = models.JSONField(default=dict)
    total = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    grade = models.CharField(max_length=16, blank=True)
    recount_requested = models.BooleanField(default=False)
    recount_notes = models.TextField(blank=True)
    issued_at = models.DateTimeField(auto_now_add=True)


class ScheduleSlot(models.Model):
    """UEM-3.7 psychometric / medical / viva / personal hearing scheduling."""

    class SlotType(models.TextChoices):
        PSYCHOMETRIC = "PSYCHOMETRIC", "Psychometric"
        MEDICAL = "MEDICAL", "Medical"
        VIVA = "VIVA", "Viva Voce"
        HEARING = "HEARING", "Personal Hearing"
        SITUATIONAL = "SITUATIONAL", "Situational Test"

    exam_instance = models.ForeignKey(
        UEMExamInstance, on_delete=models.CASCADE, related_name="schedule_slots"
    )
    slot_type = models.CharField(max_length=32, choices=SlotType.choices)
    scheduled_at = models.DateTimeField()
    venue = models.CharField(max_length=255, blank=True)
    candidates = models.ManyToManyField(
        settings.AUTH_USER_MODEL, blank=True, related_name="uem_slots"
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class MeritList(models.Model):
    """UEM-3.7 final merit + re-allocation on unfilled seats."""

    exam_instance = models.ForeignKey(
        UEMExamInstance, on_delete=models.CASCADE, related_name="merit_lists"
    )
    title = models.CharField(max_length=255)
    rows = models.JSONField(default=list)
    is_final = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class Correspondence(models.Model):
    """UEM-3.8 template correspondence / case tracking notes."""

    exam_instance = models.ForeignKey(
        UEMExamInstance,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="correspondence",
    )
    application = models.ForeignKey(
        "gr.Application",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="correspondence",
    )
    template_code = models.CharField(max_length=64, blank=True)
    subject = models.CharField(max_length=255)
    body = models.TextField()
    channel = models.CharField(max_length=16, default="EMAIL")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)
