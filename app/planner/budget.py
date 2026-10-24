"""Adaptive budget allocation engine for weddings, birthdays, and community events."""

from typing import Dict, List

from app.models import (
    AgeGroup,
    BudgetCategoryItem,
    BudgetPlan,
    CityTier,
    DietaryOption,
    EventRequest,
    IndoorOutdoor,
)
from app.planner.rules import (
    BASE_ALLOCATIONS,
    MIN_CATERING_PER_GUEST,
    MONEY_SAVING_TIPS,
    PRIORITY_TO_CATEGORY,
)


def get_base_weights(event_type: str) -> Dict[str, float]:
    """Retrieve a copy of base percentage weights for the given event type."""
    if event_type not in BASE_ALLOCATIONS:
        raise ValueError(f"Unsupported event type: {event_type}")
    return dict(BASE_ALLOCATIONS[event_type])


def apply_city_tier_adjustments(
    weights: Dict[str, float],
    city_tier: CityTier | None,
    event_type: str,
    reasonings: Dict[str, List[str]],
) -> None:
    """Adjust venue and catering weights according to city cost tier."""
    if not city_tier:
        return

    catering_key = "catering" if "catering" in weights else "food/refreshments"

    if city_tier == CityTier.METRO:
        if "venue" in weights:
            weights["venue"] *= 1.15
            reasonings.setdefault("venue", []).append("Increased venue share for metro tier cost premium")
        if catering_key in weights:
            weights[catering_key] *= 1.10
            reasonings.setdefault(catering_key, []).append("Elevated catering allocation for metro living index")
    elif city_tier == CityTier.SMALL_TOWN:
        if "venue" in weights:
            weights["venue"] *= 0.85
            reasonings.setdefault("venue", []).append("Adjusted down for lower venue overhead in small town")
        if catering_key in weights:
            weights[catering_key] *= 0.90
            reasonings.setdefault(catering_key, []).append("Reduced catering baseline for small town vendor rates")


def apply_priorities_adjustments(
    weights: Dict[str, float],
    priorities: List[str],
    event_type: str,
    reasonings: Dict[str, List[str]],
) -> None:
    """Boost categories prioritized by user by +20% relative weight."""
    mapping = PRIORITY_TO_CATEGORY.get(event_type, {})
    for p in priorities:
        cat = mapping.get(str(p))
        if cat and cat in weights:
            weights[cat] *= 1.20
            reasonings.setdefault(cat, []).append(f"Boosted (+20%) based on priority preference for {p}")


def apply_age_group_adjustments(
    weights: Dict[str, float],
    age_group: AgeGroup | None,
    event_type: str,
    reasonings: Dict[str, List[str]],
) -> None:
    """Adjust entertainment, cake, and photography for kids demographic."""
    if age_group == AgeGroup.KIDS:
        if "entertainment" in weights:
            weights["entertainment"] *= 1.25
            reasonings.setdefault("entertainment", []).append("Enhanced entertainment allocation for kids activities")
        if "cake" in weights:
            weights["cake"] *= 1.20
            reasonings.setdefault("cake", []).append("Custom cake budget increased for kids celebration")
        if "photography" in weights:
            weights["photography"] *= 0.70
            reasonings.setdefault("photography", []).append("Photography scaled back in favor of active kids entertainment")


def apply_dietary_adjustments(
    weights: Dict[str, float],
    dietary: List[DietaryOption],
    event_type: str,
    reasonings: Dict[str, List[str]],
) -> None:
    """Apply specialized catering premium for strict dietary restrictions."""
    special_diets = {DietaryOption.JAIN, DietaryOption.HALAL, DietaryOption.VEGAN}
    selected_special = [d.value for d in dietary if d in special_diets]
    if selected_special:
        catering_key = "catering" if "catering" in weights else "food/refreshments"
        if catering_key in weights:
            weights[catering_key] *= 1.08
            diets_str = ", ".join(selected_special)
            reasonings.setdefault(catering_key, []).append(
                f"Added 8% premium for specialized dietary requirements ({diets_str})"
            )


def apply_outdoor_adjustments(
    weights: Dict[str, float],
    indoor_outdoor: IndoorOutdoor,
    event_type: str,
    reasonings: Dict[str, List[str]],
) -> None:
    """Add weather backup (tent/shelter) line item for outdoor celebrations."""
    if indoor_outdoor == IndoorOutdoor.OUTDOOR:
        weights["weather backup (tent/shelter)"] = 5.0
        reasonings.setdefault("weather backup (tent/shelter)", []).append(
            "Dedicated weather contingency reserve for outdoor tenting/shelter"
        )


