from __future__ import annotations

from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.accounts.services import write_audit

from .models import (
    CaseInstance,
    CaseTransitionLog,
    WorkflowDefinition,
    WorkflowState,
    WorkflowTransition,
)


def start_case(
    *,
    workflow_code: str,
    reference_type: str,
    reference_id: str | int,
    title: str,
    created_by,
    metadata: dict | None = None,
) -> CaseInstance:
    workflow = WorkflowDefinition.objects.get(code=workflow_code, is_active=True)
    initial = workflow.states.filter(is_initial=True).first()
    if not initial:
        raise ValidationError("Workflow has no initial state.")
    return CaseInstance.objects.create(
        workflow=workflow,
        current_state=initial,
        reference_type=reference_type,
        reference_id=str(reference_id),
        title=title,
        created_by=created_by,
        metadata=metadata or {},
    )


@transaction.atomic
def transition_case(
    *,
    case: CaseInstance,
    to_state_code: str,
    actor,
    note: str = "",
    co_approver=None,
) -> CaseInstance:
    transition = (
        WorkflowTransition.objects.select_related("from_state", "to_state")
        .filter(
            workflow=case.workflow,
            from_state=case.current_state,
            to_state__code=to_state_code,
        )
        .first()
    )
    if not transition:
        raise ValidationError(
            f"No transition from {case.current_state.code} to {to_state_code}."
        )
    if transition.required_role and not actor.has_role(
        transition.required_role, "ADMIN", "IT"
    ):
        if not actor.is_superuser:
            raise PermissionDenied(
                f"Role {transition.required_role} required for this transition."
            )
    if transition.requires_dual_auth:
        if co_approver is None or co_approver.pk == actor.pk:
            raise ValidationError("Dual authorization requires a distinct co-approver.")
        if not co_approver.has_role(transition.required_role, "ADMIN", "APPROVER"):
            raise PermissionDenied("Co-approver lacks required role.")

    from_state = case.current_state
    case.current_state = transition.to_state
    case.save(update_fields=["current_state", "updated_at"])
    CaseTransitionLog.objects.create(
        case=case,
        from_state=from_state,
        to_state=transition.to_state,
        actor=actor,
        co_approver=co_approver,
        note=note,
    )
    write_audit(
        actor=actor,
        action="WORKFLOW_TRANSITION",
        entity_type=case.reference_type,
        entity_id=case.reference_id,
        detail={
            "from": from_state.code,
            "to": transition.to_state.code,
            "case_id": case.pk,
        },
    )
    return case


def ensure_workflow(
    code: str,
    name: str,
    module: str,
    states: list[tuple[str, str, str]],
) -> WorkflowDefinition:
    """
    states: list of (code, name, responsible_role)
    Creates linear transitions between consecutive states.
    """
    wf, _ = WorkflowDefinition.objects.get_or_create(
        code=code, defaults={"name": name, "module": module}
    )
    state_objs: list[WorkflowState] = []
    for idx, (scode, sname, role) in enumerate(states):
        st, _ = WorkflowState.objects.update_or_create(
            workflow=wf,
            code=scode,
            defaults={
                "name": sname,
                "sequence": idx,
                "is_initial": idx == 0,
                "is_terminal": idx == len(states) - 1,
                "responsible_role": role,
            },
        )
        state_objs.append(st)
    for i in range(len(state_objs) - 1):
        WorkflowTransition.objects.get_or_create(
            workflow=wf,
            from_state=state_objs[i],
            to_state=state_objs[i + 1],
            defaults={
                "name": f"Advance to {state_objs[i + 1].name}",
                "required_role": state_objs[i + 1].responsible_role,
            },
        )
    return wf
