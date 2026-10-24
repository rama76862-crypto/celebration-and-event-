"""Tests for the adaptive budget engine."""

from datetime import date, timedelta

from app.models import (
    AllowedCurrency,
    EventPreferences,
    EventRequest,
    EventType,
    IndoorOutdoor,
    PriorityCategory,
)
from app.planner.budget import generate_budget_plan


def make_request(
    event_type: str = "wedding",
    total_budget: float = 100000.0,
    guest_count: int = 100,
    priorities: list | None = None,
    indoor_outdoor: str = "indoor",
    currency: str = "INR",
) -> EventRequest:
    """Helper to create test event requests."""
    return EventRequest(
        event_type=EventType(event_type),
        title=f"Sample {event_type.capitalize()}",
        guest_count=guest_count,
        total_budget=total_budget,
        currency=AllowedCurrency(currency),
        event_date=date.today() + timedelta(days=60),
        location="New Delhi",
        preferences=EventPreferences(
            indoor_outdoor=IndoorOutdoor(indoor_outdoor),
            priorities=[PriorityCategory(p) for p in (priorities or [])],
        ),
    )


def test_allocations_sum_exactly_to_total_budget() -> None:
    """Category amounts must sum exactly to total_budget without floating-point mismatch."""
    for budget in [33333.33, 500000.0, 123456.78, 999999.99]:
        req = make_request(total_budget=budget)
        plan = generate_budget_plan(req)
        total_allocated = sum(c.amount for c in plan.categories)
        assert round(total_allocated, 2) == round(budget, 2)


def test_priorities_increase_relevant_category_share() -> None:
    """Prioritizing food should result in a higher catering share compared to baseline."""
    baseline_req = make_request(event_type="wedding", priorities=[])
    food_prioritized_req = make_request(event_type="wedding", priorities=["food"])

    base_plan = generate_budget_plan(baseline_req)
    prio_plan = generate_budget_plan(food_prioritized_req)

    base_catering = next(c for c in base_plan.categories if c.name == "catering")
    prio_catering = next(c for c in prio_plan.categories if c.name == "catering")

    assert prio_catering.percentage > base_catering.percentage
    assert prio_catering.amount > base_catering.amount


def test_low_budget_per_guest_triggers_warning() -> None:
    """When catering per guest falls below benchmark, a warning must be emitted."""
    # 200 guests with budget of 20,000 INR (~25-30 INR per guest catering vs 400 benchmark)
    req = make_request(total_budget=20000.0, guest_count=200, currency="INR")
    plan = generate_budget_plan(req)
    assert len(plan.warnings) > 0
    assert any("below the realistic minimum benchmark" in w for w in plan.warnings)


def test_outdoor_and_wedding_has_at_least_10_percent_contingency() -> None:
    """Outdoor events and weddings must maintain >= 10% contingency reserve."""
    wedding_req = make_request(event_type="wedding", indoor_outdoor="indoor")
    wedding_plan = generate_budget_plan(wedding_req)
    wedding_contingency = next(c for c in wedding_plan.categories if c.name == "contingency")
    assert wedding_contingency.percentage >= 10.0

    outdoor_bday_req = make_request(event_type="birthday", indoor_outdoor="outdoor")
    outdoor_plan = generate_budget_plan(outdoor_bday_req)
    outdoor_contingency = next(c for c in outdoor_plan.categories if c.name == "contingency")
    assert outdoor_contingency.percentage >= 10.0
    # Also verify weather backup line item exists
    assert any("weather backup" in c.name for c in outdoor_plan.categories)


def test_each_event_type_returns_expected_categories() -> None:
    """Verify distinct baseline categories for each event type."""
    wedding_plan = generate_budget_plan(make_request(event_type="wedding"))
    wedding_cats = {c.name for c in wedding_plan.categories}
    assert {"venue", "catering", "decor", "photography", "attire", "contingency"}.issubset(wedding_cats)

    bday_plan = generate_budget_plan(make_request(event_type="birthday"))
    bday_cats = {c.name for c in bday_plan.categories}
    assert {"venue", "catering", "decor", "cake", "entertainment", "return gifts", "contingency"}.issubset(bday_cats)

    comm_plan = generate_budget_plan(make_request(event_type="community"))
    comm_cats = {c.name for c in comm_plan.categories}
    assert {"venue", "food/refreshments", "equipment/AV", "permits/insurance", "volunteers", "publicity", "contingency"}.issubset(comm_cats)
