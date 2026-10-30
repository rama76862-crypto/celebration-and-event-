"""Tests covering boundary cases across models, planner engines, rules, and presentation."""

from datetime import date, timedelta
from unittest.mock import patch

import pytest
from pydantic import ValidationError

from app.config import settings
from app.models import (
    AgeGroup,
    CityTier,
    DietaryOption,
    EventPreferences,
    EventRequest,
    FullPlan,
    IdeaSet,
    PriorityCategory,
    ReplanRequest,
    TimelineTask,
    sanitize_text,
)
from app.planner.advisor import compute_plan_diff, generate_smart_advice
from app.planner.budget import generate_budget_plan, get_base_weights
from app.planner.ideas import (
    clean_json_text,
    generate_ideas,
    parse_and_validate_ai_response,
    select_dietary_menu,
)
from app.planner.timeline import generate_timeline_plan
from app.planner.vendors import generate_vendor_checklist
from app.presentation import adapt_ideas, adapt_replan


def test_config_has_ai_key_property() -> None:
    """Config returns boolean whether ai_api_key is set."""
    assert isinstance(settings.has_ai_key, bool)


def test_sanitize_text_none_returns_none() -> None:
    """Sanitize text returns None when input is None."""
    assert sanitize_text(None) is None


def test_models_priorities_validator_direct() -> None:
    """Directly calling validate_priorities_length with >3 priorities raises ValueError."""
    with pytest.raises(ValueError, match="maximum of 3 priorities"):
        EventPreferences.validate_priorities_length([PriorityCategory.FOOD] * 4)


def test_models_sanitize_field_non_string() -> None:
    """Calling sanitize_event_text with non-string passes it through directly."""
    assert EventRequest.sanitize_event_text(12345) == 12345


def test_models_empty_or_whitespace_title_rejected() -> None:
    """Empty or whitespace-only title raises a validation error."""
    future_date = date.today() + timedelta(days=30)
    with pytest.raises(ValidationError, match="Field cannot be empty"):
        EventRequest(
            event_type="wedding",
            title="   ",
            guest_count=100,
            total_budget=500000.0,
            currency="INR",
            event_date=future_date,
            location="Delhi",
            city_tier="metro",
        )


def test_models_replan_past_date_rejected() -> None:
    """ReplanRequest rejects an adjusted date that is today or in the past."""
    future_date = date.today() + timedelta(days=30)
    orig = EventRequest(
        event_type="birthday",
        title="Valid Event",
        guest_count=50,
        total_budget=100000.0,
        currency="INR",
        event_date=future_date,
        location="Delhi",
        city_tier="metro",
    )
    with pytest.raises(ValidationError, match="Adjusted event date must be in the future"):
        ReplanRequest(
            original_request=orig,
            new_event_date=date.today() - timedelta(days=1),
        )


def test_budget_unsupported_event_type_raises_value_error() -> None:
    """Passing an unsupported event type string raises ValueError in get_base_weights."""
    with pytest.raises(ValueError, match="Unsupported event type"):
        get_base_weights("unsupported_festival")


def test_timeline_event_date_today_sets_one_day_remaining() -> None:
    """If event date difference is 0 or negative, timeline defaults to 1 day remaining."""
    future_date = date.today() + timedelta(days=30)
    req = EventRequest(
        event_type="birthday",
        title="Short Notice Birthday",
        guest_count=20,
        total_budget=50000.0,
        currency="INR",
        event_date=future_date,
        location="Delhi",
        city_tier="metro",
    )
    object.__setattr__(req, "event_date", date.today())
    timeline = generate_timeline_plan(req)
    assert timeline.days_remaining == 1
    assert timeline.is_compressed is True
    assert "Now" in timeline.phases


def test_timeline_no_active_phases_defaults_to_now() -> None:
    """If no active tasks match standard phases, active_phases defaults to Now."""
    req = EventRequest(
        event_type="birthday",
        title="Special Birthday",
        guest_count=20,
        total_budget=50000.0,
        currency="INR",
        event_date=date.today() + timedelta(days=30),
        location="Delhi",
        city_tier="metro",
    )
    with patch("app.planner.timeline.TASK_TEMPLATES", {"birthday": []}):
        timeline = generate_timeline_plan(req)
        assert timeline.phases == ["Now"]


