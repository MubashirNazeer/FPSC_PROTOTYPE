from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("api/v1/auth/token/", TokenObtainPairView.as_view(), name="token_obtain"),
    path("api/v1/auth/token", TokenObtainPairView.as_view()),
    path("api/v1/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/v1/auth/refresh", TokenRefreshView.as_view()),
    path("api/v1/", include("apps.accounts.urls")),
    path("api/v1/", include("apps.workflow.urls")),
    path("api/v1/", include("apps.gr.urls")),
    path("api/v1/", include("apps.ce.urls")),
    path("api/v1/", include("apps.uem.urls")),
    path("api/v1/", include("apps.cms.urls")),
    path("api/v1/", include("apps.qdbms.urls")),
    path("api/v1/", include("apps.cbt.urls")),
    path("api/v1/", include("apps.supporting.urls")),
    path("api/v1/", include("apps.integrations.urls")),
    path("api/v1/", include("apps.notifications.urls")),
    path("api/v1/", include("apps.reporting.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
