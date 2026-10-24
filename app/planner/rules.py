"""Rules, benchmark costs, category templates, and fallback data."""

from typing import Dict, List

# Base percentage allocations per event type (sum must equal 100.0)
BASE_ALLOCATIONS: Dict[str, Dict[str, float]] = {
    "wedding": {
        "venue": 25.0,
        "catering": 25.0,
        "decor": 12.0,
        "photography": 10.0,
        "attire": 8.0,
        "music/entertainment": 6.0,
        "invitations": 3.0,
        "transport": 4.0,
        "contingency": 7.0,
    },
    "birthday": {
        "venue": 20.0,
        "catering": 25.0,
        "decor": 15.0,
        "cake": 7.0,
        "entertainment": 15.0,
        "return gifts": 6.0,
        "photography": 6.0,
        "contingency": 6.0,
    },
    "community": {
        "venue": 22.0,
        "food/refreshments": 20.0,
        "equipment/AV": 18.0,
        "permits/insurance": 8.0,
        "volunteers": 7.0,
        "publicity": 10.0,
        "entertainment": 8.0,
        "contingency": 7.0,
    },
}

# Mapping priority enum values to specific budget categories per event type
PRIORITY_TO_CATEGORY: Dict[str, Dict[str, str]] = {
    "wedding": {
        "venue": "venue",
        "food": "catering",
        "decor": "decor",
        "photography": "photography",
        "music": "music/entertainment",
        "entertainment": "music/entertainment",
    },
    "birthday": {
        "venue": "venue",
        "food": "catering",
        "decor": "decor",
        "photography": "photography",
        "music": "entertainment",
        "entertainment": "entertainment",
    },
    "community": {
        "venue": "venue",
        "food": "food/refreshments",
        "decor": "publicity",
        "photography": "equipment/AV",
        "music": "entertainment",
        "entertainment": "entertainment",
    },
}

# Realistic minimum per-guest catering/food thresholds by currency
MIN_CATERING_PER_GUEST: Dict[str, float] = {
    "INR": 400.0,
    "USD": 18.0,
    "EUR": 16.0,
    "GBP": 15.0,
}

# Money saving tips per event type
MONEY_SAVING_TIPS: Dict[str, List[str]] = {
    "wedding": [
        "Opt for in-season local flowers and reusable decorative draping to reduce floral costs by up to 30%.",
        "Host ceremony and reception in the same venue or opt for Friday/Sunday dates for favorable rates.",
        "Streamline menu offerings with focused signature dishes instead of an oversized buffet spread.",
    ],
    "birthday": [
        "Plan digital invitations with RSVP tracking to save printing and postage expenses.",
        "Combine return gift packaging with DIY craft station activities that guests take home.",
        "Book entertainment during mid-afternoon slots between meal times for lighter catering requirements.",
    ],
    "community": [
        "Partner with local cultural or community halls and municipal parks for lower venue fees.",
        "Organize potluck or sponsored community refreshment booths with local businesses.",
        "Leverage volunteer networks for stage management and publicity rather than paid agencies.",
    ],
}