def test_vendors_kids_demographic_generates_entertainer() -> None:
    """When age_group is kids and budget is sufficient, a dedicated entertainer vendor is added."""
    future_date = date.today() + timedelta(days=45)
    req = EventRequest(
        event_type="birthday",
        title="Little Astronaut Party",
        guest_count=30,
        total_budget=200000.0,
        currency="INR",
        event_date=future_date,
        location="Bengaluru",
        city_tier="metro",
        preferences=EventPreferences(
            age_group=AgeGroup.KIDS,
            priorities=[PriorityCategory.ENTERTAINMENT],
        ),
    )
    budget = generate_budget_plan(req)
    timeline = generate_timeline_plan(req)
    checklist = generate_vendor_checklist(req, budget, timeline)
    vendor_names = [v.vendor_type for v in checklist.vendors]
    assert "Kids Party Entertainer & Magician" in vendor_names


def test_ideas_clean_json_text() -> None:
    """clean_json_text strips code fences and returns inner JSON."""
    raw = "```json\n{\"theme_concepts\": [\"Neon Dream\"]}\n```"
    assert clean_json_text(raw) == '{"theme_concepts": ["Neon Dream"]}'
    assert clean_json_text("not json") == "not json"


def test_ideas_parse_non_dict_json_returns_none() -> None:
    """parse_and_validate_ai_response returns None if parsed JSON is not a dict."""
    assert parse_and_validate_ai_response("[1, 2, 3]") is None


def test_ideas_select_dietary_menu_vegan() -> None:
    """select_dietary_menu extracts vegan items when vegan preference is given."""
    menu_dict = {
        "vegan": ["Avocado tartine", "Tofu satay", "Coconut panna cotta"],
        "default": ["Assorted finger foods"],
    }
    result = select_dietary_menu(menu_dict, [DietaryOption.VEGAN])
    assert "Tofu satay" in result


def test_ideas_unexpected_error_gracefully_falls_back() -> None:
    """Any unexpected exception inside generate_ideas logs warning and falls back."""
    future_date = date.today() + timedelta(days=60)
    req = EventRequest(
        event_type="wedding",
        title="Celestial Union",
        guest_count=100,
        total_budget=500000.0,
        currency="INR",
        event_date=future_date,
        location="Mumbai",
        city_tier="metro",
    )
    with patch("app.ai.client.AIClient.generate", side_effect=RuntimeError("Critical connection crash")):
        ideas = generate_ideas(req, per_guest_cost=5000.0)
        assert ideas.source == "fallback"
        assert len(ideas.theme_ideas) > 0


def test_advisor_date_postponed_expands_schedule() -> None:
    """Postponing event date marks schedule expanded out of compressed mode."""
    today = date.today()
    short_date = today + timedelta(days=15)
    long_date = today + timedelta(days=200)

    req_short = EventRequest(
        event_type="wedding",
        title="Wedding",
        guest_count=100,
        total_budget=1000000.0,
        currency="INR",
        event_date=short_date,
        location="Delhi",
        city_tier="metro",
    )
    req_long = EventRequest(
        event_type="wedding",
        title="Wedding",
        guest_count=100,
        total_budget=1000000.0,
        currency="INR",
        event_date=long_date,
        location="Delhi",
        city_tier="metro",
    )

    b_short = generate_budget_plan(req_short)
    t_short = generate_timeline_plan(req_short)
    v_short = generate_vendor_checklist(req_short, b_short, t_short)
    i_short = generate_ideas(req_short, b_short.per_guest_cost)
    old_plan = FullPlan(request=req_short, budget=b_short, timeline=t_short, vendors=v_short, ideas=i_short)

    b_long = generate_budget_plan(req_long)
    t_long = generate_timeline_plan(req_long)
    v_long = generate_vendor_checklist(req_long, b_long, t_long)
    i_long = generate_ideas(req_long, b_long.per_guest_cost)
    new_plan = FullPlan(request=req_long, budget=b_long, timeline=t_long, vendors=v_long, ideas=i_long)

    diff = compute_plan_diff(old_plan, new_plan)
    assert any("Schedule expanded" in s for s in diff.timeline_changes)


def test_advisor_urgent_tasks_fallback_to_high_priority() -> None:
    """If no tasks have phase Now, advisor falls back to high priority tasks."""
    today = date.today()
    req = EventRequest(
        event_type="birthday",
        title="Planning Birthday",
        guest_count=30,
        total_budget=50000.0,
        currency="INR",
        event_date=today + timedelta(days=45),
        location="Goa",
        city_tier=CityTier.TIER2,
    )
    budget = generate_budget_plan(req)
    timeline = generate_timeline_plan(req)
    test_tasks = [
        TimelineTask(
            id="task-1",
            phase="Next 1-3 months",
            title="Book Headliner",
            due_date=today + timedelta(days=10),
            priority="high",
            category="entertainment",
            done=False,
        )
    ]
    object.__setattr__(timeline, "tasks", test_tasks)
    advice = generate_smart_advice(req, budget, timeline)
    assert any("Book Headliner" in action for action in advice.first_actions_this_week)


