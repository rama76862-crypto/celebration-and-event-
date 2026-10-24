"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, ArrowUpRight, ShieldCheck, Heart } from "lucide-react";
import { wakeBackend } from "@/lib/api";
import { playTactileBlip } from "@/lib/utils";

export default function Footer() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    void wakeBackend().then(setApiOnline);
  }, []);

  return (
    <footer className="relative border-t border-white/10 bg-black/60 backdrop-blur-2xl text-white/70 overflow-hidden pt-20 pb-12">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-white/5">
          {/* Brand Manifesto */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <span className="text-white font-semibold tracking-wider text-base">
                CELEBRATION &amp; EVENT STUDIO
              </span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed max-w-sm">
              The $250,000 event architecture suite. Deterministic mathematical rigor for finance and
              timelines, paired with bespoke GenAI creative ideation for weddings, jubilees, and community summits.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  apiOnline === true
                    ? "bg-emerald-400 animate-pulse"
                    : apiOnline === false
                    ? "bg-amber-400"
                    : "bg-white/20"
                }`}
              />
              <span className="text-xs font-mono text-white/40">
                {apiOnline === true
                  ? "FastAPI Neural Orchestrator Connected"
                  : "Client Deterministic Architecture Active"}
              </span>
            </div>
          </div>

          {/* Event Universes */}
          <div className="md:col-span-3 flex flex-col gap-3">
            <span className="text-xs uppercase font-mono tracking-widest text-white/40">
              Event Universes
            </span>
            <Link
              href="/wedding"
              onClick={() => playTactileBlip("click")}
              className="text-sm text-white/70 hover:text-amber-200 transition-colors flex items-center justify-between group"
            >
              <span>Haute Nuptials</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              href="/birthday"
              onClick={() => playTactileBlip("click")}
              className="text-sm text-white/70 hover:text-purple-300 transition-colors flex items-center justify-between group"
            >
              <span>Cyber Jubilee</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              href="/community"
              onClick={() => playTactileBlip("click")}
              className="text-sm text-white/70 hover:text-emerald-300 transition-colors flex items-center justify-between group"
            >
              <span>Terra Collective</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              href="/planner"
              onClick={() => playTactileBlip("click")}
              className="text-sm text-amber-300 hover:text-amber-200 font-medium transition-colors flex items-center justify-between group"
            >
              <span>Launch Studio Engine</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>

          {/* Technical Prowess & Architectural Standards */}
          <div className="md:col-span-4 flex flex-col gap-3">
            <span className="text-xs uppercase font-mono tracking-widest text-white/40">
              Architectural Standard
            </span>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero-Penny Remainder Arithmetic (100% Deterministic)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Backwards-Planned Timeline with Dynamic Compression</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Strict Dietary Cookware Isolation Protocol</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Sanitized Delimited Prompt Injection Defense</span>
            </div>
          </div>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40 font-mono">
          <p>© {new Date().getFullYear()} Celebration &amp; Event Studio. Crafted for extraordinary moments.</p>
          <div className="flex items-center gap-1 text-white/40">
            <span>Built with intentional precision &amp;</span>
            <Heart className="w-3.5 h-3.5 text-rose-400 inline" />
          </div>
        </div>
      </div>
    </footer>
  );
}
