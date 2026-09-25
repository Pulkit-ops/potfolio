"use client";

import React, { useRef, useState } from "react";
import { ServiceDetailedItem } from "@/data/servicesData";

interface ServiceCardEditorialProps {
  service: ServiceDetailedItem;
  isActive: boolean;
  index?: number;
  total?: number;
}

export default function ServiceCardEditorial({
  service,
  isActive,
}: ServiceCardEditorialProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setSpotlightPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <article
      ref={cardRef}
      id={`service-${service.id}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full rounded-3xl border transition-[border-color,background-color] duration-300 overflow-hidden p-5 sm:p-8 lg:p-8 xl:p-9 lg:h-[690px] flex flex-col justify-between ${
        isActive
          ? "border-white/[0.12] bg-[#0c0e13]"
          : "border-white/[0.08] bg-[#0c0e13]"
      }`}
      style={{
        boxShadow: isActive
          ? "0 32px 80px rgba(0,0,0,0.9), 0 0 0 0.5px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.5)"
          : "0 24px 60px rgba(0,0,0,0.75), 0 0 0 0.5px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {/* React Bits Spotlight Cursor Glow — warm editorial tint */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 rounded-3xl"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(circle 420px at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(229, 29, 36, 0.11), rgba(229,29,36,0.02) 45%, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      {/* Subtle Ambient Red Corner Bloom */}
      <div
        className="pointer-events-none absolute -top-32 -right-20 w-96 h-96 rounded-full bg-[#e51d24]/[0.06] blur-[80px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-indigo-500/[0.04] blur-[60px]"
        aria-hidden="true"
      />

      {/* Corner registration brackets — wider arms for editorial feel */}
      <span
        className="absolute top-3 left-3 w-4 h-4 border-t-[1.5px] border-l-[1.5px] border-white/20 pointer-events-none rounded-tl-sm"
        aria-hidden="true"
      />
      <span
        className="absolute top-3 right-3 w-4 h-4 border-t-[1.5px] border-r-[1.5px] border-white/20 pointer-events-none rounded-tr-sm"
        aria-hidden="true"
      />
      <span
        className="absolute bottom-3 left-3 w-4 h-4 border-b-[1.5px] border-l-[1.5px] border-white/20 pointer-events-none rounded-bl-sm"
        aria-hidden="true"
      />
      <span
        className="absolute bottom-3 right-3 w-4 h-4 border-b-[1.5px] border-r-[1.5px] border-white/20 pointer-events-none rounded-br-sm"
        aria-hidden="true"
      />

      {/* Header Row: Number + Badge + Sequence Counter */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 lg:pb-5 border-b border-white/[0.07] relative z-10">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <span className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-md bg-[#e51d24]/15 border border-[#e51d24]/30 text-[#ff5459] tracking-wide">
            {service.number}
          </span>
          <span className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-500">
            {service.badge}
          </span>
        </div>
        <span className="font-mono text-[10px] text-neutral-600 tracking-wider">
          {service.counter}
        </span>
      </div>

      {/* ============================================================ */}
      {/* MOBILE COMPACT VIEW (<lg): STREAMLINED, FAST TO READ        */}
      {/* ============================================================ */}
      <div className="block lg:hidden mt-3 sm:mt-5 relative z-10 space-y-3">
        {/* Category + Headline */}
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#e51d24] block mb-1.5">
            {service.title}
          </span>
          <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wide leading-[0.9] text-white">
            {service.headline}
          </h3>
        </div>

        {/* Compact Visual Banner */}
        <div className="w-full aspect-[16/8] sm:aspect-[16/9] max-h-[155px] rounded-xl overflow-hidden border border-white/[0.08] relative shadow-xl bg-[#06070a]">
          <img
            src={service.image}
            alt={service.imageAlt}
            className="w-full h-full object-cover object-center select-none"
            loading="lazy"
          />
          {/* Multi-stop film vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#08090b]/90 via-[#08090b]/10 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#08090b]/30 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Description & Inline Accent Quote */}
        <div className="space-y-2">
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-normal">
            {service.tagline}
          </p>
          <p className="text-[11px] sm:text-xs text-neutral-300 italic border-l-2 border-[#e51d24] pl-2.5 py-0.5 font-medium">
            &ldquo;{service.personalityKicker}&rdquo;
          </p>
        </div>

        {/* Compact Deliverables Tags */}
        <div className="pt-2 border-t border-white/[0.05]">
          <div className="flex flex-wrap gap-1.5">
            {service.deliverables.slice(0, 4).map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] font-medium text-neutral-400"
              >
                <span className="w-1 h-1 rounded-full bg-[#e51d24] flex-shrink-0" />
                <span>{item}</span>
              </span>
            ))}
            {service.deliverables.length > 4 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-white/[0.03] text-[10px] font-mono text-neutral-500">
                +{service.deliverables.length - 4} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* DESKTOP EDITORIAL VIEW (lg+): EXPANSIVE 2-COLUMN GRID        */}
      {/* ============================================================ */}
      <div className="hidden lg:grid grid-cols-12 gap-6 xl:gap-8 items-start relative z-10 mt-5 xl:mt-6">
        {/* Left Column: Headlines & Content (~7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <span className="font-mono text-[10px] xl:text-[11px] font-bold uppercase tracking-[0.2em] text-[#e51d24] mb-2 block">
              {service.title}
            </span>
            <h2 className="font-display text-3xl xl:text-[2.85rem] uppercase tracking-wide leading-[0.90] text-white">
              {service.headline}
            </h2>

            <p className="mt-4 text-neutral-400 text-sm leading-relaxed font-normal">
              {service.tagline}
            </p>
          </div>

          {/* Personality Kicker Quote Box — premium editorial pull-quote */}
          <div className="mt-5 p-4 xl:p-[18px] rounded-xl bg-white/[0.025] border-l-2 border-[#e51d24] border-y border-r border-white/[0.05] hover:border-l-[#ff3b42] hover:bg-white/[0.04] transition-all duration-400 group"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-500 block mb-1.5">Perspective</span>
            <p className="text-xs xl:text-sm text-neutral-200 font-medium italic leading-relaxed">
              &ldquo;{service.personalityKicker}&rdquo;
            </p>
          </div>

          {/* Deliverables Area */}
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <span className="font-mono text-[9px] xl:text-[10px] uppercase tracking-[0.18em] text-neutral-600 block mb-3">
              Core Deliverables &amp; Execution
            </span>
            <div className="flex flex-wrap gap-1.5 xl:gap-2">
              {service.deliverables.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.07] text-[11px] font-medium text-neutral-400 hover:border-[#e51d24]/35 hover:bg-white/[0.05] hover:text-neutral-200 transition-all duration-200 cursor-default"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e51d24] flex-shrink-0" />
                  <span>{item}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Visual Composition (~5 cols) */}
        <div className="lg:col-span-5 h-full flex flex-col">
          <div
            className="w-full aspect-square lg:aspect-[4/4.5] xl:aspect-[4/5] max-h-[380px] rounded-2xl overflow-hidden border border-white/[0.07] relative group bg-[#06070a]"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)" }}
          >
            <img
              src={service.image}
              alt={service.imageAlt}
              className="w-full h-full object-cover object-center select-none group-hover:scale-[1.04] transition-transform duration-700 ease-out"
              loading="lazy"
            />
            {/* Multi-stop film tone vignette for editorial depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#06070a]/85 via-[#06070a]/15 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#06070a]/40 pointer-events-none" />
            {/* Subtle inner border glow on hover */}
            <div className="absolute inset-0 rounded-2xl ring-inset ring-1 ring-white/0 group-hover:ring-white/[0.06] transition-all duration-500 pointer-events-none" />
          </div>
        </div>
      </div>
    </article>
  );
}
