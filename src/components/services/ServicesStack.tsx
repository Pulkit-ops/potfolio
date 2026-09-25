"use client";

import React, { useState, useRef, useCallback } from "react";
import { servicesDetailedData } from "@/data/servicesData";
import ServicesIndex from "./ServicesIndex";
import HTML3DCrumpleStage from "./HTML3DCrumpleStage";
import ServicesMobileMethods from "./ServicesMobileMethods";

export default function ServicesStack() {
  const [activeId, setActiveId] = useState(servicesDetailedData[0].id);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageWrapperRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);

  // Card-change notifications from the desktop animation engine.
  const handleCardChange = useCallback((idx: number) => {
    if (!isProgrammaticScroll.current && servicesDetailedData[idx]) {
      setActiveId(servicesDetailedData[idx].id);
    }
  }, []);

  // Jump to a specific service card (desktop index / keyboard).
  const handleSelectService = useCallback((id: string) => {
    const idx = servicesDetailedData.findIndex((s) => s.id === id);
    if (idx === -1) return;

    setActiveId(id);
    const container = containerRef.current;
    const stage = stageWrapperRef.current;
    if (!container || !stage) return;

    isProgrammaticScroll.current = true;
    const rect = container.getBoundingClientRect();
    const scrollDistance = container.offsetHeight - stage.offsetHeight;
    const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
    const targetY =
      window.scrollY + rect.top - stickyTop + (idx / (servicesDetailedData.length - 1)) * scrollDistance;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({ top: targetY, behavior: reduced ? "auto" : "smooth" });
    window.setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 700);
  }, []);

  return (
    <div className="w-full">
      {/* DESKTOP (lg+): sticky 3D crumple stage */}
      <div className="hidden lg:block w-full">
        <div ref={containerRef} className="w-full relative h-[400vh]">
          <div
            ref={stageWrapperRef}
            className="sticky top-20 xl:top-24 h-[84vh] min-h-[640px] max-h-[860px] w-full flex flex-col justify-start"
          >
            <div className="flex flex-row items-start gap-8 xl:gap-14 w-full flex-1 min-h-0 relative">
              <div className="w-[30%] xl:w-[26%] flex-shrink-0 pt-2">
                <ServicesIndex services={servicesDetailedData} activeId={activeId} onSelect={handleSelectService} />
              </div>
              <div className="w-[70%] xl:w-[74%] h-full relative flex items-center justify-center">
                <HTML3DCrumpleStage
                  services={servicesDetailedData}
                  containerRef={containerRef}
                  stageWrapperRef={stageWrapperRef}
                  activeId={activeId}
                  onCardChange={handleCardChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE (<lg): sticky stage switcher, no scroll hijack */}
      <div className="block lg:hidden w-full">
        <ServicesMobileMethods services={servicesDetailedData} activeId={activeId} onSelect={setActiveId} />
      </div>
    </div>
  );
}
