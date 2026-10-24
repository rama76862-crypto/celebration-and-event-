"""Tests for backwards-planned timeline generator."""

from datetime import date, timedelta

from app.models import (
    AllowedCurrency,
    EventPreferences,
    EventRequest,
    EventType,
)
from app.planner.rules import BASE_ALLOCATIONS
from app.planner.timeline import generate_timeline_plan


def create_req(event_type: str, days_ahead: int) -> EventRequest:
    """Helper to create an EventRequest with a designated lead time."""
    return EventRequest(
        event_type=EventType(event_type),
        title=f"Test {event_type}",
        guest_count=100,
        total_budget=50000.0,
        currency=AllowedCurrency.INR,
        event_date=date.today() + timedelta(days=days_ahead),
        location="Delhi",
        preferences=EventPreferences(),
    )


def test_tasks_are_sorted_by_due_date() -> None:
    """Verify that tasks returned are always sorted in non-decreasing order of due date."""
    for ev_type in ["wedding", "birthday", "community"]:
        plan = generate_timeline_plan(create_req(ev_type, 120))
        due_dates = [t.due_date for t in plan.tasks]
        assert due_dates == sorted(due_dates)


def test_no_due_date_is_in_the_past() -> None:
    """Even for very imminent events, no due date should precede today."""
    today = date.today()
    for days in [1, 5, 14, 30, 200]:
        plan = generate_timeline_plan(create_req("wedding", days))
        for task in plan.tasks:
            assert task.due_date >= today
            assert task.due_date <= req_event_date(days)


def req_event_date(days: int) -> date:
    return date.today() + timedelta(days=days)


def test_compressed_mode_triggers_when_event_is_less_than_ideal_lead_time() -> None:
    """Wedding ideal is 180 days; an event in 30 days must be compressed."""
    tight_wedding = generate_timeline_plan(create_req("wedding", 30))
    assert tight_wedding.is_compressed is True
    assert len(tight_wedding.warnings) > 0

    ample_wedding = generate_timeline_plan(create_req("wedding", 250))
    assert ample_wedding.is_compressed is False


def test_every_task_maps_to_a_valid_category() -> None:
    """Every generated task category must link to a valid budget category for that event type."""
    for ev_type in ["wedding", "birthday", "community"]:
        plan = generate_timeline_plan(create_req(ev_type, 90))
        valid_cats = set(BASE_ALLOCATIONS[ev_type].keys())
        for task in plan.tasks:
            assert task.category in valid_cats, f"Task {task.id} category '{task.category}' not in {valid_cats}"


def test_event_day_schedule_exists_for_all_three_event_types() -> None:
    """Run-of-show hour-by-hour schedule must exist and have multiple entries for each event type."""
    for ev_type in ["wedding", "birthday", "community"]:
        plan = generate_timeline_plan(create_req(ev_type, 60))
        assert len(plan.run_of_show) >= 5
        for item in plan.run_of_show:
            assert item.time_offset
            assert item.activity
            assert item.details
