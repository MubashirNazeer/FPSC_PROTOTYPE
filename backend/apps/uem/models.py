"""Module 3 — Unified Examination Module (configurable exam types)."""
from __future__ import annotations

from django.db import models


class ExamType(models.Model):
    code = models.CharField(max_length=32, unique=True)
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True)
    stages = models.JSONField(
        default=list,
        help_text="Ordered list of stage codes, e.g. ['REQUISITION','AD','APPLY','EXAM','RESULT']",
    )
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
