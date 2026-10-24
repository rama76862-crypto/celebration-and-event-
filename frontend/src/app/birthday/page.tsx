"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Music,
  Cake,
  Users,
  CheckCircle2,
  Volume2,
  Zap,
} from "lucide-react";
import { playTactileBlip } from "@/lib/utils";

const EventScene = dynamic(() => import("@/components/canvas/EventScene"), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
});

export default function BirthdayPage() {
  return (
    <div className="relative min-h-screen bg-[#07040d] text-[#f8fafc] overflow-hidden theme-birthday">
      {/* 3D Birthday Scene Canvas */}
      <div className="absolute inset-0 z-0 h-[85vh] pointer-events-none opacity-80">
        <EventScene theme="birthday" />
      </div>

      {/* Atmospheric Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[400px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />

      {/* Hero Header */}
      <section className="relative z-10 pt-36 md:pt-44 pb-20 px-6 sm:px-12 max-w-7xl mx-auto text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 glass-panel-neon px-4 py-1.5 rounded-full border border-purple-400/30 mb-8"
        >
          <Zap className="w-3.5 h-3.5 text-purple-300" />
          <span className="text-xs uppercase font-mono tracking-[0.2em] text-purple-200">
            Cyber Jubilee • Velvet Celebrations
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-display font-bold tracking-tight text-white max-w-4xl"
        >
          Milestone Birthdays, Engineered with{" "}
          <span className="cyber-gradient-text inline-block">High Fidelity.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-base sm:text-xl text-white/60 max-w-2xl font-light leading-relaxed"
        >
          From vibrant first birthdays with verified entertainer background clearances to lavish 50th
          golden jubilees with world-class DJ acoustics and custom cake reveal choreography.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link
            href="/planner?type=birthday"
            onClick={() => playTactileBlip("swoosh")}
            onMouseEnter={() => playTactileBlip("hover")}
            className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white font-semibold text-sm tracking-wide shadow-2xl hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <span>Plan Birthday Jubilee</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#demographics"
            onClick={() => playTactileBlip("click")}
            className="px-8 py-4 rounded-full glass-panel border border-white/10 hover:border-purple-400/30 text-white text-sm font-medium transition-all"
          >
            Explore Milestone Profiles
          </a>
        </motion.div>
      </section>

      {/* Birthday Pillars */}
      <section id="demographics" className="relative z-10 py-24 px-6 sm:px-12 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-purple-400">
            Targeted Architecture
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight mt-2">
            Engineered Across Every Milestone
          </h2>
          <p className="text-sm text-white/50 mt-4 font-light">
            Our planner automatically pivots entertainment, safety checklists, and budget weights based on your demographic.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl glass-panel-neon border border-purple-400/20 hover:border-purple-400/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-purple-400/20 border border-purple-400/30 flex items-center justify-center text-purple-300 mb-6">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Kids &amp; Family Celebrations</h3>
              <p className="text-xs text-white/60 leading-relaxed font-light">
                Entertainment budgets are weighted towards verified magicians, inflatable safety inspections,
                and allergy-conscious cake bakers. All vendor questionnaires require mandatory child safety background records.
              </p>
            </div>
            <div className="pt-6 border-t border-white/10 mt-6 flex items-center gap-1.5 text-xs text-purple-300 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Background Safety Verification</span>
            </div>
          </div>

          <div className="p-8 rounded-3xl glass-panel-neon border border-purple-400/20 hover:border-purple-400/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-pink-400/20 border border-pink-400/30 flex items-center justify-center text-pink-300 mb-6">
                <Volume2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Young Adult &amp; 21st Euphoria</h3>
              <p className="text-xs text-white/60 leading-relaxed font-light">
                High-fidelity sound, dynamic lighting truss, interactive photobooths, and signature craft mocktails/cocktails.
                Automatic decibel audits prevent venue sound fines.
              </p>
            </div>
            <div className="pt-6 border-t border-white/10 mt-6 flex items-center gap-1.5 text-xs text-pink-300 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Acoustic Threshold Optimizer</span>
            </div>
          </div>

          <div className="p-8 rounded-3xl glass-panel-neon border border-purple-400/20 hover:border-purple-400/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-cyan-400/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 mb-6">
                <Cake className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">30th, 40th &amp; Golden Jubilees</h3>
              <p className="text-xs text-white/60 leading-relaxed font-light">
                Sophisticated velvet lounge environments, intimate multi-course culinary tasting menus, retrospective
                video toasts, and live jazz or acoustic duos.
              </p>
            </div>
            <div className="pt-6 border-t border-white/10 mt-6 flex items-center gap-1.5 text-xs text-cyan-300 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Curated Fine Dining &amp; Lounge</span>
            </div>
          </div>
        </div>
      </section>

      {/* Entertainment Threshold Callout */}
      <section className="relative z-10 py-24 px-6 sm:px-12 max-w-4xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl glass-panel border border-purple-400/30 bg-black/70 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-widest mb-2">
              <Music className="w-4 h-4" />
              <span>Smart Feasibility Filter</span>
            </div>
            <h3 className="text-2xl font-display font-bold text-white">
              Dynamic Entertainment Thresholds
            </h3>
            <p className="text-xs text-white/60 mt-2 font-light max-w-lg leading-relaxed">
              If allocated music funds are below ₹15,000 / $200, the engine skips expensive live bands and
              proposes high-fidelity speaker rentals with custom Spotify digital playlist curation to protect your budget.
            </p>
          </div>

          <Link
            href="/planner?type=birthday"
            onClick={() => playTactileBlip("swoosh")}
            className="whitespace-nowrap px-8 py-3.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            Launch Birthday Engine
          </Link>
        </div>
      </section>
    </div>
  );
}
