from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import NewsItemViewSet, PageViewSet, SiteSettingViewSet

router = DefaultRouter()
router.register("pages", PageViewSet, basename="page")
router.register("news", NewsItemViewSet, basename="news")
router.register("site-settings", SiteSettingViewSet, basename="site-setting")

urlpatterns = [path("", include(router.urls))]
