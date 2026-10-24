"""Context-aware vendor checklist generator for Event Planning Assistant."""

from datetime import date, timedelta
from typing import Dict, List, Optional
from app.models import (
    EventRequest,
    BudgetPlan,
    TimelinePlan,
    VendorChecklist,
    VendorItem,
    SkippedVendor,
    IndoorOutdoor,
    AgeGroup,
    DietaryOption,
)


def get_deadline_for_category(timeline: TimelinePlan, category_keywords: List[str], default_date: date) -> date:
    """Find the earliest task due date matching given category keywords."""
    matching_tasks = [
        t for t in timeline.tasks
        if any(kw.lower() in t.category.lower() or kw.lower() in t.title.lower() for kw in category_keywords)
    ]
    if matching_tasks:
        return min(t.due_date for t in matching_tasks)
    return default_date


def get_budget_amount(budget: BudgetPlan, category_keywords: List[str]) -> float:
    """Find the allocated monetary amount for the category."""
    for cat in budget.categories:
        if any(kw.lower() in cat.name.lower() for kw in category_keywords):
            return cat.amount
    return 0.0


def build_caterer_vendor(
    request: EventRequest,
    budget: BudgetPlan,
    timeline: TimelinePlan,
) -> VendorItem:
    """Generate caterer checklist item."""
    allocated = get_budget_amount(budget, ["catering", "food"])
    deadline = get_deadline_for_category(
        timeline,
        ["catering", "food"],
        request.event_date - timedelta(days=30),
    )

    questions = [
        "What is your per-plate price breakdown and what does it include (staffing, tableware, taxes)?",
        "Can we schedule a formal food tasting session before finalizing the contract?",
        "How do you handle leftover food packaging and hygiene management at the conclusion of the event?",
        "What is your policy regarding head count adjustments (+/- 10%) leading up to the event date?",
    ]

    # Dietary contextual questions
    special_diets = [d.value for d in request.preferences.dietary if d != DietaryOption.NONE]
    if special_diets:
        diets_text = ", ".join(special_diets)
        questions.append(
            f"How do you ensure strict cookware and kitchen counter segregation for {diets_text} guests?"
        )
        questions.append("Can you provide allergen-safe labeling on buffet chafing dishes?")

    # Kids party questions
    if request.preferences.age_group == AgeGroup.KIDS or request.event_type.value == "birthday":
        questions.append(
            "Do you provide kid-friendly finger foods with nut-free and dairy-safe options?"
        )

    return VendorItem(
        vendor_type="Caterer & Beverage Service",
        why_needed="Oversees food preparation, professional banquet staffing, beverages, and tableware.",
        budget_allocated=allocated,
        questions_to_ask=questions[:6],
        red_flags=[
            "Refusal to commit to an itemized ingredient and service breakdown in writing",
            "Lack of certified food hygiene compliance or local municipal health license",
            "Reluctance to permit a food tasting or accommodate documented dietary requirements",
        ],
        documents_to_get=[
            "Detailed Itemized Quote",
            "Formal Catering Service Agreement",
            "Food Safety / Hygiene Certificate",
            "Tasting Menu Confirmation Sign-off",
        ],
        booking_deadline=deadline,
        status="not_started",
    )


def build_photographer_vendor(
    request: EventRequest,
    budget: BudgetPlan,
    timeline: TimelinePlan,
) -> VendorItem:
    """Generate photographer checklist item."""
    allocated = get_budget_amount(budget, ["photography", "equipment"])
    deadline = get_deadline_for_category(
        timeline,
        ["photography"],
        request.event_date - timedelta(days=45),
    )

    questions = [
        "Will you personally shoot the event, or will associate shooters be assigned?",
        "What is the exact turnaround time for teaser photos and the complete high-resolution gallery?",
        "What dual-camera and memory card redundancy backups do you carry on site?",
        "Do we receive full non-commercial printing and digital sharing rights with no watermarks?",
    ]

    return VendorItem(
        vendor_type="Photographer & Videographer",
        why_needed="Captures key milestones, candid emotions, and formal portraits with professional lighting.",
        budget_allocated=allocated,
        questions_to_ask=questions,
        red_flags=[
            "No full-event gallery portfolio (only cherry-picked social media clips)",
            "Ambiguous delivery timeline or withholding digital copyright releases",
            "No backup camera equipment or replacement photographer contingency plan",
        ],
        documents_to_get=[
            "Photography Service Contract",
            "Deliverables & Album Schedule",
            "Liability Insurance Certificate",
            "Payment Milestone Invoice",
        ],
        booking_deadline=deadline,
        status="not_started",
    )


