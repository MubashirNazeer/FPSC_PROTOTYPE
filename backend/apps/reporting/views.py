from django.contrib.auth import get_user_model
from django.db.models import Count
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.accounts.exceptions import success_response
from apps.accounts.permissions import IsStaffUser
from apps.accounts.models import AuditLog
from apps.cbt.models import ExamSession, ExamSitting
from apps.ce.models import CompetitiveExamCycle
from apps.gr.models import Advertisement, Application, Appeal, Requisition
from apps.notifications.models import NotificationOutbox
from apps.qdbms.models import ExamPaper, Question
from apps.supporting.models import DutyAssignment, InventoryItem
from apps.uem.models import PreExamReport, UEMExamInstance
from apps.workflow.models import CaseInstance

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
                "shortlisted": Application.objects.filter(status="SHORTLISTED").count(),
                "by_status": list(
                    Application.objects.values("status").annotate(c=Count("id"))
                ),
            },
            "advertisements_published": Advertisement.objects.filter(
                is_published=True
            ).count(),
            "ce_cycles": CompetitiveExamCycle.objects.count(),
            "uem_exams": UEMExamInstance.objects.count(),
            "pre_exam_reports": PreExamReport.objects.count(),
            "appeals_open": Appeal.objects.exclude(
                status__in=["ACCEPTED", "REJECTED", "RESTORED"]
            ).count(),
            "open_cases": CaseInstance.objects.exclude(
                current_state__is_terminal=True
            ).count(),
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
            "audit_events": AuditLog.objects.count(),
            "staff_users": User.objects.filter(is_staff=True).count(),
            "candidates": User.objects.filter(roles__code="CANDIDATE").distinct().count(),
            "delay_solutions_live": {
                "qdbms_cbt": True,
                "automated_scoring": True,
                "scrutiny_engine": True,
                "ecase_workflow": True,
                "notifications": True,
                "central_ems": True,
                "dss_dashboard": True,
                "audit_trail": True,
            },
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


class CentreWorkloadView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request):
        rows = list(
            Application.objects.exclude(centre__isnull=True)
            .values("centre__code", "centre__name", "centre__city")
            .annotate(candidates=Count("id"))
            .order_by("-candidates")
        )
        return success_response(rows)


class ScrutinyStatsView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request):
        return success_response(
            {
                "shortlisted": Application.objects.filter(status="SHORTLISTED").count(),
                "rejected": Application.objects.filter(status="REJECTED").count(),
                "under_scrutiny": Application.objects.filter(
                    status="UNDER_SCRUTINY"
                ).count(),
                "avg_score_sample": list(
                    Application.objects.exclude(scrutiny_score__isnull=True)
                    .order_by("-scrutiny_score")
                    .values("tracking_id", "scrutiny_score", "status")[:20]
                ),
            }
        )
