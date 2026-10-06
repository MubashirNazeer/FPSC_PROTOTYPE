from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError

from apps.accounts.exceptions import success_response
from apps.accounts.permissions import IsCandidate, IsStaffUser

from .models import (
    AdmitCard,
    Advertisement,
    Application,
    ExamCentre,
    InterviewPanel,
    Nomination,
    Requisition,
)
from .serializers import (
    AdmitCardSerializer,
    AdvertisementSerializer,
    ApplicationSerializer,
    ApplySerializer,
    ExamCentreSerializer,
    InterviewPanelSerializer,
    NominationSerializer,
    RequisitionSerializer,
)
from .services import (
    advance_requisition,
    assign_roll_and_admit,
    create_requisition,
    pay_application_fee,
    run_scrutiny,
    submit_application,
)


class RequisitionViewSet(viewsets.ModelViewSet):
    queryset = Requisition.objects.select_related("created_by", "case").all()
    serializer_class = RequisitionSerializer
    filterset_fields = ["status", "bps"]
    search_fields = ["case_number", "post_title", "ministry"]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.IsAuthenticated()]
        return [IsStaffUser()]

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        ser = self.get_serializer(page or qs, many=True)
        data = self.get_paginated_response(ser.data).data if page is not None else ser.data
        return success_response(data)

    def retrieve(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_object()).data)

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        req = create_requisition(data=ser.validated_data, user=request.user)
        return success_response(
            RequisitionSerializer(req).data, "Requisition created", status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        ser = self.get_serializer(instance, data=request.data, partial=partial)
        ser.is_valid(raise_exception=True)
        ser.save()
        return success_response(ser.data, "Updated")

    @action(detail=True, methods=["post"])
    def advance(self, request, pk=None):
        req = advance_requisition(
            requisition=self.get_object(),
            user=request.user,
            note=request.data.get("note", ""),
        )
        return success_response(RequisitionSerializer(req).data, "Advanced")


class AdvertisementViewSet(viewsets.ModelViewSet):
    queryset = Advertisement.objects.prefetch_related("requisitions").all()
    serializer_class = AdvertisementSerializer
    filterset_fields = ["kind", "is_published"]
    search_fields = ["ref_number", "title"]

    def get_permissions(self):
        if self.action in ("list", "retrieve", "published"):
            return [permissions.AllowAny()]
        return [IsStaffUser()]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == "published" or (
            self.action in ("list", "retrieve") and not self.request.user.is_authenticated
        ):
            return qs.filter(is_published=True)
        if self.action in ("list", "retrieve") and self.request.user.has_role("CANDIDATE"):
            if not self.request.user.is_staff:
                return qs.filter(is_published=True)
        return qs

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        ser = self.get_serializer(page or qs, many=True)
        data = self.get_paginated_response(ser.data).data if page is not None else ser.data
        return success_response(data)

    def retrieve(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_object()).data)

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj = ser.save()
        return success_response(self.get_serializer(obj).data, "Created", 201)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        ser = self.get_serializer(instance, data=request.data, partial=partial)
        ser.is_valid(raise_exception=True)
        ser.save()
        return success_response(ser.data, "Updated")

    @action(detail=False, methods=["get"], permission_classes=[permissions.AllowAny])
    def published(self, request):
        qs = Advertisement.objects.filter(is_published=True)
        return success_response(AdvertisementSerializer(qs, many=True).data)

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        ad = self.get_object()
        ad.is_published = True
        from django.utils import timezone

        if not ad.publish_date:
            ad.publish_date = timezone.localdate()
        ad.save()
        return success_response(AdvertisementSerializer(ad).data, "Published")


class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    filterset_fields = ["status", "advertisement", "fee_paid"]
    search_fields = ["tracking_id", "roll_number", "candidate__username"]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        qs = Application.objects.select_related(
            "advertisement", "candidate", "requisition", "centre"
        )
        user = self.request.user
        if user.is_staff or user.has_role(
            "T_AND_S", "PROGRAM", "COMMISSION", "IT", "ADMIN"
        ):
            return qs.all()
        return qs.filter(candidate=user)

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        ser = self.get_serializer(page or qs, many=True)
        data = self.get_paginated_response(ser.data).data if page is not None else ser.data
        return success_response(data)

    def retrieve(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_object()).data)

    @action(detail=False, methods=["post"], permission_classes=[IsCandidate])
    def apply(self, request):
        ser = ApplySerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        app = submit_application(
            candidate=request.user,
            advertisement_id=ser.validated_data["advertisement_id"],
            requisition_id=ser.validated_data.get("requisition_id"),
            documents=ser.validated_data.get("documents"),
        )
        return success_response(
            ApplicationSerializer(app).data, "Application submitted", 201
        )

    @action(detail=True, methods=["post"])
    def pay(self, request, pk=None):
        app = pay_application_fee(application=self.get_object(), user=request.user)
        return success_response(ApplicationSerializer(app).data, "Payment successful")

    @action(detail=True, methods=["post"], permission_classes=[IsStaffUser])
    def issue_admit_card(self, request, pk=None):
        card = assign_roll_and_admit(application=self.get_object())
        return success_response(AdmitCardSerializer(card).data, "Admit card issued")

    @action(detail=True, methods=["post"], permission_classes=[IsStaffUser])
    def scrutiny(self, request, pk=None):
        app = run_scrutiny(application=self.get_object(), user=request.user)
        return success_response(ApplicationSerializer(app).data, "Scrutiny complete")

    @action(detail=True, methods=["get"])
    def admit_card(self, request, pk=None):
        app = self.get_object()
        if not hasattr(app, "admit_card"):
            raise ValidationError("Admit card not issued yet.")
        return success_response(AdmitCardSerializer(app.admit_card).data)


class ExamCentreViewSet(viewsets.ModelViewSet):
    queryset = ExamCentre.objects.all()
    serializer_class = ExamCentreSerializer

    def list(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_queryset(), many=True).data)

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj = ser.save()
        return success_response(self.get_serializer(obj).data, "Created", 201)


class NominationViewSet(viewsets.ModelViewSet):
    queryset = Nomination.objects.select_related("application", "requisition").all()
    serializer_class = NominationSerializer
    permission_classes = [IsStaffUser]

    def list(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_queryset(), many=True).data)

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj = ser.save()
        app = obj.application
        app.status = Application.Status.NOMINATED
        app.save(update_fields=["status"])
        return success_response(self.get_serializer(obj).data, "Nomination issued", 201)


class InterviewPanelViewSet(viewsets.ModelViewSet):
    queryset = InterviewPanel.objects.all()
    serializer_class = InterviewPanelSerializer
    permission_classes = [IsStaffUser]

    def list(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_queryset(), many=True).data)
