"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";

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
  speed?: number;
  textColor?: string;
  bgColor?: string;
  marqueeBgColor?: string;
  marqueeTextColor?: string;
  borderColor?: string;
  className?: string;
}

interface MenuItemProps extends FlowingMenuItemData {
  speed: number;
  textColor: string;
  defaultMarqueeBg: string;
  defaultMarqueeText: string;
  borderColor: string;
  isFirst: boolean;
  isLast: boolean;
  isActive?: boolean;
  isMobile?: boolean;
  scrollDirection?: "top" | "bottom";
  onMobileClick?: () => void;
  onRef?: (el: HTMLDivElement | null) => void;
}

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
  const [scrollDirection, setScrollDirection] = useState<"top" | "bottom">("bottom");
  const manualTapRef = useRef(false);
  const manualTapScrollYRef = useRef(0);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const checkMobile = () => {
      const mobile =
        window.innerWidth < 1024 ||
        (typeof window !== "undefined" &&
          window.matchMedia("(hover: none) and (pointer: coarse)").matches);
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile, { passive: true });
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setActiveMobileIndex(null);
      return;
    }

    let ticking = false;

    const checkActiveItem = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY >= lastScrollYRef.current;
      setScrollDirection(isScrollingDown ? "bottom" : "top");
      lastScrollYRef.current = currentScrollY;

      // If user recently tapped an item manually, hold it unless scrolled significantly (>50px)
      if (manualTapRef.current) {
        if (Math.abs(currentScrollY - manualTapScrollYRef.current) < 50) {
          return;
        }
        manualTapRef.current = false;
      }

      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const vh = window.innerHeight;

      // If entire container is outside viewport
      if (containerRect.bottom < 80 || containerRect.top > vh - 80) {
        setActiveMobileIndex(null);
        return;
      }

      const centerY = vh / 2;
      let closestIndex: number | null = null;
      let minDistance = Infinity;

      itemRefs.current.forEach((el, idx) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const itemCenter = rect.top + rect.height / 2;
        const dist = Math.abs(itemCenter - centerY);

        // Within active center focal band (42% of viewport height)
        if (dist < vh * 0.42 && dist < minDistance) {
          minDistance = dist;
          closestIndex = idx;
        }
      });

      setActiveMobileIndex(closestIndex);
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkActiveItem();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    checkActiveItem();

    return () => window.removeEventListener("scroll", onScroll);
  }, [isMobile]);

  const handleMobileClick = (idx: number) => {
    manualTapRef.current = true;
    manualTapScrollYRef.current = window.scrollY;
    setActiveMobileIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-hidden select-none ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      <nav className="flex flex-col w-full m-0 p-0">
        {items.map((item, idx) => (
          <MenuItem
            key={idx}
            {...item}
            speed={speed}
            textColor={textColor}
            defaultMarqueeBg={marqueeBgColor}
            defaultMarqueeText={marqueeTextColor}
            borderColor={borderColor}
            isFirst={idx === 0}
            isLast={idx === items.length - 1}
            isActive={isMobile && activeMobileIndex === idx}
            isMobile={isMobile}
            scrollDirection={scrollDirection}
            onMobileClick={() => handleMobileClick(idx)}
            onRef={(el) => {
              itemRefs.current[idx] = el;
            }}
          />
        ))}
      </nav>
    </div>
  );
}

