from rest_framework import serializers

from .models import (
    DutyAssignment,
    InventoryItem,
    InventoryTxn,
    LeaveRequest,
    LibraryItem,
    TransportDispatch,
)


class DutyAssignmentSerializer(serializers.ModelSerializer):
    staff_name = serializers.SerializerMethodField()
    centre_name = serializers.CharField(source="centre.name", read_only=True)

    class Meta:
        model = DutyAssignment
        fields = "__all__"

    def get_staff_name(self, obj):
        return obj.staff.get_full_name() or obj.staff.username


class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = "__all__"


class InventoryTxnSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryTxn
        fields = "__all__"
        read_only_fields = ("created_by",)


class TransportDispatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransportDispatch
        fields = "__all__"


class LeaveRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = "__all__"


class LibraryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = LibraryItem
        fields = "__all__"
