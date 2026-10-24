"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Volume2, VolumeX, Menu, X, ArrowUpRight } from "lucide-react";
import { playTactileBlip, toggleSoundState, isSoundEnabled } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Studio", href: "/" },
  { label: "Wedding", href: "/wedding", badge: "Royal" },
  { label: "Birthday", href: "/birthday", badge: "Neon" },
  { label: "Community", href: "/community", badge: "Civic" },
  { label: "Interactive Planner", href: "/planner", highlight: true },
];

export default function Navbar() {
  const pathname = usePathname();
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleToggleSound = () => {
    const newState = toggleSoundState();
    setSoundOn(newState);
    if (newState) {
      playTactileBlip("success");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-8 pt-4 pb-2 pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Monogram */}
        <Link
          href="/"
          onClick={() => playTactileBlip("click")}
          onMouseEnter={() => playTactileBlip("hover")}
          className="pointer-events-auto group flex items-center gap-3 glass-panel px-4 py-2.5 rounded-full border border-white/10 hover:border-amber-400/40 transition-all duration-300 shadow-2xl backdrop-blur-xl"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500/20 via-white/10 to-transparent flex items-center justify-center border border-amber-400/30 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.22em] text-white/50 font-medium font-mono">
              Celebration
            </span>
            <span className="text-sm font-semibold tracking-wide text-white group-hover:text-amber-200 transition-colors">
              Event Studio
            </span>
          </div>
        </Link>

        {/* Desktop Floating Pill Navigation */}
        <nav
          className={`hidden md:flex items-center gap-1 glass-panel px-3 py-1.5 rounded-full border transition-all duration-300 pointer-events-auto ${
            scrolled ? "border-white/15 bg-black/70 shadow-2xl" : "border-white/10 bg-black/40"
          }`}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => playTactileBlip("click")}
                onMouseEnter={() => playTactileBlip("hover")}
                className={`relative px-4 py-2 text-xs font-medium tracking-wide rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? "text-white shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                } ${item.highlight && !isActive ? "text-amber-300 font-semibold" : ""}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-active-pill"
                    className="absolute inset-0 bg-gradient-to-r from-white/15 to-white/5 border border-white/20 rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
                {item.badge && (
                  <span
                    className={`relative z-10 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full font-mono ${
                      item.badge === "Royal"
                        ? "bg-amber-400/20 text-amber-200 border border-amber-400/30"
                        : item.badge === "Neon"
                        ? "bg-purple-500/20 text-purple-200 border border-purple-500/30"
                        : "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.highlight && !isActive && (
                  <span className="relative z-10 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Utility Actions */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Synthesized Audio Haptic Sound Button */}
          <button
            onClick={handleToggleSound}
            onMouseEnter={() => playTactileBlip("hover")}
            title={soundOn ? "Haptic audio active (click to mute)" : "Enable tactile haptic audio"}
            className="flex items-center gap-2 glass-panel px-3 py-2 rounded-full border border-white/10 hover:border-amber-400/30 text-white/70 hover:text-white transition-all duration-200"
            aria-label="Toggle haptic audio"
          >
            {soundOn ? (
              <>
                <Volume2 className="w-4 h-4 text-amber-400" />
                <div className="hidden sm:flex items-center gap-0.5 h-3">
                  <span className="w-0.5 h-3 bg-amber-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-0.5 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-0.5 h-3.5 bg-amber-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </>
            ) : (
              <VolumeX className="w-4 h-4 text-white/40" />
            )}
          </button>

          {/* Direct CTA */}
          <Link
            href="/planner"
            onClick={() => playTactileBlip("swoosh")}
            onMouseEnter={() => playTactileBlip("hover")}
            className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black text-xs font-semibold tracking-wide px-4 py-2.5 rounded-full shadow-lg hover:shadow-amber-400/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <span>Launch Engine</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => {
              playTactileBlip("click");
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="md:hidden glass-panel p-2.5 rounded-full border border-white/10 text-white/80 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="pointer-events-auto md:hidden mt-3 mx-auto max-w-sm glass-panel p-4 rounded-2xl border border-white/15 bg-black/90 backdrop-blur-2xl shadow-2xl flex flex-col gap-2"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  playTactileBlip("click");
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium ${
                  pathname === item.href
                    ? "bg-white/10 text-white border border-white/10"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-white/60">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
