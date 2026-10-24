"""Backwards-planned timeline generator for Event Planning Assistant."""

from datetime import date, timedelta
from typing import Dict, List
from app.models import (
    EventRequest,
    TimelinePlan,
    TimelineTask,
    RunOfShowItem,
)
from app.planner.rules import (
    TASK_TEMPLATES,
    RUN_OF_SHOW_TEMPLATES,
    IDEAL_LEAD_TIME,
)


def determine_phase(due_date: date, event_date: date, today: date) -> str:
    """Classify a task into a milestone planning phase."""
    if due_date == event_date:
        return "Event day"
    if due_date <= today + timedelta(days=3):
        return "Now"
    if due_date <= today + timedelta(days=30):
        return "This month"
    if due_date <= today + timedelta(days=90):
        return "Next 1-3 months"
    if due_date < event_date - timedelta(days=7):
        return "Final month"
    return "Final week"


def generate_timeline_plan(request: EventRequest, reference_date: date | None = None) -> TimelinePlan:
    """Generate a backwards-planned task schedule and run-of-show."""
    today = reference_date or date.today()
    event_date = request.event_date
    event_type = request.event_type.value

    days_remaining = (event_date - today).days
    if days_remaining <= 0:
        days_remaining = 1

    ideal_lead = IDEAL_LEAD_TIME.get(event_type, 60)
    is_compressed = days_remaining < ideal_lead

    warnings: List[str] = []
    if is_compressed:
        warnings.append(
            f"Compressed planning schedule: Only {days_remaining} days remaining until your event "
            f"(recommended lead time is {ideal_lead} days). Key booking tasks have been accelerated into the "
            f"'Now' phase as popular vendors and venues may have limited availability."
        )

    task_templates = TASK_TEMPLATES.get(event_type, [])
    tasks: List[TimelineTask] = []

    for tmpl in task_templates:
        lead_days = tmpl["lead_days"]

        # Calculate backwards-planned due date
        if is_compressed:
            # Scale task lead time proportionally within the compressed available window
            scaled_days = int(lead_days * (days_remaining / ideal_lead))
            calculated_due = event_date - timedelta(days=scaled_days)
        else:
            calculated_due = event_date - timedelta(days=lead_days)

        # Enforce that no due_date is in the past, and does not exceed event_date
        due_date = max(today, min(calculated_due, event_date))

        phase = determine_phase(due_date, event_date, today)
        if is_compressed and lead_days >= days_remaining:
            phase = "Now"

        tasks.append(
            TimelineTask(
                id=tmpl["id"],
                title=tmpl["title"],
                due_date=due_date,
                phase=phase,
                category=tmpl["category"],
                priority=tmpl["priority"],
                done=False,
            )
        )

    # Sort tasks primarily by due_date ascending, secondarily by priority (high > medium > low)
    priority_order = {"high": 0, "medium": 1, "low": 2}
    tasks.sort(key=lambda t: (t.due_date, priority_order.get(t.priority, 1)))

    # Identify all distinct phases in logical chronological order
    all_possible_phases = ["Now", "This month", "Next 1-3 months", "Final month", "Final week", "Event day"]
    active_phases = [p for p in all_possible_phases if any(t.phase == p for t in tasks)]
    if not active_phases:
        active_phases = ["Now"]

    # Build event-day run of show
    ros_data = RUN_OF_SHOW_TEMPLATES.get(event_type, [])
    run_of_show = [
        RunOfShowItem(
            time_offset=item["time_offset"],
            activity=item["activity"],
            details=item["details"],
        )
        for item in ros_data
    ]

    return TimelinePlan(
        days_remaining=days_remaining,
        is_compressed=is_compressed,
        phases=active_phases,
        tasks=tasks,
        run_of_show=run_of_show,
        warnings=warnings,
    )
