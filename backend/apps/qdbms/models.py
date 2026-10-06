"""Module 5A — Question Data Bank Management System."""
from __future__ import annotations

from django.conf import settings
from django.db import models


class TaxonomyNode(models.Model):
    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.CASCADE, related_name="children"
    )
    name = models.CharField(max_length=128)
    code = models.CharField(max_length=64, unique=True)
    level = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["code"]

    def __str__(self) -> str:
        return self.name


class Question(models.Model):
    class QType(models.TextChoices):
        MCQ_SINGLE = "MCQ_SINGLE", "MCQ Single"
        MCQ_MULTI = "MCQ_MULTI", "MCQ Multi"
        TRUE_FALSE = "TRUE_FALSE", "True/False"
        MATCHING = "MATCHING", "Matching"
        FILL_BLANK = "FILL_BLANK", "Fill in Blank"

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
        APPROVED = "APPROVED", "Approved"
        ACTIVE = "ACTIVE", "Active"
        RETIRED = "RETIRED", "Retired"

    stem = models.TextField()
    qtype = models.CharField(max_length=16, choices=QType.choices, default=QType.MCQ_SINGLE)
    options = models.JSONField(default=list)
    correct_answer = models.JSONField(default=dict)
    taxonomy = models.ForeignKey(
        TaxonomyNode, null=True, blank=True, on_delete=models.SET_NULL, related_name="questions"
    )
    difficulty = models.PositiveSmallIntegerField(default=3)  # 1-5
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    version = models.PositiveIntegerField(default=1)
    usage_count = models.PositiveIntegerField(default=0)
    metadata = models.JSONField(default=dict, blank=True)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.SET_NULL,
        related_name="authored_questions",
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reviewed_questions",
    )
    approver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_questions",
    )
    facility_index = models.FloatField(null=True, blank=True)
    discrimination_index = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return f"Q{self.pk} v{self.version}"


class QuestionVersion(models.Model):
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="versions"
    )
    version = models.PositiveIntegerField()
    snapshot = models.JSONField()
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)


class PaperBlueprint(models.Model):
    title = models.CharField(max_length=255)
    total_questions = models.PositiveIntegerField(default=20)
    constraints = models.JSONField(
        default=dict,
        help_text="e.g. {difficulty_dist:{1:2,2:4,...}, taxonomy_codes:[...], reuse_limit:3}",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)


class ExamPaper(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PENDING_DUAL = "PENDING_DUAL", "Pending Dual Auth"
        APPROVED = "APPROVED", "Approved"
        USED = "USED", "Used"

    title = models.CharField(max_length=255)
    blueprint = models.ForeignKey(
        PaperBlueprint, null=True, blank=True, on_delete=models.SET_NULL
    )
    questions = models.ManyToManyField(Question, related_name="papers")
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.DRAFT
    )
    authorizer_one = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="papers_auth1",
    )
    authorizer_two = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="papers_auth2",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.SET_NULL,
        related_name="papers_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.title
