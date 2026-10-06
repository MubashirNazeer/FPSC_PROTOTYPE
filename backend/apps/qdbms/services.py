from __future__ import annotations

import random

from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.accounts.services import write_audit

from .models import ExamPaper, PaperBlueprint, Question, QuestionVersion


STATUS_FLOW = [
    Question.Status.DRAFT,
    Question.Status.UNDER_REVIEW,
    Question.Status.APPROVED,
    Question.Status.ACTIVE,
]


def snapshot_question(question: Question, user) -> QuestionVersion:
    return QuestionVersion.objects.create(
        question=question,
        version=question.version,
        snapshot={
            "stem": question.stem,
            "options": question.options,
            "correct_answer": question.correct_answer,
            "difficulty": question.difficulty,
            "status": question.status,
        },
        changed_by=user,
    )


@transaction.atomic
def advance_question_status(*, question: Question, user) -> Question:
    try:
        idx = STATUS_FLOW.index(question.status)
    except ValueError as exc:
        if question.status == Question.Status.RETIRED:
            raise ValidationError("Question is retired.") from exc
        raise ValidationError("Invalid status") from exc
    if idx >= len(STATUS_FLOW) - 1:
        raise ValidationError("Already active.")
    nxt = STATUS_FLOW[idx + 1]
    if nxt == Question.Status.UNDER_REVIEW and not user.has_role(
        "AUTHOR", "REVIEWER", "APPROVER", "SECRECY", "ADMIN", "IT"
    ):
        if not user.is_superuser:
            raise PermissionDenied("Author/reviewer role required.")
    if nxt == Question.Status.APPROVED:
        if not user.has_role("REVIEWER", "APPROVER", "SECRECY", "ADMIN"):
            if not user.is_superuser:
                raise PermissionDenied("Reviewer role required.")
        question.reviewer = user
    if nxt == Question.Status.ACTIVE:
        if not user.has_role("APPROVER", "SECRECY", "ADMIN"):
            if not user.is_superuser:
                raise PermissionDenied("Approver role required.")
        question.approver = user
    snapshot_question(question, user)
    question.status = nxt
    question.version += 1
    question.save()
    write_audit(
        actor=user,
        action="Q_STATUS",
        entity_type="Question",
        entity_id=question.pk,
        detail={"status": nxt},
    )
    return question


@transaction.atomic
def generate_paper(*, title: str, blueprint: PaperBlueprint, user) -> ExamPaper:
    pool = Question.objects.filter(
        status__in=[Question.Status.APPROVED, Question.Status.ACTIVE]
    )
    constraints = blueprint.constraints or {}
    codes = constraints.get("taxonomy_codes") or []
    if codes:
        pool = pool.filter(taxonomy__code__in=codes)
    reuse_limit = constraints.get("reuse_limit", 9999)
    pool = pool.filter(usage_count__lt=reuse_limit)
    items = list(pool)
    if len(items) < blueprint.total_questions:
        raise ValidationError(
            f"Not enough questions in pool ({len(items)}/{blueprint.total_questions})."
        )
    difficulty_dist = constraints.get("difficulty_dist") or {}
    selected: list[Question] = []
    if difficulty_dist:
        for diff, count in difficulty_dist.items():
            bucket = [q for q in items if q.difficulty == int(diff) and q not in selected]
            random.shuffle(bucket)
            selected.extend(bucket[: int(count)])
        remaining = blueprint.total_questions - len(selected)
        if remaining > 0:
            rest = [q for q in items if q not in selected]
            random.shuffle(rest)
            selected.extend(rest[:remaining])
    else:
        random.shuffle(items)
        selected = items[: blueprint.total_questions]

    paper = ExamPaper.objects.create(
        title=title,
        blueprint=blueprint,
        status=ExamPaper.Status.PENDING_DUAL,
        created_by=user,
    )
    paper.questions.set(selected)
    return paper


@transaction.atomic
def dual_authorize_paper(*, paper: ExamPaper, user) -> ExamPaper:
    if paper.status not in (
        ExamPaper.Status.PENDING_DUAL,
        ExamPaper.Status.DRAFT,
    ):
        raise ValidationError("Paper not pending authorization.")
    if paper.authorizer_one_id is None:
        paper.authorizer_one = user
        paper.save(update_fields=["authorizer_one"])
        return paper
    if paper.authorizer_one_id == user.pk:
        raise ValidationError("Second authorizer must be a different user.")
    paper.authorizer_two = user
    paper.status = ExamPaper.Status.APPROVED
    paper.save()
    for q in paper.questions.all():
        q.usage_count += 1
        q.save(update_fields=["usage_count"])
    write_audit(
        actor=user,
        action="PAPER_DUAL_AUTH",
        entity_type="ExamPaper",
        entity_id=paper.pk,
        detail={"auth1": paper.authorizer_one_id, "auth2": user.pk},
    )
    return paper


def compute_basic_psychometrics(question: Question, correct_rate: float, disc: float) -> Question:
    question.facility_index = correct_rate
    question.discrimination_index = disc
    if correct_rate > 0.95 or correct_rate < 0.15 or disc < 0.2:
        meta = dict(question.metadata or {})
        meta["flag_revision"] = True
        question.metadata = meta
    question.save()
    return question
