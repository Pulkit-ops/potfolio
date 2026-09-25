"use client";

import React, { useRef, useEffect, useState, useCallback, memo } from "react";
import Link from "next/link";
import Image from "next/image";

export interface FlowingMenuItemData {
  link?: string;
  text?: string;
  image: string;
  value?: string;
  accent?: string;
  label?: string;
  index?: string;
  tag?: string;
  marqueeText?: string;
  marqueeBgColor?: string;
  marqueeTextColor?: string;
}

export interface FlowingMenuProps {
  items?: FlowingMenuItemData[];
  /** Seconds per marquee loop. */
  speed?: number;
  textColor?: string;
  bgColor?: string;
  marqueeBgColor?: string;
  marqueeTextColor?: string;
  borderColor?: string;
  className?: string;
}

type Edge = "top" | "bottom";

// power3.out, the curve the GSAP version used.
const EASE = "cubic-bezier(0.215, 0.61, 0.355, 1)";
const DURATION = 420;

/**
 * Direction-aware marquee rows.
 *
 * Previously: GSAP (≈70 KB) for one hover effect, a padding transition on hover
 * that re-laid-out the entire page below (on mobile it fired from the scroll
 * handler, so content jumped mid-scroll), a `backdrop-filter` pill inside a
 * moving layer, full-size photos as CSS backgrounds for 44px capsules, and a
 * scroll listener that ran for the whole page on phones.
 *
 * Now: WAAPI for the edge reveal, a CSS keyframe loop for the marquee (paused
 * unless the row is open), fixed row height, and an IntersectionObserver-gated
 * scroll listener that only runs while the strip is on screen.
 */
export default function FlowingMenu({
  items = [],
  speed = 18,
  textColor = "#ffffff",
  bgColor = "transparent",
  marqueeBgColor = "#e51d24",
  marqueeTextColor = "#ffffff",
  borderColor = "rgba(255, 255, 255, 0.08)",
  className = "",
}: FlowingMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeMobileIndex, setActiveMobileIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const scrollDirRef = useRef<Edge>("bottom");
  const manualTapRef = useRef(false);
  const manualTapScrollYRef = useRef(0);

  useEffect(() => {
    // Touch-first or narrow screens use scroll-focus instead of hover.
    const mq = window.matchMedia("(max-width: 1023px), (hover: none) and (pointer: coarse)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!isMobile || !container) {
      setActiveMobileIndex(null);
      return;
    }

    let raf = 0;
    let lastY = window.scrollY;

    const check = () => {
      raf = 0;
      const y = window.scrollY;
      if (y !== lastY) scrollDirRef.current = y > lastY ? "bottom" : "top";
      lastY = y;

      if (manualTapRef.current) {
        if (Math.abs(y - manualTapScrollYRef.current) < 50) return;
        manualTapRef.current = false;
      }

      const vh = window.innerHeight;
      const centerY = vh / 2;
      let closest: number | null = null;
      let min = Infinity;
      itemRefs.current.forEach((el, idx) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dist = Math.abs(r.top + r.height / 2 - centerY);
        if (dist < vh * 0.42 && dist < min) {
          min = dist;
          closest = idx;
        }
      });
      setActiveMobileIndex(closest);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };

    let attached = false;
    const io = new IntersectionObserver((entries) => {
      const on = entries[0].isIntersecting;
      if (on === attached) return;
      attached = on;
      if (on) {
        lastY = window.scrollY;
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
      } else {
        window.removeEventListener("scroll", onScroll);
        setActiveMobileIndex(null);
      }
    }, { rootMargin: "-80px 0px" });
    io.observe(container);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isMobile]);

  const handleMobileClick = useCallback((idx: number) => {
    manualTapRef.current = true;
    manualTapScrollYRef.current = window.scrollY;
    setActiveMobileIndex((prev) => (prev === idx ? null : idx));
  }, []);

  const setItemRef = useCallback((idx: number, el: HTMLDivElement | null) => {
    itemRefs.current[idx] = el;
  }, []);

  return (
    <div ref={containerRef} className={`w-full overflow-hidden select-none ${className}`} style={{ backgroundColor: bgColor }}>
      <nav className="flex flex-col w-full m-0 p-0" aria-label="Headline metrics">
        {items.map((item, idx) => (
          <MenuItem
            key={idx}
            {...item}
            idx={idx}
            speed={speed}
            textColor={textColor}
            defaultMarqueeBg={marqueeBgColor}
            defaultMarqueeText={marqueeTextColor}
            borderColor={borderColor}
            isFirst={idx === 0}
            isActive={isMobile && activeMobileIndex === idx}
            isMobile={isMobile}
            scrollDirRef={scrollDirRef}
            onMobileClick={handleMobileClick}
            onRef={setItemRef}
          />
        ))}
      </nav>
    </div>
  );
}

