from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    DutyAssignmentViewSet,
    InventoryItemViewSet,
    InventoryTxnViewSet,
    LeaveRequestViewSet,
    LibraryItemViewSet,
    TransportDispatchViewSet,
)

router = DefaultRouter()
router.register("duties", DutyAssignmentViewSet, basename="duty")
router.register("inventory", InventoryItemViewSet, basename="inventory")
router.register("inventory-txns", InventoryTxnViewSet, basename="inventory-txn")
router.register("transport", TransportDispatchViewSet, basename="transport")
router.register("leave", LeaveRequestViewSet, basename="leave")
router.register("library", LibraryItemViewSet, basename="library")

urlpatterns = [path("", include(router.urls))]
