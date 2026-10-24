"use client";

import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Award,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { playTactileBlip } from "@/lib/utils";

// Lazy-load 3D canvas with no SSR for peak performance
const EventScene = dynamic(() => import("@/components/canvas/EventScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-24 h-24 rounded-full border border-amber-400/20 animate-ping opacity-30" />
    </div>
  ),
});

const UNIVERSES = [
  {
    id: "wedding" as const,
    title: "Haute Nuptials",
    subtitle: "Ceremony, Banquets & Royal Choreography",
    desc: "Curated for couples requiring perfection. 180-day backwards-planned countdowns, segregated dietary cookware protocols, and haute couture scenography.",
    tag: "Aura of Luminescence",
    color: "#D4AF37",
    textColor: "text-amber-300",
    borderColor: "hover:border-amber-400/40",
    bgGradient: "from-amber-950/20 via-black to-black",
    features: ["180-Day Benchmark", "Dietary Cookware Segregation", "Weather Backup Matrix", "Run-of-Show Choreography"],
    route: "/wedding",
    presetBudget: "₹1,500,000",
  },
  {
    id: "birthday" as const,
    title: "Cyber Jubilee",
    subtitle: "Velvet Reverie, DJ Acoustics & Milestone Eras",
    desc: "From sweet sixteens to golden 50th jubilees. Dynamic entertainment audio threshold validation, signature cake reveals, and immersive neon styling.",
    tag: "Radiant Velvet",
    color: "#A855F7",
    textColor: "text-purple-300",
    borderColor: "hover:border-purple-400/40",
    bgGradient: "from-purple-950/20 via-black to-black",
    features: ["45-Day Benchmark", "Sound Threshold Auditor", "Dynamic Age Profiles", "Party Run-of-Show"],
    route: "/birthday",
    presetBudget: "₹250,000",
  },
  {
    id: "community" as const,
    title: "Terra Collective",
    subtitle: "Civic Summits, Cultural Fairs & Public Banquets",
    desc: "Designed for neighborhood organizers and civic summits. Municipal fire permits, silent power generators, crowd flow buffers, and multi-stage coordination.",
    tag: "Emerald Zenith",
    color: "#10B981",
    textColor: "text-emerald-300",
    borderColor: "hover:border-emerald-400/40",
    bgGradient: "from-emerald-950/20 via-black to-black",
    features: ["60-Day Benchmark", "Municipal Permit Tracker", "Silent Generator Load", "Crowd Density Safety"],
    route: "/community",
    presetBudget: "₹600,000",
  },
];

