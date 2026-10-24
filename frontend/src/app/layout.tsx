import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Syne, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/navigation/Footer";
import SmoothScroll from "@/components/providers/SmoothScroll";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Celebration & Event Studio | World-Class Event Architecture",
  description:
    "An intelligent, context-aware event architecture platform orchestrating deterministic budgets, backwards-planned timelines, and bespoke GenAI ideation for weddings, jubilees, and community summits.",
  keywords: [
    "Event Planner",
    "Wedding Planning",
    "Birthday Planning",
    "Community Event Architecture",
    "Smart Budget Engine",
    "Awwwards Web Design",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} ${syne.variable} ${jetbrains.variable} dark`}>
      <body className="font-sans bg-[#07080b] text-[#f8fafc] antialiased selection:bg-amber-400/30 selection:text-white min-h-screen flex flex-col">
        {/* Cinematic film grain overlay */}
        <div className="grain-overlay" aria-hidden="true" />

        <SmoothScroll>
          <Navbar />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  );
}
