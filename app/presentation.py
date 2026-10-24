"""API presentation models and adapters for the Next.js planner.

The planning engines use compact domain models.  This module deliberately owns
the public JSON contract so the web client never has to translate internal
planner terminology or guess at missing fields.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date
from typing import Dict, List

from pydantic import BaseModel, ConfigDict

from app.models import (
    BudgetPlan,
    EventRequest,
    FullPlan,
    IdeaSet,
    PlanDiff,
    SmartAdvice,
    TimelinePlan,
    VendorChecklist,
)


class APIModel(BaseModel):
    """Forbid accidental fields in all browser-facing response models."""

    model_config = ConfigDict(extra="forbid")


class BudgetCategoryResponse(APIModel):
    name: str
    percentage: float
    amount: float
    reasoning: str


class BudgetResponse(APIModel):
    event_type: str
    total_budget: float
    currency: str
    per_guest_cost: float
    categories: List[BudgetCategoryResponse]
    total_allocated: float
    contingency_percentage: float
    contingency_amount: float
    benchmark_warnings: List[str]
    notes: List[str]


class TimelineTaskResponse(APIModel):
    title: str
    category: str
    due_date: date
    days_before_event: int
    phase: str
    is_urgent: bool
    description: str


class RunOfShowResponse(APIModel):
    time_offset_hours: float
    time_label: str
    duration_minutes: int
    title: str
    description: str
    owner: str


class TimelineResponse(APIModel):
    event_type: str
    event_date: date
    days_remaining: int
    is_compressed: bool
    lead_benchmark_days: int
    phases: Dict[str, List[TimelineTaskResponse]]
    all_tasks_sorted: List[TimelineTaskResponse]
    run_of_show: List[RunOfShowResponse]


class VendorResponse(APIModel):
    vendor_type: str
    booking_deadline: date
    allocated_budget: float
    interview_questions: List[str]
    red_flags: List[str]
    required_documents: List[str]


class VendorChecklistResponse(APIModel):
    event_type: str
    recommended_vendors: List[VendorResponse]
    skipped_vendors: Dict[str, str]


class ThemeConceptResponse(APIModel):
    name: str
    description: str
    color_palette: List[str]


class DecorSuggestionResponse(APIModel):
    area: str
    idea: str
    diy_tip: str | None = None


class MenuRecommendationResponse(APIModel):
    course: str
    dishes: List[str]
    dietary_note: str | None = None


class ActivityResponse(APIModel):
    time_slot: str
    activity: str
    age_relevance: str | None = None


class IdeasResponse(APIModel):
    theme_concepts: List[ThemeConceptResponse]
    decor_suggestions: List[DecorSuggestionResponse]
    menu_recommendations: List[MenuRecommendationResponse]
    activity_timeline: List[ActivityResponse]
    budget_hacks: List[str]
    source: str


class PlanResponse(APIModel):
    request: EventRequest
    budget: BudgetResponse
    timeline: TimelineResponse
    vendors: VendorChecklistResponse
    ideas: IdeasResponse


class CategoryShiftResponse(APIModel):
    old_amount: float
    new_amount: float
    difference: float


class PlanDiffResponse(APIModel):
    budget_delta: float
    guest_count_delta: int
    date_shift_days: int
    category_shifts: Dict[str, CategoryShiftResponse]
    newly_urgent_tasks: List[str]


class SmartAdviceResponse(APIModel):
    primary_recommendation: str
    concrete_options: List[str]
    trade_offs: List[str]
    first_actions_this_week: List[str]


class ReplanResponse(APIModel):
    new_plan: PlanResponse
    diff: PlanDiffResponse
    advice: SmartAdviceResponse


_PALETTES = {
    "wedding": ["#D4AF37", "#F3E5AB", "#1A1412", "#E0A899"],
    "birthday": ["#A855F7", "#EC4899", "#06B6D4", "#0A0612"],
    "community": ["#10B981", "#D97706", "#04130C", "#D1FAE5"],
}

_LEAD_BENCHMARKS = {"wedding": 180, "birthday": 45, "community": 60}


def adapt_budget(request: EventRequest, budget: BudgetPlan) -> BudgetResponse:
    """Expose the budget fields consumed by the interactive planner."""
    contingency = next((item for item in budget.categories if item.name == "contingency"), None)
    return BudgetResponse(
        event_type=request.event_type.value,
        total_budget=budget.total_budget,
        currency=budget.currency,
        per_guest_cost=budget.per_guest_cost,
        categories=[
            BudgetCategoryResponse.model_validate(item, from_attributes=True)
            for item in budget.categories
        ],
        total_allocated=round(sum(item.amount for item in budget.categories), 2),
        contingency_percentage=contingency.percentage if contingency else 0,
        contingency_amount=contingency.amount if contingency else 0,
        benchmark_warnings=budget.warnings,
        notes=budget.money_saving_tips,
    )


def adapt_timeline(request: EventRequest, timeline: TimelinePlan) -> TimelineResponse:
    """Convert domain tasks into the ordered/grouped view expected by the UI."""
    tasks: List[TimelineTaskResponse] = []
    grouped: Dict[str, List[TimelineTaskResponse]] = defaultdict(list)
    for task in timeline.tasks:
        item = TimelineTaskResponse(
            title=task.title,
            category=task.category,
            due_date=task.due_date,
            days_before_event=max(0, (request.event_date - task.due_date).days),
            phase=task.phase,
            is_urgent=task.phase == "Now" or task.priority == "high",
            description=f"{task.priority.capitalize()} priority planning milestone.",
        )
        tasks.append(item)
        grouped[item.phase].append(item)

    run_of_show = [
        RunOfShowResponse(
            time_offset_hours=_parse_time_offset(item.time_offset),
            time_label=item.time_offset,
            duration_minutes=60,
            title=item.activity,
            description=item.details,
            owner="Event coordination lead",
        )
        for item in timeline.run_of_show
    ]
    return TimelineResponse(
        event_type=request.event_type.value,
        event_date=request.event_date,
        days_remaining=timeline.days_remaining,
        is_compressed=timeline.is_compressed,
        lead_benchmark_days=_LEAD_BENCHMARKS[request.event_type.value],
        phases=dict(grouped),
        all_tasks_sorted=tasks,
        run_of_show=run_of_show,
    )


def _parse_time_offset(value: str) -> float:
    """Best-effort conversion of a readable schedule label to an hour offset."""
    try:
        normalized = value.replace("T+", "").replace("T-", "-")
        hours, minutes = normalized.split(":", maxsplit=1)
        return float(hours) + (int(minutes) / 60 if float(hours) >= 0 else -(int(minutes) / 60))
    except (TypeError, ValueError):
        return 0


def adapt_vendors(request: EventRequest, vendors: VendorChecklist) -> VendorChecklistResponse:
    """Rename domain checklist fields once, at the HTTP boundary."""
    fallback_deadline = request.event_date
    return VendorChecklistResponse(
        event_type=request.event_type.value,
        recommended_vendors=[
            VendorResponse(
                vendor_type=item.vendor_type,
                booking_deadline=item.booking_deadline or fallback_deadline,
                allocated_budget=item.budget_allocated,
                interview_questions=item.questions_to_ask,
                red_flags=item.red_flags,
                required_documents=item.documents_to_get,
            )
            for item in vendors.vendors
        ],
        skipped_vendors={item.vendor_type: item.reason for item in vendors.skipped_vendors},
    )


def adapt_ideas(request: EventRequest, ideas: IdeaSet) -> IdeasResponse:
    """Give curated/AI text a consistent, visual structure for the moodboard."""
    palette = _PALETTES[request.event_type.value]
    theme_concepts = [
        ThemeConceptResponse(
            name=_idea_title(idea, index),
            description=idea,
            color_palette=palette,
        )
        for index, idea in enumerate(ideas.theme_ideas[:4], start=1)
    ]
    if not theme_concepts:
        theme_concepts.append(
            ThemeConceptResponse(
                name="Tailored celebration concept",
                description="A balanced concept built around your event brief.",
                color_palette=palette,
            )
        )

    menu_recommendations = [
        MenuRecommendationResponse(
            course=f"Curated course {index}",
            dishes=[dish],
            dietary_note="Matched to your stated dietary preferences.",
        )
        for index, dish in enumerate(ideas.food_menu_ideas[:4], start=1)
    ]
    return IdeasResponse(
        theme_concepts=theme_concepts,
        decor_suggestions=[
            DecorSuggestionResponse(area=f"Design moment {index}", idea=idea)
            for index, idea in enumerate(ideas.decor_ideas[:4], start=1)
        ],
        menu_recommendations=menu_recommendations,
        activity_timeline=[
            ActivityResponse(time_slot=f"Moment {index}", activity=idea)
            for index, idea in enumerate(ideas.activities[:4], start=1)
        ],
        budget_hacks=ideas.budget_hacks,
        source=ideas.source,
    )


def _idea_title(idea: str, index: int) -> str:
    """Create a concise card title without discarding the full idea text."""
    title = idea.split(":", maxsplit=1)[0].strip().strip("'\"")
    return title[:72] or f"Concept {index}"


def adapt_plan(plan: FullPlan) -> PlanResponse:
    """Build the one response object shared by planning and re-planning."""
    return PlanResponse(
        request=plan.request,
        budget=adapt_budget(plan.request, plan.budget),
        timeline=adapt_timeline(plan.request, plan.timeline),
        vendors=adapt_vendors(plan.request, plan.vendors),
        ideas=adapt_ideas(plan.request, plan.ideas),
    )


def adapt_replan(
    old_plan: FullPlan,
    new_plan: FullPlan,
    diff: PlanDiff,
    advice: SmartAdvice,
) -> ReplanResponse:
    """Convert domain deltas to the planner's directly renderable re-plan contract."""
    old_categories = {item.name: item.amount for item in old_plan.budget.categories}
    new_categories = {item.name: item.amount for item in new_plan.budget.categories}
    all_categories = list(dict.fromkeys([*old_categories, *new_categories]))
    old_urgent = {task.id for task in old_plan.timeline.tasks if task.phase == "Now"}
    new_urgent = {task.id for task in new_plan.timeline.tasks if task.phase == "Now"}
    budget_delta = round(new_plan.budget.total_budget - old_plan.budget.total_budget, 2)

    if budget_delta < 0:
        primary = "Budget reduced: protect catering quality first, then use the revised category allocations to negotiate vendor scope."
    elif budget_delta > 0:
        primary = "Budget increased: direct the additional capacity to the priorities you selected before adding new commitments."
    else:
        primary = "Your revised guest count and date have been rebalanced while keeping the total budget stable."

    return ReplanResponse(
        new_plan=adapt_plan(new_plan),
        diff=PlanDiffResponse(
            budget_delta=budget_delta,
            guest_count_delta=new_plan.request.guest_count - old_plan.request.guest_count,
            date_shift_days=(new_plan.request.event_date - old_plan.request.event_date).days,
            category_shifts={
                name: CategoryShiftResponse(
                    old_amount=round(old_categories.get(name, 0), 2),
                    new_amount=round(new_categories.get(name, 0), 2),
                    difference=round(new_categories.get(name, 0) - old_categories.get(name, 0), 2),
                )
                for name in all_categories
            },
            newly_urgent_tasks=[
                task.title for task in new_plan.timeline.tasks if task.id in new_urgent - old_urgent
            ],
        ),
        advice=SmartAdviceResponse(
            primary_recommendation=primary,
            concrete_options=advice.options_for_budget_or_guests,
            trade_offs=advice.tradeoff_advice or diff.timeline_changes,
            first_actions_this_week=advice.first_actions_this_week,
        ),
    )
