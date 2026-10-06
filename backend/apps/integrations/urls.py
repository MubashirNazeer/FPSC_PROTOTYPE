from django.urls import path

from .views import NadraVerifyView, PaymentChargeView, SmsSendView

urlpatterns = [
    path("integrations/nadra/verify/", NadraVerifyView.as_view()),
    path("integrations/payment/charge/", PaymentChargeView.as_view()),
    path("integrations/sms/send/", SmsSendView.as_view()),
]
