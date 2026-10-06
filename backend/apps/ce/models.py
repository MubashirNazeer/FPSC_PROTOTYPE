"""Module 2 — Competitive Examination (CSS / MPT)."""
from __future__ import annotations

from django.conf import settings
from django.db import models


class CompetitiveExamCycle(models.Model):
    class Phase(models.TextChoices):
        PAPER_PREP = "PAPER_PREP", "Paper Preparation"
        MPT_AD = "MPT_AD", "MPT Advertisement"
        MPT_APPS = "MPT_APPS", "MPT Applications"
        MPT_EXAM = "MPT_EXAM", "MPT Exam"
        WRITTEN = "WRITTEN", "Written Exam"
        PSYCH = "PSYCH", "Psychological Assessment"
        MEDICAL = "MEDICAL", "Medical"
        VIVA = "VIVA", "Viva Voce"
        ALLOCATION = "ALLOCATION", "Group Allocation"
        CLOSED = "CLOSED", "Closed"

    year = models.PositiveIntegerField(unique=True)
    title = models.CharField(max_length=255)
    phase = models.CharField(
        max_length=32, choices=Phase.choices, default=Phase.PAPER_PREP
    )
    mpt_advertisement = models.ForeignKey(
        "gr.Advertisement",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="ce_cycles",
    )
    case = models.ForeignKey(
        "workflow.CaseInstance",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.title


class ExaminerPanel(models.Model):
    cycle = models.ForeignKey(
        CompetitiveExamCycle, on_delete=models.CASCADE, related_name="panels"
    )
    subject = models.CharField(max_length=128)
    examiners = models.JSONField(default=list)
    commission_approved = models.BooleanField(default=False)
    approved_at = models.DateTimeField(null=True, blank=True)


class CECandidateProgress(models.Model):
    cycle = models.ForeignKey(
        CompetitiveExamCycle, on_delete=models.CASCADE, related_name="progress"
    )
    candidate = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    application = models.ForeignKey(
        "gr.Application", null=True, blank=True, on_delete=models.SET_NULL
    )
    mpt_passed = models.BooleanField(default=False)
    written_marks = models.JSONField(default=dict, blank=True)
    psych_status = models.CharField(max_length=32, blank=True)
    medical_status = models.CharField(max_length=32, blank=True)
    viva_marks = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )
    allocated_group = models.CharField(max_length=64, blank=True)
    allocated_service = models.CharField(max_length=128, blank=True)
    final_merit = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        unique_together = ("cycle", "candidate")


class CEScheduleEvent(models.Model):
    cycle = models.ForeignKey(
        CompetitiveExamCycle, on_delete=models.CASCADE, related_name="events"
    )
    event_type = models.CharField(max_length=64)
    scheduled_at = models.DateTimeField()
    venue = models.CharField(max_length=255, blank=True)
    details = models.TextField(blank=True)
