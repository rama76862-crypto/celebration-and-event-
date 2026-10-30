"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  RefreshCw,
  Printer,
  Sliders,
  Lightbulb,
  FileText,
  HelpCircle,
  AlertCircle,
} from "lucide-react";

import {
  EventType,
  CityTier,
  DietaryOption,
  IndoorOutdoor,
  PriorityCategory,
  AgeGroup,
  AllowedCurrency,
  EventRequest,
  FullPlan,
  ReplanResponse,
} from "@/lib/types";
import { fetchEventPlan, fetchEventReplan } from "@/lib/api";
import { formatCurrency, playTactileBlip } from "@/lib/utils";

function PlannerContent() {
  const searchParams = useSearchParams();
  const initialType = (searchParams.get("type") as EventType) || "wedding";

  // Form State
  const [eventType, setEventType] = useState<EventType>(initialType);
  const [title, setTitle] = useState(
    initialType === "wedding"
      ? "The Grand Celestial Nuptials"
      : initialType === "birthday"
      ? "Midnight Velvet Jubilee"
      : "Civic Horizon Summit"
  );
  const [guestCount, setGuestCount] = useState<number>(
    initialType === "wedding" ? 250 : initialType === "birthday" ? 60 : 350
  );
  const [totalBudget, setTotalBudget] = useState<number>(
    initialType === "wedding" ? 1500000 : initialType === "birthday" ? 300000 : 750000
  );
  const [currency, setCurrency] = useState<AllowedCurrency>("INR");

  // Default event date 90 days in future
  const [eventDate, setEventDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + (initialType === "wedding" ? 180 : 60));
    return d.toISOString().split("T")[0];
  });

  const [location, setLocation] = useState("Mumbai / Metropolis");
  const [cityTier, setCityTier] = useState<CityTier>("metro");
  const [priorities, setPriorities] = useState<PriorityCategory[]>(["food", "decor"]);
  const [dietary, setDietary] = useState<DietaryOption[]>(["vegetarian"]);
  const [indoorOutdoor, setIndoorOutdoor] = useState<IndoorOutdoor>("indoor");
  const [ageGroup] = useState<AgeGroup>("adults");
  const [themeVision, setThemeVision] = useState(
    initialType === "wedding"
      ? "Royal minimalist romance with warm champagne lighting and architectural floral arches"
      : initialType === "birthday"
      ? "Neon cyberpunk velvet lounge with dynamic DJ acoustics"
      : "Community botanical festival with multi-stage civic coordination"
  );

  // Execution & Plan State
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePlan, setActivePlan] = useState<FullPlan | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem("event_planner_completed_tasks");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [expandedVendor, setExpandedVendor] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [statusMessage, setStatusMessage] = useState<string>("");

  // "What-If" Re-planning State
  const [isReplanModalOpen, setIsReplanModalOpen] = useState(false);
  const [replanBudget, setReplanBudget] = useState<number>(totalBudget);
  const [replanGuests, setReplanGuests] = useState<number>(guestCount);
  const [replanDate, setReplanDate] = useState<string>(eventDate);
  const [replanLoading, setReplanLoading] = useState(false);
  const [replanResult, setReplanResult] = useState<ReplanResponse | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isReplanModalOpen) {
        setIsReplanModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isReplanModalOpen]);

  // Update defaults when eventType changes
  const handleTypeSelect = (type: EventType) => {
    playTactileBlip("click");
    setEventType(type);
    if (type === "wedding") {
      setTitle("The Grand Celestial Nuptials");
      setGuestCount(250);
      setTotalBudget(1500000);
      setThemeVision("Royal minimalist romance with warm champagne lighting and architectural floral arches");
      const d = new Date();
      d.setDate(d.getDate() + 180);
      setEventDate(d.toISOString().split("T")[0]);
    } else if (type === "birthday") {
      setTitle("Midnight Velvet Jubilee");
      setGuestCount(60);
      setTotalBudget(300000);
      setThemeVision("Neon cyberpunk velvet lounge with dynamic DJ acoustics");
      const d = new Date();
      d.setDate(d.getDate() + 45);
      setEventDate(d.toISOString().split("T")[0]);
    } else {
      setTitle("Civic Horizon Summit");
      setGuestCount(350);
      setTotalBudget(750000);
      setThemeVision("Community botanical festival with multi-stage civic coordination");
      const d = new Date();
      d.setDate(d.getDate() + 60);
      setEventDate(d.toISOString().split("T")[0]);
    }
    setStatusMessage(`Switched celebration archetype to ${type}.`);
  };

  const toggleTask = (taskTitle: string) => {
    playTactileBlip("click");
    setCompletedTasks((prev) => {
      const nextState = { ...prev, [taskTitle]: !prev[taskTitle] };
      try {
        localStorage.setItem("event_planner_completed_tasks", JSON.stringify(nextState));
      } catch {
        // Fallback
      }
      return nextState;
    });
  };

  const togglePriority = (p: PriorityCategory) => {
    playTactileBlip("click");
    if (priorities.includes(p)) {
      setPriorities(priorities.filter((item) => item !== p));
    } else {
      if (priorities.length < 3) {
        setPriorities([...priorities, p]);
      }
    }
  };

  const toggleDietary = (d: DietaryOption) => {
    playTactileBlip("click");
    if (dietary.includes(d)) {
      setDietary(dietary.filter((item) => item !== d));
    } else {
      setDietary([...dietary, d]);
    }
  };

  const handleGeneratePlan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    playTactileBlip("swoosh");
    setIsGenerating(true);

    const payload: EventRequest = {
      event_type: eventType,
      title: title.trim() || "My Celebration",
      guest_count: Number(guestCount),
      total_budget: Number(totalBudget),
      currency,
      event_date: eventDate,
      location: location.trim() || "City Center",
      city_tier: cityTier,
      preferences: {
        theme: themeVision.trim() || undefined,
        dietary: dietary.length > 0 ? dietary : ["none"],
        indoor_outdoor: indoorOutdoor,
        priorities,
        age_group: ageGroup,
      },
    };

    try {
      const plan = await fetchEventPlan(payload);
      setActivePlan(plan);
      setReplanBudget(plan.budget.total_budget);
      setReplanGuests(plan.request.guest_count);
      setReplanDate(plan.request.event_date);
      setIsGenerating(false);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors:
            eventType === "wedding"
              ? ["#D4AF37", "#F3E5AB", "#FFFFFF"]
              : eventType === "birthday"
              ? ["#A855F7", "#EC4899", "#06B6D4"]
              : ["#10B981", "#D97706", "#FFFFFF"],
        });
      } catch {
        // Fallback if confetti blocked
      }

      playTactileBlip("success");
      setStatusMessage(`Event architecture dossier for ${title} successfully generated. Use tabs to explore.`);

      // Smooth scroll to generated dossier
      setTimeout(() => {
        document.getElementById("blueprint-dossier")?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } catch {
      setIsGenerating(false);
      setStatusMessage("Failed to synthesize plan. Please check inputs and try again.");
    }
  };

  // Re-plan computation
  const handleCalculateReplan = async () => {
    if (!activePlan) return;
    playTactileBlip("click");
    setReplanLoading(true);

    try {
      const res = await fetchEventReplan({
        original_request: activePlan.request,
        new_budget: Number(replanBudget),
        new_guest_count: Number(replanGuests),
        new_event_date: replanDate,
      });
      setReplanResult(res);
      setReplanLoading(false);
      playTactileBlip("success");
      setStatusMessage("What-If re-plan calculated. View structural diff below.");
    } catch {
      setReplanLoading(false);
      setStatusMessage("Re-planning calculation encountered an issue.");
    }
  };

  const handleApplyReplan = () => {
    if (!replanResult) return;
    playTactileBlip("success");
    setActivePlan(replanResult.new_plan);
    setTotalBudget(replanResult.new_plan.budget.total_budget);
    setGuestCount(replanResult.new_plan.request.guest_count);
    setEventDate(replanResult.new_plan.request.event_date);
    setIsReplanModalOpen(false);
    setReplanResult(null);
    setStatusMessage("Revised plan applied to primary dossier.");
  };

  const handlePrint = () => {
    playTactileBlip("click");
    window.print();
  };

  const handleDownloadJSON = () => {
    if (!activePlan) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activePlan, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${(activePlan.request.title || "event_plan").toLowerCase().replace(/\s+/g, "_")}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    playTactileBlip("success");
    setStatusMessage("Event plan JSON dossier downloaded successfully.");
  };

  const handleReset = () => {
    playTactileBlip("click");
    setActivePlan(null);
    setCompletedTasks({});
    try {
      localStorage.removeItem("event_planner_completed_tasks");
    } catch {
      // Fallback
    }
    handleTypeSelect(eventType);
    setStatusMessage("Event planner reset to initial configuration.");
  };

  return (
    <div
      className={`min-h-screen pt-28 pb-32 px-4 sm:px-8 max-w-7xl mx-auto transition-colors duration-500 ${
        eventType === "wedding"
          ? "theme-wedding"
          : eventType === "birthday"
          ? "theme-birthday"
          : "theme-community"
      }`}
    >
      {/* Studio Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 glass-panel px-4 py-1.5 rounded-full border border-white/10 mb-4"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span className="text-xs uppercase font-mono tracking-[0.2em] text-white/70">
            Interactive Architecture Studio
          </span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight"
        >
          Event Orchestration Engine
        </motion.h1>
        <p className="text-sm text-white/50 mt-3 font-light leading-relaxed">
          Configure celebration parameters to generate an itemized deterministic budget,
          backwards-planned timeline milestones, vendor contract checklists, and GenAI creative concepts.
        </p>
      </div>

      {/* Live accessibility status announcer */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage}
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Configuration Controls (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Specification Parameters</span>
            </h2>
            <span className="text-[11px] font-mono text-white/40">Step 1 of 2</span>
          </div>

          <form onSubmit={handleGeneratePlan} className="space-y-6">
            {/* Event Category Selector */}
            <fieldset>
              <legend className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-2">
                1. Celebration Archetype
              </legend>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Celebration archetype selection">
                {(["wedding", "birthday", "community"] as EventType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={eventType === type}
                    onClick={() => handleTypeSelect(type)}
                    className={`py-3 px-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 border flex flex-col items-center gap-1.5 cursor-pointer ${
                      eventType === type
                        ? type === "wedding"
                          ? "bg-amber-400/20 text-amber-200 border-amber-400/50 shadow-lg"
                          : type === "birthday"
                          ? "bg-purple-500/20 text-purple-200 border-purple-500/50 shadow-lg"
                          : "bg-emerald-500/20 text-emerald-200 border-emerald-500/50 shadow-lg"
                        : "bg-white/5 text-white/60 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    <span>{type === "wedding" ? "💍 Wedding" : type === "birthday" ? "🎂 Birthday" : "🏛️ Civic"}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Title & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="event-title-input" className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
                  Event Title
                </label>
                <input
                  id="event-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400/50 transition-colors"
                  required
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="event-location-input" className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
                  City Location
                </label>
                <input
                  id="event-location-input"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400/50 transition-colors"
                  required
                  aria-required="true"
                />
              </div>
            </div>

            {/* Currency & Total Budget */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="total-budget-number" className="text-xs font-mono uppercase tracking-wider text-white/70">
                  Total Budget
                </label>
                <div className="flex items-center gap-1" role="radiogroup" aria-label="Currency selection">
                  {(["INR", "USD", "EUR", "GBP"] as AllowedCurrency[]).map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      role="radio"
                      aria-checked={currency === curr}
                      onClick={() => {
                        playTactileBlip("click");
                        setCurrency(curr);
                      }}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors cursor-pointer ${
                        currency === curr
                          ? "bg-amber-400 text-black font-bold"
                          : "text-white/40 hover:text-white"
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <input
                  id="total-budget-number"
                  type="number"
                  min="1000"
                  max="10000000"
                  step="1000"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(Number(e.target.value))}
                  aria-label="Total budget numeric value"
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-lg font-mono font-bold text-white focus:outline-none focus:border-amber-400/60"
                  required
                  aria-required="true"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-white/40" aria-hidden="true">
                  {formatCurrency(totalBudget, currency)}
                </span>
              </div>

              <input
                id="total-budget-slider"
                type="range"
                min="10000"
                max="5000000"
                step="10000"
                value={totalBudget}
                onChange={(e) => setTotalBudget(Number(e.target.value))}
                aria-label="Adjust total budget slider"
                aria-valuemin={10000}
                aria-valuemax={5000000}
                aria-valuenow={totalBudget}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Guest Count & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-white/70">
                  <label htmlFor="guest-count-slider">Guest Count</label>
                  <span className="text-amber-300 font-bold">{guestCount} Guests</span>
                </div>
                <input
                  id="guest-count-slider"
                  type="range"
                  min="10"
                  max="1000"
                  step="5"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  aria-label="Guest count slider"
                  aria-valuemin={10}
                  aria-valuemax={1000}
                  aria-valuenow={guestCount}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="text-[10px] font-mono text-white/40 text-right">
                  ~{formatCurrency(Math.round(totalBudget / Math.max(1, guestCount)), currency)} / guest
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <label htmlFor="event-date-input" className="block text-xs font-mono text-white/70">
                  Target Event Date
                </label>
                <input
                  id="event-date-input"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400/60 font-mono"
                  required
                  aria-required="true"
                />
              </div>
            </div>

            {/* City Tier & Setting */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city-tier-select" className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
                  City Tier
                </label>
                <select
                  id="city-tier-select"
                  value={cityTier}
                  onChange={(e) => setCityTier(e.target.value as CityTier)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400/50 cursor-pointer"
                >
                  <option value="metro" className="bg-[#0f1420]">Metro (+15% Venue)</option>
                  <option value="tier2" className="bg-[#0f1420]">Tier 2 Standard</option>
                  <option value="small_town" className="bg-[#0f1420]">Small Town (-10%)</option>
                </select>
              </div>

              <div>
                <label htmlFor="venue-setting-select" className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
                  Venue Setting
                </label>
                <select
                  id="venue-setting-select"
                  value={indoorOutdoor}
                  onChange={(e) => setIndoorOutdoor(e.target.value as IndoorOutdoor)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400/50 cursor-pointer"
                >
                  <option value="indoor" className="bg-[#0f1420]">Indoor Hall</option>
                  <option value="outdoor" className="bg-[#0f1420]">Outdoor Lawn (Weather Buffer)</option>
                  <option value="either" className="bg-[#0f1420]">Either / Flexible</option>
                </select>
              </div>
            </div>

            {/* Priority Weighting Matrix (+20% Boost) */}
            <fieldset>
              <legend className="flex items-center justify-between mb-2 w-full">
                <span className="text-xs font-mono uppercase tracking-wider text-white/60">
                  Top Focus Priorities (Max 3)
                </span>
                <span className="text-[10px] font-mono text-amber-300">
                  {priorities.length}/3 Selected (+20% Weight)
                </span>
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {(["food", "decor", "music", "photography", "venue", "entertainment"] as PriorityCategory[]).map(
                  (p) => {
                    const isSelected = priorities.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => togglePriority(p)}
                        className={`py-2 px-2 rounded-xl text-xs font-medium capitalize transition-all border cursor-pointer ${
                          isSelected
                            ? "bg-amber-400/20 border-amber-400/50 text-amber-200"
                            : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  }
                )}
              </div>
            </fieldset>

            {/* Dietary Preferences (+8% kitchen surcharge) */}
            <fieldset>
              <legend className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-2">
                Dietary Integrity Protocols
              </legend>
              <div className="flex flex-wrap gap-2">
                {(["vegetarian", "vegan", "jain", "halal", "gluten_free"] as DietaryOption[]).map((d) => {
                  const isSel = dietary.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={isSel}
                      onClick={() => toggleDietary(d)}
                      className={`text-[11px] font-mono px-3 py-1.5 rounded-full capitalize transition-all border cursor-pointer ${
                        isSel
                          ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-200"
                          : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                      }`}
                    >
                      {d.replace("_", " ")}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Creative Theme & Vision Notes */}
            <div>
              <label htmlFor="theme-vision-textarea" className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1.5">
                Creative Theme &amp; Atmosphere
              </label>
              <textarea
                id="theme-vision-textarea"
                rows={2}
                value={themeVision}
                onChange={(e) => setThemeVision(e.target.value)}
                placeholder="E.g. Vintage Italian countryside, or cybernetic neon rave..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400/50"
              />
            </div>

            {/* Launch Calculation CTA */}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black font-semibold text-sm tracking-wide shadow-2xl hover:shadow-amber-400/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Deterministic Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Synthesize Event Blueprint</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Generated Plan Executive Dossier (7 cols) */}
        <div id="blueprint-dossier" className="lg:col-span-7 space-y-6">
          {!activePlan ? (
            /* Blank state waiting for input */
            <div className="glass-panel p-12 rounded-3xl border border-white/10 text-center flex flex-col items-center justify-center min-h-[500px]">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-amber-300/60" />
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-2">
                Awaiting Architectural Synthesis
              </h3>
              <p className="text-sm text-white/50 max-w-md font-light leading-relaxed mb-6">
                Adjust parameters on the left and tap &quot;Synthesize Event Blueprint&quot; to generate an
                itemized budget, backwards timeline, vendor dossiers, and GenAI creative concepts.
              </p>
              <button
                onClick={() => handleGeneratePlan()}
                className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold tracking-wider uppercase transition-colors"
              >
                Synthesize Sample Plan Now
              </button>
            </div>
          ) : (
            /* Active Generated Dossier */
            <div className="space-y-6">
              {/* Executive Summary Card */}
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 bg-black/60 shadow-2xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
                        {activePlan.request.event_type} Architecture
                      </span>
                      {activePlan.timeline.is_compressed ? (
                        <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Compressed Schedule</span>
                        </span>
                      ) : (
                        <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Optimal Timeline Horizon</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-display font-bold text-white">
                      {activePlan.request.title}
                    </h3>
                    <p className="text-xs text-white/50 mt-1 font-mono">
                      {activePlan.request.location} • {activePlan.request.guest_count} Guests •{" "}
                      {activePlan.timeline.days_remaining} Days Remaining
                    </p>
                  </div>

                  {/* Actions: Re-plan, Print, Download JSON, Reset */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        playTactileBlip("click");
                        setIsReplanModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      aria-label="Open What-If Re-plan modal"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>&quot;What-If&quot; Re-plan</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="p-2 rounded-xl glass-panel border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                      title="Print / Save PDF Dossier"
                      aria-label="Print or save PDF dossier"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadJSON}
                      className="p-2 rounded-xl glass-panel border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                      title="Download Plan as JSON"
                      aria-label="Download event plan as JSON file"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-200 border border-white/10 text-xs font-semibold transition-colors cursor-pointer"
                      title="Reset and start over"
                      aria-label="Reset plan and return to initial settings"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* KPI Metrics Ribbon */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] font-mono uppercase text-white/40 block">
                      Total Allocation
                    </span>
                    <span className="text-sm sm:text-base font-bold font-mono text-white">
                      {formatCurrency(activePlan.budget.total_budget, activePlan.budget.currency)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] font-mono uppercase text-white/40 block">
                      Per Guest Cost
                    </span>
                    <span className="text-sm sm:text-base font-bold font-mono text-amber-300">
                      {formatCurrency(activePlan.budget.per_guest_cost, activePlan.budget.currency)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] font-mono uppercase text-white/40 block">
                      Contingency Buffer
                    </span>
                    <span className="text-sm sm:text-base font-bold font-mono text-emerald-400">
                      {activePlan.budget.contingency_percentage}% (
                      {formatCurrency(activePlan.budget.contingency_amount, activePlan.budget.currency)})
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] font-mono uppercase text-white/40 block">
                      Lead Benchmark
                    </span>
                    <span className="text-sm sm:text-base font-bold font-mono text-purple-300">
                      {activePlan.timeline.lead_benchmark_days}d Ideal
                    </span>
                  </div>
                </div>

                {/* Warnings / Fail-safe Notices */}
                {activePlan.budget.benchmark_warnings.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      {activePlan.budget.benchmark_warnings.map((w, idx) => (
                        <p key={idx} className="text-xs text-amber-200">
                          {w}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* WAI-ARIA Accessible Tab Navigation */}
              <div
                role="tablist"
                aria-label="Event Plan Dossier Sections"
                className="flex items-center gap-2 p-1.5 rounded-2xl glass-panel border border-white/10 bg-black/50 overflow-x-auto"
              >
                {[
                  { id: "all", label: "Full Dossier", icon: FileText },
                  { id: "budget", label: "Budget", icon: DollarSign },
                  { id: "timeline", label: "Timeline", icon: Calendar },
                  { id: "vendors", label: "Vendors", icon: ShieldCheck },
                  { id: "ideas", label: "Creative Ideas", icon: Lightbulb },
                ].map((tab, idx, arr) => {
                  const isSelected = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      id={`tab-${tab.id}`}
                      role="tab"
                      type="button"
                      aria-selected={isSelected}
                      aria-controls={`panel-${tab.id}`}
                      tabIndex={isSelected ? 0 : -1}
                      onClick={() => {
                        playTactileBlip("click");
                        setActiveTab(tab.id);
                        setStatusMessage(`Switched to ${tab.label} tab.`);
                      }}
                      onKeyDown={(e) => {
                        let nextIdx = idx;
                        if (e.key === "ArrowRight") nextIdx = (idx + 1) % arr.length;
                        else if (e.key === "ArrowLeft") nextIdx = (idx - 1 + arr.length) % arr.length;
                        else if (e.key === "Home") nextIdx = 0;
                        else if (e.key === "End") nextIdx = arr.length - 1;
                        else return;
                        e.preventDefault();
                        const nextTab = arr[nextIdx];
                        setActiveTab(nextTab.id);
                        setStatusMessage(`Switched to ${nextTab.label} tab.`);
                        document.getElementById(`tab-${nextTab.id}`)?.focus();
                      }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer shrink-0 ${
                        isSelected
                          ? "bg-amber-400 text-black shadow-lg"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* 1. Itemized Adaptive Budget */}
              <div
                id="panel-budget"
                role="tabpanel"
                aria-labelledby="tab-budget"
                hidden={activeTab !== "all" && activeTab !== "budget"}
                className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6"
              >
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <h4 className="text-base font-display font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    <span>Adaptive Budget Allocation</span>
                  </h4>
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>0-Penny Remainder Exact</span>
                  </span>
                </div>

                {/* Visual Segment Bar */}
                <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden flex">
                  {activePlan.budget.categories.map((c, i) => {
                    const colors = [
                      "bg-amber-400",
                      "bg-amber-200",
                      "bg-rose-400",
                      "bg-purple-400",
                      "bg-cyan-400",
                      "bg-teal-400",
                    ];
                    return (
                      <div
                        key={c.name}
                        className={`h-full ${colors[i % colors.length]}`}
                        style={{ width: `${c.percentage}%` }}
                        title={`${c.name}: ${c.percentage}%`}
                      />
                    );
                  })}
                  <div
                    className="h-full bg-emerald-400"
                    style={{ width: `${activePlan.budget.contingency_percentage}%` }}
                    title={`Contingency: ${activePlan.budget.contingency_percentage}%`}
                  />
                </div>

                {/* Category List */}
                <div className="space-y-3">
                  {activePlan.budget.categories.map((cat) => (
                    <div
                      key={cat.name}
                      className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/10 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{cat.name}</span>
                          <span className="text-xs font-mono text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded">
                            {cat.percentage}%
                          </span>
                        </div>
                        <p className="text-xs text-white/50 mt-1">{cat.reasoning}</p>
                      </div>
                      <div className="text-right sm:shrink-0">
                        <span className="text-sm font-mono font-bold text-white block">
                          {formatCurrency(cat.amount, activePlan.budget.currency)}
                        </span>
                        <span className="text-[10px] font-mono text-white/40">
                          ~{formatCurrency(Math.round(cat.amount / Math.max(1, activePlan.request.guest_count)), activePlan.budget.currency)} / guest
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Contingency Line */}
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-emerald-200">
                        Zero-Penny Contingency Buffer
                      </span>
                      <p className="text-xs text-emerald-300/60 mt-0.5">
                        Protects against unforeseen weather, overage plates, or emergency vendor fees.
                      </p>
                    </div>
                    <span className="text-sm font-mono font-bold text-emerald-300">
                      {formatCurrency(activePlan.budget.contingency_amount, activePlan.budget.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Backwards-Planned Timeline & Run-of-Show */}
              <div
                id="panel-timeline"
                role="tabpanel"
                aria-labelledby="tab-timeline"
                hidden={activeTab !== "all" && activeTab !== "timeline"}
                className="space-y-6"
              >
                <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <h4 className="text-base font-display font-bold text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <span>Backwards-Planned Timeline Matrix</span>
                    </h4>
                    <span className="text-xs font-mono text-white/50">
                      Target: {activePlan.timeline.event_date}
                    </span>
                  </div>

                  <div className="space-y-4" role="group" aria-label="Timeline tasks checklist">
                    {activePlan.timeline.all_tasks_sorted.map((task, i) => {
                      const isDone = !!completedTasks[task.title];
                      return (
                        <button
                          key={i}
                          type="button"
                          role="checkbox"
                          aria-checked={isDone}
                          aria-label={`Mark task as ${isDone ? "incomplete" : "complete"}: ${task.title}`}
                          onClick={() => toggleTask(task.title)}
                          onKeyDown={(e) => {
                            if (e.key === " " || e.key === "Enter") {
                              e.preventDefault();
                              toggleTask(task.title);
                            }
                          }}
                          className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                            isDone
                              ? "bg-white/5 border-white/5 opacity-50 line-through"
                              : task.is_urgent
                              ? "bg-rose-500/10 border-rose-500/30 hover:border-rose-500/50"
                              : "bg-white/5 border-white/10 hover:border-white/20"
                          }`}
                        >
                          <div
                            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              isDone ? "bg-emerald-400 border-emerald-400 text-black" : "border-white/30"
                            }`}
                          >
                            {isDone && <CheckCircle2 className="w-3 h-3" />}
                          </div>

                          <div className="flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-white">{task.title}</span>
                              <div className="flex items-center gap-2">
                                {task.is_urgent && (
                                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                                    Urgent Action
                                  </span>
                                )}
                                <span className="text-xs font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded">
                                  Due: {task.due_date}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-white/50 mt-1">{task.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Hour-by-Hour Run-of-Show Choreography */}
                <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <h4 className="text-base font-display font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span>Event-Day Run-of-Show Choreography</span>
                    </h4>
                    <span className="text-xs font-mono text-white/50">Production Day Order</span>
                  </div>

                  <div className="space-y-4">
                    {activePlan.timeline.run_of_show.map((slot, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-mono font-bold text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded border border-purple-500/20 whitespace-nowrap">
                            {slot.time_label}
                          </span>
                          <div>
                            <h5 className="text-sm font-semibold text-white">{slot.title}</h5>
                            <p className="text-xs text-white/50 mt-0.5">{slot.description}</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-white/40 sm:shrink-0 bg-white/5 px-2.5 py-1 rounded">
                          Lead: {slot.owner}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Vendor Dossier & Negotiation Playbook */}
              <div
                id="panel-vendors"
                role="tabpanel"
                aria-labelledby="tab-vendors"
                hidden={activeTab !== "all" && activeTab !== "vendors"}
                className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6"
              >
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <h4 className="text-base font-display font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Vendor Dossiers &amp; Discretion Playbook</span>
                  </h4>
                  <span className="text-xs font-mono text-white/50">Mandatory Due Diligence</span>
                </div>

                <div className="space-y-4">
                  {activePlan.vendors.recommended_vendors.map((vendor, vIdx) => {
                    const isExp = expandedVendor === vIdx;
                    return (
                      <div
                        key={vIdx}
                        className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden transition-all"
                      >
                        <button
                          type="button"
                          id={`vendor-header-${vIdx}`}
                          aria-expanded={isExp}
                          aria-controls={`vendor-details-${vIdx}`}
                          onClick={() => {
                            playTactileBlip("click");
                            setExpandedVendor(isExp ? null : vIdx);
                          }}
                          className="w-full text-left p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors focus:outline-none focus:ring-1 focus:ring-amber-400"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-bold text-white">{vendor.vendor_type}</h5>
                              <span className="text-xs font-mono text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded">
                                Budget: {formatCurrency(vendor.allocated_budget, activePlan.budget.currency)}
                              </span>
                            </div>
                            <span className="text-xs font-mono text-white/40 mt-1 block">
                              Lock by: {vendor.booking_deadline}
                            </span>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-white/50 transition-transform ${
                              isExp ? "rotate-180 text-white" : ""
                            }`}
                          />
                        </button>

                        {isExp && (
                          <div
                            id={`vendor-details-${vIdx}`}
                            role="region"
                            aria-labelledby={`vendor-header-${vIdx}`}
                            className="p-5 pt-0 border-t border-white/5 space-y-4 text-xs"
                          >
                            {/* Interview Questions */}
                            <div>
                              <span className="font-semibold text-white/80 uppercase font-mono tracking-wider block mb-2 flex items-center gap-1.5">
                                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                                <span>High-Discretion Interview Questions (Ask Before Hiring)</span>
                              </span>
                              <ul className="space-y-1.5 list-disc list-inside text-white/60">
                                {vendor.interview_questions.map((q, qIdx) => (
                                  <li key={qIdx}>{q}</li>
                                ))}
                              </ul>
                            </div>

                            {/* Red Flags */}
                            <div>
                              <span className="font-semibold text-rose-300 uppercase font-mono tracking-wider block mb-2 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                                <span>Critical Red Flags</span>
                              </span>
                              <ul className="space-y-1.5 list-disc list-inside text-rose-200/70">
                                {vendor.red_flags.map((rf, rfIdx) => (
                                  <li key={rfIdx}>{rf}</li>
                                ))}
                              </ul>
                            </div>

                            {/* Required Documents */}
                            <div>
                              <span className="font-semibold text-emerald-300 uppercase font-mono tracking-wider block mb-2 flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Mandatory Contract Documents</span>
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {vendor.required_documents.map((doc, dIdx) => (
                                  <span
                                    key={dIdx}
                                    className="font-mono text-[10px] bg-emerald-500/10 text-emerald-200 border border-emerald-500/20 px-2 py-1 rounded"
                                  >
                                    {doc}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5. GenAI Creative Moodboard & Concepts */}
              <div
                id="panel-ideas"
                role="tabpanel"
                aria-labelledby="tab-ideas"
                hidden={activeTab !== "all" && activeTab !== "ideas"}
                className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6"
              >
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <h4 className="text-base font-display font-bold text-white flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-300" />
                    <span>Creative Moodboard &amp; Ideation Suite</span>
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/70">
                    Source: {activePlan.ideas.source}
                  </span>
                </div>

                {/* Theme Concepts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activePlan.ideas.theme_concepts.map((concept, cIdx) => (
                    <div
                      key={cIdx}
                      className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3"
                    >
                      <h5 className="text-sm font-bold text-white">{concept.name}</h5>
                      <p className="text-xs text-white/50 leading-relaxed">{concept.description}</p>
                      <div className="flex items-center gap-2 pt-2">
                        <span className="text-[10px] font-mono text-white/40">Palette:</span>
                        {concept.color_palette.map((color, colIdx) => (
                          <div
                            key={colIdx}
                            className="w-5 h-5 rounded-full border border-white/20 shadow-md"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Banquet Menu Pairings */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                  <span className="text-xs uppercase font-mono tracking-wider text-amber-300 font-semibold block">
                    Curated Banquet Recommendations
                  </span>
                  <div className="space-y-3">
                    {activePlan.ideas.menu_recommendations.map((menu, mIdx) => (
                      <div key={mIdx} className="space-y-1">
                        <span className="text-xs font-semibold text-white/80">{menu.course}</span>
                        <p className="text-xs text-white/50">{menu.dishes.join(" • ")}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Practical Budget Hacks */}
                <div className="p-5 rounded-2xl bg-amber-400/5 border border-amber-400/15 space-y-2">
                  <span className="text-xs uppercase font-mono tracking-wider text-amber-300 font-semibold block">
                    Strategic Budget Hacks
                  </span>
                  <ul className="space-y-1.5 list-disc list-inside text-xs text-white/70">
                    {activePlan.ideas.budget_hacks.map((hack, hIdx) => (
                      <li key={hIdx}>{hack}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* "What-If" Re-planning Modal */}
      <AnimatePresence>
        {isReplanModalOpen && activePlan && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="replan-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl glass-panel p-8 rounded-3xl border border-white/15 bg-[#0a0d14] shadow-2xl max-h-[90vh] overflow-y-auto space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h3 id="replan-modal-title" className="text-xl font-display font-bold text-white flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-amber-400" />
                    <span>&quot;What-If&quot; Dynamic Re-planning</span>
                  </h3>
                  <p className="text-xs text-white/50 mt-1">
                    Modify budget, guest count, or dates to inspect live structural diffs and financial advisor suggestions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReplanModalOpen(false)}
                  aria-label="Close re-planning modal dialog"
                  className="text-white/40 hover:text-white text-sm font-mono px-3 py-1 rounded bg-white/5 cursor-pointer"
                >
                  ESC / Close
                </button>
              </div>

              {/* Interactive Sliders */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-mono text-white/70 mb-1">
                    <label htmlFor="replan-budget-slider">Revised Budget</label>
                    <span className="text-amber-300 font-bold">
                      {formatCurrency(replanBudget, activePlan.budget.currency)}
                    </span>
                  </div>
                  <input
                    id="replan-budget-slider"
                    type="range"
                    min="10000"
                    max="5000000"
                    step="10000"
                    value={replanBudget}
                    onChange={(e) => setReplanBudget(Number(e.target.value))}
                    aria-label="Adjust revised budget slider"
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono text-white/70 mb-1">
                    <label htmlFor="replan-guest-slider">Revised Guest Count</label>
                    <span className="text-amber-300 font-bold">{replanGuests} Guests</span>
                  </div>
                  <input
                    id="replan-guest-slider"
                    type="range"
                    min="10"
                    max="1000"
                    step="5"
                    value={replanGuests}
                    onChange={(e) => setReplanGuests(Number(e.target.value))}
                    aria-label="Adjust revised guest count slider"
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                <div>
                  <label htmlFor="replan-date-input" className="block text-xs font-mono text-white/70 mb-1">
                    Revised Event Date
                  </label>
                  <input
                    id="replan-date-input"
                    type="date"
                    value={replanDate}
                    onChange={(e) => setReplanDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                  />
                </div>

                <button
                  onClick={handleCalculateReplan}
                  disabled={replanLoading}
                  className="w-full py-3 rounded-xl bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase hover:bg-amber-300 transition-colors cursor-pointer"
                >
                  {replanLoading ? "Computing Structural Delta..." : "Compute Dynamic Plan Diff"}
                </button>
              </div>

              {/* Re-plan Results Display */}
              {replanResult && (
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-bold">
                      Itemized Structural Diff
                    </span>
                    <span className="text-xs font-mono text-white/50">
                      Budget Delta: {replanResult.diff.budget_delta >= 0 ? "+" : ""}
                      {formatCurrency(replanResult.diff.budget_delta, activePlan.budget.currency)}
                    </span>
                  </div>

                  {/* Advisor Primary Recommendation */}
                  <div className="p-4 rounded-xl bg-amber-400/10 border border-amber-400/20 text-xs text-amber-200">
                    <strong>Advisor:</strong> {replanResult.advice.primary_recommendation}
                  </div>

                  {/* Category Shifts Breakdown */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
                    {Object.entries(replanResult.diff.category_shifts).map(([catName, shift]) => (
                      <div
                        key={catName}
                        className="flex items-center justify-between text-xs py-1.5 border-b border-white/5"
                      >
                        <span className="text-white/70">{catName}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-white/40">
                            {formatCurrency(shift.old_amount, activePlan.budget.currency)}
                          </span>
                          <span className="text-white/40">&rarr;</span>
                          <span className="text-white font-bold">
                            {formatCurrency(shift.new_amount, activePlan.budget.currency)}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              shift.difference >= 0
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-rose-500/20 text-rose-300"
                            }`}
                          >
                            {shift.difference >= 0 ? "+" : ""}
                            {formatCurrency(shift.difference, activePlan.budget.currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleApplyReplan}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-semibold text-xs tracking-wider uppercase hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Apply Revised Parameters To Main Blueprint
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PlannerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
        </div>
      }
    >
      <PlannerContent />
    </Suspense>
  );
}
