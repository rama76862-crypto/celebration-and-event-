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

# Ideal planning lead time in days
IDEAL_LEAD_TIME: Dict[str, int] = {
    "wedding": 180,
    "birthday": 45,
    "community": 60,
}

# Master task templates by event type
TASK_TEMPLATES: Dict[str, List[dict]] = {
    "wedding": [
        {"id": "w-01", "title": "Book Ceremony & Reception Venue", "lead_days": 240, "category": "venue", "priority": "high"},
        {"id": "w-02", "title": "Hire Lead Photographer & Videographer", "lead_days": 180, "category": "photography", "priority": "high"},
        {"id": "w-03", "title": "Finalize Catering Menu & Tastings", "lead_days": 120, "category": "catering", "priority": "high"},
        {"id": "w-04", "title": "Select Wedding Attire & Bridal Fittings", "lead_days": 90, "category": "attire", "priority": "medium"},
        {"id": "w-05", "title": "Contract Florist & Theme Decor Team", "lead_days": 90, "category": "decor", "priority": "medium"},
        {"id": "w-06", "title": "Book DJ or Live Entertainment Band", "lead_days": 75, "category": "music/entertainment", "priority": "medium"},
        {"id": "w-07", "title": "Send Formal Invitations & Track RSVPs", "lead_days": 60, "category": "invitations", "priority": "high"},
        {"id": "w-08", "title": "Arrange Guest Transport & Logistics", "lead_days": 30, "category": "transport", "priority": "low"},
        {"id": "w-09", "title": "Final Headcount Confirmation with Caterer", "lead_days": 14, "category": "catering", "priority": "high"},
        {"id": "w-10", "title": "Rehearsal Walkthrough & Vendor Call-sheets", "lead_days": 3, "category": "contingency", "priority": "high"},
    ],
    "birthday": [
        {"id": "b-01", "title": "Select & Reserve Party Venue", "lead_days": 45, "category": "venue", "priority": "high"},
        {"id": "b-02", "title": "Order Custom Theme Cake", "lead_days": 30, "category": "cake", "priority": "high"},
        {"id": "b-03", "title": "Book Party Entertainer or DJ", "lead_days": 30, "category": "entertainment", "priority": "high"},
        {"id": "b-04", "title": "Send Party Invitations & Track RSVPs", "lead_days": 21, "category": "venue", "priority": "medium"},
        {"id": "b-05", "title": "Source Theme Balloons & Table Decor", "lead_days": 14, "category": "decor", "priority": "medium"},
        {"id": "b-06", "title": "Confirm Catering & Finger Food Quantities", "lead_days": 10, "category": "catering", "priority": "medium"},
        {"id": "b-07", "title": "Pack Return Gifts & Favor Bags", "lead_days": 5, "category": "return gifts", "priority": "low"},
        {"id": "b-08", "title": "Confirm Photography / Assign Family Camera", "lead_days": 5, "category": "photography", "priority": "low"},
        {"id": "b-09", "title": "Final RSVP Tally & Dietary Check", "lead_days": 2, "category": "catering", "priority": "high"},
    ],
    "community": [
        {"id": "c-01", "title": "Secure Park/Hall Venue & Municipal Permits", "lead_days": 60, "category": "permits/insurance", "priority": "high"},
        {"id": "c-02", "title": "Arrange Event Liability Insurance", "lead_days": 45, "category": "permits/insurance", "priority": "high"},
        {"id": "c-03", "title": "Book Stage, Sound & AV Equipment Rental", "lead_days": 35, "category": "equipment/AV", "priority": "high"},
        {"id": "c-04", "title": "Launch Community Publicity & Social Flyers", "lead_days": 30, "category": "publicity", "priority": "medium"},
        {"id": "c-05", "title": "Recruit & Organize Volunteer Teams", "lead_days": 25, "category": "volunteers", "priority": "high"},
        {"id": "c-06", "title": "Confirm Food Stalls / Refreshment Sponsors", "lead_days": 20, "category": "food/refreshments", "priority": "medium"},
        {"id": "c-07", "title": "Schedule Performers & Speaker Lineup", "lead_days": 14, "category": "entertainment", "priority": "medium"},
        {"id": "c-08", "title": "Volunteer Orientation & Walkie-Talkie Prep", "lead_days": 3, "category": "volunteers", "priority": "high"},
        {"id": "c-09", "title": "Final Equipment Soundcheck & Stage Setup", "lead_days": 1, "category": "equipment/AV", "priority": "high"},
    ],
}

