from django.contrib.auth import get_user_model
from django.db.models import Count
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.accounts.exceptions import success_response
from apps.accounts.permissions import IsStaffUser
from apps.cbt.models import ExamSession, ExamSitting
from apps.ce.models import CompetitiveExamCycle
from apps.gr.models import Advertisement, Application, Requisition
from apps.notifications.models import NotificationOutbox
from apps.qdbms.models import ExamPaper, Question
from apps.supporting.models import DutyAssignment, InventoryItem
from apps.uem.models import UEMExamInstance

User = get_user_model()


class ExecutiveDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request):
        data = {
            "requisitions": {
                "total": Requisition.objects.count(),
                "by_status": list(
                    Requisition.objects.values("status").annotate(c=Count("id"))
                ),
            },
            "applications": {
                "total": Application.objects.count(),
                "fee_paid": Application.objects.filter(fee_paid=True).count(),
                "by_status": list(
                    Application.objects.values("status").annotate(c=Count("id"))
                ),
            },
            "advertisements_published": Advertisement.objects.filter(
                is_published=True
            ).count(),
            "ce_cycles": CompetitiveExamCycle.objects.count(),
            "uem_exams": UEMExamInstance.objects.count(),
            "questions": {
                "total": Question.objects.count(),
                "active": Question.objects.filter(status="ACTIVE").count(),
            },
            "papers_approved": ExamPaper.objects.filter(status="APPROVED").count(),
            "cbt": {
                "sittings": ExamSitting.objects.count(),
                "live": ExamSitting.objects.filter(status="LIVE").count(),
                "sessions": ExamSession.objects.count(),
                "in_progress": ExamSession.objects.filter(status="IN_PROGRESS").count(),
            },
            "duties": DutyAssignment.objects.count(),
            "inventory_skus": InventoryItem.objects.count(),
            "notifications_sent": NotificationOutbox.objects.filter(status="SENT").count(),
            "staff_users": User.objects.filter(is_staff=True).count(),
            "candidates": User.objects.filter(roles__code="CANDIDATE").distinct().count(),
        }
        return success_response(data)


class MeritListView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request):
        ad_id = request.query_params.get("advertisement_id")
        qs = Application.objects.filter(fee_paid=True).exclude(score__isnull=True)
        if ad_id:
            qs = qs.filter(advertisement_id=ad_id)
        qs = qs.order_by("-score")[:100]
        rows = [
            {
                "tracking_id": a.tracking_id,
                "roll_number": a.roll_number,
                "candidate": a.candidate.get_full_name() or a.candidate.username,
                "score": float(a.score),
                "status": a.status,
            }
            for a in qs.select_related("candidate")
        ]
        return success_response(rows)
