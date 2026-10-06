from __future__ import annotations

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def standard_exception_handler(exc, context):
    """Wrap DRF errors in {success, data, message} envelope."""
    response = exception_handler(exc, context)
    if response is None:
        return Response(
            {
                "success": False,
                "data": {},
                "message": str(exc),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    message = "Request failed"
    data = response.data
    if isinstance(data, dict):
        if "detail" in data:
            message = str(data["detail"])
        else:
            message = "; ".join(
                f"{k}: {v}" for k, v in data.items()
            )
    elif isinstance(data, list):
        message = "; ".join(str(x) for x in data)
    response.data = {"success": False, "data": data, "message": message}
    return response


def success_response(data=None, message: str = "OK", status_code: int = 200):
    return Response(
        {"success": True, "data": data if data is not None else {}, "message": message},
        status=status_code,
    )
