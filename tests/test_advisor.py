"""Tests for the dynamic re-planning advisor and plan diff engine."""

from datetime import date, timedelta

from app.models import (
    AllowedCurrency,
    EventPreferences,
    EventRequest,
    EventType,
    FullPlan,
)
from app.planner.advisor import compute_plan_diff, generate_smart_advice
from app.planner.budget import generate_budget_plan
from app.planner.ideas import generate_fallback_ideas
from app.planner.timeline import generate_timeline_plan
from app.planner.vendors import generate_vendor_checklist


def create_full_plan(
    total_budget: float = 300000.0,
    guest_count: int = 100,
    days_ahead: int = 120,
    event_type: str = "wedding",
) -> FullPlan:
    """Helper to assemble a FullPlan object."""
    req = EventRequest(
        event_type=EventType(event_type),
        title="Diff Test Celebration",
        guest_count=guest_count,
        total_budget=total_budget,
        currency=AllowedCurrency.INR,
        event_date=date.today() + timedelta(days=days_ahead),
        location="Jaipur",
        preferences=EventPreferences(),
    )
    b = generate_budget_plan(req)
    t = generate_timeline_plan(req)
    v = generate_vendor_checklist(req, b, t)
    i = generate_fallback_ideas(req)
    return FullPlan(request=req, budget=b, timeline=t, vendors=v, ideas=i)


def test_budget_increase_raises_allocated_amounts_proportionally() -> None:
    """Increasing budget should raise individual category amounts and show positive diffs."""
    old_plan = create_full_plan(total_budget=200000.0)
    new_plan = create_full_plan(total_budget=300000.0)

    diff = compute_plan_diff(old_plan, new_plan)
    assert len(diff.budget_changes) > 0

    for change in diff.budget_changes:
        assert change.new_amount > change.old_amount
        assert change.amount_change > 0
        # 200,000 to 300,000 is a 50% increase
        assert pytest_approx(change.percentage_change, 50.0, abs_tol=1.0)


def pytest_approx(val: float, target: float, abs_tol: float = 1.0) -> bool:
    return abs(val - target) <= abs_tol


def test_shortening_date_triggers_compressed_mode_and_urgent_tasks() -> None:
    """Shortening timeline from 180 days to 20 days should trigger compressed mode and urgent task counts."""
    old_plan = create_full_plan(days_ahead=180)
    new_plan = create_full_plan(days_ahead=20)

    diff = compute_plan_diff(old_plan, new_plan)

    assert new_plan.timeline.is_compressed is True
    assert any("compressed" in c.lower() for c in diff.timeline_changes)
    assert any("urgent" in c.lower() for c in diff.timeline_changes or diff.summary)


def test_diff_output_lists_only_categories_that_actually_changed() -> None:
    """When budget is unchanged, diff.budget_changes must be completely empty."""
    plan_a = create_full_plan(total_budget=250000.0, days_ahead=100)
    # Change date only, leave budget and guests untouched
    plan_b = create_full_plan(total_budget=250000.0, days_ahead=80)

    diff = compute_plan_diff(plan_a, plan_b)
    # Budget amounts did not change, so budget_changes must be empty
    assert len(diff.budget_changes) == 0


def test_smart_advice_provides_concrete_options_when_budget_is_low() -> None:
    """Low catering budget per guest should trigger 3 concrete options (cut guests, raise budget, format change)."""
    # 200 guests with 20,000 INR (~25-30 INR per guest catering vs 400 benchmark)
    plan = create_full_plan(total_budget=20000.0, guest_count=200)
    advice = generate_smart_advice(plan.request, plan.budget, plan.timeline)

    assert len(advice.options_for_budget_or_guests) == 3
    assert any("guest" in opt.lower() for opt in advice.options_for_budget_or_guests)
    assert any("budget" in opt.lower() for opt in advice.options_for_budget_or_guests)
    assert any("format" in opt.lower() or "tea" in opt.lower() or "buffet" in opt.lower() for opt in advice.options_for_budget_or_guests)


def test_first_actions_this_week_populated_for_close_dates() -> None:
    """For events with short horizons, first actions this week must return prioritized tasks."""
    plan = create_full_plan(days_ahead=15)
    advice = generate_smart_advice(plan.request, plan.budget, plan.timeline)
    assert len(advice.first_actions_this_week) > 0
    assert len(advice.first_actions_this_week) <= 5