# Run-of-show schedule templates
RUN_OF_SHOW_TEMPLATES: Dict[str, List[dict]] = {
    "wedding": [
        {"time_offset": "08:00 AM", "activity": "Bridal Prep & Groom Dressing", "details": "Hair, makeup, and attire photography session"},
        {"time_offset": "10:30 AM", "activity": "First Look & Couple Portraits", "details": "Intimate couple photo session before guests arrive"},
        {"time_offset": "12:00 PM", "activity": "Guest Arrival & Welcome Refreshments", "details": "Usher guests, welcome drinks and instrumental music"},
        {"time_offset": "01:00 PM", "activity": "Main Ceremony & Rituals", "details": "Exchange of vows/rings and sacred traditions"},
        {"time_offset": "02:30 PM", "activity": "Cocktail Hour & Family Formal Photos", "details": "Hors d'oeuvres and group pictures"},
        {"time_offset": "04:30 PM", "activity": "Grand Reception Entrance & Speeches", "details": "Couple grand entry, celebratory toasts and speeches"},
        {"time_offset": "06:30 PM", "activity": "Dinner Banquet & Live Music", "details": "Multi-course feast and acoustic performances"},
        {"time_offset": "08:30 PM", "activity": "First Dance & Open Dance Floor", "details": "Celebratory dance with friends and family"},
        {"time_offset": "11:00 PM", "activity": "Grand Send-off & Farewell", "details": "Sparkler exit and farewell to attendees"},
    ],
    "birthday": [
        {"time_offset": "T-1h", "activity": "Vendor Arrival & Setup", "details": "Balloons, decor styling, cake table and music check"},
        {"time_offset": "T+0h", "activity": "Guest Arrival & Welcome Activity", "details": "Welcome drinks, tattoo artist / greeting corner"},
        {"time_offset": "T+1h", "activity": "Interactive Games & Entertainment", "details": "Host-led party games, magician or dance games"},
        {"time_offset": "T+2h", "activity": "Cake Cutting Celebration", "details": "Singing happy birthday, candle blowing, photo session"},
        {"time_offset": "T+2.5h", "activity": "Buffet Snacks & Meal Service", "details": "Food served for kids and adults, mingling"},
        {"time_offset": "T+3.5h", "activity": "Return Gifts & Thank-You Moments", "details": "Personalized favor bags handed out to guests"},
        {"time_offset": "T+4h", "activity": "Event Wrap & Teardown", "details": "Collect gifts and personal items, venue checkout"},
    ],
    "community": [
        {"time_offset": "08:30 AM", "activity": "Volunteer Check-in & Setup", "details": "Banners, safety inspection, sound system checks"},
        {"time_offset": "10:00 AM", "activity": "Official Inauguration & Welcome", "details": "Welcome remarks by community leaders"},
        {"time_offset": "11:00 AM", "activity": "Community Stalls & Interactive Activities", "details": "Local cultural booths, craft workshops, food stalls"},
        {"time_offset": "01:00 PM", "activity": "Lunch Intermission & Acoustic Music", "details": "Local musical talent performance during lunch"},
        {"time_offset": "03:00 PM", "activity": "Keynote Speeches & Awards Ceremony", "details": "Honoring community volunteers and participants"},
        {"time_offset": "05:00 PM", "activity": "Closing Remarks & Vote of Thanks", "details": "Summary of achievements and sponsor acknowledgment"},
        {"time_offset": "06:00 PM", "activity": "Ground Teardown & Site Restoration", "details": "Waste segregation, volunteer debrief, venue handover"},
    ],
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
