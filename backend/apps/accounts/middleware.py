from __future__ import annotations


class AuditMiddleware:
    """Attach request IP for later audit logging helpers."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.client_ip = self._client_ip(request)
        return self.get_response(request)

    @staticmethod
    def _client_ip(request) -> str | None:
        forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")
