"use client";

import React, { useEffect, useRef } from "react";
import { ServiceDetailedItem } from "@/data/servicesData";

interface ServicesIndexProps {
  services: ServiceDetailedItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

export default function ServicesIndex({
  services,
  activeId,
  onSelect,
}: ServicesIndexProps) {
  const activeIndex = services.findIndex((s) => s.id === activeId);
  const currentNum = activeIndex >= 0 ? services[activeIndex].number : "01";
  const totalNum = String(services.length).padStart(2, "0");

  const asideRef = useRef<HTMLElement>(null);

  // Quick-jump keys (1–N, ↑/↓, j/k). These used to be bound globally at all
  // times — pressing ↓ anywhere on the page (even in the hero, or on phones
  // where this panel is hidden) called preventDefault and teleported the page
  // to the services track. They are now live only while this panel is on
  // screen, and never while typing, with modifiers held, or inside a dialog.
  useEffect(() => {
    const aside = asideRef.current;
    if (!aside) return;
    let inView = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!inView || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.closest("[role='dialog']"))) {
        return;
      }
      if (e.key >= "1" && e.key <= String(services.length)) {
        const target = services[parseInt(e.key, 10) - 1];
        if (target) onSelect(target.id);
      } else if ((e.key === "ArrowDown" || e.key === "j") && activeIndex < services.length - 1) {
        e.preventDefault();
        onSelect(services[activeIndex + 1].id);
      } else if ((e.key === "ArrowUp" || e.key === "k") && activeIndex > 0) {
        e.preventDefault();
        onSelect(services[activeIndex - 1].id);
      }
    };

    const io = new IntersectionObserver((entries) => {
      inView = entries[0].intersectionRatio >= 0.6;
    }, { threshold: [0, 0.6, 1] });
    io.observe(aside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      io.disconnect();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, services, onSelect]);

  return (
    <aside
      ref={asideRef}
      aria-label="Services navigation index"
      className="w-full bg-[#0b0d13] border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/80 select-none"
    >
      {/* Current Position Counter */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
        <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#e51d24]">
          INDEX
        </span>
        <div className="flex items-baseline gap-1 font-mono text-xs text-neutral-400">
          <span className="text-white font-bold text-sm">{currentNum}</span>
          <span>/</span>
          <span>{totalNum}</span>
        </div>
      </div>

      {/* Services Nav List */}
      <nav className="space-y-2">
        {services.map((service) => {
          const isActive = service.id === activeId;
          return (
            <button
              key={service.id}
              onClick={() => onSelect(service.id)}
              className={`w-full text-left px-3.5 py-3 rounded-xl transition-colors duration-300 flex items-center justify-between group ${
                isActive
                  ? "bg-white/[0.08] text-white border border-[#e51d24]/40 shadow-[0_0_20px_rgba(229,29,36,0.15)]"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03] border border-transparent"
              }`}
              type="button"
              aria-current={isActive ? "true" : undefined}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`font-mono text-xs transition-colors ${
                    isActive ? "text-[#e51d24] font-bold" : "text-neutral-500 group-hover:text-neutral-400"
                  }`}
                >
                  {service.number}
                </span>
                <span className="font-mono text-xs tracking-wider uppercase font-medium">
                  {service.indexLabel}
                </span>
              </div>

              {/* Indicator Dot */}
              <span
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-[#e51d24] scale-125 shadow-[0_0_8px_#e51d24]"
                    : "bg-white/20 group-hover:bg-white/40 scale-100"
                }`}
              />
            </button>
          );
        })}
      </nav>

      {/* Keyboard Shortcut Hint */}
      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-neutral-500">
        <span>Quick Jump:</span>
        <div className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-400 text-[10px]">
            1
          </kbd>
          <span>–</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-400 text-[10px]">
            {services.length}
          </kbd>
        </div>
      </div>
    </aside>
  );
}
