from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdvertisementViewSet,
    AppealViewSet,
    ApplicationViewSet,
    AttendanceRecordViewSet,
    ExamCentreViewSet,
    InterviewPanelViewSet,
    NominationViewSet,
    PersonalHearingViewSet,
    RequisitionViewSet,
)

router = DefaultRouter()
router.register("requisitions", RequisitionViewSet, basename="requisition")
router.register("advertisements", AdvertisementViewSet, basename="advertisement")
router.register("applications", ApplicationViewSet, basename="application")
router.register("centres", ExamCentreViewSet, basename="centre")
router.register("nominations", NominationViewSet, basename="nomination")
router.register("interview-panels", InterviewPanelViewSet, basename="interview-panel")
router.register("appeals", AppealViewSet, basename="appeal")
router.register("hearings", PersonalHearingViewSet, basename="hearing")
router.register("attendance", AttendanceRecordViewSet, basename="attendance")

urlpatterns = [path("", include(router.urls))]
