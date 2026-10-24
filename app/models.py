"""Pydantic data models and schemas for Event Planning Assistant."""

import re
from datetime import date
from enum import Enum
from typing import Any, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


# Strip control characters (C0 & C1 control codes) except normal whitespace
CONTROL_CHARS_REGEX = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]")


def sanitize_text(value: Optional[str]) -> Optional[str]:
    """Strip control characters and trim surrounding whitespace."""
    if value is None:
        return None
    cleaned = CONTROL_CHARS_REGEX.sub("", value).strip()
    return cleaned


class EventType(str, Enum):
    """Supported event categories."""
    WEDDING = "wedding"
    BIRTHDAY = "birthday"
    COMMUNITY = "community"


class CityTier(str, Enum):
    """City cost tier adjustment."""
    METRO = "metro"
    TIER2 = "tier2"
    SMALL_TOWN = "small_town"


class DietaryOption(str, Enum):
    """Dietary preferences and restrictions."""
    VEGETARIAN = "vegetarian"
    VEGAN = "vegan"
    JAIN = "jain"
    HALAL = "halal"
    GLUTEN_FREE = "gluten_free"
    NONE = "none"


class IndoorOutdoor(str, Enum):
    """Venue setting preference."""
    INDOOR = "indoor"
    OUTDOOR = "outdoor"
    EITHER = "either"


class PriorityCategory(str, Enum):
    """Focus areas for budget boosting."""
    FOOD = "food"
    DECOR = "decor"
    MUSIC = "music"
    PHOTOGRAPHY = "photography"
    VENUE = "venue"
    ENTERTAINMENT = "entertainment"


class AgeGroup(str, Enum):
    """Primary guest demographic."""
    KIDS = "kids"
    TEENS = "teens"
    ADULTS = "adults"
    SENIORS = "seniors"
    MIXED = "mixed"


class AllowedCurrency(str, Enum):
    """Whitelisted transaction currencies."""
    INR = "INR"
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"


class EventPreferences(BaseModel):
    """User preferences for event tailoring."""

    model_config = ConfigDict(extra="forbid")

    theme: Optional[str] = Field(default=None, max_length=100)
    dietary: List[DietaryOption] = Field(default_factory=list)
    indoor_outdoor: IndoorOutdoor = Field(default=IndoorOutdoor.EITHER)
    priorities: List[PriorityCategory] = Field(default_factory=list, max_length=3)
    age_group: Optional[AgeGroup] = Field(default=None)
    notes: Optional[str] = Field(default=None, max_length=500)

    @field_validator("theme", "notes", mode="before")
    @classmethod
    def sanitize_free_text(cls, v: Any) -> Any:
        if isinstance(v, str):
            return sanitize_text(v)
        return v

    @field_validator("priorities")
    @classmethod
    def validate_priorities_length(cls, v: List[PriorityCategory]) -> List[PriorityCategory]:
        if len(v) > 3:
            raise ValueError("A maximum of 3 priorities can be selected")
        return v


class EventRequest(BaseModel):
    """Strictly validated incoming event planning request."""

    model_config = ConfigDict(extra="forbid")

    event_type: EventType
    title: str = Field(..., min_length=1, max_length=100)
    guest_count: int = Field(..., ge=1, le=1000)
    total_budget: float = Field(..., gt=0, le=10_000_000)
    currency: AllowedCurrency = Field(default=AllowedCurrency.INR)
    event_date: date
    location: str = Field(..., min_length=1, max_length=100)
    city_tier: Optional[CityTier] = Field(default=None)
    preferences: EventPreferences = Field(default_factory=EventPreferences)

    @field_validator("title", "location", mode="before")
    @classmethod
    def sanitize_event_text(cls, v: Any) -> Any:
        if isinstance(v, str):
            cleaned = sanitize_text(v)
            if not cleaned:
                raise ValueError("Field cannot be empty or only whitespace")
            return cleaned
        return v

    @field_validator("event_date")
    @classmethod
    def validate_future_date(cls, v: date) -> date:
        if v <= date.today():
            raise ValueError("Event date must be in the future")
        return v


# ---------------------------------------------------------------------------
# Output / Response Models
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    """Health status response."""
    model_config = ConfigDict(extra="forbid")
    status: str


class BudgetCategoryItem(BaseModel):
    """Individual budget category breakdown."""
    model_config = ConfigDict(extra="forbid")
    name: str
    percentage: float
    amount: float
    reasoning: str


