from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ExamTypeViewSet, UEMExamInstanceViewSet

router = DefaultRouter()
router.register("exam-types", ExamTypeViewSet, basename="exam-type")
router.register("uem-exams", UEMExamInstanceViewSet, basename="uem-exam")

urlpatterns = [path("", include(router.urls))]