def build_venue_vendor(
    request: EventRequest,
    budget: BudgetPlan,
    timeline: TimelinePlan,
) -> VendorItem:
    """Generate venue checklist item."""
    allocated = get_budget_amount(budget, ["venue"])
    deadline = get_deadline_for_category(
        timeline,
        ["venue"],
        request.event_date - timedelta(days=60),
    )

    questions = [
        "What is the venue's approved guest capacity and sound curfew policy?",
        "Are tables, chairs, staging, standard lighting, and cleanup included in the booking fee?",
        "Do you allow external vendors or do you enforce an exclusive vendor list with buyout fees?",
        "What is the cancellation, postponement, and security deposit refund schedule?",
    ]

    return VendorItem(
        vendor_type="Venue & Banquet Manager",
        why_needed="Provides the physical space, basic utilities, parking, and facility infrastructure.",
        budget_allocated=allocated,
        questions_to_ask=questions,
        red_flags=[
            "Hidden overtime penalty rates, electricity charges, or mandatory vendor commissions",
            "Strict early sound curfews that conflict with party timelines",
            "Vague damages deduction policy for the refundable security deposit",
        ],
        documents_to_get=[
            "Venue Lease & Booking Contract",
            "Occupancy & Fire Safety Certificate",
            "Deposit & Payment Schedule Receipt",
            "House Rules & Sound Decibel Guidelines",
        ],
        booking_deadline=deadline,
        status="not_started",
    )


def build_decor_vendor(
    request: EventRequest,
    budget: BudgetPlan,
    timeline: TimelinePlan,
) -> VendorItem:
    """Generate decorator/florist checklist item."""
    allocated = get_budget_amount(budget, ["decor"])
    deadline = get_deadline_for_category(
        timeline,
        ["decor"],
        request.event_date - timedelta(days=30),
    )

    questions = [
        "Can you share 3D sketches or itemized moodboards matching our desired theme?",
        "How many hours of venue setup time do you require before guest arrival?",
        "Are flowers fresh, artificial, or a blend, and what happens in case of seasonal shortage?",
        "Is post-event tear-down and venue restoration included in the total quote?",
    ]

    return VendorItem(
        vendor_type="Event Decorator & Florist",
        why_needed="Designs ambiance, stage backdrops, entrance arches, floral styling, and lighting.",
        budget_allocated=allocated,
        questions_to_ask=questions,
        red_flags=[
            "Refusal to commit to specific materials, lighting fixtures, or flower varieties in writing",
            "No real event photos of setups matching your chosen scale",
            "Requiring setup hours beyond what the venue booking allows",
        ],
        documents_to_get=[
            "Decor Design Proposal & Moodboard",
            "Itemized Material Breakdown & Contract",
            "Venue Access & Tear-down Agreement",
        ],
        booking_deadline=deadline,
        status="not_started",
    )


