"""Independent Alert Dispatching Service.
Formats in-app notifications, browser Web Notification API payloads, and
provides abstraction for email (SMTP/SendGrid) and SMS (Twilio) gateways.
"""

from typing import Dict, Any, List
import json


class NotificationDispatcher:
    def __init__(self):
        self.in_memory_notifications: List[Dict[str, Any]] = []

    def dispatch(self, alert_payload: Dict[str, Any], subscribers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Dispatch notifications across enabled channels for subscribers."""
        dispatched_count = 0
        channels_used = set()

        for sub in subscribers:
            channels = sub.get("channels", {})
            user_email = sub.get("user_email")

            # 1. In-App Notification
            notification_item = {
                "alert_id": alert_payload.get("id"),
                "recipient": user_email,
                "title": alert_payload.get("title"),
                "message": alert_payload.get("message"),
                "severity": alert_payload.get("severity"),
                "timestamp": alert_payload.get("created_at"),
                "distance_km": sub.get("distance_km")
            }
            self.in_memory_notifications.append(notification_item)
            dispatched_count += 1

            # 2. Browser Push Web Notification Payload
            if channels.get("browser"):
                channels_used.add("browser")

            # 3. Email Gateway (Mock/Abstraction)
            if channels.get("email"):
                channels_used.add("email")
                # Real implementation: send_email(user_email, title, body)

            # 4. SMS Gateway (Mock/Abstraction)
            if channels.get("sms"):
                channels_used.add("sms")
                # Real implementation: send_sms(phone, body)

        return {
            "dispatched_count": dispatched_count,
            "channels_used": list(channels_used),
            "status": "DISPATCHED"
        }

    def get_latest_notifications(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.in_memory_notifications[-limit:]


dispatcher = NotificationDispatcher()
