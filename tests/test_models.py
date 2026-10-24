"""Tests for Pydantic input models and validation."""

from datetime import date, timedelta

import pytest
from pydantic import ValidationError

from app.models import (
    AllowedCurrency,
    EventRequest,
    EventType,
    IndoorOutdoor,
)


def get_valid_payload() -> dict:
    """Helper to return a valid request payload."""
    future_date = date.today() + timedelta(days=90)
    return {
        "event_type": "wedding",
        "title": "Aarav & Diya Wedding",
        "guest_count": 150,
        "total_budget": 500000.0,
        "currency": "INR",
        "event_date": future_date.isoformat(),
        "location": "Jaipur, Rajasthan",
        "city_tier": "tier2",
        "preferences": {
            "theme": "Royal Rajasthani Heritage",
            "dietary": ["vegetarian", "jain"],
            "indoor_outdoor": "outdoor",
            "priorities": ["food", "decor", "venue"],
            "age_group": "mixed",
            "notes": "Looking for traditional folk music and eco-friendly decor.",
        },
    }


def test_valid_input() -> None:
    """Test valid event payload parses successfully."""
    payload = get_valid_payload()
    req = EventRequest(**payload)
    assert req.event_type == EventType.WEDDING
    assert req.guest_count == 150
    assert req.currency == AllowedCurrency.INR
    assert req.preferences.indoor_outdoor == IndoorOutdoor.OUTDOOR
    assert len(req.preferences.priorities) == 3


def test_past_date_rejected() -> None:
    """Event date in the past or today must be rejected."""
    payload = get_valid_payload()
    payload["event_date"] = (date.today() - timedelta(days=1)).isoformat()
    with pytest.raises(ValidationError) as exc_info:
        EventRequest(**payload)
    assert "Event date must be in the future" in str(exc_info.value)


def test_negative_budget_rejected() -> None:
    """Budget <= 0 must fail validation."""
    payload = get_valid_payload()
    payload["total_budget"] = -100.0
    with pytest.raises(ValidationError):
        EventRequest(**payload)

    payload["total_budget"] = 0
    with pytest.raises(ValidationError):
        EventRequest(**payload)


def test_oversized_guest_count_rejected() -> None:
    """Guest count > 1000 or < 1 must fail validation."""
    payload = get_valid_payload()
    payload["guest_count"] = 1001
    with pytest.raises(ValidationError):
        EventRequest(**payload)

    payload["guest_count"] = 0
    with pytest.raises(ValidationError):
        EventRequest(**payload)


def test_bad_currency_rejected() -> None:
    """Disallowed currencies must be rejected."""
    payload = get_valid_payload()
    payload["currency"] = "BITCOIN"
    with pytest.raises(ValidationError):
        EventRequest(**payload)


def test_too_many_priorities_rejected() -> None:
    """Selecting more than 3 priorities must fail validation."""
    payload = get_valid_payload()
    payload["preferences"]["priorities"] = ["food", "decor", "music", "photography"]
    with pytest.raises(ValidationError) as exc_info:
        EventRequest(**payload)
    assert "A maximum of 3 priorities can be selected" in str(exc_info.value) or "at most 3 items" in str(exc_info.value)


def test_extra_fields_forbidden() -> None:
    """Unknown fields should be forbidden for security."""
    payload = get_valid_payload()
    payload["unknown_injection"] = "malicious_payload"
    with pytest.raises(ValidationError):
        EventRequest(**payload)


def test_text_sanitization_removes_control_chars() -> None:
    """Control characters in title and notes must be stripped."""
    payload = get_valid_payload()
    payload["title"] = "  Wedding\x00Title\x07  "
    payload["preferences"]["notes"] = "\x1b[31mNotes with ANSI\x08 and control\x00"
    req = EventRequest(**payload)
    assert req.title == "WeddingTitle"
    assert "\x00" not in req.preferences.notes