export default function HomePage() {
  const [activeUniverse, setActiveUniverse] = useState<"studio" | "wedding" | "birthday" | "community">("studio");

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#07080b]">
      {/* 3D Canvas Background Layer */}
      <div className="absolute inset-0 z-0 h-[90vh] md:h-screen pointer-events-none">
        <EventScene theme={activeUniverse} />
      </div>

      {/* Atmospheric Vignette Gradients */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-[#07080b]/50 to-[#07080b] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />

      {/* Hero Section */}
      <section className="relative z-10 pt-36 md:pt-44 pb-20 px-6 sm:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Eyebrow Micro-pill */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 glass-panel px-4 py-1.5 rounded-full border border-white/10 shadow-2xl mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="text-xs uppercase font-mono tracking-[0.2em] text-white/70">
            Awwwards Standard • $250k Agency Architecture
          </span>
        </motion.div>

        {/* Hero Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight text-white max-w-5xl leading-[1.08]"
        >
          The Architecture of{" "}
          <span className="gold-gradient-text inline-block">Unforgettable</span>{" "}
          Moments.
        </motion.h1>

        {/* Hero Editorial Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-6 text-base sm:text-xl text-white/60 max-w-2xl font-light leading-relaxed"
        >
          Pairing deterministic mathematical certainty for budgets and backwards-planned timelines
          with GenAI-powered creative moodboards for high-discretion celebrations.
        </motion.p>

        {/* CTA Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link
            href="/planner"
            onClick={() => playTactileBlip("swoosh")}
            onMouseEnter={() => playTactileBlip("hover")}
            className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black font-semibold text-sm tracking-wide shadow-2xl hover:shadow-amber-400/30 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <span>Launch Studio Engine</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <a
            href="#universes"
            onClick={() => playTactileBlip("click")}
            onMouseEnter={() => playTactileBlip("hover")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full glass-panel border border-white/10 hover:border-white/20 text-white text-sm font-medium hover:bg-white/5 transition-all duration-300"
          >
            <span>Explore Event Universes</span>
            <ChevronRight className="w-4 h-4 text-white/50" />
          </a>
        </motion.div>

        {/* Real-time Metric Indicators Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl glass-panel border border-white/10 bg-black/40 shadow-2xl backdrop-blur-2xl"
        >
          <div className="flex flex-col items-center justify-center p-3 border-r border-white/5">
            <span className="text-2xl font-bold font-mono text-white">0.00%</span>
            <span className="text-xs text-white/50 font-mono mt-1">Remainder Discrepancy</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 md:border-r border-white/5">
            <span className="text-2xl font-bold font-mono text-amber-300">+20%</span>
            <span className="text-xs text-white/50 font-mono mt-1">Priority Weight Boost</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 border-r border-white/5">
            <span className="text-2xl font-bold font-mono text-emerald-400">100%</span>
            <span className="text-xs text-white/50 font-mono mt-1">Deterministic Dates</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3">
            <span className="text-2xl font-bold font-mono text-purple-400">100KB</span>
            <span className="text-xs text-white/50 font-mono mt-1">Hardened Payload Defense</span>
          </div>
        </motion.div>
      </section>

      {/* Universes Showcase Section */}
      <section id="universes" className="relative z-10 py-24 px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-amber-400 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tailored Worlds</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight">
              Three Distinct Archetypes.
            </h2>
          </div>
          <p className="text-sm text-white/50 max-w-md font-light leading-relaxed">
            Each celebration archetype features dedicated budgeting rules, schedule compression
            benchmarks, and specialized vendor discovery.
          </p>
        </div>

        {/* 3-Column Universe Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {UNIVERSES.map((universe) => (
            <motion.div
              key={universe.id}
              onMouseEnter={() => {
                setActiveUniverse(universe.id);
                playTactileBlip("hover");
              }}
              className={`group relative rounded-3xl p-8 glass-panel border border-white/10 ${universe.borderColor} transition-all duration-500 flex flex-col justify-between overflow-hidden shadow-2xl`}
            >
              {/* Background ambient gradient glow on card hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-b ${universe.bgGradient} opacity-30 group-hover:opacity-70 transition-opacity duration-500 pointer-events-none`}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
                    {universe.tag}
                  </span>
                  <span className="text-xs font-mono text-white/40">From {universe.presetBudget}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2 group-hover:translate-x-1 transition-transform">
                  {universe.title}
                </h3>
                <p className="text-xs font-medium text-white/60 mb-4">{universe.subtitle}</p>
                <p className="text-sm text-white/50 leading-relaxed font-light mb-6">
                  {universe.desc}
                </p>

                {/* Features Pill List */}
                <div className="grid grid-cols-2 gap-2 mb-8">
                  {universe.features.map((feat) => (
                    <div
                      key={feat}
                      className="text-[11px] font-mono text-white/70 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5 flex items-center gap-1.5"
                    >
                      <span className="w-1 h-1 rounded-full bg-white/40" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between">
                <Link
                  href={universe.route}
                  onClick={() => playTactileBlip("click")}
                  className={`text-sm font-semibold tracking-wide ${universe.textColor} flex items-center gap-2 group-hover:gap-3 transition-all`}
                >
                  <span>Explore Architecture</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href={`/planner?type=${universe.id}`}
                  onClick={() => playTactileBlip("swoosh")}
                  className="text-xs font-mono text-white/60 hover:text-white px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Quick Plan
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Engineering Philosophy: Why Deterministic Math Matters */}
      <section className="relative z-10 py-24 px-6 sm:px-12 max-w-7xl mx-auto border-t border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-emerald-400 mb-3">
              <ShieldCheck className="w-4 h-4" />
              <span>Architectural Rigor</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight leading-tight">
              Deterministic Logic Where Money &amp; Dates Are At Stake.
            </h2>
            <p className="mt-6 text-base text-white/60 font-light leading-relaxed">
              Large language models are probabilistic and prone to arithmetic hallucinations and date drift.
              In our engine, all budgets, timelines, and vendor interview requirements are computed
              deterministically in Python. Generative AI is reserved strictly for creative ideation.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300 mt-1">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Zero-Penny Remainder Balance</h4>
                  <p className="text-xs text-white/50 mt-0.5">
                    Every budget item is rounded to 2 decimal places, and any fractional penny discrepancy
                    is reallocated to contingency so total allocations match to the cent.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 mt-1">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Backwards-Planned Timeline Matrix</h4>
                  <p className="text-xs text-white/50 mt-0.5">
                    Calculates due dates back-planned from the event date. If lead time is below industry
                    benchmarks, the engine triggers compressed mode and accelerates critical contracts.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-400/10 border border-purple-400/20 text-purple-300 mt-1">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Strict Prompt Injection Defense</h4>
                  <p className="text-xs text-white/50 mt-0.5">
                    Untrusted notes are isolated within secure XML-delimited envelopes to prevent prompt
                    hijacking, ensuring 100% resilient schema outputs.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Live Blueprint Preview Box */}
          <div className="relative p-8 rounded-3xl glass-panel border border-white/10 bg-black/60 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-white/70">
                  Live Plan Simulation
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                100% Deterministic
              </span>
            </div>

            <div className="py-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Sample Nuptial Budget</span>
                <span className="font-mono text-white font-semibold">₹1,500,000</span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden flex">
                <div className="h-full bg-amber-400" style={{ width: "35%" }} title="Venue 35%" />
                <div className="h-full bg-amber-200" style={{ width: "25%" }} title="Catering 25%" />
                <div className="h-full bg-rose-400" style={{ width: "15%" }} title="Decor 15%" />
                <div className="h-full bg-purple-400" style={{ width: "13%" }} title="Photo 13%" />
                <div className="h-full bg-emerald-400" style={{ width: "12%" }} title="Contingency 12%" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-white/50 pt-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-amber-400" />
                  <span>Venue 35%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-amber-200" />
                  <span>Catering 25%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-emerald-400" />
                  <span>Contingency 12%</span>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/70 font-medium">Compress Timeline Check</span>
                  <span className="text-amber-300 font-mono">180d Benchmark</span>
                </div>
                <p className="text-xs text-white/40">
                  Compressed mode automatically triggers when days remaining &lt; 180, locking venue &amp;
                  catering into the urgent &quot;Now&quot; phase.
                </p>
              </div>
            </div>

            <Link
              href="/planner"
              onClick={() => playTactileBlip("swoosh")}
              className="mt-4 w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold tracking-wider uppercase text-center block transition-colors"
            >
              Open Full Interactive Studio &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Final Grand Call To Action */}
      <section className="relative z-10 py-32 px-6 sm:px-12 max-w-5xl mx-auto text-center">
        <div className="relative p-12 sm:p-16 rounded-3xl glass-panel-gold border border-amber-400/30 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight">
              Ready to Craft an Extraordinary Celebration?
            </h2>
            <p className="mt-4 text-base text-white/70 max-w-xl font-light">
              Enter your parameters, configure priorities, and generate a complete, mathematically
              bulletproof blueprint in seconds.
            </p>

            <Link
              href="/planner"
              onClick={() => playTactileBlip("swoosh")}
              onMouseEnter={() => playTactileBlip("hover")}
              className="mt-8 px-10 py-4 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black font-semibold text-sm tracking-wide shadow-2xl hover:shadow-amber-400/30 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2"
            >
              <span>Launch Event Studio Engine</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