def build_entertainment_vendor(
    request: EventRequest,
    budget: BudgetPlan,
    timeline: TimelinePlan,
) -> tuple[Optional[VendorItem], Optional[SkippedVendor]]:
    """Generate DJ/Band/Host vendor or recommend cost-saving skip if budget is too low."""
    allocated = get_budget_amount(budget, ["entertainment", "music"])

    # Budget threshold: under 15,000 INR or $200 equivalent cannot support a live band or full DJ
    threshold = 15000.0 if request.currency.value == "INR" else 200.0

    if allocated < threshold and allocated > 0:
        return None, SkippedVendor(
            vendor_type="Live Band / Full DJ Production",
            reason=f"Allocated entertainment budget of {request.currency.value} {allocated:,.2f} is below the threshold "
            f"({request.currency.value} {threshold:,.2f}) for professional live bands. "
            "Recommended alternative: Rent high-power wireless party speakers and curate custom Spotify/Apple Music playlists.",
        )

    deadline = get_deadline_for_category(
        timeline,
        ["music", "entertainment"],
        request.event_date - timedelta(days=21),
    )

    v_type = "DJ & Master of Ceremonies (MC)"
    if request.preferences.age_group == AgeGroup.KIDS:
        v_type = "Kids Party Entertainer & Magician"

    questions = [
        "What sound system, mixers, wireless microphones, and lighting do you provide yourself?",
        "Can we share a tailored 'must-play' and 'do-not-play' set list in advance?",
        "How do you engage guests and maintain schedule momentum during transitions?",
        "What backup plan or standby performer do you have in case of unforeseen emergency?",
    ]

    if request.preferences.age_group == AgeGroup.KIDS:
        questions.append(
            "Can you provide background verification and proof of experience hosting interactive children's games?"
        )

    return (
        VendorItem(
            vendor_type=v_type,
            why_needed="Manages music, guest engagement, activities, and celebratory announcements.",
            budget_allocated=allocated,
            questions_to_ask=questions[:5],
            red_flags=[
                "Inability to share recorded live event performance samples",
                "Unwillingness to accept client music and announcement guidelines",
                "No backup audio equipment or replacement artist contingency",
            ],
            documents_to_get=[
                "Performance Service Contract",
                "Sound Equipment Technical Rider",
                "Advance Payment Receipt",
            ],
            booking_deadline=deadline,
            status="not_started",
        ),
        None,
    )


def build_outdoor_vendors(
    request: EventRequest,
    budget: BudgetPlan,
    timeline: TimelinePlan,
) -> List[VendorItem]:
    """Generate dedicated outdoor infrastructure vendors."""
    shelter_budget = get_budget_amount(budget, ["weather backup", "contingency"])
    deadline = get_deadline_for_category(
        timeline,
        ["venue", "contingency"],
        request.event_date - timedelta(days=25),
    )

    shelter_vendor = VendorItem(
        vendor_type="Tent House & Weather Canopy Supplier",
        why_needed="Supplies waterproof canopies, weather-resistant marquees, sidewalls, and ground leveling.",
        budget_allocated=round(shelter_budget * 0.5, 2),
        questions_to_ask=[
            "What wind speed and rainfall load ratings are your canopies certified to handle?",
            "How much notice is required to install protective side curtains if rain develops?",
            "Do you provide water weight barrels or lawn stakes safe for the property?",
            "Is an emergency support technician on standby during active event hours?",
        ],
        red_flags=[
            "Tents lacking safety certifications or structural load ratings",
            "Soiled or damaged canopy tarps without fire-retardant compliance",
            "No contingency plan for severe gusts or sudden heavy precipitation",
        ],
        documents_to_get=[
            "Tenting Specification & Rental Agreement",
            "Wind Load Safety Certificate",
            "Setup & Dismantle Protocol",
        ],
        booking_deadline=deadline,
        status="not_started",
    )

    power_vendor = VendorItem(
        vendor_type="Silent Power Generator Supplier",
        why_needed="Guarantees uninterrupted electrical supply for catering refrigeration, sound, and lighting.",
        budget_allocated=round(shelter_budget * 0.25, 2),
        questions_to_ask=[
            "Is the generator acoustic-shielded (silent running) to eliminate background noise?",
            "What kVA capacity is recommended based on total catering, AV, and lighting load?",
            "Does the package include a certified operator on site with fuel for full runtime?",
            "How fast does automatic changeover occur in case of main grid outage?",
        ],
        red_flags=[
            "Loud unsilenced industrial generator placed adjacent to guest seating",
            "No dedicated on-site technician to monitor electrical load distribution",
        ],
        documents_to_get=[
            "Generator Rental Voucher",
            "Electrical Safety Inspection Clearance",
            "Fuel & Maintenance Agreement",
        ],
        booking_deadline=deadline,
        status="not_started",
    )

    toilet_vendor = VendorItem(
        vendor_type="Luxury Mobile Sanitation Trailer",
        why_needed="Supplies clean, pressurized restroom trailers with running water for outdoor attendees.",
        budget_allocated=round(shelter_budget * 0.25, 2),
        questions_to_ask=[
            "How many private stalls are recommended for our guest count and event duration?",
            "Is an on-site sanitation attendant included for continuous replenishment and hygiene?",
            "What specific fresh water and electrical connections are needed on site?",
            "What is the waste holding tank capacity and environmental disposal certification?",
        ],
        red_flags=[
            "No on-site cleaning attendant during peak gathering hours",
            "Unclear water connection prerequisites or uncertified waste disposal",
        ],
        documents_to_get=[
            "Sanitation Service Agreement",
            "Waste Disposal Compliance Permit",
        ],
        booking_deadline=deadline,
        status="not_started",
    )

    return [shelter_vendor, power_vendor, toilet_vendor]


