from __future__ import annotations

import random

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.integrations.adapters import get_nadra_adapter
from apps.qdbms.models import Question

from .models import ExamSession, ExamSitting


def _shuffle_options(question: Question) -> list:
    opts = list(question.options or [])
    random.shuffle(opts)
    return opts


@transaction.atomic
def enroll_candidate(*, sitting: ExamSitting, candidate, application=None) -> ExamSession:
    questions = list(sitting.paper.questions.filter(
        status__in=[Question.Status.APPROVED, Question.Status.ACTIVE]
    ))
    if not questions:
        questions = list(sitting.paper.questions.all())
    qids = [q.pk for q in questions]
    random.shuffle(qids)
    option_orders = {str(q.pk): _shuffle_options(q) for q in questions}
    session, _ = ExamSession.objects.get_or_create(
        sitting=sitting,
        candidate=candidate,
        defaults={
            "application": application,
            "question_order": qids,
            "option_orders": option_orders,
        },
    )
    return session


def verify_biometric(*, session: ExamSession, cnic: str) -> ExamSession:
    result = get_nadra_adapter().verify(cnic=cnic)
    if not result.get("matched"):
        session.anomaly_flags = list(session.anomaly_flags or []) + ["BIOMETRIC_FAIL"]
        session.save(update_fields=["anomaly_flags"])
        raise ValidationError("Biometric verification failed.")
    session.status = ExamSession.Status.BIOMETRIC_OK
    session.save(update_fields=["status"])
    return session


@transaction.atomic
def start_session(*, session: ExamSession, terminal_id: str = "") -> ExamSession:
    if session.sitting.status != ExamSitting.Status.LIVE:
        raise ValidationError("Sitting is not live.")
    if session.status not in (
        ExamSession.Status.PENDING,
        ExamSession.Status.BIOMETRIC_OK,
        ExamSession.Status.PAUSED,
    ):
        if session.status != ExamSession.Status.IN_PROGRESS:
            raise ValidationError("Session cannot be started.")
    if not session.started_at:
        session.started_at = timezone.now()
    session.status = ExamSession.Status.IN_PROGRESS
    if terminal_id:
        session.terminal_id = terminal_id
    session.save()
    return session


def save_answer(*, session: ExamSession, question_id: int, answer) -> ExamSession:
    if session.status != ExamSession.Status.IN_PROGRESS:
        raise ValidationError("Session not in progress.")
    if session.seconds_remaining <= 0:
        return auto_submit(session=session)
    answers = dict(session.answers or {})
    answers[str(question_id)] = answer
    session.answers = answers
    session.save(update_fields=["answers"])
    return session


def toggle_flag(*, session: ExamSession, question_id: int) -> ExamSession:
    flagged = list(session.flagged or [])
    qid = str(question_id)
    if qid in flagged:
        flagged.remove(qid)
    else:
        flagged.append(qid)
    session.flagged = flagged
    session.save(update_fields=["flagged"])
    return session


def device_swap(*, session: ExamSession, new_terminal: str) -> ExamSession:
    session.terminal_id = new_terminal
    session.anomaly_flags = list(session.anomaly_flags or []) + [
        f"DEVICE_SWAP:{new_terminal}"
    ]
    session.save(update_fields=["terminal_id", "anomaly_flags"])
    return session


def _score_session(session: ExamSession) -> float:
    correct = 0
    total = len(session.question_order or [])
    if total == 0:
        return 0.0
    questions = {
        q.pk: q
        for q in Question.objects.filter(pk__in=session.question_order)
    }
    for qid in session.question_order:
        q = questions.get(qid)
        if not q:
            continue
        ans = (session.answers or {}).get(str(qid))
        expected = (q.correct_answer or {}).get("key")
        if isinstance(ans, dict):
            ans = ans.get("key")
        if ans == expected:
            correct += 1
    return round(100.0 * correct / total, 2)


@transaction.atomic
def submit_session(*, session: ExamSession, auto: bool = False) -> ExamSession:
    if session.status in (
        ExamSession.Status.SUBMITTED,
        ExamSession.Status.AUTO_SUBMITTED,
    ):
        return session
    session.score = _score_session(session)
    session.submitted_at = timezone.now()
    session.status = (
        ExamSession.Status.AUTO_SUBMITTED if auto else ExamSession.Status.SUBMITTED
    )
    session.save()
    if session.application_id:
        session.application.score = session.score
        session.application.save(update_fields=["score"])
    return session


def auto_submit(*, session: ExamSession) -> ExamSession:
    return submit_session(session=session, auto=True)


def go_live(*, sitting: ExamSitting) -> ExamSitting:
    sitting.status = ExamSitting.Status.LIVE
    sitting.seal_package()
    sitting.save(update_fields=["status"])
    return sitting
