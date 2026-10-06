from __future__ import annotations

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.accounts.services import write_audit
from apps.workflow.services import start_case, transition_case

from .models import CompetitiveExamCycle

PHASE_FLOW = [
    CompetitiveExamCycle.Phase.PAPER_PREP,
    CompetitiveExamCycle.Phase.MPT_AD,
    CompetitiveExamCycle.Phase.MPT_APPS,
    CompetitiveExamCycle.Phase.MPT_EXAM,
    CompetitiveExamCycle.Phase.WRITTEN,
    CompetitiveExamCycle.Phase.PSYCH,
    CompetitiveExamCycle.Phase.MEDICAL,
    CompetitiveExamCycle.Phase.VIVA,
    CompetitiveExamCycle.Phase.ALLOCATION,
    CompetitiveExamCycle.Phase.CLOSED,
]

PHASE_TO_STATE = {p: p for p in PHASE_FLOW}


@transaction.atomic
def create_cycle(*, year: int, title: str, user) -> CompetitiveExamCycle:
    cycle = CompetitiveExamCycle.objects.create(year=year, title=title)
    case = start_case(
        workflow_code="CE_LIFECYCLE",
        reference_type="CompetitiveExamCycle",
        reference_id=cycle.pk,
        title=title,
        created_by=user,
    )
    cycle.case = case
    cycle.save(update_fields=["case"])
    return cycle


@transaction.atomic
def advance_cycle(*, cycle: CompetitiveExamCycle, user, note: str = "") -> CompetitiveExamCycle:
    try:
        idx = PHASE_FLOW.index(cycle.phase)
    except ValueError as exc:
        raise ValidationError("Unknown phase") from exc
    if idx >= len(PHASE_FLOW) - 1:
        raise ValidationError("Already closed.")
    nxt = PHASE_FLOW[idx + 1]
    if cycle.case:
        transition_case(
            case=cycle.case,
            to_state_code=PHASE_TO_STATE[nxt],
            actor=user,
            note=note,
        )
    cycle.phase = nxt
    cycle.save(update_fields=["phase"])
    write_audit(
        actor=user,
        action="CE_ADVANCE",
        entity_type="CompetitiveExamCycle",
        entity_id=cycle.pk,
        detail={"phase": nxt},
    )
    return cycle


def allocate_groups(*, cycle: CompetitiveExamCycle, user) -> int:
    """Simple merit-based group allocation stub."""
    prefs = ["PAS", "PSP", "FSP", "IRS", "PCS"]
    qs = cycle.progress.filter(mpt_passed=True).order_by("final_merit", "id")
    count = 0
    for i, prog in enumerate(qs):
        prog.allocated_group = prefs[i % len(prefs)]
        prog.allocated_service = f"{prog.allocated_group} — allocated {timezone.localdate()}"
        prog.save()
        count += 1
    write_audit(
        actor=user,
        action="GROUP_ALLOCATION",
        entity_type="CompetitiveExamCycle",
        entity_id=cycle.pk,
        detail={"allocated": count},
    )
    return count
