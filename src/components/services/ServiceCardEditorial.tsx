"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { ServiceDetailedItem } from "@/data/servicesData";

interface ServiceCardEditorialProps {
  service: ServiceDetailedItem;
  isActive: boolean;
}

const SPOTLIGHT = 840;

/**
 * Desktop editorial service card (rendered only inside the lg+ crumple stage).
 *
 * The cursor spotlight used to be React state: every mousemove re-rendered the
 * whole card and repainted a card-sized radial gradient. It is now a fixed
 * pre-rendered gradient layer moved with a transform (compositor-only), with
 * hover visibility handled in CSS. The two blur(60–80px) corner blooms were
 * replaced by equivalent radial gradients, so the crumple animation no longer
 * re-rasterises blurred layers every frame.
 */
export default function ServiceCardEditorial({ service, isActive }: ServiceCardEditorialProps) {
  const cardRef = useRef<HTMLElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const rafRef = useRef(0);
  const posRef = useRef({ x: 0, y: 0 });

  const handlePointerEnter = () => {
    rectRef.current = cardRef.current?.getBoundingClientRect() ?? null;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch") return;
    const rect = rectRef.current;
    if (!rect) return;
    posRef.current.x = e.clientX - rect.left - SPOTLIGHT / 2;
    posRef.current.y = e.clientY - rect.top - SPOTLIGHT / 2;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      if (spotRef.current) {
        spotRef.current.style.transform = `translate3d(${posRef.current.x.toFixed(1)}px, ${posRef.current.y.toFixed(1)}px, 0)`;
      }
    });
  };

  return (
    <article
      ref={cardRef}
      id={`service-${service.id}`}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      className={`group/card relative w-full rounded-3xl border transition-[border-color] duration-300 overflow-hidden p-5 sm:p-8 lg:p-8 xl:p-9 lg:h-[690px] flex flex-col justify-between bg-[#0c0e13] ${
        isActive ? "border-white/[0.12]" : "border-white/[0.08]"
      }`}
      style={{
        boxShadow: isActive
          ? "0 32px 80px rgba(0,0,0,0.9), 0 0 0 0.5px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.5)"
          : "0 24px 60px rgba(0,0,0,0.75), 0 0 0 0.5px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {/* Cursor spotlight — warm editorial tint */}
      <div
        ref={spotRef}
        className="pointer-events-none absolute left-0 top-0 rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity duration-500"
        style={{
          width: SPOTLIGHT,
          height: SPOTLIGHT,
          background:
            "radial-gradient(circle closest-side, rgba(229, 29, 36, 0.11), rgba(229,29,36,0.02) 45%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Ambient corner blooms */}
      <div
        className="pointer-events-none absolute -top-72 -right-60 w-[40rem] h-[40rem] rounded-full"
        style={{ background: "radial-gradient(circle closest-side, rgba(229,29,36,0.06), rgba(229,29,36,0.025) 45%, transparent)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-52 -left-44 w-[30rem] h-[30rem] rounded-full"
        style={{ background: "radial-gradient(circle closest-side, rgba(99,102,241,0.04), rgba(99,102,241,0.015) 45%, transparent)" }}
        aria-hidden="true"
      />

      {/* Corner registration brackets */}
      <span className="absolute top-3 left-3 w-4 h-4 border-t-[1.5px] border-l-[1.5px] border-white/20 pointer-events-none rounded-tl-sm" aria-hidden="true" />
      <span className="absolute top-3 right-3 w-4 h-4 border-t-[1.5px] border-r-[1.5px] border-white/20 pointer-events-none rounded-tr-sm" aria-hidden="true" />
      <span className="absolute bottom-3 left-3 w-4 h-4 border-b-[1.5px] border-l-[1.5px] border-white/20 pointer-events-none rounded-bl-sm" aria-hidden="true" />
      <span className="absolute bottom-3 right-3 w-4 h-4 border-b-[1.5px] border-r-[1.5px] border-white/20 pointer-events-none rounded-br-sm" aria-hidden="true" />

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
        <span className="font-mono text-[10px] text-neutral-600 tracking-wider">{service.counter}</span>
      </div>

      {/* Editorial 2-column grid */}
      <div className="grid grid-cols-12 gap-6 xl:gap-8 items-start relative z-10 mt-5 xl:mt-6">
        <div className="col-span-7 flex flex-col justify-between">
          <div>
            <span className="font-mono text-[10px] xl:text-[11px] font-bold uppercase tracking-[0.2em] text-[#e51d24] mb-2 block">
              {service.title}
            </span>
            <h3 className="font-display text-3xl xl:text-[2.85rem] uppercase tracking-wide leading-[0.90] text-white">
              {service.headline}
            </h3>
            <p className="mt-4 text-neutral-400 text-sm leading-relaxed font-normal">{service.tagline}</p>
          </div>

          <div
            className="mt-5 p-4 xl:p-[18px] rounded-xl bg-white/[0.025] border-l-2 border-[#e51d24] border-y border-r border-white/[0.05] hover:border-l-[#ff3b42] hover:bg-white/[0.04] transition-colors duration-300"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-500 block mb-1.5">Perspective</span>
            <p className="text-xs xl:text-sm text-neutral-200 font-medium italic leading-relaxed">
              &ldquo;{service.personalityKicker}&rdquo;
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <span className="font-mono text-[9px] xl:text-[10px] uppercase tracking-[0.18em] text-neutral-600 block mb-3">
              Core Deliverables &amp; Execution
            </span>
            <ul className="flex flex-wrap gap-1.5 xl:gap-2">
              {service.deliverables.map((item, idx) => (
                <li
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.07] text-[11px] font-medium text-neutral-400 hover:border-[#e51d24]/35 hover:bg-white/[0.05] hover:text-neutral-200 transition-colors duration-200 cursor-default"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e51d24] flex-shrink-0" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="col-span-5 h-full flex flex-col">
          <div
            className="w-full aspect-[4/4.5] xl:aspect-[4/5] max-h-[380px] rounded-2xl overflow-hidden border border-white/[0.07] relative group bg-[#06070a]"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)" }}
          >
            <Image
              src={service.image}
              alt={service.imageAlt}
              fill
              sizes="(min-width: 1280px) 420px, 34vw"
              className="object-cover object-center select-none group-hover:scale-[1.04] transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06070a]/85 via-[#06070a]/15 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#06070a]/40 pointer-events-none" />
          </div>
        </div>
      </div>
    </article>
  );
}
