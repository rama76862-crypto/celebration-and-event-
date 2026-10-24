"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Compass,
  Tent,
  Zap,
  CheckCircle2,
  FileText,
  VolumeX,
} from "lucide-react";
import { playTactileBlip } from "@/lib/utils";

const EventScene = dynamic(() => import("@/components/canvas/EventScene"), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
});

export default function CommunityPage() {
  return (
    <div className="relative min-h-screen bg-[#040d08] text-[#f8fafc] overflow-hidden theme-community">
      {/* 3D Community Scene Canvas */}
      <div className="absolute inset-0 z-0 h-[85vh] pointer-events-none opacity-80">
        <EventScene theme="community" />
      </div>

      {/* Atmospheric Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[400px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />

      {/* Hero Header */}
      <section className="relative z-10 pt-36 md:pt-44 pb-20 px-6 sm:px-12 max-w-7xl mx-auto text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 glass-panel-emerald px-4 py-1.5 rounded-full border border-emerald-400/30 mb-8"
        >
          <Compass className="w-3.5 h-3.5 text-emerald-300" />
          <span className="text-xs uppercase font-mono tracking-[0.2em] text-emerald-200">
            Terra Collective • Civic Gatherings
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-display font-bold tracking-tight text-white max-w-4xl"
        >
          Public Summits &amp; Festivals, Built on{" "}
          <span className="emerald-gradient-text inline-block">Civic Precision.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-base sm:text-xl text-white/60 max-w-2xl font-light leading-relaxed"
        >
          Navigating municipal fire marshals, tent wind-load engineering, silent generator capacity,
          and crowd throughput buffers for gatherings of 100 to 1,000+ citizens.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link
            href="/planner?type=community"
            onClick={() => playTactileBlip("swoosh")}
            onMouseEnter={() => playTactileBlip("hover")}
            className="px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 text-black font-semibold text-sm tracking-wide shadow-2xl hover:shadow-emerald-500/30 hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <span>Plan Community Gathering</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#civic-protocols"
            onClick={() => playTactileBlip("click")}
            className="px-8 py-4 rounded-full glass-panel border border-white/10 hover:border-emerald-400/30 text-white text-sm font-medium transition-all"
          >
            View Municipal Protocols
          </a>
        </motion.div>
      </section>

      {/* Civic Protocols */}
      <section id="civic-protocols" className="relative z-10 py-24 px-6 sm:px-12 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-emerald-400">
            Logistical Infrastructure
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight mt-2">
            Engineered for Safety &amp; Scale
          </h2>
          <p className="text-sm text-white/50 mt-4 font-light">
            Public gatherings carry municipal liability. Our engine guarantees required documents and vendor checks are met.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl glass-panel-emerald border border-emerald-400/20 hover:border-emerald-400/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 mb-6">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Permits &amp; Municipal Clearances</h3>
              <p className="text-xs text-white/60 leading-relaxed font-light">
                Auto-generates verification for park authority sound variance waivers, fire marshal
                inspections, commercial general liability policies, and emergency egress routing.
              </p>
            </div>
            <div className="pt-6 border-t border-white/10 mt-6 flex items-center gap-1.5 text-xs text-emerald-300 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Municipal Compliance Check</span>
            </div>
          </div>

          <div className="p-8 rounded-3xl glass-panel-emerald border border-emerald-400/20 hover:border-emerald-400/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-teal-400/20 border border-teal-400/30 flex items-center justify-center text-teal-300 mb-6">
                <Tent className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Outdoor Weather Shelters</h3>
              <p className="text-xs text-white/60 leading-relaxed font-light">
                Outdoor festivals automatically reserve emergency shelter buffers. Vendors are audited for
                wind-load ratings, ground ballast weights, and flame-retardant vinyl certifications.
              </p>
            </div>
            <div className="pt-6 border-t border-white/10 mt-6 flex items-center gap-1.5 text-xs text-teal-300 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Weather Contingency Shield</span>
            </div>
          </div>

          <div className="p-8 rounded-3xl glass-panel-emerald border border-emerald-400/20 hover:border-emerald-400/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 mb-6">
                <VolumeX className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Silent Power Generators</h3>
              <p className="text-xs text-white/60 leading-relaxed font-light">
                Community staging requires acoustic separation from noisy industrial generators.
                Our vendor playbook mandates acoustic canopy enclosures and grounded 3-phase distribution boxes.
              </p>
            </div>
            <div className="pt-6 border-t border-white/10 mt-6 flex items-center gap-1.5 text-xs text-amber-300 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Silent Generator Standard</span>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-stage Coordination Callout */}
      <section className="relative z-10 py-24 px-6 sm:px-12 max-w-4xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl glass-panel border border-emerald-400/30 bg-black/70 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-widest mb-2">
              <Zap className="w-4 h-4" />
              <span>Civic Orchestration</span>
            </div>
            <h3 className="text-2xl font-display font-bold text-white">
              60-Day Community Lead Benchmark
            </h3>
            <p className="text-xs text-white/60 mt-2 font-light max-w-lg leading-relaxed">
              If days remaining are under 60 days, critical permit filings and pavilion leases are
              compressed into the urgent &quot;Now&quot; phase to avoid municipal rejection.
            </p>
          </div>

          <Link
            href="/planner?type=community"
            onClick={() => playTactileBlip("swoosh")}
            className="whitespace-nowrap px-8 py-3.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-black text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            Launch Community Studio
          </Link>
        </div>
      </section>
    </div>
  );
}
