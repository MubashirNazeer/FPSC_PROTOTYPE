from rest_framework import permissions, viewsets
from rest_framework.decorators import action

from apps.accounts.exceptions import success_response
from apps.accounts.permissions import IsStaffUser

from .models import ExamSession, ExamSitting
from .serializers import (
    ExamSessionSerializer,
    ExamSittingSerializer,
    build_candidate_questions,
)
from .services import (
    device_swap,
    enroll_candidate,
    go_live,
    save_answer,
    start_session,
    submit_session,
    toggle_flag,
    verify_biometric,
)


class ExamSittingViewSet(viewsets.ModelViewSet):
    queryset = ExamSitting.objects.select_related("paper", "centre").all()
    serializer_class = ExamSittingSerializer
    permission_classes = [IsStaffUser]
    filterset_fields = ["status", "mode", "centre"]

    def list(self, request, *args, **kwargs):
        return success_response(
            self.get_serializer(self.filter_queryset(self.get_queryset()), many=True).data
        )

    def retrieve(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_object()).data)

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj = ser.save()
        obj.seal_package()
        return success_response(self.get_serializer(obj).data, "Sitting created", 201)

    @action(detail=True, methods=["post"])
    def go_live(self, request, pk=None):
        sitting = go_live(sitting=self.get_object())
        return success_response(ExamSittingSerializer(sitting).data, "Sitting is LIVE")

    @action(detail=True, methods=["get"])
    def invigilator(self, request, pk=None):
        sitting = self.get_object()
        sessions = sitting.sessions.select_related("candidate").all()
        data = {
            "sitting": ExamSittingSerializer(sitting).data,
            "sessions": ExamSessionSerializer(sessions, many=True).data,
            "counts": {
                "total": sessions.count(),
                "in_progress": sessions.filter(status="IN_PROGRESS").count(),
                "submitted": sessions.filter(
                    status__in=["SUBMITTED", "AUTO_SUBMITTED"]
                ).count(),
                "anomalies": sessions.exclude(anomaly_flags=[]).count(),
            },
        }
        return success_response(data)

    @action(detail=True, methods=["post"])
    def enroll(self, request, pk=None):
        sitting = self.get_object()
        candidate_id = request.data.get("candidate_id") or request.user.pk
        from django.contrib.auth import get_user_model

        User = get_user_model()
        candidate = User.objects.get(pk=candidate_id)
        session = enroll_candidate(sitting=sitting, candidate=candidate)
        return success_response(ExamSessionSerializer(session).data, "Enrolled", 201)


class ExamSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ExamSessionSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        qs = ExamSession.objects.select_related("sitting", "candidate", "application")
        user = self.request.user
        if user.is_staff or user.has_role("INVIGILATOR", "SECRECY", "IT", "ADMIN"):
            return qs.all()
        return qs.filter(candidate=user)

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        return success_response(self.get_serializer(qs, many=True).data)

    def retrieve(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_object()).data)

    @action(detail=True, methods=["post"])
    def verify_biometric(self, request, pk=None):
        session = self.get_object()
        cnic = request.data.get("cnic") or request.user.cnic
        session = verify_biometric(session=session, cnic=cnic)
        return success_response(ExamSessionSerializer(session).data, "Biometric OK")

    @action(detail=True, methods=["post"])
    def start(self, request, pk=None):
        session = start_session(
            session=self.get_object(),
            terminal_id=request.data.get("terminal_id", "T-01"),
        )
        return success_response(
            {
                "session": ExamSessionSerializer(session).data,
                "questions": build_candidate_questions(session),
            },
            "Exam started",
        )

    @action(detail=True, methods=["get"])
    def paper(self, request, pk=None):
        session = self.get_object()
        if session.candidate_id != request.user.pk and not request.user.is_staff:
            return success_response({}, "Forbidden", 403)
        return success_response(
            {
                "session": ExamSessionSerializer(session).data,
                "questions": build_candidate_questions(session),
            }
        )

    @action(detail=True, methods=["post"])
    def answer(self, request, pk=None):
        session = save_answer(
            session=self.get_object(),
            question_id=int(request.data.get("question_id")),
            answer=request.data.get("answer"),
        )
        return success_response(
            {
                "session": ExamSessionSerializer(session).data,
                "seconds_remaining": session.seconds_remaining,
            },
            "Answer saved",
        )

    @action(detail=True, methods=["post"])
    def flag(self, request, pk=None):
        session = toggle_flag(
            session=self.get_object(),
            question_id=int(request.data.get("question_id")),
        )
        return success_response(ExamSessionSerializer(session).data, "Flag toggled")

    @action(detail=True, methods=["post"])
    def swap_device(self, request, pk=None):
        session = device_swap(
            session=self.get_object(),
            new_terminal=request.data.get("terminal_id", "T-SWAP"),
        )
        return success_response(ExamSessionSerializer(session).data, "Device swapped")

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        session = submit_session(session=self.get_object())
        return success_response(ExamSessionSerializer(session).data, "Submitted")