def build_community_vendors(
    request: EventRequest,
    budget: BudgetPlan,
    timeline: TimelinePlan,
) -> List[VendorItem]:
    """Generate regulatory and insurance items for community gatherings."""
    deadline = get_deadline_for_category(
        timeline,
        ["permits", "insurance"],
        request.event_date - timedelta(days=35),
    )
    permits_budget = get_budget_amount(budget, ["permits", "insurance"])

    permits_liaison = VendorItem(
        vendor_type="Municipal Permits & Police Liaison",
        why_needed="Coordinates public assembly permits, police sound NOC, and traffic marshaling.",
        budget_allocated=round(permits_budget * 0.6, 2),
        questions_to_ask=[
            "What municipal permits (noise, public gathering, fire department clearance) are mandatory?",
            "What is the statutory filing timeline for local administrative clearances?",
            "Are dedicated traffic police marshals required for parking and crowd control?",
            "What first aid and emergency ambulance standby provisions are mandated?",
        ],
        red_flags=[
            "Operating in public parks without written civic administration approval",
            "Missing emergency first aid station or fire safety sign-off",
        ],
        documents_to_get=[
            "Municipal Event Authorization",
            "Police Sound NOC Certificate",
            "Fire Dept Safety Clearance",
        ],
        booking_deadline=deadline,
        status="not_started",
    )

    insurance_broker = VendorItem(
        vendor_type="Event Public Liability Insurance Broker",
        why_needed="Protects against third-party liability, property damage, and volunteer accident claims.",
        budget_allocated=round(permits_budget * 0.4, 2),
        questions_to_ask=[
            "What is the total public liability coverage limit per incident?",
            "Does the policy cover volunteer accidents, equipment damage, and sudden weather disruption?",
            "What are the deductible amounts and specific exclusions in the policy?",
            "How quickly can the official certificate of insurance be issued to municipal authorities?",
        ],
        red_flags=[
            "Exclusions denying coverage to unpaid community volunteers",
            "Prohibitive deductibles that exceed minor claim value",
        ],
        documents_to_get=[
            "Certificate of Insurance (COI)",
            "Policy Schedule & Endorsements",
        ],
        booking_deadline=deadline,
        status="not_started",
    )

    return [permits_liaison, insurance_broker]


def generate_vendor_checklist(
    request: EventRequest,
    budget: BudgetPlan,
    timeline: TimelinePlan,
) -> VendorChecklist:
    """Generate tailored vendor checklist based on event parameters, budget, and timeline."""
    vendors: List[VendorItem] = []
    skipped: List[SkippedVendor] = []

    # 1. Core vendors
    vendors.append(build_venue_vendor(request, budget, timeline))
    vendors.append(build_caterer_vendor(request, budget, timeline))
    vendors.append(build_photographer_vendor(request, budget, timeline))
    vendors.append(build_decor_vendor(request, budget, timeline))

    # 2. Entertainment (with potential budget-based skip)
    ent_item, ent_skipped = build_entertainment_vendor(request, budget, timeline)
    if ent_item:
        vendors.append(ent_item)
    if ent_skipped:
        skipped.append(ent_skipped)

    # 3. Outdoor vendors
    if request.preferences.indoor_outdoor == IndoorOutdoor.OUTDOOR:
        vendors.extend(build_outdoor_vendors(request, budget, timeline))

    # 4. Community-specific regulatory vendors
    if request.event_type.value == "community":
        vendors.extend(build_community_vendors(request, budget, timeline))

    # Sort vendors by booking deadline so most urgent vendors come first
    # Fallback to far future if no deadline
    vendors.sort(key=lambda v: v.booking_deadline or date.max)

    return VendorChecklist(
        vendors=vendors,
        skipped_vendors=skipped,
    )
