"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { servicesDetailedData } from "@/data/servicesData";
import ServicesIndex from "./ServicesIndex";
import HTML3DCrumpleStage from "./HTML3DCrumpleStage";

export default function ServicesStack() {
  const [activeId, setActiveId] = useState(servicesDetailedData[0].id);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const stageWrapperRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);

  // Viewport tracking (desktop vs mobile)
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop, { passive: true });
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Stable callback for card-change notifications from the animation engine.
  // Must NOT be an inline arrow — that would create a new ref every render,
  // cascading through useCallback/useEffect deps and resetting the RAF loop.
  const handleCardChange = useCallback(
    (idx: number) => {
      if (!isProgrammaticScroll.current) {
        setActiveId(servicesDetailedData[idx].id);
      }
    },
    [] // isProgrammaticScroll is a ref, servicesDetailedData is module-level constant
  );

  // Jump to specific service card smoothly
  const handleSelectService = useCallback(
    (id: string) => {
      const idx = servicesDetailedData.findIndex((s) => s.id === id);
      if (idx === -1) return;

      setActiveId(id);
      const container = containerRef.current;
      const stage = stageWrapperRef.current;
      if (!container || !stage) return;

      isProgrammaticScroll.current = true;
      const rect = container.getBoundingClientRect();
      const stageHeight = stage.offsetHeight;
      const scrollDistance = container.offsetHeight - stageHeight;
      const stickyTop = isDesktop
        ? window.innerWidth >= 1280
          ? 96
          : 80
        : 56;

      const targetScrollProgress = idx / (servicesDetailedData.length - 1);
      const targetY =
        window.scrollY + rect.top - stickyTop + targetScrollProgress * scrollDistance;

      window.scrollTo({
        top: targetY,
        behavior: prefersReducedMotion ? "instant" : "smooth",
      });

      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 700);
    },
    [isDesktop, prefersReducedMotion]
  );

  const activeIndex = servicesDetailedData.findIndex((s) => s.id === activeId);

  return (
    <div
      ref={containerRef}
      className={`w-full relative ${
        isDesktop ? "h-[400vh]" : "h-[340vh]"
      }`}
    >
      {/* Sticky Presentation Stage */}
      <div
        ref={stageWrapperRef}
        className={`sticky ${
          isDesktop
            ? "top-20 xl:top-24 h-[84vh] min-h-[640px] max-h-[860px]"
            : "top-14 sm:top-16 h-[82dvh] min-h-[560px] max-h-[760px]"
        } w-full flex flex-col justify-start`}
      >
        {/* ============================================================== */}
        {/* MOBILE STICKY TRACKER (<lg)                                    */}
        {/* ============================================================== */}
        <div className="block lg:hidden w-full mb-3 flex-shrink-0">
          <div className="bg-[#0b0d13]/90 backdrop-blur-xl border border-white/10 rounded-full px-4 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between shadow-xl shadow-black/80">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs font-bold text-[#e51d24] flex-shrink-0">
                {servicesDetailedData[activeIndex >= 0 ? activeIndex : 0].number}
              </span>
              <span className="font-mono text-xs uppercase font-medium text-white truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none">
                {servicesDetailedData[activeIndex >= 0 ? activeIndex : 0].indexLabel}
              </span>
            </div>

            {/* Quick Tap Dots */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {servicesDetailedData.map((s, idx) => {
                const isSelected = s.id === activeId;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectService(s.id)}
                    aria-label={`Jump to ${s.title}`}
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] transition-all ${
                      isSelected
                        ? "bg-[#e51d24] text-white font-bold scale-110"
                        : "bg-white/10 text-neutral-400 hover:bg-white/20"
                    }`}
                    type="button"
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MAIN LAYOUT: PERSISTENT INDEX (LEFT) + CRUMPLE STAGE (RIGHT)  */}
        {/* ============================================================== */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 xl:gap-14 w-full flex-1 min-h-0 relative">
          {/* Left Column: Persistent Index (Desktop Only) */}
          <div className="hidden lg:block lg:w-[30%] xl:w-[26%] flex-shrink-0 pt-2">
            <ServicesIndex
              services={servicesDetailedData}
              activeId={activeId}
              onSelect={handleSelectService}
            />
          </div>

          {/* Right Column: 100% Native HTML 3D Crumple & Origami Toss Stage */}
          <div className="w-full lg:w-[70%] xl:w-[74%] h-full relative flex items-center justify-center">
            <HTML3DCrumpleStage
              services={servicesDetailedData}
              containerRef={containerRef}
              stageWrapperRef={stageWrapperRef}
              isDesktop={isDesktop}
              prefersReducedMotion={prefersReducedMotion}
              activeId={activeId}
              onCardChange={handleCardChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
