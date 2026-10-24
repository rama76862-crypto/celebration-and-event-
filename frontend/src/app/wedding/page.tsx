"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  CheckCircle2,
  Gem,
  Utensils,
  Sun,
  Flame,
} from "lucide-react";
import { playTactileBlip } from "@/lib/utils";

const EventScene = dynamic(() => import("@/components/canvas/EventScene"), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
});

export default function WeddingPage() {
  return (
    <div className="relative min-h-screen bg-[#080608] text-[#f8fafc] overflow-hidden theme-wedding">
      {/* 3D Wedding Scene Canvas */}
      <div className="absolute inset-0 z-0 h-[85vh] pointer-events-none opacity-80">
        <EventScene theme="wedding" />
      </div>

      {/* Atmospheric Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[400px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />

      {/* Hero Header */}
      <section className="relative z-10 pt-36 md:pt-44 pb-20 px-6 sm:px-12 max-w-7xl mx-auto text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 glass-panel-gold px-4 py-1.5 rounded-full border border-amber-400/30 mb-8"
        >
          <Gem className="w-3.5 h-3.5 text-amber-300" />
          <span className="text-xs uppercase font-mono tracking-[0.2em] text-amber-200">
            Haute Nuptials • Royal Choreography
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-display font-bold tracking-tight text-white max-w-4xl"
        >
          Sovereign Nuptials, Curated with{" "}
          <span className="gold-gradient-text inline-block">Mathematical Grace.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-base sm:text-xl text-white/60 max-w-2xl font-light leading-relaxed"
        >
          From the 180-day backwards-planned timeline to strictly segregated Jain &amp; Halal culinary
          standards, our engine orchestrates flawless multi-day wedding celebrations.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link
            href="/planner?type=wedding"
            onClick={() => playTactileBlip("swoosh")}
            onMouseEnter={() => playTactileBlip("hover")}
            className="px-8 py-4 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black font-semibold text-sm tracking-wide shadow-2xl hover:shadow-amber-400/30 hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <span>Plan Royal Wedding</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#protocols"
            onClick={() => playTactileBlip("click")}
            className="px-8 py-4 rounded-full glass-panel border border-white/10 hover:border-amber-400/30 text-white text-sm font-medium transition-all"
          >
            View Nuptial Standards
          </a>
        </motion.div>
      </section>

      {/* Nuptial Standards & Protocols */}
      <section id="protocols" className="relative z-10 py-24 px-6 sm:px-12 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-400">
            Nuptial Architecture
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight mt-2">
            The 4 Gold Standards for Weddings
          </h2>
          <p className="text-sm text-white/50 mt-4 font-light">
            Every wedding calculated by our engine automatically incorporates strict hospitality fail-safes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="p-8 rounded-3xl glass-panel-gold border border-amber-400/20 hover:border-amber-400/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 mb-6">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">180-Day Chrono Benchmark</h3>
              <p className="text-xs text-white/60 leading-relaxed font-light">
                Weddings require at least 6 months of lead time for prime venue banquets. If lead time is
                compressed, contracts accelerate instantly into an urgent &quot;Now&quot; phase.
              </p>
            </div>
            <div className="pt-6 border-t border-white/10 mt-6 flex items-center gap-1.5 text-xs text-amber-300 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Lead Time Compression Matrix</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-3xl glass-panel-gold border border-amber-400/20 hover:border-amber-400/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 mb-6">
                <Utensils className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Strict Dietary Segregation</h3>
              <p className="text-xs text-white/60 leading-relaxed font-light">
                Selecting Jain, Halal, or Vegan automatically injects a +8% catering surcharge to fund
                dedicated kitchenware segregation, verified by mandatory interview questions.
              </p>
            </div>
            <div className="pt-6 border-t border-white/10 mt-6 flex items-center gap-1.5 text-xs text-amber-300 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Cross-Contamination Audit</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-3xl glass-panel-gold border border-amber-400/20 hover:border-amber-400/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 mb-6">
                <Sun className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">10% Mandatory Contingency</h3>
              <p className="text-xs text-white/60 leading-relaxed font-light">
                Weddings have a strictly enforced 10% minimum contingency buffer (12% for outdoor lawns)
                to absorb last-minute headcount additions or weather shelters.
              </p>
            </div>
            <div className="pt-6 border-t border-white/10 mt-6 flex items-center gap-1.5 text-xs text-amber-300 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Enforced Financial Buffer</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-8 rounded-3xl glass-panel-gold border border-amber-400/20 hover:border-amber-400/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 mb-6">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Curfew &amp; Decibel Compliance</h3>
              <p className="text-xs text-white/60 leading-relaxed font-light">
                Auto-generates vendor interview questions regarding municipal sound curfews, DG silent
                generator backup capacities, and flame-retardant fabric certificates.
              </p>
            </div>
            <div className="pt-6 border-t border-white/10 mt-6 flex items-center gap-1.5 text-xs text-amber-300 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Legal Safety Shield</span>
            </div>
          </div>
        </div>
      </section>

      {/* Wedding Run-of-Show Choreography Preview */}
      <section className="relative z-10 py-24 px-6 sm:px-12 max-w-5xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl glass-panel border border-amber-400/30 bg-black/60 shadow-2xl">
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
                Choreographed Order
              </span>
              <h3 className="text-2xl font-display font-bold text-white mt-1">
                Typical Wedding Run-of-Show Schedule
              </h3>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
              12-Hour Production
            </span>
          </div>

          <div className="mt-8 space-y-6">
            <div className="flex items-start gap-4">
              <span className="text-xs font-mono text-amber-300 bg-white/5 px-2.5 py-1 rounded border border-white/10">
                10:00 AM
              </span>
              <div>
                <h4 className="text-sm font-semibold text-white">Bridal Suite Load-in &amp; Floral Staging</h4>
                <p className="text-xs text-white/50 mt-1">
                  Hair &amp; makeup stylists on-site. Mandap / Altar floral installation commences under lighting supervisor.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="text-xs font-mono text-amber-300 bg-white/5 px-2.5 py-1 rounded border border-white/10">
                03:30 PM
              </span>
              <div>
                <h4 className="text-sm font-semibold text-white">Guest Arrival &amp; Welcome Acoustic Ambiance</h4>
                <p className="text-xs text-white/50 mt-1">
                  Signature welcome mocktails, live harp/sitar prelude, and usher briefing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="text-xs font-mono text-amber-300 bg-white/5 px-2.5 py-1 rounded border border-white/10">
                05:00 PM
              </span>
              <div>
                <h4 className="text-sm font-semibold text-white">Sacred Nuptial Rituals &amp; Exchange of Vows</h4>
                <p className="text-xs text-white/50 mt-1">
                  Spotlight focus on ceremony altar with synchronized audio level dampening.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="text-xs font-mono text-amber-300 bg-white/5 px-2.5 py-1 rounded border border-white/10">
                07:30 PM
              </span>
              <div>
                <h4 className="text-sm font-semibold text-white">Grand Reception Banquet Feast &amp; First Dance</h4>
                <p className="text-xs text-white/50 mt-1">
                  Multi-station banquet service opens with dedicated dietary stewards, followed by celebratory speeches.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-white/50">
              Want this customized down to the minute for your specific venue?
            </span>
            <Link
              href="/planner?type=wedding"
              onClick={() => playTactileBlip("swoosh")}
              className="px-6 py-2.5 rounded-full bg-amber-400 text-black text-xs font-semibold tracking-wider uppercase hover:bg-amber-300 transition-colors"
            >
              Generate Custom Wedding Plan &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
