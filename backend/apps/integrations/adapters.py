"""Pluggable mock adapters for NADRA, payment, SMS."""
from __future__ import annotations

import uuid
from typing import Protocol


class NadraAdapter(Protocol):
    def verify(self, cnic: str) -> dict: ...


class PaymentAdapter(Protocol):
    def charge(self, amount: float, reference: str, payer_cnic: str) -> dict: ...


class SmsAdapter(Protocol):
    def send(self, phone: str, message: str) -> dict: ...


class MockNadraAdapter:
    def verify(self, cnic: str) -> dict:
        digits = (cnic or "").replace("-", "")
        matched = len(digits) == 13 and digits.isdigit()
        return {
            "matched": matched,
            "provider": "MOCK_NADRA",
            "cnic": cnic,
            "name": "Verified Citizen" if matched else None,
        }


class MockPaymentAdapter:
    def charge(self, amount: float, reference: str, payer_cnic: str) -> dict:
        return {
            "success": True,
            "transaction_id": f"PAY-{uuid.uuid4().hex[:12].upper()}",
            "amount": amount,
            "reference": reference,
            "payer_cnic": payer_cnic,
            "provider": "MOCK_PAY",
        }


class MockSmsAdapter:
    def send(self, phone: str, message: str) -> dict:
        return {
            "success": True,
            "message_id": f"SMS-{uuid.uuid4().hex[:8].upper()}",
            "phone": phone,
            "provider": "MOCK_SMS",
            "preview": message[:120],
        }


def get_nadra_adapter() -> NadraAdapter:
    return MockNadraAdapter()


def get_payment_adapter() -> PaymentAdapter:
    return MockPaymentAdapter()


def get_sms_adapter() -> SmsAdapter:
    return MockSmsAdapter()
