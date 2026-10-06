"""Configurable workflow / eCase engine."""
from __future__ import annotations

from django.conf import settings
from django.db import models


class WorkflowDefinition(models.Model):
    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=128)
    module = models.CharField(max_length=32)  # GR, CE, UEM, QDB
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.name


class WorkflowState(models.Model):
    workflow = models.ForeignKey(
        WorkflowDefinition, on_delete=models.CASCADE, related_name="states"
    )
    code = models.CharField(max_length=64)
    name = models.CharField(max_length=128)
    sequence = models.PositiveIntegerField(default=0)
    is_initial = models.BooleanField(default=False)
    is_terminal = models.BooleanField(default=False)
    responsible_role = models.CharField(max_length=64, blank=True)

    class Meta:
        unique_together = ("workflow", "code")
        ordering = ["sequence"]

    def __str__(self) -> str:
        return f"{self.workflow.code}:{self.code}"


class WorkflowTransition(models.Model):
    workflow = models.ForeignKey(
        WorkflowDefinition, on_delete=models.CASCADE, related_name="transitions"
    )
    from_state = models.ForeignKey(
        WorkflowState, on_delete=models.CASCADE, related_name="outgoing"
    )
    to_state = models.ForeignKey(
        WorkflowState, on_delete=models.CASCADE, related_name="incoming"
    )
    name = models.CharField(max_length=128)
    required_role = models.CharField(max_length=64, blank=True)
    requires_dual_auth = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"{self.from_state.code} → {self.to_state.code}"


class CaseInstance(models.Model):
    """Generic eCase attached to domain objects via content reference."""

    workflow = models.ForeignKey(WorkflowDefinition, on_delete=models.PROTECT)
    current_state = models.ForeignKey(WorkflowState, on_delete=models.PROTECT)
    reference_type = models.CharField(max_length=64)
    reference_id = models.CharField(max_length=64)
    title = models.CharField(max_length=255)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.SET_NULL,
        related_name="cases_created",
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="cases_assigned",
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["reference_type", "reference_id"]),
        ]

    def __str__(self) -> str:
        return self.title


class CaseComment(models.Model):
    case = models.ForeignKey(
        CaseInstance, on_delete=models.CASCADE, related_name="comments"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL
    )
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


class CaseTransitionLog(models.Model):
    case = models.ForeignKey(
        CaseInstance, on_delete=models.CASCADE, related_name="transition_logs"
    )
    from_state = models.ForeignKey(
        WorkflowState, on_delete=models.PROTECT, related_name="+"
    )
    to_state = models.ForeignKey(
        WorkflowState, on_delete=models.PROTECT, related_name="+"
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL
    )
    co_approver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="co_approvals",
    )
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
