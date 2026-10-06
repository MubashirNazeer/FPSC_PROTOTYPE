from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.accounts.exceptions import success_response

from .adapters import get_nadra_adapter, get_payment_adapter, get_sms_adapter


class NadraVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        cnic = request.data.get("cnic") or request.user.cnic
        return success_response(get_nadra_adapter().verify(cnic), "NADRA mock verify")


class PaymentChargeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        result = get_payment_adapter().charge(
            amount=float(request.data.get("amount", 0)),
            reference=request.data.get("reference", "TEST"),
            payer_cnic=request.data.get("cnic") or request.user.cnic,
        )
        return success_response(result, "Payment mock charge")


class SmsSendView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        result = get_sms_adapter().send(
            phone=request.data.get("phone", ""),
            message=request.data.get("message", ""),
        )
        return success_response(result, "SMS mock send")