def enforce_contingency(
    weights: Dict[str, float],
    min_contingency: float,
    reasonings: Dict[str, List[str]],
) -> Dict[str, float]:
    """Ensure contingency meets minimum threshold and renormalize non-contingency categories to sum to 100%."""
    other_total = sum(v for k, v in weights.items() if k != "contingency")
    target_other = 100.0 - min_contingency

    normalized: Dict[str, float] = {}
    if other_total > 0:
        factor = target_other / other_total
        for k, v in weights.items():
            if k != "contingency":
                normalized[k] = round(v * factor, 4)
    normalized["contingency"] = min_contingency

    if min_contingency >= 10.0:
        reasonings.setdefault("contingency", []).append(
            f"Preserved elevated contingency of {min_contingency:.0f}% for outdoor or wedding risk buffer"
        )
    else:
        reasonings.setdefault("contingency", []).append(
            f"Maintained baseline contingency of {min_contingency:.0f}%"
        )

    return normalized


def compute_category_allocations(
    weights: Dict[str, float],
    total_budget: float,
    reasonings: Dict[str, List[str]],
) -> List[BudgetCategoryItem]:
    """Calculate rounded amounts and assign any rounding discrepancy directly to contingency."""
    # Ensure total percentages sum to exactly 100.0%
    total_w = sum(weights.values())
    pcts = {k: round((v / total_w) * 100.0, 2) for k, v in weights.items()}

    # Adjust percentage rounding error if any into contingency
    pct_diff = round(100.0 - sum(pcts.values()), 2)
    if "contingency" in pcts:
        pcts["contingency"] = round(pcts["contingency"] + pct_diff, 2)

    # Calculate monetary amounts
    items: List[BudgetCategoryItem] = []
    total_allocated = 0.0

    for name, pct in pcts.items():
        if name == "contingency":
            continue
        amt = round(total_budget * (pct / 100.0), 2)
        total_allocated += amt
        reason = "; ".join(reasonings.get(name, [])) or "Standard allocation based on event benchmarks"
        items.append(BudgetCategoryItem(name=name, percentage=pct, amount=amt, reasoning=reason))

    # Contingency gets the exact remainder so sum(amounts) == total_budget
    contingency_amt = round(total_budget - total_allocated, 2)
    contingency_pct = pcts.get("contingency", 5.0)
    contingency_reason = "; ".join(reasonings.get("contingency", [])) or "Reserve buffer for unforeseen expenses"

    items.append(
        BudgetCategoryItem(
            name="contingency",
            percentage=contingency_pct,
            amount=contingency_amt,
            reasoning=contingency_reason,
        )
    )

    return items


def generate_budget_plan(request: EventRequest) -> BudgetPlan:
    """Generate an adaptive budget plan based on event parameters and preferences."""
    event_type = request.event_type.value
    weights = get_base_weights(event_type)
    reasonings: Dict[str, List[str]] = {}

    # 1. City tier adjustment
    apply_city_tier_adjustments(weights, request.city_tier, event_type, reasonings)

    # 2. Priorities adjustment
    priority_values = [p.value for p in request.preferences.priorities]
    apply_priorities_adjustments(weights, priority_values, event_type, reasonings)

    # 3. Age group adjustment
    apply_age_group_adjustments(weights, request.preferences.age_group, event_type, reasonings)

    # 4. Dietary restrictions adjustment
    apply_dietary_adjustments(weights, request.preferences.dietary, event_type, reasonings)

    # 5. Outdoor weather-backup adjustment
    apply_outdoor_adjustments(weights, request.preferences.indoor_outdoor, event_type, reasonings)

    # 6. Contingency rules: at least 10% for outdoor events or weddings, else at least 5%
    is_outdoor = request.preferences.indoor_outdoor == IndoorOutdoor.OUTDOOR
    is_wedding = request.event_type.value == "wedding"
    min_contingency = 10.0 if (is_outdoor or is_wedding) else 5.0

    weights = enforce_contingency(weights, min_contingency, reasonings)

    # 7. Compute final items and exact sum match
    categories = compute_category_allocations(weights, request.total_budget, reasonings)

    # 8. Check per-guest cost and warnings
    warnings: List[str] = []
    per_guest_cost = round(request.total_budget / request.guest_count, 2)

    catering_key = "catering" if any(c.name == "catering" for c in categories) else "food/refreshments"
    catering_item = next((c for c in categories if c.name == catering_key), None)
    if catering_item:
        catering_per_guest = catering_item.amount / request.guest_count
        benchmark_min = MIN_CATERING_PER_GUEST.get(request.currency.value, 400.0)
        if catering_per_guest < benchmark_min:
            warnings.append(
                f"Catering allocation of {request.currency.value} {catering_per_guest:.2f} per guest is below "
                f"the realistic minimum benchmark ({request.currency.value} {benchmark_min:.2f}). "
                "Consider increasing total budget or reducing guest count."
            )

    # 9. Money saving tips
    tips = MONEY_SAVING_TIPS.get(event_type, [
        "Track vendor deliverables closely against contract milestones.",
        "Consolidate transport and logistics where feasible.",
    ])

    return BudgetPlan(
        total_budget=request.total_budget,
        currency=request.currency.value,
        per_guest_cost=per_guest_cost,
        categories=categories,
        warnings=warnings,
        money_saving_tips=tips,
    )
