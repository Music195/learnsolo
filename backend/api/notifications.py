import json
from pathlib import Path
from flask import request, current_app
from flask_login import current_user

from api import api_bp
from extensions import db
from models import Feedback

NOTIFICATIONS_FILE = Path(__file__).resolve().parent.parent.parent / "content" / "notifications.json"

DEFAULT_NOTIFICATIONS = [
    {
        "id": "noti-1",
        "title": "JLPT N1–N5 Mock Tests are live! 🎉",
        "message": "Practice with 200 authentic mock tests across Vocabulary, Grammar, Reading, and Listening.",
        "link": "/past/jlpt",
        "date": "Nov 4, 2026",
    },
    {
        "id": "noti-2",
        "title": "Live Exam Scoring & Review Cards 🎯",
        "message": "Check your real-time score, accuracy percentage, and pass/review badges on every mock test.",
        "link": "/past",
        "date": "Nov 4, 2026",
    },
    {
        "id": "noti-3",
        "title": "Grade 12 Myanmar Physics & Math Updated 🇲🇲",
        "message": "Complete physics interactive simulations and mathematics chapter notes ready for exam prep.",
        "link": "/notes",
        "date": "Nov 3, 2026",
    },
]


def _load_notifications():
    if not NOTIFICATIONS_FILE.exists():
        try:
            NOTIFICATIONS_FILE.parent.mkdir(parents=True, exist_ok=True)
            with open(NOTIFICATIONS_FILE, "w", encoding="utf-8") as f:
                json.dump(DEFAULT_NOTIFICATIONS, f, indent=2, ensure_ascii=False)
            return DEFAULT_NOTIFICATIONS
        except Exception:
            return DEFAULT_NOTIFICATIONS
    try:
        with open(NOTIFICATIONS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return DEFAULT_NOTIFICATIONS


@api_bp.get("/notifications")
def api_notifications():
    """Fetch notifications and creator announcements."""
    notifications = _load_notifications()
    return {"notifications": notifications}


@api_bp.post("/feedback")
def api_submit_feedback():
    """Submit user feedback."""
    data = request.get_json(silent=True) or {}
    message = str(data.get("message", "")).strip()
    category = str(data.get("category", "general")).strip()
    page_url = str(data.get("page_url", "")).strip()

    if not message:
        return {"error": "Feedback message cannot be empty."}, 400

    email = current_user.email if current_user.is_authenticated else str(data.get("email", "")).strip() or None

    try:
        feedback = Feedback(
            user_email=email,
            category=category,
            message=message,
            page_url=page_url[:500] if page_url else None,
        )
        db.session.add(feedback)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        current_app.logger.error("Failed to save feedback: %s", e)
        # Even if DB table is syncing, acknowledge reception
        return {"ok": True, "message": "Thank you! Your feedback has been received."}

    return {"ok": True, "message": "Thank you! Your feedback has been received."}
