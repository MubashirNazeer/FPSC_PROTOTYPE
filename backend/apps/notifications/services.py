from __future__ import annotations

from django.utils import timezone

from .models import NotificationOutbox
from .tasks import deliver_notification


def queue_notification(
    *,
    user,
    channel: str,
    subject: str,
    body: str,
    template_code: str = "",
    context: dict | None = None,
) -> NotificationOutbox:
    note = NotificationOutbox.objects.create(
        user=user,
        channel=channel,
        template_code=template_code,
        subject=subject,
        body=body,
        context=context or {},
        status=NotificationOutbox.Status.QUEUED,
    )
    deliver_notification.delay(note.pk)
    return note


def mark_sent(note_id: int) -> None:
    NotificationOutbox.objects.filter(pk=note_id).update(
        status=NotificationOutbox.Status.SENT,
        sent_at=timezone.now(),
    )
