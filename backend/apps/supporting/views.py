from django.db import transaction
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError

from apps.accounts.exceptions import success_response
from apps.accounts.permissions import IsStaffUser

from .models import (
    DutyAssignment,
    InventoryItem,
    InventoryTxn,
    LeaveRequest,
    LibraryItem,
    TransportDispatch,
)
from .serializers import (
    DutyAssignmentSerializer,
    InventoryItemSerializer,
    InventoryTxnSerializer,
    LeaveRequestSerializer,
    LibraryItemSerializer,
    TransportDispatchSerializer,
)


class BaseStaffViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaffUser]

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        return success_response(self.get_serializer(qs, many=True).data)

    def retrieve(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_object()).data)

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj = ser.save()
        return success_response(self.get_serializer(obj).data, "Created", 201)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        ser = self.get_serializer(instance, data=request.data, partial=partial)
        ser.is_valid(raise_exception=True)
        ser.save()
        return success_response(ser.data, "Updated")


class DutyAssignmentViewSet(BaseStaffViewSet):
    queryset = DutyAssignment.objects.select_related("staff", "centre").all()
    serializer_class = DutyAssignmentSerializer
    filterset_fields = ["exam_date", "centre", "role"]


class InventoryItemViewSet(BaseStaffViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer


class InventoryTxnViewSet(BaseStaffViewSet):
    queryset = InventoryTxn.objects.select_related("item", "centre").all()
    serializer_class = InventoryTxnSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        item = ser.validated_data["item"]
        qty = ser.validated_data["quantity"]
        txn_type = ser.validated_data["txn_type"]
        if txn_type == InventoryTxn.TxnType.ISSUE:
            if item.quantity_on_hand < qty:
                raise ValidationError("Insufficient stock.")
            item.quantity_on_hand -= qty
        elif txn_type == InventoryTxn.TxnType.RETURN:
            item.quantity_on_hand += qty
        item.save(update_fields=["quantity_on_hand"])
        obj = ser.save(created_by=request.user)
        return success_response(self.get_serializer(obj).data, "Txn recorded", 201)


class TransportDispatchViewSet(BaseStaffViewSet):
    queryset = TransportDispatch.objects.select_related("centre").all()
    serializer_class = TransportDispatchSerializer


class LeaveRequestViewSet(BaseStaffViewSet):
    queryset = LeaveRequest.objects.select_related("staff").all()
    serializer_class = LeaveRequestSerializer

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        leave = self.get_object()
        leave.status = LeaveRequest.Status.APPROVED
        leave.save(update_fields=["status"])
        return success_response(LeaveRequestSerializer(leave).data, "Approved")


class LibraryItemViewSet(BaseStaffViewSet):
    queryset = LibraryItem.objects.all()
    serializer_class = LibraryItemSerializer
    search_fields = ["title", "accession_no"]
