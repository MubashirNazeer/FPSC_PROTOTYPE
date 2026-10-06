from __future__ import annotations

from typing import Any

from .models import AuditLog, User


def write_audit(
    *,
    actor: User | None,
    action: str,
    entity_type: str,
    entity_id: str | int = "",
    detail: dict[str, Any] | None = None,
    ip_address: str | None = None,
) -> AuditLog:
    return AuditLog.objects.create(
        actor=actor,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        detail=detail or {},
        ip_address=ip_address,
    )
