from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdvertisementViewSet,
    ApplicationViewSet,
    ExamCentreViewSet,
    InterviewPanelViewSet,
    NominationViewSet,
    RequisitionViewSet,
)

router = DefaultRouter()
router.register("requisitions", RequisitionViewSet, basename="requisition")
router.register("advertisements", AdvertisementViewSet, basename="advertisement")
router.register("applications", ApplicationViewSet, basename="application")
router.register("centres", ExamCentreViewSet, basename="centre")
router.register("nominations", NominationViewSet, basename="nomination")
router.register("interview-panels", InterviewPanelViewSet, basename="interview-panel")

urlpatterns = [path("", include(router.urls))]
