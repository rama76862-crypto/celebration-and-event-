import {
  EventRequest,
  FullPlan,
  ReplanRequest,
  ReplanResponse,
  EventType,
  BudgetPlan,
  TimelinePlan,
  VendorChecklist,
  IdeaSet,
  PlanDiff,
  SmartAdvice,
} from "./types";

/**
 * A production build receives the public API URL through Vercel's environment
 * settings. Local development intentionally keeps the FastAPI default.
 */
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

/**
 * A lightweight browser-side health check. It is called when the shared footer
 * mounts, which both reports service availability and wakes hosts that sleep
 * after inactivity. No user data is sent.
 */
export async function wakeBackend(): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(apiUrl("/health"), {
      cache: "no-store",
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

// Client-side deterministic calculation fallback matching backend logic
export function generateClientPlan(req: EventRequest): FullPlan {
  const total = req.total_budget;
  const guests = Math.max(1, req.guest_count);
  const perGuest = total / guests;
  const eventDate = new Date(req.event_date);
  const now = new Date();
  const diffTime = eventDate.getTime() - now.getTime();
  const daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Benchmark days
  const benchmarkMap: Record<EventType, number> = {
    wedding: 180,
    birthday: 45,
    community: 60,
  };
  const benchmark = benchmarkMap[req.event_type] || 60;
  const isCompressed = daysRemaining < benchmark;

  // Contingency percentage
  let contingencyPct = 0.08;
  if (req.event_type === "wedding" || req.preferences.indoor_outdoor === "outdoor") {
    contingencyPct = 0.12;
  }

  // Weightings based on priorities and event type
  let categories: { name: string; baseWeight: number; reasoning: string }[] = [];
  if (req.event_type === "wedding") {
    categories = [
      { name: "Venue & Banquets", baseWeight: 0.35, reasoning: "Core ceremony space and reception halls" },
      { name: "Catering & Bar", baseWeight: 0.25, reasoning: "Multi-course dining and hospitality" },
      { name: "Decor, Floral & Staging", baseWeight: 0.15, reasoning: "Haute couture stage, floral arches and lighting" },
      { name: "Photography & Cinematography", baseWeight: 0.12, reasoning: "High-resolution 4K bridal and ceremony memories" },
      { name: "Music & Live Entertainment", baseWeight: 0.08, reasoning: "Acoustic strings, DJ, and entrance audio" },
      { name: "Attire & Beauty", baseWeight: 0.05, reasoning: "Stylist, hair, and bridal wardrobe logistics" },
    ];
  } else if (req.event_type === "birthday") {
    categories = [
      { name: "Venue & Atmosphere", baseWeight: 0.28, reasoning: "Curated party space, lighting and lounge setup" },
      { name: "Food & Signature Cake", baseWeight: 0.32, reasoning: "Interactive food stations and custom cake reveal" },
      { name: "Entertainment, DJ & Audio", baseWeight: 0.22, reasoning: "Sound system, dynamic DJ and live party host" },
      { name: "Thematic Decor & Photo-Ops", baseWeight: 0.12, reasoning: "Holographic backdrop, neon signs and balloon art" },
      { name: "Party Favors & Keepsakes", baseWeight: 0.06, reasoning: "Custom gift bags and celebratory tokens" },
    ];
  } else {
    categories = [
      { name: "Venue, Permits & Staging", baseWeight: 0.32, reasoning: "Civic park permits, pavilion hire and staging" },
      { name: "Community Catering & Refreshments", baseWeight: 0.28, reasoning: "Communal banquet, food stalls and beverage tents" },
      { name: "Audio-Visual, Power & Generator", baseWeight: 0.18, reasoning: "PA sound system, outdoor silent generators and mics" },
      { name: "Safety, Sanitation & Weather Tenting", baseWeight: 0.14, reasoning: "First aid station, clean restrooms and shade tents" },
      { name: "Activities & Signage", baseWeight: 0.08, reasoning: "Directional maps, banner printing and stage schedule" },
    ];
  }

  // Dietary check
  const hasStrictDietary = req.preferences.dietary.some((d) => ["jain", "halal", "vegan"].includes(d));
  const warnings: string[] = [];
  if (req.currency === "INR" && perGuest < 400) {
    warnings.push(`Per-guest budget (₹${Math.round(perGuest)}) is tight for full-course service. Consider buffet or finger food.`);
  } else if (req.currency === "USD" && perGuest < 25) {
    warnings.push(`Per-guest allocation ($${Math.round(perGuest)}) is below metro banquet benchmarks ($50+).`);
  }

  // Compute category items
  const nonContingencyBudget = total * (1 - contingencyPct);
  const totalWeight = categories.reduce((s, c) => s + c.baseWeight, 0);
  const budgetCategories = categories.map((c) => {
    const share = c.baseWeight / totalWeight;
    const amount = Math.round(nonContingencyBudget * share);
    const pct = Math.round((amount / total) * 100);
    return {
      name: c.name,
      percentage: pct,
      amount,
      reasoning: c.reasoning,
    };
  });

  const contingencyAmount = Math.round(total * contingencyPct);
  const allocatedTotal = budgetCategories.reduce((s, c) => s + c.amount, 0) + contingencyAmount;

  const budgetPlan: BudgetPlan = {
    event_type: req.event_type,
    total_budget: total,
    currency: req.currency,
    per_guest_cost: Math.round(perGuest),
    categories: budgetCategories,
    total_allocated: allocatedTotal,
    contingency_percentage: Math.round(contingencyPct * 100),
    contingency_amount: contingencyAmount,
    benchmark_warnings: warnings,
    notes: [
      hasStrictDietary ? "Strict dietary protocols applied (+8% specialized kitchen surcharge reserved)." : "Standard dietary provisions active.",
      req.preferences.indoor_outdoor === "outdoor" ? "Dedicated outdoor weather backup buffer included." : "Standard indoor venue setting.",
    ],
  };

  // Timeline Tasks
  const taskTemplates = [
    { title: "Lock Down Venue & Sign Agreement", category: "Venue", offsetDays: Math.min(daysRemaining, 120), phase: "Immediate Priority", urgent: isCompressed, desc: "Finalize capacity, curfew rules, deposit, and access hours." },
    { title: "Secure Primary Catering Contract", category: "Catering", offsetDays: Math.min(daysRemaining - 2, 90), phase: "Immediate Priority", urgent: isCompressed, desc: "Sample menu tasting, lock guest count bounds, verify dietary cookware segregation." },
    { title: "Engage Lead Audio/Visual & Sound Engineer", category: "Entertainment", offsetDays: Math.min(daysRemaining - 5, 60), phase: "Next Phase", urgent: false, desc: "Check venue decibel limits, wireless mics, and generator silent load." },
    { title: "Finalize Decor Styling & Floor Layout", category: "Decor", offsetDays: Math.min(daysRemaining - 10, 45), phase: "Mid Horizon", urgent: false, desc: "Render 3D layout, confirm floral delivery schedule, and electrical drop-points." },
    { title: "Review Run-of-Show & Vendor Arrival Times", category: "Coordination", offsetDays: Math.min(daysRemaining - 15, 14), phase: "Final Month", urgent: false, desc: "Assemble minute-by-minute timeline, emergency contacts, and vendor load-in passes." },
    { title: "Final Headcount Confirmation & Payment Clearances", category: "Administration", offsetDays: Math.min(daysRemaining - 20, 3), phase: "Final Week", urgent: true, desc: "Lock final plates with caterer, disperse vendor final balance envelopes." },
  ];

  const tasks = taskTemplates.map((t) => {
    const d = new Date(eventDate);
    d.setDate(d.getDate() - Math.max(1, t.offsetDays));
    return {
      title: t.title,
      category: t.category,
      due_date: d.toISOString().split("T")[0],
      days_before_event: t.offsetDays,
      phase: isCompressed && t.offsetDays > daysRemaining / 2 ? "Urgent Acceleration" : t.phase,
      is_urgent: t.urgent,
      description: t.desc,
    };
  }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  // Run of Show
  const runOfShow = [
    { time_offset_hours: 0, time_label: "T-0:00 (H-Hour)", duration_minutes: 60, title: "Vendor Load-in & Technical Sound Check", description: "All sound systems, lighting rigs, and floral stages inspected.", owner: "Production Lead" },
    { time_offset_hours: 1.5, time_label: "T+1:30", duration_minutes: 45, title: "Guest Welcome & Atmospheric Prelude", description: "Signature welcome drinks, background acoustic ambiance, and host greetings.", owner: "Hospitality Lead" },
    { time_offset_hours: 2.5, time_label: "T+2:30", duration_minutes: 60, title: "Grand Celebration Highlight & Spotlight Ceremony", description: "Central ritual, keynote entrance, cake cutting, or opening speeches.", owner: "Master of Ceremonies" },
    { time_offset_hours: 3.5, time_label: "T+3:30", duration_minutes: 90, title: "Banquet Feast & Interactive Revelry", description: "Buffet / plated service, live DJ ramp-up, open dance floor or festival activities.", owner: "Catering & DJ" },
    { time_offset_hours: 5.0, time_label: "T+5:00", duration_minutes: 45, title: "Grand Finale, Gratitude & Guest Departure", description: "Token gifting, sparkler sendoff or closing remarks, scheduled load-out.", owner: "Coordinator" },
  ];

  const phasesMap: Record<string, typeof tasks> = {};
  tasks.forEach((t) => {
    if (!phasesMap[t.phase]) phasesMap[t.phase] = [];
    phasesMap[t.phase].push(t);
  });

  const timelinePlan: TimelinePlan = {
    event_type: req.event_type,
    event_date: req.event_date,
    days_remaining: daysRemaining,
    is_compressed: isCompressed,
    lead_benchmark_days: benchmark,
    phases: phasesMap,
    all_tasks_sorted: tasks,
    run_of_show: runOfShow,
  };

  // Vendors
  const vendorsList = [
    {
      vendor_type: "Banquet Venue & Hospitality Suite",
      booking_deadline: tasks[0].due_date,
      allocated_budget: budgetCategories[0].amount,
      interview_questions: [
        "What is the exact curfew for amplified acoustic and live music?",
        "Do you have a dedicated 3-phase silent backup generator on premises?",
        "Are there separate green rooms for hosts, performers, or bridal party?",
        "What is the exact load-in window permitted before guest arrival?",
      ],
      red_flags: [
        "Hidden overtime charges exceeding 25% of hourly rate",
        "Mandatory vendor exclusivity with non-negotiable markup fees",
        "Vague cancellation refund terms under weather disruption",
      ],
      required_documents: ["Commercial Venue Agreement", "Fire Marshal Occupancy Certificate", "Public Liability Insurance Certificate"],
    },
    {
      vendor_type: "Master Executive Caterer",
      booking_deadline: tasks[1].due_date,
      allocated_budget: budgetCategories[1].amount,
      interview_questions: [
        "Can you guarantee strictly segregated cookware and utensils for dietary requirements?",
        "What is the exact server-to-guest ratio during peak banquet dining?",
        "How is excess gourmet food handled safely after service?",
        "Do you provide a formal on-site tasting for up to 4 guests?",
      ],
      red_flags: [
        "Unwillingness to provide ingredient origin certificates",
        "Refusal to conduct an in-person kitchen tasting session",
        "No formal temperature-controlled transport vehicles",
      ],
      required_documents: ["Food Safety & Hygiene License (FSSAI/FDA)", "Menu Tasting Signoff Document", "Staff Health Clearances"],
    },
    {
      vendor_type: "Creative Scenography & Floral Decorator",
      booking_deadline: tasks[2].due_date,
      allocated_budget: budgetCategories[2] ? budgetCategories[2].amount : Math.round(total * 0.1),
      interview_questions: [
        "Do you create realistic 3D spatial renders of the stage before construction?",
        "What is your backup plan if specific seasonal flowers are unavailable?",
        "Are all fabrics and drape materials fire-retardant certified?",
        "How many technicians will be dedicated to teardown immediately following the event?",
      ],
      red_flags: [
        "Showing other agencies' portfolio photos as their own work",
        "No certified electrical technicians on the rigging crew",
        "Unwilling to do a prior venue walkthrough measurement",
      ],
      required_documents: ["Spatial Render Contract", "Flame Resistance Certification", "Damage Deposit Indemnity Clause"],
    },
  ];

  const vendorChecklist: VendorChecklist = {
    event_type: req.event_type,
    recommended_vendors: vendorsList,
    skipped_vendors: {
      "Orchestral Philharmonic Band": "Skipped because allocated entertainment budget recommends high-fidelity DJ & speaker rental.",
    },
  };

  // Creative Ideas
  const ideas: IdeaSet = {
    theme_concepts: [
      {
        name: req.event_type === "wedding" ? "Ethereal Celestial Romance" : req.event_type === "birthday" ? "Neon Velvet Reverie" : "Emerald Horizon Harmony",
        description: "An intentional sensory world that elevates high architectural lines, warm atmospheric lighting, and personalized tactile moments.",
        color_palette: req.event_type === "wedding" ? ["#D4AF37", "#F3E5AB", "#1A1412", "#E0A899"] : req.event_type === "birthday" ? ["#A855F7", "#EC4899", "#06B6D4", "#0A0612"] : ["#10B981", "#D97706", "#04130C", "#D1FAE5"],
      },
      {
        name: "Minimalist Modern Luxe",
        description: "Monochrome elegance layered with brushed metallic typography, floating organic botanical textures, and curated micro-accents.",
        color_palette: ["#FFFFFF", "#94A3B8", "#1E293B", "#0F172A"],
      },
    ],
    decor_suggestions: [
      { area: "Grand Entrance & Threshold", idea: "Kinetic ribbon portal with subtle fragrance misting and warm floor-level amber uplighting." },
      { area: "Center Stage / Focal Altar", idea: "Architectural monolithic backdrop with floating asymmetrical floral clusters and backlit brass rim lighting." },
      { area: "Interactive Cocktail Lounge", idea: "Mirrored floating bars with custom laser-engraved acrylic cocktail menus and velvet banquettes." },
    ],
    menu_recommendations: [
      { course: "Amuse-Bouche & Hors d'œuvres", dishes: ["Truffle-infused wild mushroom tartlets", "Smoked saffron paneer crudo", "Crispy lotus root chips with avocado crema"] },
      { course: "Signature Main Course", dishes: ["Slow-braised royal dal makhani with 24k gold leaf", "Artisanal saffron pilaf with toasted pine nuts", "Chargrilled heirloom vegetables in chimichurri"] },
      { course: "Dessert Grand Finale", dishes: ["Pistachio cardamom entremet with rose syrup dew", "Deconstructed tiramisu espresso mist", "Liquid nitrogen artisanal kulfi spheres"] },
    ],
    activity_timeline: [
      { time_slot: "Sunset Hour", activity: "Acoustic cello & harp prelude with personalized guest arrival polaroids." },
      { time_slot: "Peak Hour", activity: "Choreographed champagne fountain toast and synchronized dynamic light show." },
      { time_slot: "Late Hour", activity: "Midnight dessert lounge with live acoustic saxophone freestyle." },
    ],
    budget_hacks: [
      "Repurpose ceremonial floral arrangements into the evening reception buffet styling to save ~35% on florals.",
      "Opt for high-impact atmospheric LED pin-spotting rather than excessive ceiling hanging chandeliers.",
      "Focus premium bar options during the primary 2-hour cocktail window, switching to signature blends thereafter.",
    ],
    source: "Celebration Master Studio Engine",
  };

  return {
    request: req,
    budget: budgetPlan,
    timeline: timelinePlan,
    vendors: vendorChecklist,
    ideas,
  };
}

// Compute replan diff and advice locally
export function generateClientReplan(replanReq: ReplanRequest): ReplanResponse {
  const orig = replanReq.original_request;
  const newBudget = replanReq.new_budget ?? orig.total_budget;
  const newGuests = replanReq.new_guest_count ?? orig.guest_count;
  const newDate = replanReq.new_event_date ?? orig.event_date;

  const revisedReq: EventRequest = {
    ...orig,
    total_budget: newBudget,
    guest_count: newGuests,
    event_date: newDate,
  };

  const oldPlan = generateClientPlan(orig);
  const newPlan = generateClientPlan(revisedReq);

  const budgetDelta = newBudget - orig.total_budget;
  const guestDelta = newGuests - orig.guest_count;

  const origD = new Date(orig.event_date);
  const newD = new Date(newDate);
  const dateShiftDays = Math.round((newD.getTime() - origD.getTime()) / (1000 * 60 * 60 * 24));

  const categoryShifts: Record<string, { old_amount: number; new_amount: number; difference: number }> = {};
  newPlan.budget.categories.forEach((newCat) => {
    const oldCat = oldPlan.budget.categories.find((c) => c.name === newCat.name);
    const oldAmt = oldCat ? oldCat.amount : 0;
    categoryShifts[newCat.name] = {
      old_amount: oldAmt,
      new_amount: newCat.amount,
      difference: newCat.amount - oldAmt,
    };
  });

  const diff: PlanDiff = {
    budget_delta: budgetDelta,
    guest_count_delta: guestDelta,
    date_shift_days: dateShiftDays,
    category_shifts: categoryShifts,
    newly_urgent_tasks: newPlan.timeline.is_compressed ? ["Venue Contract", "Catering Deposit"] : [],
  };

  const advice: SmartAdvice = {
    primary_recommendation: budgetDelta < 0
      ? `Budget reduced by ${Math.abs(budgetDelta)}. We automatically calibrated contingency buffers and protected catering quality.`
      : budgetDelta > 0
      ? `Budget expanded by ${budgetDelta}. Funds prioritized towards enhanced decor staging and entertainment.`
      : "Guest and date parameters adjusted with zero loss in proportional allocation balance.",
    concrete_options: [
      "Review vendor negotiation targets to lock in contracted rates before price escalations.",
      "Consider digital invitations and customized RSVP tracking to eliminate printing lead-times.",
      "Leverage the contingency buffer if venue setup requires expedited early-morning access.",
    ],
    trade_offs: [
      budgetDelta < 0 ? "Lowering production budget slightly limits custom rigging." : "Expanding guest list increases table layout complexity.",
      dateShiftDays < 0 ? "Accelerated schedule requires prioritizing vendor deposits this week." : "Extended date offers deeper vendor availability.",
    ],
    first_actions_this_week: [
      "Execute primary venue agreement with updated guest capacity.",
      "Transmit dietary headcount directly to catering executive.",
      "Confirm backup power generator reservation.",
    ],
  };

  return {
    new_plan: newPlan,
    diff,
    advice,
  };
}

// Full API caller with graceful deterministic fallback
export async function fetchEventPlan(req: EventRequest): Promise<FullPlan> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(apiUrl("/api/plan"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return data as FullPlan;
    }
  } catch {
    // Graceful fallback to client deterministic engine
  }

  return generateClientPlan(req);
}

// Replan API caller with graceful deterministic fallback
export async function fetchEventReplan(replanReq: ReplanRequest): Promise<ReplanResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(apiUrl("/api/replan"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(replanReq),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return data as ReplanResponse;
    }
  } catch {
    // Graceful fallback
  }

  return generateClientReplan(replanReq);
}
