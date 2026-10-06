from django.conf import settings
from django.db import models


class NotificationOutbox(models.Model):
    class Channel(models.TextChoices):
        EMAIL = "EMAIL", "Email"
        SMS = "SMS", "SMS"
        PUSH = "PUSH", "Push"
        IN_APP = "IN_APP", "In-App"

    class Status(models.TextChoices):
        QUEUED = "QUEUED", "Queued"
        SENT = "SENT", "Sent"
        FAILED = "FAILED", "Failed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="notifications",
    )
    channel = models.CharField(max_length=16, choices=Channel.choices)
    template_code = models.CharField(max_length=64, blank=True)
    subject = models.CharField(max_length=255, blank=True)
    body = models.TextField()
    context = models.JSONField(default=dict, blank=True)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.QUEUED
    )
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