const MenuItem: React.FC<MenuItemProps> = ({
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
  isLast,
  isActive = false,
  isMobile = false,
  scrollDirection = "bottom",
  onMobileClick,
  onRef,
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const edgeTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const isHoveredRef = useRef(false);
  const [isHovered, setIsHovered] = useState(false);
  const [repetitions, setRepetitions] = useState(4);

  const activeMarqueeBg = marqueeBgColor || defaultMarqueeBg;
  const activeMarqueeText = marqueeTextColor || defaultMarqueeText;
  const displayText = marqueeText || text || `${value || ""}${accent || ""} ${label || ""}`;

  const animationDefaults = { duration: 0.42, ease: "power3.out" };

  const setupMarquee = () => {
    if (!marqueeInnerRef.current) return;
    const marqueeContent = marqueeInnerRef.current.querySelector(
      ".marquee-part"
    ) as HTMLElement;
    if (!marqueeContent) return;
    const contentWidth = marqueeContent.offsetWidth;
    if (contentWidth === 0) return;

    if (animationRef.current) {
      animationRef.current.kill();
    }

    animationRef.current = gsap.to(marqueeInnerRef.current, {
      x: -contentWidth,
      duration: speed,
      ease: "none",
      repeat: -1,
      paused: !isHoveredRef.current,
    });
  };

  useEffect(() => {
    const calculateRepetitions = () => {
      if (!marqueeInnerRef.current) return;
      const marqueeContent = marqueeInnerRef.current.querySelector(
        ".marquee-part"
      ) as HTMLElement;
      if (!marqueeContent) return;
      const contentWidth = marqueeContent.offsetWidth;
      const viewportWidth = window.innerWidth;
      const needed = Math.ceil(viewportWidth / (contentWidth || 400)) + 2;
      setRepetitions(Math.max(4, needed));
    };

    calculateRepetitions();
    window.addEventListener("resize", calculateRepetitions);
    return () => window.removeEventListener("resize", calculateRepetitions);
  }, [displayText, image]);

  useEffect(() => {
    setupMarquee();
    const timer = setTimeout(setupMarquee, 40);
    return () => {
      clearTimeout(timer);
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [displayText, image, repetitions, speed]);

  const openCard = (edge: "top" | "bottom" = "bottom") => {
    isHoveredRef.current = true;
    setIsHovered(true);

    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;

    if (edgeTimelineRef.current) {
      edgeTimelineRef.current.kill();
      edgeTimelineRef.current = null;
    }

    if (!animationRef.current) {
      setupMarquee();
    }
    (animationRef.current as gsap.core.Tween | null)?.play();

    edgeTimelineRef.current = gsap
      .timeline({ defaults: animationDefaults })
      .set(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .set(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0)
      .to(
        [marqueeRef.current, marqueeInnerRef.current],
        { y: "0%", overwrite: "auto" },
        0
      );
  };

  const closeCard = (edge: "top" | "bottom" = "bottom") => {
    isHoveredRef.current = false;
    setIsHovered(false);

    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;

    if (edgeTimelineRef.current) {
      edgeTimelineRef.current.kill();
      edgeTimelineRef.current = null;
    }

    edgeTimelineRef.current = gsap
      .timeline({
        defaults: animationDefaults,
        onComplete: () => {
          if (!isHoveredRef.current && animationRef.current) {
            animationRef.current.pause();
          }
        },
      })
      .to(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%", overwrite: "auto" }, 0)
      .to(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%", overwrite: "auto" }, 0);
  };

  // Synchronize mobile active state (triggered by scroll or click)
  useEffect(() => {
    if (!isMobile) return;
    if (isActive) {
      openCard(scrollDirection);
    } else {
      closeCard(scrollDirection);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isMobile]);

  // Desktop Hover Handlers
  const handleMouseEnter = (ev: React.MouseEvent<HTMLElement>) => {
    if (isMobile) return;
    const rect = itemRef.current?.getBoundingClientRect();
    const mouseY = rect ? ev.clientY - rect.top : 0;
    const edge = rect && mouseY < rect.height / 2 ? "top" : "bottom";
    openCard(edge);
  };

  const handleMouseLeave = (ev: React.MouseEvent<HTMLElement>) => {
    if (isMobile) return;
    const rect = itemRef.current?.getBoundingClientRect();
    const mouseY = rect ? ev.clientY - rect.top : 0;
    const edge = rect && mouseY < rect.height / 2 ? "top" : "bottom";
    closeCard(edge);
  };

  const content = value ? (
    /* Full-Bleed Architectural Stat Row Layout (Resting State -> Expanding on Hover) */
    <div
      className={`w-full relative px-6 sm:px-12 md:px-16 lg:px-24 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ease-out ${
        isHovered
          ? "py-[28px] sm:py-[34px] bg-white/[0.02]"
          : "py-[18px] sm:py-[22px]"
      }`}
    >
      {/* Ambient Watermark in background */}
      <span
        aria-hidden="true"
        className={`absolute right-12 sm:right-32 top-1/2 -translate-y-1/2 font-display font-black text-5xl sm:text-6xl lg:text-7xl pointer-events-none select-none tracking-tight hidden sm:block transition-all duration-300 ${
          isHovered ? "text-white/[0.045] scale-105" : "text-white/[0.025]"
        }`}
      >
        {value}
      </span>

      {/* Metric & Accent with Monospace Index */}
      <div className="flex items-baseline gap-4 sm:gap-8 relative z-10">
        {index && (
          <span className="font-mono text-xs text-neutral-500 font-semibold tracking-widest uppercase">
            {index}
          </span>
        )}
        <div className="font-display font-black text-3xl sm:text-4xl lg:text-5xl xl:text-6xl tracking-tight text-white flex items-baseline leading-none group-hover:translate-x-1 transition-transform duration-300">
          <span>{value}</span>
          <span className="text-[#e51d24] ml-1.5 inline-block group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_12px_rgba(229,29,36,0.65)] animate-pulse">
            {accent}
          </span>
        </div>
      </div>

      {/* Label with Live Telemetry Bars & Explore Cue */}
      <div className="flex items-center justify-between md:justify-end gap-4 sm:gap-8 relative z-10">
        <div className="flex items-center gap-3">
          {/* Recurring live algorithmic visualizer bars */}
          <div className="flex items-end gap-[3px] h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition-opacity">
            <span className="w-1 h-full bg-[#e51d24] rounded-full animate-metric-bar-1" />
            <span className="w-1 h-full bg-white/70 rounded-full animate-metric-bar-2" />
            <span className="w-1 h-full bg-[#e51d24] rounded-full animate-metric-bar-3" />
          </div>
          <p className="text-xs sm:text-sm lg:text-base text-neutral-300 font-medium tracking-wide max-w-sm text-left">
            {label}
          </p>
        </div>

        <div className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 group-hover:text-white transition-colors">
          <span>Explore Proof</span>
          <span className="transition-transform group-hover:translate-x-1.5">→</span>
        </div>
      </div>
    </div>
  ) : (
    /* Standard React Bits Flowing Menu Text Item */
    <div
      className={`flex items-center justify-center px-6 transition-all duration-300 ease-out ${
        isHovered ? "py-7 sm:py-8" : "py-5 sm:py-6"
      }`}
    >
      <span className="uppercase font-semibold text-xl sm:text-2xl lg:text-3xl tracking-tight">
        {text}
      </span>
    </div>
  );

  return (
    <div
      className="w-full relative overflow-hidden group transition-all duration-300 ease-out"
      ref={(el) => {
        itemRef.current = el;
        onRef?.(el);
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        borderTop: isFirst ? `1px solid ${borderColor}` : "none",
        borderBottom: isHovered
          ? "1px solid rgba(229, 29, 36, 0.35)"
          : `1px solid ${borderColor}`,
        transition: "border-color 0.3s ease",
      }}
    >
      <Link
        href={link}
        aria-label={label ? `${value || ""}${accent || ""} ${label}` : text || "Metric item"}
        onClick={(e) => {
          if (isMobile) {
            e.preventDefault();
            onMobileClick?.();
          }
        }}
        className="block w-full h-full relative cursor-pointer no-underline group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e51d24]/70 active:scale-[0.99] transition-transform"
        style={{ color: textColor }}
      >
        {content}
      </Link>

      {/* Scanning laser line accent along the bottom border */}
      <span className="absolute bottom-0 left-0 w-36 h-[1.5px] bg-gradient-to-r from-transparent via-[#e51d24]/60 to-transparent animate-scan-light pointer-events-none" />

      {/* Direction-Aware Flowing Marquee Layer */}
      <div
        className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none translate-y-[101%] z-20"
        ref={marqueeRef}
        style={{ backgroundColor: activeMarqueeBg }}
      >
        <div className="h-full w-fit flex items-center" ref={marqueeInnerRef}>
          {[...Array(repetitions)].map((_, idx) => (
            <div
              className="marquee-part flex items-center flex-shrink-0"
              key={idx}
              style={{ color: activeMarqueeText }}
            >
              <span className="whitespace-nowrap font-display font-black text-xl sm:text-3xl lg:text-4xl uppercase tracking-tight px-3 sm:px-5">
                {displayText}
              </span>
              
              {/* Rounded capsule thumbnail */}
              <div
                className="w-[95px] sm:w-[135px] lg:w-[160px] h-[32px] sm:h-[40px] lg:h-[44px] my-1 mx-2.5 sm:mx-4 rounded-full bg-cover bg-center border-2 border-white/50 shadow-xl flex-shrink-0"
                style={{ backgroundImage: `url(${image})` }}
              />

              {/* Frosted Glass Telemetry Pill Tag */}
              <span className="px-3 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider bg-black/35 backdrop-blur-md border border-white/25 text-white flex-shrink-0 mx-2">
                ✦ {tag}
              </span>

              {/* Sparkle separator */}
              <span className="text-white/40 text-base px-2.5 flex-shrink-0 select-none">
                ✦
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
