from celery import shared_task


@shared_task
def deliver_notification(note_id: int) -> str:
    from .services import mark_sent

    mark_sent(note_id)
    return f"sent:{note_id}"
