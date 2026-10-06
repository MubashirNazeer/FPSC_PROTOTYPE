"""IAM models — users, roles, wings, audit trail."""
from __future__ import annotations

from django.contrib.auth.models import AbstractUser
from django.db import models


class Wing(models.Model):
    """FPSC organizational wing / directorate."""

    code = models.CharField(max_length=32, unique=True)
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["code"]

    def __str__(self) -> str:
        return f"{self.code} — {self.name}"


class Role(models.Model):
    """Named role used for RBAC."""

    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True)
    is_staff_role = models.BooleanField(default=True)

    class Meta:
        ordering = ["code"]

    def __str__(self) -> str:
        return self.name


class User(AbstractUser):
    """Extended user with CNIC, wing, and role membership."""

    cnic = models.CharField(max_length=15, blank=True, db_index=True)
    phone = models.CharField(max_length=20, blank=True)
    wing = models.ForeignKey(
        Wing,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="users",
    )
    roles = models.ManyToManyField(Role, blank=True, related_name="users")
    designation = models.CharField(max_length=128, blank=True)

    class Meta:
        ordering = ["username"]

    def has_role(self, *codes: str) -> bool:
        if self.is_superuser:
            return True
        return self.roles.filter(code__in=codes).exists()

    @property
    def role_codes(self) -> list[str]:
        return list(self.roles.values_list("code", flat=True))


class AuditLog(models.Model):
    """Immutable audit trail for security & compliance."""

    actor = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=64)
    entity_type = models.CharField(max_length=64)
    entity_id = models.CharField(max_length=64, blank=True)
    detail = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.action} {self.entity_type}:{self.entity_id}"


class CandidateProfile(models.Model):
    """Extended candidate self-service profile."""

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="candidate_profile"
    )
    father_name = models.CharField(max_length=128, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    domicile = models.CharField(max_length=64, blank=True)
    province = models.CharField(max_length=64, blank=True)
    address = models.TextField(blank=True)
    education_summary = models.TextField(blank=True)
    experience_summary = models.TextField(blank=True)
    quota = models.CharField(max_length=64, blank=True)
    photo = models.ImageField(upload_to="candidates/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Candidate:{self.user.username}"
