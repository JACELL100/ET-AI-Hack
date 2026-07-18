"""Authkey.io integration for SMS and Voice call alerts.

Authkey.io API:
    Base: https://api.authkey.io/request
    SMS:  ?authkey=KEY&mobile=PHONE&country_code=91&sms=MSG&sender=SENDERID
    Voice: ?authkey=KEY&mobile=PHONE&country_code=91&voice=MSG
    Both:  combine sms + voice params in one request
"""
from __future__ import annotations

import logging
import time
import urllib.parse
from dataclasses import dataclass
from typing import Optional

import httpx

logger = logging.getLogger(__name__)


@dataclass
class AlertDeliveryResult:
    success: bool = False
    channel: str = ""            # sms | voice | both
    phone: str = ""
    message: str = ""
    authkey_response: dict | None = None
    error: str | None = None
    timestamp: float = 0.0

    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "channel": self.channel,
            "phone": self.phone,
            "message": self.message,
            "authkey_response": self.authkey_response,
            "error": self.error,
            "timestamp": self.timestamp or time.time(),
        }


class AuthkeyService:
    """Integration with Authkey.io for sending SMS and Voice alerts."""

    BASE_URL = "https://api.authkey.io/request"

    def __init__(
        self,
        api_key: str = "",
        sender_id: str = "RAKSHA",
        country_code: str = "91",
    ) -> None:
        self.api_key = api_key
        self.sender_id = sender_id
        self.country_code = country_code
        self._client = httpx.AsyncClient(timeout=30.0)

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    # -- low-level API calls ------------------------------------------------

    async def send_sms(self, phone: str, message: str) -> AlertDeliveryResult:
        """Send an SMS alert via Authkey.io."""
        if not self.is_configured:
            return AlertDeliveryResult(
                success=False,
                channel="sms",
                phone=phone,
                message=message,
                error="Authkey API key not configured",
            )

        params = {
            "authkey": self.api_key,
            "mobile": self._clean_phone(phone),
            "country_code": self.country_code,
            "sms": message,
            "sender": self.sender_id,
        }

        return await self._make_request(params, "sms", phone, message)

    async def send_voice_alert(self, phone: str, message: str) -> AlertDeliveryResult:
        """Place an outbound TTS voice call via Authkey.io.

        The Authkey platform converts the text message into speech and
        calls the recipient.
        """
        if not self.is_configured:
            return AlertDeliveryResult(
                success=False,
                channel="voice",
                phone=phone,
                message=message,
                error="Authkey API key not configured",
            )

        params = {
            "authkey": self.api_key,
            "mobile": self._clean_phone(phone),
            "country_code": self.country_code,
            "voice": message,
        }

        return await self._make_request(params, "voice", phone, message)

    async def send_combined_alert(
        self,
        phone: str,
        sms_message: str,
        voice_message: str,
    ) -> AlertDeliveryResult:
        """Send both SMS + Voice call in a single Authkey request."""
        if not self.is_configured:
            return AlertDeliveryResult(
                success=False,
                channel="both",
                phone=phone,
                message=sms_message,
                error="Authkey API key not configured",
            )

        params = {
            "authkey": self.api_key,
            "mobile": self._clean_phone(phone),
            "country_code": self.country_code,
            "sms": sms_message,
            "sender": self.sender_id,
            "voice": voice_message,
        }

        return await self._make_request(params, "both", phone, sms_message)

    # -- high-level helpers --------------------------------------------------

    async def send_scam_alert(
        self,
        phone: str,
        threat_score: float,
        scam_type: str | None = None,
        channel: str = "sms",
    ) -> AlertDeliveryResult:
        """Format and send a RAKSHA scam alert.

        Parameters
        ----------
        channel : str
            ``sms``, ``voice``, or ``both``.
        """
        scam_label = scam_type or "Suspicious Activity"
        risk_pct = int(min(100, threat_score))

        sms_msg = (
            f"⚠️ RAKSHA AI Alert: Potential {scam_label} detected "
            f"(Risk: {risk_pct}%). Do NOT transfer money. Hang up immediately. "
            f"Report: cybercrime.gov.in | Helpline: 1930"
        )

        voice_msg = (
            f"Attention! RAKSHA AI has detected a potential scam call "
            f"targeting you. The risk level is {risk_pct} percent. "
            f"Please hang up immediately and do not transfer any money. "
            f"For help, call the cyber crime helpline 1930."
        )

        if channel == "sms":
            return await self.send_sms(phone, sms_msg)
        elif channel == "voice":
            return await self.send_voice_alert(phone, voice_msg)
        else:
            return await self.send_combined_alert(phone, sms_msg, voice_msg)

    # -- internals -----------------------------------------------------------

    async def _make_request(
        self,
        params: dict,
        channel: str,
        phone: str,
        message: str,
    ) -> AlertDeliveryResult:
        """Execute the Authkey GET request."""
        try:
            resp = await self._client.get(self.BASE_URL, params=params)
            resp_data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {"raw": resp.text}

            is_ok = resp.status_code == 200
            logger.info(
                "Authkey %s → %s | status=%s | resp=%s",
                channel, phone, resp.status_code, resp.text[:200],
            )

            return AlertDeliveryResult(
                success=is_ok,
                channel=channel,
                phone=phone,
                message=message,
                authkey_response=resp_data,
                timestamp=time.time(),
            )

        except Exception as exc:
            logger.error("Authkey request failed: %s", exc)
            return AlertDeliveryResult(
                success=False,
                channel=channel,
                phone=phone,
                message=message,
                error=str(exc),
                timestamp=time.time(),
            )

    @staticmethod
    def _clean_phone(phone: str) -> str:
        """Strip +91, spaces, dashes from phone number."""
        clean = phone.strip().replace(" ", "").replace("-", "")
        if clean.startswith("+91"):
            clean = clean[3:]
        elif clean.startswith("91") and len(clean) == 12:
            clean = clean[2:]
        return clean

    async def close(self) -> None:
        await self._client.aclose()


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------
_service: AuthkeyService | None = None


def get_authkey_service(
    api_key: str = "",
    sender_id: str = "RAKSHA",
) -> AuthkeyService:
    global _service
    if _service is None:
        _service = AuthkeyService(api_key=api_key, sender_id=sender_id)
    return _service
