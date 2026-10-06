from rest_framework import permissions, viewsets
from rest_framework.decorators import action

from apps.accounts.exceptions import success_response
from apps.accounts.permissions import IsStaffUser

from .models import NewsItem, Page, SiteSetting
from .serializers import NewsItemSerializer, PageSerializer, SiteSettingSerializer


class PageViewSet(viewsets.ModelViewSet):
    queryset = Page.objects.all()
    serializer_class = PageSerializer
    lookup_field = "slug"

    def get_permissions(self):
        if self.action in ("list", "retrieve", "published"):
            return [permissions.AllowAny()]
        return [IsStaffUser()]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action in ("list", "retrieve", "published") and not getattr(
            self.request.user, "is_staff", False
        ):
            return qs.filter(is_published=True)
        return qs

    def list(self, request, *args, **kwargs):
        return success_response(
            self.get_serializer(self.filter_queryset(self.get_queryset()), many=True).data
        )

    def retrieve(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_object()).data)

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj = ser.save(updated_by=request.user)
        return success_response(self.get_serializer(obj).data, "Created", 201)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        ser = self.get_serializer(instance, data=request.data, partial=partial)
        ser.is_valid(raise_exception=True)
        ser.save(updated_by=request.user)
        return success_response(ser.data, "Updated")


class NewsItemViewSet(viewsets.ModelViewSet):
    queryset = NewsItem.objects.all()
    serializer_class = NewsItemSerializer
    lookup_field = "slug"
    filterset_fields = ["category", "is_published"]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.AllowAny()]
        return [IsStaffUser()]

    def get_queryset(self):
        qs = super().get_queryset()
        if not getattr(self.request.user, "is_staff", False):
            return qs.filter(is_published=True)
        return qs

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        return success_response(self.get_serializer(qs, many=True).data)

    def retrieve(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_object()).data)

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj = ser.save(author=request.user)
        return success_response(self.get_serializer(obj).data, "Created", 201)


class SiteSettingViewSet(viewsets.ModelViewSet):
    queryset = SiteSetting.objects.all()
    serializer_class = SiteSettingSerializer
    lookup_field = "key"

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.AllowAny()]
        return [IsStaffUser()]

    def list(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_queryset(), many=True).data)
