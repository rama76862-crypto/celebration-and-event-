"""Edge case and boundary condition tests."""

from datetime import date, timedelta

from app.models import (
    AllowedCurrency,
    EventPreferences,
    EventRequest,
    EventType,
)
from app.planner.budget import generate_budget_plan
from app.planner.ideas import generate_fallback_ideas
from app.planner.timeline import generate_timeline_plan


def test_guest_count_at_lower_boundary() -> None:
    """Guest count of exactly 1 must be accepted and planned."""
    req = EventRequest(
        event_type=EventType.BIRTHDAY,
        title="Solo Birthday Celebration",
        guest_count=1,
        total_budget=5000.0,
        currency=AllowedCurrency.INR,
        event_date=date.today() + timedelta(days=15),
        location="Delhi",
        preferences=EventPreferences(),
    )
    b = generate_budget_plan(req)
    assert b.per_guest_cost == 5000.0
    assert sum(c.amount for c in b.categories) == 5000.0


def test_guest_count_at_upper_boundary() -> None:
    """Guest count of exactly 1000 must be accepted and planned."""
    req = EventRequest(
        event_type=EventType.COMMUNITY,
        title="Mega Town Gathering",
        guest_count=1000,
        total_budget=1000000.0,
        currency=AllowedCurrency.INR,
        event_date=date.today() + timedelta(days=90),
        location="Bengaluru",
        preferences=EventPreferences(),
    )
    b = generate_budget_plan(req)
    assert b.per_guest_cost == 1000.0
    assert sum(c.amount for c in b.categories) == 1000000.0


def test_event_tomorrow() -> None:
    """Event occurring tomorrow (1 day ahead) triggers emergency compressed timeline."""
    tomorrow = date.today() + timedelta(days=1)
    req = EventRequest(
        event_type=EventType.WEDDING,
        title="Last Minute Wedding",
        guest_count=50,
        total_budget=200000.0,
        currency=AllowedCurrency.INR,
        event_date=tomorrow,
        location="Goa",
        preferences=EventPreferences(),
    )
    t = generate_timeline_plan(req)
    assert t.days_remaining == 1
    assert t.is_compressed is True
    assert len(t.warnings) > 0
    # Every task due date must be either today or tomorrow
    for task in t.tasks:
        assert task.due_date in (date.today(), tomorrow)


def test_huge_budget_upper_bound() -> None:
    """Maximum allowable budget (10,000,000) works without numerical overflow."""
    req = EventRequest(
        event_type=EventType.WEDDING,
        title="Palatial Grand Wedding",
        guest_count=500,
        total_budget=10_000_000.0,
        currency=AllowedCurrency.INR,
        event_date=date.today() + timedelta(days=180),
        location="Udaipur",
        preferences=EventPreferences(),
    )
    b = generate_budget_plan(req)
    assert sum(c.amount for c in b.categories) == 10_000_000.0
    assert b.per_guest_cost == 20000.0


def test_unicode_and_emojis_in_title_and_notes() -> None:
    """Unicode characters, regional scripts, and emojis in user inputs are preserved cleanly."""
    unicode_title = "💍 Diya & Aarav's Shaadi 🎉"
    unicode_notes = "विवाह समारोह की शुभकामनाएं! Looking for traditional sitar and eco-friendly diyas 🪔."

    req = EventRequest(
        event_type=EventType.WEDDING,
        title=unicode_title,
        guest_count=100,
        total_budget=500000.0,
        currency=AllowedCurrency.INR,
        event_date=date.today() + timedelta(days=90),
        location="Varanasi",
        preferences=EventPreferences(notes=unicode_notes),
    )
    assert req.title == unicode_title
    assert "विवाह" in req.preferences.notes
    assert "🪔" in req.preferences.notes

    # Verify ideas fallback handles it safely
    ideas = generate_fallback_ideas(req)
    assert len(ideas.theme_ideas) > 0


def test_empty_priorities_handled_gracefully() -> None:
    """When no priorities are selected, standard balanced weights are applied."""
    req = EventRequest(
        event_type=EventType.BIRTHDAY,
        title="Simple Birthday",
        guest_count=30,
        total_budget=30000.0,
        currency=AllowedCurrency.INR,
        event_date=date.today() + timedelta(days=30),
        location="Pune",
        preferences=EventPreferences(priorities=[]),
    )
    b = generate_budget_plan(req)
    assert len(b.categories) > 0
    assert sum(c.amount for c in b.categories) == 30000.0
