from django.contrib import admin

from .models import (
    DutyAssignment,
    InventoryItem,
    InventoryTxn,
    LeaveRequest,
    LibraryItem,
    TransportDispatch,
)

admin.site.register(DutyAssignment)
admin.site.register(InventoryItem)
admin.site.register(InventoryTxn)
admin.site.register(TransportDispatch)
admin.site.register(LeaveRequest)
admin.site.register(LibraryItem)
