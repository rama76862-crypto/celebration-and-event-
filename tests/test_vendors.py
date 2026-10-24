"""Tests for context-aware vendor checklist builder."""

from datetime import date, timedelta

from app.models import (
    AgeGroup,
    AllowedCurrency,
    DietaryOption,
    EventPreferences,
    EventRequest,
    EventType,
    IndoorOutdoor,
)
from app.planner.budget import generate_budget_plan
from app.planner.timeline import generate_timeline_plan
from app.planner.vendors import generate_vendor_checklist


def make_context(
    event_type: str = "wedding",
    total_budget: float = 200000.0,
    indoor_outdoor: str = "indoor",
    dietary: list | None = None,
    age_group: str | None = None,
) -> tuple[EventRequest, any, any]:
    """Helper to generate request, budget plan, and timeline plan."""
    req = EventRequest(
        event_type=EventType(event_type),
        title=f"Sample {event_type}",
        guest_count=100,
        total_budget=total_budget,
        currency=AllowedCurrency.INR,
        event_date=date.today() + timedelta(days=90),
        location="Bengaluru",
        preferences=EventPreferences(
            indoor_outdoor=IndoorOutdoor(indoor_outdoor),
            dietary=[DietaryOption(d) for d in (dietary or [])],
            age_group=AgeGroup(age_group) if age_group else None,
        ),
    )
    budget = generate_budget_plan(req)
    timeline = generate_timeline_plan(req)
    return req, budget, timeline


def test_every_vendor_has_at_least_four_questions() -> None:
    """Every generated vendor item must provide at least 4 specific interview questions."""
    for ev_type in ["wedding", "birthday", "community"]:
        req, budget, timeline = make_context(event_type=ev_type, total_budget=300000.0)
        checklist = generate_vendor_checklist(req, budget, timeline)
        assert len(checklist.vendors) > 0
        for vendor in checklist.vendors:
            assert len(vendor.questions_to_ask) >= 4, f"{vendor.vendor_type} has only {len(vendor.questions_to_ask)} questions"


def test_outdoor_events_include_shelter_vendor() -> None:
    """Outdoor events must include tent house and weather shelter vendors."""
    req, budget, timeline = make_context(event_type="wedding", indoor_outdoor="outdoor")
    checklist = generate_vendor_checklist(req, budget, timeline)
    vendor_types = [v.vendor_type.lower() for v in checklist.vendors]
    assert any("tent" in vt or "canopy" in vt or "shelter" in vt for vt in vendor_types)
    assert any("generator" in vt or "power" in vt for vt in vendor_types)
    assert any("sanitation" in vt or "trailer" in vt for vt in vendor_types)


def test_low_budget_skips_premium_vendors_with_explanation() -> None:
    """When the entertainment budget is below threshold, live band/DJ is skipped with clear rationale."""
    # Total budget of 10,000 INR -> entertainment allocation is ~1,500 INR, well below the 15,000 threshold
    req, budget, timeline = make_context(event_type="birthday", total_budget=10000.0)
    checklist = generate_vendor_checklist(req, budget, timeline)
    assert len(checklist.skipped_vendors) > 0
    skipped = checklist.skipped_vendors[0]
    assert "Live Band" in skipped.vendor_type or "DJ" in skipped.vendor_type
    assert "below the threshold" in skipped.reason


def test_sort_order_is_by_deadline() -> None:
    """Vendors must be sorted in ascending order of booking deadline."""
    req, budget, timeline = make_context(event_type="wedding", total_budget=500000.0, indoor_outdoor="outdoor")
    checklist = generate_vendor_checklist(req, budget, timeline)
    deadlines = [v.booking_deadline for v in checklist.vendors if v.booking_deadline]
    assert deadlines == sorted(deadlines)
