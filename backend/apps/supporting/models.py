"""Module 6 — Supporting operations."""
from __future__ import annotations

from django.conf import settings
from django.db import models


class DutyAssignment(models.Model):
    exam_date = models.DateField()
    centre = models.ForeignKey("gr.ExamCentre", on_delete=models.CASCADE)
    staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=64)  # invigilator, supervisor
    shift = models.PositiveSmallIntegerField(default=1)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ("exam_date", "centre", "staff", "shift")


class InventoryItem(models.Model):
    sku = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=128)
    quantity_on_hand = models.PositiveIntegerField(default=0)
    unit = models.CharField(max_length=32, default="pcs")


class InventoryTxn(models.Model):
    class TxnType(models.TextChoices):
        ISSUE = "ISSUE", "Issue"
        RETURN = "RETURN", "Return"
        ADJUST = "ADJUST", "Adjust"

    item = models.ForeignKey(
        InventoryItem, on_delete=models.CASCADE, related_name="transactions"
    )
    txn_type = models.CharField(max_length=16, choices=TxnType.choices)
    quantity = models.PositiveIntegerField()
    centre = models.ForeignKey(
        "gr.ExamCentre", null=True, blank=True, on_delete=models.SET_NULL
    )
    reference = models.CharField(max_length=128, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)


class TransportDispatch(models.Model):
    centre = models.ForeignKey("gr.ExamCentre", on_delete=models.CASCADE)
    dispatch_date = models.DateField()
    vehicle = models.CharField(max_length=64)
    driver = models.CharField(max_length=128)
    materials = models.TextField()
    status = models.CharField(max_length=32, default="PLANNED")


class LeaveRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField(blank=True)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.PENDING
    )


class LibraryItem(models.Model):
    title = models.CharField(max_length=255)
    accession_no = models.CharField(max_length=64, unique=True)
    category = models.CharField(max_length=64, blank=True)
    available = models.BooleanField(default=True)