class BudgetPlan(BaseModel):
    """Complete budget allocation plan."""
    model_config = ConfigDict(extra="forbid")
    total_budget: float
    currency: str
    per_guest_cost: float
    categories: List[BudgetCategoryItem]
    warnings: List[str] = Field(default_factory=list)
    money_saving_tips: List[str] = Field(default_factory=list)


class TimelineTask(BaseModel):
    """Individual milestone or preparation task."""
    model_config = ConfigDict(extra="forbid")
    id: str
    title: str
    due_date: date
    phase: str
    category: str
    priority: str = Field(default="medium")  # high, medium, low
    done: bool = Field(default=False)


class RunOfShowItem(BaseModel):
    """Hour-by-hour event day schedule entry."""
    model_config = ConfigDict(extra="forbid")
    time_offset: str
    activity: str
    details: str


class TimelinePlan(BaseModel):
    """Backwards-planned event timeline."""
    model_config = ConfigDict(extra="forbid")
    days_remaining: int
    is_compressed: bool
    phases: List[str]
    tasks: List[TimelineTask]
    run_of_show: List[RunOfShowItem]
    warnings: List[str] = Field(default_factory=list)


class VendorItem(BaseModel):
    """Checklist entry for a recommended service provider."""
    model_config = ConfigDict(extra="forbid")
    vendor_type: str
    why_needed: str
    budget_allocated: float
    questions_to_ask: List[str]
    red_flags: List[str]
    documents_to_get: List[str]
    booking_deadline: Optional[date] = None
    status: str = Field(default="not_started")


class SkippedVendor(BaseModel):
    """Vendor intentionally omitted with explanation."""
    model_config = ConfigDict(extra="forbid")
    vendor_type: str
    reason: str


class VendorChecklist(BaseModel):
    """Complete vendor sourcing and interview checklist."""
    model_config = ConfigDict(extra="forbid")
    vendors: List[VendorItem]
    skipped_vendors: List[SkippedVendor] = Field(default_factory=list)


class IdeaSet(BaseModel):
    """Tailored creative suggestions."""
    model_config = ConfigDict(extra="forbid")
    source: str = Field(..., description="'ai' or 'fallback'")
    theme_ideas: List[str]
    decor_ideas: List[str]
    food_menu_ideas: List[str]
    activities: List[str]
    return_gift_ideas: List[str]
    budget_hacks: List[str]


class FullPlan(BaseModel):
    """Aggregated event planning deliverable."""
    model_config = ConfigDict(extra="forbid")
    request: EventRequest
    budget: BudgetPlan
    timeline: TimelinePlan
    vendors: VendorChecklist
    ideas: IdeaSet


class ReplanRequest(BaseModel):
    """Input payload for adjusting event parameters and re-planning."""
    model_config = ConfigDict(extra="forbid")
    original_request: EventRequest
    new_budget: Optional[float] = Field(default=None, gt=0, le=10_000_000)
    new_guest_count: Optional[int] = Field(default=None, ge=1, le=1000)
    new_event_date: Optional[date] = None

    @field_validator("new_event_date")
    @classmethod
    def validate_future_date_if_present(cls, v: Optional[date]) -> Optional[date]:
        if v is not None and v <= date.today():
            raise ValueError("Adjusted event date must be in the future")
        return v


class CategoryDiff(BaseModel):
    """Comparison item for an individual budget category."""
    model_config = ConfigDict(extra="forbid")
    category: str
    old_amount: float
    new_amount: float
    amount_change: float
    percentage_change: float


class PlanDiff(BaseModel):
    """Structured delta between original and revised plans."""
    model_config = ConfigDict(extra="forbid")
    budget_changes: List[CategoryDiff]
    timeline_changes: List[str] = Field(default_factory=list)
    summary: List[str] = Field(default_factory=list)


class SmartAdvice(BaseModel):
    """Context-aware recommendations from advisor engine."""
    model_config = ConfigDict(extra="forbid")
    options_for_budget_or_guests: List[str] = Field(default_factory=list)
    first_actions_this_week: List[str] = Field(default_factory=list)
    tradeoff_advice: List[str] = Field(default_factory=list)


class ReplanResponse(BaseModel):
    """Output bundle containing new plan, structural diff, and advisor guidance."""
    model_config = ConfigDict(extra="forbid")
    new_plan: FullPlan
    diff: PlanDiff
    advice: SmartAdvice

