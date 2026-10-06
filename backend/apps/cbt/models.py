"""Module 5B — Computer-Based Testing."""
from __future__ import annotations

import hashlib
import secrets

from django.conf import settings
from django.db import models
from django.utils import timezone


class ExamSitting(models.Model):
    class Mode(models.TextChoices):
        CENTRALIZED = "CENTRALIZED", "Centralized"
        EDGE = "EDGE", "Edge"

    class Status(models.TextChoices):
        SCHEDULED = "SCHEDULED", "Scheduled"
        LIVE = "LIVE", "Live"
        CLOSED = "CLOSED", "Closed"

    title = models.CharField(max_length=255)
    paper = models.ForeignKey("qdbms.ExamPaper", on_delete=models.PROTECT)
    centre = models.ForeignKey(
        "gr.ExamCentre", null=True, blank=True, on_delete=models.SET_NULL
    )
    mode = models.CharField(
        max_length=16, choices=Mode.choices, default=Mode.CENTRALIZED
    )
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.SCHEDULED
    )
    duration_minutes = models.PositiveIntegerField(default=60)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    package_hash = models.CharField(max_length=64, blank=True)
    decryption_key_hint = models.CharField(max_length=64, blank=True)
    shift = models.PositiveSmallIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def seal_package(self) -> None:
        raw = f"{self.pk}:{self.paper_id}:{secrets.token_hex(8)}"
        self.package_hash = hashlib.sha256(raw.encode()).hexdigest()
        self.decryption_key_hint = secrets.token_hex(8)
        self.save(update_fields=["package_hash", "decryption_key_hint"])


class ExamSession(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        BIOMETRIC_OK = "BIOMETRIC_OK", "Biometric Verified"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        PAUSED = "PAUSED", "Paused"
        SUBMITTED = "SUBMITTED", "Submitted"
        AUTO_SUBMITTED = "AUTO_SUBMITTED", "Auto Submitted"

    sitting = models.ForeignKey(
        ExamSitting, on_delete=models.CASCADE, related_name="sessions"
    )
    candidate = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    application = models.ForeignKey(
        "gr.Application", null=True, blank=True, on_delete=models.SET_NULL
    )
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.PENDING
    )
    question_order = models.JSONField(default=list)
    option_orders = models.JSONField(default=dict)
    answers = models.JSONField(default=dict)
    flagged = models.JSONField(default=list)
    started_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    terminal_id = models.CharField(max_length=64, blank=True)
    score = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    anomaly_flags = models.JSONField(default=list, blank=True)

    class Meta:
        unique_together = ("sitting", "candidate")

    @property
    def seconds_remaining(self) -> int:
        if not self.started_at or self.status in (
            self.Status.SUBMITTED,
            self.Status.AUTO_SUBMITTED,
        ):
            return 0
        elapsed = (timezone.now() - self.started_at).total_seconds()
        total = self.sitting.duration_minutes * 60
        return max(0, int(total - elapsed))
