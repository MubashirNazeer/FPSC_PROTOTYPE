from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CorrespondenceViewSet,
    ExamTypeViewSet,
    MarksheetViewSet,
    MeritListViewSet,
    PreExamReportViewSet,
    QuotaRosterViewSet,
    ScheduleSlotViewSet,
    UEMExamInstanceViewSet,
    UEMRequisitionViewSet,
)

router = DefaultRouter()
router.register("exam-types", ExamTypeViewSet, basename="exam-type")
router.register("uem-exams", UEMExamInstanceViewSet, basename="uem-exam")
router.register("uem-requisitions", UEMRequisitionViewSet, basename="uem-requisition")
router.register("quota-rosters", QuotaRosterViewSet, basename="quota-roster")
router.register("pre-exam-reports", PreExamReportViewSet, basename="pre-exam-report")
router.register("marksheets", MarksheetViewSet, basename="marksheet")
router.register("schedule-slots", ScheduleSlotViewSet, basename="schedule-slot")
router.register("merit-lists", MeritListViewSet, basename="merit-list")
router.register("correspondence", CorrespondenceViewSet, basename="correspondence")

urlpatterns = [path("", include(router.urls))]