interface MenuItemProps extends FlowingMenuItemData {
  idx: number;
  speed: number;
  textColor: string;
  defaultMarqueeBg: string;
  defaultMarqueeText: string;
  borderColor: string;
  isFirst: boolean;
  isActive: boolean;
  isMobile: boolean;
  scrollDirRef: React.RefObject<Edge>;
  onMobileClick: (idx: number) => void;
  onRef: (idx: number, el: HTMLDivElement | null) => void;
}

const MenuItem = memo(function MenuItem({
  idx,
  link = "#",
  text,
  image,
  value,
  accent,
  label,
  index,
  tag = "VERIFIED IMPACT",
  marqueeText,
  marqueeBgColor,
  marqueeTextColor,
  speed,
  textColor,
  defaultMarqueeBg,
  defaultMarqueeText,
  borderColor,
  isFirst,
  isActive,
  isMobile,
  scrollDirRef,
  onMobileClick,
  onRef,
}: MenuItemProps) {
  const itemRef = useRef<HTMLDivElement | null>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);
  const animsRef = useRef<Animation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [repetitions, setRepetitions] = useState(4);

  const activeMarqueeBg = marqueeBgColor || defaultMarqueeBg;
  const activeMarqueeText = marqueeTextColor || defaultMarqueeText;
  const displayText = marqueeText || text || `${value || ""}${accent || ""} ${label || ""}`;

  // Enough copies to cover the viewport; recomputed only when the width changes.
  useEffect(() => {
    const inner = marqueeInnerRef.current;
    if (!inner) return;
    let lastW = 0;
    const calc = () => {
      const w = window.innerWidth;
      if (w === lastW) return;
      lastW = w;
      const part = inner.querySelector<HTMLElement>(".marquee-part");
      const partW = part?.offsetWidth || 400;
      setRepetitions(Math.max(4, Math.ceil(w / partW) + 2));
    };
    calc();
    window.addEventListener("resize", calc, { passive: true });
    return () => window.removeEventListener("resize", calc);
  }, [displayText]);

  const slide = useCallback((open: boolean, edge: Edge) => {
    const layer = marqueeRef.current;
    const inner = marqueeInnerRef.current;
    if (!layer || !inner) return;
    const off = edge === "top" ? "-101%" : "101%";
    const offInner = edge === "top" ? "101%" : "-101%";
    // Start from wherever an interrupted animation left each layer.
    const fromLayer = getComputedStyle(layer).transform;
    const fromInner = getComputedStyle(inner).transform;
    animsRef.current.forEach((a) => a.cancel());
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const opts: KeyframeAnimationOptions = { duration: reduced ? 0 : DURATION, easing: EASE, fill: "forwards" };
    const cur = (m: string) => (m === "none" ? "translateY(0)" : m);
    animsRef.current = open
      ? [
          layer.animate([{ transform: `translateY(${off})` }, { transform: "translateY(0)" }], opts),
          inner.animate([{ transform: `translateY(${offInner})` }, { transform: "translateY(0)" }], opts),
        ]
      : [
          layer.animate([{ transform: cur(fromLayer) }, { transform: `translateY(${off})` }], opts),
          inner.animate([{ transform: cur(fromInner) }, { transform: `translateY(${offInner})` }], opts),
        ];
  }, []);

  const open = useCallback(
    (edge: Edge) => {
      setIsOpen(true);
      slide(true, edge);
    },
    [slide]
  );
  const close = useCallback(
    (edge: Edge) => {
      setIsOpen(false);
      slide(false, edge);
    },
    [slide]
  );

  useEffect(() => () => animsRef.current.forEach((a) => a.cancel()), []);

  // Mobile: open/close follows scroll focus or taps.
  const wasActive = useRef(false);
  useEffect(() => {
    if (!isMobile || isActive === wasActive.current) return;
    wasActive.current = isActive;
    if (isActive) open(scrollDirRef.current ?? "bottom");
    else close(scrollDirRef.current ?? "bottom");
  }, [isActive, isMobile, open, close, scrollDirRef]);

  const edgeFor = (ev: React.PointerEvent<HTMLElement>): Edge => {
    const rect = itemRef.current?.getBoundingClientRect();
    return rect && ev.clientY - rect.top < rect.height / 2 ? "top" : "bottom";
  };

  const content = value ? (
    <div className="w-full relative px-6 sm:px-12 md:px-16 lg:px-24 py-[18px] sm:py-[22px] flex flex-col md:flex-row md:items-center justify-between gap-4">
      <span
        aria-hidden="true"
        className={`absolute right-12 sm:right-32 top-1/2 -translate-y-1/2 font-display font-black text-5xl sm:text-6xl lg:text-7xl pointer-events-none select-none tracking-tight hidden sm:block transition-colors duration-300 ${
          isOpen ? "text-white/[0.045]" : "text-white/[0.025]"
        }`}
      >
        {value}
      </span>

      <div className="flex items-baseline gap-4 sm:gap-8 relative z-10">
        {index && <span className="font-mono text-xs text-neutral-500 font-semibold tracking-widest uppercase">{index}</span>}
        <div className="font-display font-black text-3xl sm:text-4xl lg:text-5xl xl:text-6xl tracking-tight text-white flex items-baseline leading-none group-hover:translate-x-1 transition-transform duration-300">
          <span>{value}</span>
          <span className="text-[#e51d24] ml-1.5 inline-block [text-shadow:0_0_12px_rgba(229,29,36,0.65)] animate-pulse">{accent}</span>
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-4 sm:gap-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-end gap-[3px] h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition-opacity" aria-hidden="true">
            <span className="w-1 h-full bg-[#e51d24] rounded-full animate-metric-bar-1" />
            <span className="w-1 h-full bg-white/70 rounded-full animate-metric-bar-2" />
            <span className="w-1 h-full bg-[#e51d24] rounded-full animate-metric-bar-3" />
          </div>
          <p className="text-xs sm:text-sm lg:text-base text-neutral-300 font-medium tracking-wide max-w-sm text-left">{label}</p>
        </div>
        <div className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 group-hover:text-white transition-colors">
          <span>Explore Proof</span>
          <span className="transition-transform group-hover:translate-x-1.5">→</span>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center px-6 py-5 sm:py-6">
      <span className="uppercase font-semibold text-xl sm:text-2xl lg:text-3xl tracking-tight">{text}</span>
    </div>
  );

  return (
    <div
      className={`w-full relative overflow-hidden group transition-[background-color] duration-300 ${isOpen ? "bg-white/[0.02]" : ""}`}
      ref={(el) => {
        itemRef.current = el;
        onRef(idx, el);
      }}
      onPointerEnter={(ev) => {
        if (!isMobile && ev.pointerType !== "touch") open(edgeFor(ev));
      }}
      onPointerLeave={(ev) => {
        if (!isMobile && ev.pointerType !== "touch") close(edgeFor(ev));
      }}
      style={{
        borderTop: isFirst ? `1px solid ${borderColor}` : "none",
        borderBottom: `1px solid ${isOpen ? "rgba(229, 29, 36, 0.35)" : borderColor}`,
        transition: "border-color 0.3s ease, background-color 0.3s ease",
      }}
    >
      <Link
        href={link}
        aria-label={label ? `${value || ""}${accent || ""} ${label}` : text || "Metric item"}
        onClick={(e) => {
          if (isMobile) {
            e.preventDefault();
            onMobileClick(idx);
          }
        }}
        className="block w-full h-full relative cursor-pointer no-underline group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e51d24]/70 active:scale-[0.99] transition-transform"
        style={{ color: textColor }}
      >
        {content}
      </Link>

      {/* Scanning laser line along the bottom border */}
      <span className="absolute bottom-0 left-0 w-36 h-[1.5px] bg-gradient-to-r from-transparent via-[#e51d24]/60 to-transparent animate-scan-light pointer-events-none" aria-hidden="true" />

      {/* Direction-aware marquee layer */}
      <div
        className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-20 translate-y-[101%]"
        ref={marqueeRef}
        style={{ backgroundColor: activeMarqueeBg }}
        aria-hidden="true"
      >
        <div className="h-full" ref={marqueeInnerRef}>
        <div
          className="h-full w-fit flex items-center fm-marquee"
          data-running={isOpen ? "" : undefined}
          style={{ "--fm-duration": `${speed}s`, "--fm-reps": repetitions } as React.CSSProperties}
        >
          {Array.from({ length: repetitions }, (_, rep) => (
            <div className="marquee-part flex items-center flex-shrink-0" key={rep} style={{ color: activeMarqueeText }}>
              <span className="whitespace-nowrap font-display font-black text-xl sm:text-3xl lg:text-4xl uppercase tracking-tight px-3 sm:px-5">
                {displayText}
              </span>
              <span className="relative w-[95px] sm:w-[135px] lg:w-[160px] h-[32px] sm:h-[40px] lg:h-[44px] my-1 mx-2.5 sm:mx-4 rounded-full overflow-hidden border-2 border-white/50 shadow-xl flex-shrink-0 bg-black/20">
                {/* Lazy: the layer is clipped off-row until first opened. */}
                <Image src={image} alt="" fill sizes="160px" className="object-cover" />
              </span>
              <span className="px-3 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider bg-black/40 border border-white/25 text-white flex-shrink-0 mx-2">
                ✦ {tag}
              </span>
              <span className="text-white/40 text-base px-2.5 flex-shrink-0 select-none">✦</span>
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
});