def test_advisor_music_priority_with_tight_budget() -> None:
    """Music priority with modest budget generates targeted trade-off advice."""
    future_date = date.today() + timedelta(days=90)
    req = EventRequest(
        event_type="birthday",
        title="Live DJ Birthday",
        guest_count=50,
        total_budget=20000.0,
        currency="INR",
        event_date=future_date,
        location="Delhi",
        city_tier=CityTier.SMALL_TOWN,
        preferences=EventPreferences(
            priorities=[PriorityCategory.MUSIC, PriorityCategory.DECOR],
        ),
    )
    budget = generate_budget_plan(req)
    timeline = generate_timeline_plan(req)
    advice = generate_smart_advice(req, budget, timeline)
    assert any("master of ceremonies" in to.lower() for to in advice.tradeoff_advice)


def test_presentation_reduced_budget_and_date_change_advice() -> None:
    """Presentation adapt_replan generates tailored primary recommendation."""
    today = date.today()
    req_orig = EventRequest(
        event_type="wedding",
        title="Royal Wedding",
        guest_count=100,
        total_budget=1000000.0,
        currency="INR",
        event_date=today + timedelta(days=120),
        location="Delhi",
        city_tier="metro",
    )
    req_reduced = EventRequest(
        event_type="wedding",
        title="Royal Wedding",
        guest_count=100,
        total_budget=800000.0,
        currency="INR",
        event_date=today + timedelta(days=120),
        location="Delhi",
        city_tier="metro",
    )
    req_date_shifted = EventRequest(
        event_type="wedding",
        title="Royal Wedding",
        guest_count=120,
        total_budget=1000000.0,
        currency="INR",
        event_date=today + timedelta(days=140),
        location="Delhi",
        city_tier="metro",
    )

    old_plan = FullPlan(
        request=req_orig,
        budget=generate_budget_plan(req_orig),
        timeline=generate_timeline_plan(req_orig),
        vendors=generate_vendor_checklist(req_orig, generate_budget_plan(req_orig), generate_timeline_plan(req_orig)),
        ideas=generate_ideas(req_orig, 10000.0),
    )
    reduced_plan = FullPlan(
        request=req_reduced,
        budget=generate_budget_plan(req_reduced),
        timeline=generate_timeline_plan(req_reduced),
        vendors=generate_vendor_checklist(req_reduced, generate_budget_plan(req_reduced), generate_timeline_plan(req_reduced)),
        ideas=generate_ideas(req_reduced, 8000.0),
    )
    date_plan = FullPlan(
        request=req_date_shifted,
        budget=generate_budget_plan(req_date_shifted),
        timeline=generate_timeline_plan(req_date_shifted),
        vendors=generate_vendor_checklist(req_date_shifted, generate_budget_plan(req_date_shifted), generate_timeline_plan(req_date_shifted)),
        ideas=generate_ideas(req_date_shifted, 8333.0),
    )

    diff_reduced = compute_plan_diff(old_plan, reduced_plan)
    advice_reduced = generate_smart_advice(req_reduced, reduced_plan.budget, reduced_plan.timeline)
    replan_resp_red = adapt_replan(old_plan, reduced_plan, diff_reduced, advice_reduced)
    assert "Budget reduced" in replan_resp_red.advice.primary_recommendation

    diff_date = compute_plan_diff(old_plan, date_plan)
    advice_date = generate_smart_advice(req_date_shifted, date_plan.budget, date_plan.timeline)
    replan_resp_date = adapt_replan(old_plan, date_plan, diff_date, advice_date)
    assert "revised guest count" in replan_resp_date.advice.primary_recommendation


def test_presentation_empty_theme_fallback() -> None:
    """Presentation adapt_ideas handles empty theme concepts gracefully."""
    today = date.today()
    req = EventRequest(
        event_type="birthday",
        title="Special Birthday",
        guest_count=20,
        total_budget=50000.0,
        currency="INR",
        event_date=today + timedelta(days=30),
        location="Delhi",
        city_tier="metro",
    )
    ideas = IdeaSet(
        source="fallback",
        theme_ideas=[],  # Empty themes triggers line 278
        decor_ideas=["LED arches"],
        food_menu_ideas=["Mini sliders"],
        activities=["Karaoke"],
        return_gift_ideas=["Gift boxes"],
        budget_hacks=["BYO drinks"],
    )
    adapted = adapt_ideas(req, ideas)
    assert len(adapted.theme_concepts) > 0
    assert adapted.theme_concepts[0].name == "Tailored celebration concept"
