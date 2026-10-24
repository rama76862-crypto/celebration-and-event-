"""Smart suggestions engine and plan diff computation for dynamic re-planning."""

from typing import List

from app.models import (
    BudgetPlan,
    CategoryDiff,
    EventRequest,
    FullPlan,
    PlanDiff,
    SmartAdvice,
    TimelinePlan,
)
from app.planner.rules import MIN_CATERING_PER_GUEST


def compute_plan_diff(old_plan: FullPlan, new_plan: FullPlan) -> PlanDiff:
    """Calculate structured difference between two plans.

    CRITICAL: Lists only categories that actually changed in amount.
    """
    old_cat_map = {c.name: c for c in old_plan.budget.categories}
    new_cat_map = {c.name: c for c in new_plan.budget.categories}

    budget_changes: List[CategoryDiff] = []
    summary_snippets: List[str] = []

    # 1. Budget changes
    all_cat_names = list(dict.fromkeys(list(old_cat_map.keys()) + list(new_cat_map.keys())))
    for name in all_cat_names:
        old_cat = old_cat_map.get(name)
        new_cat = new_cat_map.get(name)

        old_amt = round(old_cat.amount, 2) if old_cat else 0.0
        new_amt = round(new_cat.amount, 2) if new_cat else 0.0

        if old_amt != new_amt:
            amt_change = round(new_amt - old_amt, 2)
            pct_change = round(((new_amt - old_amt) / old_amt) * 100, 1) if old_amt > 0 else 100.0

            budget_changes.append(
                CategoryDiff(
                    category=name,
                    old_amount=old_amt,
                    new_amount=new_amt,
                    amount_change=amt_change,
                    percentage_change=pct_change,
                )
            )

    # 2. Timeline changes
    timeline_changes: List[str] = []
    old_urgent = {t.id for t in old_plan.timeline.tasks if t.phase == "Now"}
    new_urgent = {t.id for t in new_plan.timeline.tasks if t.phase == "Now"}

    if len(new_urgent) > len(old_urgent):
        diff_count = len(new_urgent) - len(old_urgent)
        timeline_changes.append(f"{diff_count} tasks became urgent")
        summary_snippets.append(f"{diff_count} tasks became urgent")
    elif len(new_urgent) < len(old_urgent):
        diff_count = len(old_urgent) - len(new_urgent)
        timeline_changes.append(f"{diff_count} tasks moved to extended planning windows")

    if new_plan.timeline.is_compressed and not old_plan.timeline.is_compressed:
        timeline_changes.append("Schedule transitioned into compressed urgent mode")
    elif not new_plan.timeline.is_compressed and old_plan.timeline.is_compressed:
        timeline_changes.append("Schedule expanded out of compressed mode")

    days_diff = new_plan.timeline.days_remaining - old_plan.timeline.days_remaining
    if days_diff != 0:
        timeline_changes.append(
            f"Planning window shifted by {days_diff:+d} days ({new_plan.timeline.days_remaining} days remaining)"
        )

    # 3. Overall summary snippets
    if old_plan.budget.total_budget != new_plan.budget.total_budget:
        b_diff = new_plan.budget.total_budget - old_plan.budget.total_budget
        summary_snippets.append(f"Total budget {b_diff:+,.2f} {new_plan.budget.currency}")

    # Add top category shifts to summary
    for bc in budget_changes[:2]:
        summary_snippets.append(f"{bc.category.capitalize()} {bc.percentage_change:+.1f}%")

    return PlanDiff(
        budget_changes=budget_changes,
        timeline_changes=timeline_changes,
        summary=summary_snippets,
    )


def generate_smart_advice(
    request: EventRequest,
    budget: BudgetPlan,
    timeline: TimelinePlan,
) -> SmartAdvice:
    """Produce context-aware recommendations on budget/guest tradeoffs and urgent priorities."""
    options_for_budget_or_guests: List[str] = []
    first_actions_this_week: List[str] = []
    tradeoff_advice: List[str] = []

    # 1. Per-guest cost benchmarking
    min_bench = MIN_CATERING_PER_GUEST.get(request.currency.value, 400.0)
    catering_key = "catering" if any(c.name == "catering" for c in budget.categories) else "food/refreshments"
    catering_item = next((c for c in budget.categories if c.name == catering_key), None)

    if catering_item and request.guest_count > 0:
        catering_per_guest = catering_item.amount / request.guest_count
        if catering_per_guest < min_bench:
            # Concrete Option 1: Cut guests
            target_guests = max(1, int(catering_item.amount / min_bench))
            options_for_budget_or_guests.append(
                f"Option 1 (Reduce Guest List): Trim guest count from {request.guest_count} to ~{target_guests} attendees "
                f"to achieve the recommended catering standard ({request.currency.value} {min_bench:.0f}/guest)."
            )

            # Concrete Option 2: Raise budget
            target_catering = min_bench * request.guest_count
            share = catering_item.percentage / 100.0 if catering_item.percentage > 0 else 0.25
            target_total = round(target_catering / share, -2)
            options_for_budget_or_guests.append(
                f"Option 2 (Increase Total Budget): Raise total budget to ~{request.currency.value} {target_total:,.0f} "
                f"to adequately cover catering, venue, and service standards for all {request.guest_count} guests."
            )

            # Concrete Option 3: Cheaper format
            options_for_budget_or_guests.append(
                "Option 3 (Menu Restructure): Switch from a formal seated dinner buffet to an interactive high-tea, "
                "heavy cocktail appetizers, or grazing street-food station format to reduce per-plate costs by 35%."
            )

    # 2. Prioritized first 5 things to do this week (if date is close or compressed)
    if timeline.days_remaining <= 60 or timeline.is_compressed:
        # Sort by urgency: phase 'Now' and high priority first
        urgent_tasks = [t for t in timeline.tasks if t.phase == "Now"]
        if not urgent_tasks:
            urgent_tasks = [t for t in timeline.tasks if t.priority == "high"]

        for idx, task in enumerate(urgent_tasks[:5], start=1):
            first_actions_this_week.append(
                f"{idx}. {task.title} (Target due: {task.due_date}, Category: {task.category.capitalize()})"
            )

    # 3. Priority tradeoff advice
    chosen_priorities = [p.value for p in request.preferences.priorities]
    if len(chosen_priorities) >= 2:
        if "venue" in chosen_priorities and "food" in chosen_priorities and "decor" in chosen_priorities:
            tradeoff_advice.append(
                "Prioritizing Venue, Food, and Decor simultaneously consumes over 65% of all funds. "
                "Consider opting for in-season local flowers or digital invitations to protect your food quality "
                "without compromising the guest experience."
            )
        elif "music" in chosen_priorities or "entertainment" in chosen_priorities:
            if budget.per_guest_cost < (min_bench * 1.5):
                tradeoff_advice.append(
                    "With entertainment prioritized on a modest budget, consider booking a versatile DJ who also acts as "
                    "Master of Ceremonies (MC), avoiding the dual cost of a live band and a separate party host."
                )

    return SmartAdvice(
        options_for_budget_or_guests=options_for_budget_or_guests,
        first_actions_this_week=first_actions_this_week,
        tradeoff_advice=tradeoff_advice,
    )
