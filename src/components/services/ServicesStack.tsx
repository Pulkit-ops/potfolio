"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { servicesDetailedData } from "@/data/servicesData";
import ServicesIndex from "./ServicesIndex";
import HTML3DCrumpleStage from "./HTML3DCrumpleStage";
import ServicesMobileMethods from "./ServicesMobileMethods";

export default function ServicesStack() {
  const [activeId, setActiveId] = useState(servicesDetailedData[0].id);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  // Default to true on initial render (both SSR and client) so the DOM tree matches identically
  const [isDesktop, setIsDesktop] = useState(true);

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

  // Stable callback for card-change notifications from the desktop animation engine.
  const handleCardChange = useCallback(
    (idx: number) => {
      if (!isProgrammaticScroll.current && servicesDetailedData[idx]) {
        setActiveId(servicesDetailedData[idx].id);
      }
    },
    []
  );

  // Jump to specific service card smoothly (desktop)
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
      const stickyTop = window.innerWidth >= 1280 ? 96 : 80;

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
    [prefersReducedMotion]
  );

  return (
    <div className="w-full">
      {/* ============================================================== */}
      {/* DESKTOP EXPERIENCE (lg+): STICKY 3D ORIGAMI CRUMPLE STAGE      */}
      {/* ============================================================== */}
      <div className="hidden lg:block w-full">
        <div
          ref={containerRef}
          className="w-full relative h-[400vh]"
        >
          <div
            ref={stageWrapperRef}
            className="sticky top-20 xl:top-24 h-[84vh] min-h-[640px] max-h-[860px] w-full flex flex-col justify-start"
          >
            <div className="flex flex-row items-start gap-8 xl:gap-14 w-full flex-1 min-h-0 relative">
              {/* Left Column: Persistent Index (Desktop Only) */}
              <div className="w-[30%] xl:w-[26%] flex-shrink-0 pt-2">
                <ServicesIndex
                  services={servicesDetailedData}
                  activeId={activeId}
                  onSelect={handleSelectService}
                />
              </div>

              {/* Right Column: 100% Native HTML 3D Crumple & Origami Toss Stage */}
              <div className="w-[70%] xl:w-[74%] h-full relative flex items-center justify-center">
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
      </div>

      {/* ============================================================== */}
      {/* MOBILE EXPERIENCE (<lg): KACHMO METHODS MOBILE STAGE ENGINE   */}
      {/* Zero scroll-hijack, hardware-composited morph & gesture rail   */}
      {/* ============================================================== */}
      <div className="block lg:hidden w-full">
        <ServicesMobileMethods
          services={servicesDetailedData}
          activeId={activeId}
          onSelect={setActiveId}
        />
      </div>
    </div>
  );
}
