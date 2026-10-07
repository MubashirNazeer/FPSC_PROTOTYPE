from django.urls import path

from .views import (
    CentreWorkloadView,
    ExecutiveDashboardView,
    MeritListView,
    ScrutinyStatsView,
)

urlpatterns = [
    path("dashboard/", ExecutiveDashboardView.as_view()),
    path("reports/merit/", MeritListView.as_view()),
    path("reports/centre-workload/", CentreWorkloadView.as_view()),
    path("reports/scrutiny/", ScrutinyStatsView.as_view()),
]
