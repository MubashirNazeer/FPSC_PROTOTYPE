from django.urls import path

from .views import ExecutiveDashboardView, MeritListView

urlpatterns = [
    path("dashboard/", ExecutiveDashboardView.as_view()),
    path("reports/merit/", MeritListView.as_view()),
]
