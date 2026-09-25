import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import ServicesStack from "@/components/services/ServicesStack";
import ContactTriggerButton from "@/components/contact/ContactTriggerButton";

export const metadata: Metadata = {
  title: "What I Actually Do | Pulkit Maheshwari",
  description:
    "Short-form video, audience-first social management, distinctive creative direction, and full social presence. Crafted for thumb-stopping retention.",
};

export default function ServicesPage() {
  return (
    <div className="w-full min-h-screen bg-[#08090b] text-[#f5f6f8] pt-16 sm:pt-24 lg:pt-28 pb-24 sm:pb-32">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16">
        {/* Minimalist Top Back Bar */}
        <div className="flex items-center justify-between pb-8 mb-12 border-b border-white/10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono font-medium text-neutral-400 hover:text-white active:scale-95 transition-all group py-1 focus-visible:outline-none focus-visible:underline"
          >
            <span className="text-[#e51d24] group-hover:-translate-x-1.5 transition-transform duration-200 font-bold">
              ←
            </span>
            <span>BACK TO HOME</span>
          </Link>

          <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] sm:text-[11px] font-mono text-emerald-400 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden xs:inline">Available for Select Sprints</span>
              <span className="xs:hidden">Available</span>
            </span>
          </div>
        </div>

        {/* Page Introductory Header */}
        <header className="max-w-4xl mb-10 sm:mb-24">
          <h1 className="font-display text-[2.5rem] sm:text-6xl lg:text-8xl 2xl:text-9xl uppercase tracking-wide leading-[0.94] text-white">
            <span className="block">WHAT I</span>
            <span className="block mt-1 sm:mt-2 text-white">ACTUALLY DO.</span>
          </h1>

          <p className="mt-8 text-lg sm:text-xl text-neutral-300 font-normal leading-relaxed max-w-2xl">
            Good content isn&apos;t just something you post to feed an algorithm. It&apos;s
            something people genuinely stop their thumb for, remember, and talk
            about. Here is how we build it together.
          </p>
        </header>

        {/* Interactive Services Scroll Stack */}
        <section aria-label="Interactive services list" className="w-full mb-16 sm:mb-32">
          <ServicesStack />
        </section>

        {/* Conversational & Confident CTA Banner */}
        <section
          id="cta"
          aria-label="Contact call to action"
          className="relative w-full p-7 sm:p-16 lg:p-20 rounded-3xl bg-gradient-to-b from-[#12151e] to-[#0a0c10] border border-white/10 text-center flex flex-col items-center overflow-hidden shadow-2xl shadow-black/80"
        >
          {/* Subtle Ambient Red Glow */}
          <div
            className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[#e51d24]/10 blur-3xl"
            aria-hidden="true"
          />

          <h2 className="font-display text-[2rem] sm:text-5xl lg:text-7xl uppercase tracking-wide leading-[1.05] sm:leading-[0.94] text-white max-w-3xl mb-6 relative z-10">
            <span className="block">THINK WE&apos;D MAKE</span>
            <span className="block mt-1.5 sm:mt-2 text-[#e51d24]">GOOD WORK TOGETHER?</span>
          </h2>

          <p className="text-sm sm:text-base text-neutral-300 max-w-xl leading-relaxed mb-10 relative z-10 font-normal">
            Currently accepting select new projects for channel growth, video
            sprints, and creative direction. No 40-page corporate decks — just
            good ideas, high-retention video, and content people actually want to
            watch.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
            <ContactTriggerButton />
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-full bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.97] border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e51d24]/60"
            >
              <span>EXPLORE HOMEPAGE</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
