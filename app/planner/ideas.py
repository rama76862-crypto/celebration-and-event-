"""Personalized ideas generator with AI and curated rule-based fallback."""

import json
import logging
import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ValidationError

from app.models import (
    EventRequest,
    IdeaSet,
    DietaryOption,
    AgeGroup,
)
from app.ai.client import AIClient, AIUnavailable
from app.planner.prompt_templates import SYSTEM_PROMPT, build_user_prompt
from app.planner.rules import CURATED_IDEA_BANK

logger = logging.getLogger(__name__)

# Pydantic validation schema for raw AI payload
class RawAIIdeaResponse(BaseModel):
    theme_ideas: List[str] = Field(..., min_length=1)
    decor_ideas: List[str] = Field(..., min_length=1)
    food_menu_ideas: List[str] = Field(..., min_length=1)
    activities: List[str] = Field(..., min_length=1)
    return_gift_ideas: List[str] = Field(..., min_length=1)
    budget_hacks: List[str] = Field(..., min_length=1)


def clean_json_text(text: str) -> str:
    """Extract and isolate JSON text from markdown code fences or conversational text."""
    trimmed = text.strip()
    # Match ```json ... ``` or ``` ... ```
    fence_pattern = re.compile(r"^```(?:json)?\s*([\s\S]*?)\s*```$", re.MULTILINE)
    match = fence_pattern.search(trimmed)
    if match:
        trimmed = match.group(1).strip()
    else:
        # Locate first '{' and last '}'
        start = trimmed.find("{")
        end = trimmed.rfind("}")
        if start != -1 and end != -1 and end > start:
            trimmed = trimmed[start : end + 1]
    return trimmed


def parse_and_validate_ai_response(raw_text: str) -> Optional[RawAIIdeaResponse]:
    """Parse raw LLM response as JSON and validate against strict schema."""
    cleaned = clean_json_text(raw_text)
    try:
        data = json.loads(cleaned)
        if not isinstance(data, dict):
            return None
        return RawAIIdeaResponse.model_validate(data)
    except (json.JSONDecodeError, ValidationError) as exc:
        logger.warning("Failed to validate AI response JSON: %s", exc)
        return None


def select_dietary_menu(menu_dict: Dict[str, List[str]], dietary: List[DietaryOption]) -> List[str]:
    """Select the most restrictive suitable menu based on user dietary preferences."""
    diet_values = {d for d in dietary}
    if DietaryOption.JAIN in diet_values and "jain" in menu_dict:
        return list(menu_dict["jain"])
    if DietaryOption.VEGAN in diet_values and "vegan" in menu_dict:
        return list(menu_dict["vegan"])
    if DietaryOption.VEGETARIAN in diet_values and "vegetarian" in menu_dict:
        return list(menu_dict["vegetarian"])
    return list(menu_dict.get("default", []))


def generate_fallback_ideas(request: EventRequest) -> IdeaSet:
    """Generate structured, culturally attuned ideas from the curated rules bank."""
    ev_type = request.event_type.value
    bank = CURATED_IDEA_BANK.get(ev_type, CURATED_IDEA_BANK["wedding"])

    is_bday_kids = ev_type == "birthday" and request.preferences.age_group == AgeGroup.KIDS
    source_bank = bank.get("kids", bank) if is_bday_kids else bank.get("general", bank)

    theme_ideas = list(source_bank.get("theme_ideas", []))
    if request.preferences.theme:
        theme_ideas.insert(0, f"Custom Theme Focus: '{request.preferences.theme}' styling with complementary color palette")

    decor_ideas = list(source_bank.get("decor_ideas", []))
    activities = list(source_bank.get("activities", []))
    return_gift_ideas = list(source_bank.get("return_gift_ideas", []))
    budget_hacks = list(source_bank.get("budget_hacks", []))

    # Pull contextual menu respecting dietary restrictions
    menus_bank = bank.get("menus", {})
    food_menu_ideas = select_dietary_menu(menus_bank, request.preferences.dietary)

    return IdeaSet(
        source="fallback",
        theme_ideas=theme_ideas[:4],
        decor_ideas=decor_ideas[:4],
        food_menu_ideas=food_menu_ideas[:4],
        activities=activities[:4],
        return_gift_ideas=return_gift_ideas[:3],
        budget_hacks=budget_hacks[:3],
    )


def generate_ideas(
    request: EventRequest,
    per_guest_cost: float = 0.0,
    client: Optional[AIClient] = None,
) -> IdeaSet:
    """Generate personalized ideas using AI when available, falling back safely to curated rules."""
    ai_client = client or AIClient()

    try:
        user_prompt = build_user_prompt(request, per_guest_cost)
        raw_output = ai_client.generate(SYSTEM_PROMPT, user_prompt)
        parsed = parse_and_validate_ai_response(raw_output)

        if parsed:
            return IdeaSet(
                source="ai",
                theme_ideas=parsed.theme_ideas[:4],
                decor_ideas=parsed.decor_ideas[:4],
                food_menu_ideas=parsed.food_menu_ideas[:4],
                activities=parsed.activities[:4],
                return_gift_ideas=parsed.return_gift_ideas[:3],
                budget_hacks=parsed.budget_hacks[:3],
            )
        else:
            logger.warning("AI output failed validation; engaging curated fallback")
    except AIUnavailable as exc:
        logger.info("AI service unavailable (%s); using curated fallback", exc)
    except Exception as exc:
        logger.warning("Unexpected error during AI idea generation: %s", exc)

    return generate_fallback_ideas(request)
