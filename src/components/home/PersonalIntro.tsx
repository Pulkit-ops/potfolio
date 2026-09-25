"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { aboutIntroChapters, IntroChapter } from "@/data/aboutIntroChapters";

export default function PersonalIntro() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mobileCardRefs = useRef<(HTMLElement | null)[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  // Check desktop vs mobile viewport
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop, { passive: true });
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Mobile card-stacking takeover animation (mirrors kachmo-website linear capability stack)
  useEffect(() => {
    if (isDesktop || prefersReducedMotion) {
      mobileCardRefs.current.forEach((el) => {
        if (el) {
          el.style.filter = "";
          el.style.opacity = "";
          el.style.transform = "";
        }
      });
      return;
    }

    const cards = mobileCardRefs.current;
    const lastFilter: string[] = cards.map(() => "");
    const lastOpacity: string[] = cards.map(() => "");
    const lastTransform: string[] = cards.map(() => "");

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const validCards = mobileCardRefs.current;
        const n = validCards.length;
        if (n <= 1) return;

        // Pass 1: Read all rects
        const tops = new Float64Array(n);
        const bottoms = new Float64Array(n);
        for (let i = 0; i < n; i++) {
          const card = validCards[i];
          if (!card) continue;
          const rect = card.getBoundingClientRect();
          tops[i] = rect.top;
          bottoms[i] = rect.bottom;
        }

        // Pass 2: Write styles
        for (let i = 0; i < n; i++) {
          const card = validCards[i];
          if (!card) continue;

          let filter = "none";
          let opacity = "1";
          let transform = "none";

          if (i < n - 1 && validCards[i + 1]) {
            const height = bottoms[i] - tops[i];
            const takeover =
              height > 0
                ? Math.max(0, Math.min(1, (bottoms[i] - tops[i + 1]) / height))
                : 0;

            if (takeover > 0.01) {
              filter = `blur(${(takeover * 5).toFixed(2)}px)`;
              opacity = (1 - takeover * 0.45).toFixed(3);
              transform = `scale(${(1 - takeover * 0.04).toFixed(3)})`;
            }
          }

          if (lastFilter[i] !== filter) {
            lastFilter[i] = filter;
            card.style.filter = filter;
          }
          if (lastOpacity[i] !== opacity) {
            lastOpacity[i] = opacity;
            card.style.opacity = opacity;
          }
          if (lastTransform[i] !== transform) {
            lastTransform[i] = transform;
            card.style.transform = transform;
          }
        }
      });
    };

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      onScroll();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    onScroll();

    const cleanupCards = mobileCardRefs.current.slice();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      cleanupCards.forEach((el) => {
        if (el) {
          el.style.filter = "";
          el.style.opacity = "";
          el.style.transform = "";
        }
      });
    };
  }, [isDesktop, prefersReducedMotion]);

  // Track scroll progress inside data-driven container height
  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalDistance = rect.height - window.innerHeight;

      if (totalDistance <= 0) return;

      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / totalDistance));

      animationFrameId = requestAnimationFrame(() => {
        setScrollProgress(progress);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const totalChapters = aboutIntroChapters.length;

  // Active chapter and handover math
  const { currentIdx, nextIdx, handoverProgress, isHandover } = useMemo(() => {
    if (totalChapters <= 1) {
      return { currentIdx: 0, nextIdx: 0, handoverProgress: 0, isHandover: false };
    }

    // Segment size per chapter
    const rawProgress = scrollProgress * totalChapters;
    const current = Math.min(totalChapters - 1, Math.floor(rawProgress));
    const localT = rawProgress - current; // 0 to 1 inside current chapter

    // Handover occurs during the last 28% of the chapter segment
    const handoverThreshold = 0.72;
    const isTransitioning = localT > handoverThreshold && current < totalChapters - 1;
    const handover = isTransitioning
      ? (localT - handoverThreshold) / (1 - handoverThreshold)
      : 0;

    return {
      currentIdx: current,
      nextIdx: isTransitioning ? current + 1 : current,
      handoverProgress: handover,
      isHandover: isTransitioning,
    };
  }, [scrollProgress, totalChapters]);


  return (
    <section
      ref={containerRef}
      id="personal-intro"
      style={{ "--intro-track-height": `${totalChapters * 100}dvh` } as React.CSSProperties}
      className="relative w-full bg-[#08090b] h-auto lg:h-[var(--intro-track-height)]"
    >
      {/* ============================================================== */}
      {/* DESKTOP EXPERIENCE: STICKY PINNED CINEMATIC SCENE (lg+)       */}
      {/* ============================================================== */}
      <div className="hidden lg:flex sticky top-0 h-screen h-[100dvh] w-full items-center justify-center overflow-hidden z-10">
        <div className="max-w-[1440px] w-full mx-auto px-10 xl:px-16 flex items-center justify-between gap-12 xl:gap-20 h-full py-12">
          {/* ------------------------------------------------------------ */}
          {/* LEFT: STORY / BIG TYPOGRAPHY (~55%)                         */}
          {/* ------------------------------------------------------------ */}
          <div className="w-[52%] xl:w-[54%] flex flex-col justify-center relative min-h-[520px]">
            {aboutIntroChapters.map((chapter, idx) => {
              const isCurrent = idx === currentIdx;
              const isNext = idx === nextIdx && isHandover;

              if (!isCurrent && !isNext) return null;

              // Transition transforms with clean sequence separation (no overlapping text collision)
              let opacity = 1;
              let translateY = 0;

              if (prefersReducedMotion) {
                opacity = isCurrent ? 1 - handoverProgress : handoverProgress;
              } else if (isCurrent && isHandover) {
                // Outgoing chapter: drifts slightly upward and fades out cleanly in first 45% of handover
                const exitProgress = Math.min(1, handoverProgress / 0.45);
                opacity = 1 - exitProgress;
                translateY = -exitProgress * 28;
              } else if (isNext) {
                // Incoming chapter: emerges from below with crisp opacity starting after 35% of handover
                const enterProgress = Math.max(0, (handoverProgress - 0.35) / 0.65);
                opacity = enterProgress;
                translateY = (1 - enterProgress) * 36;
              }

              return (
                <div
                  key={chapter.id}
                  className="absolute inset-0 flex flex-col justify-center select-none"
                  style={{
                    opacity,
                    transform: `translate3d(0, ${translateY}px, 0)`,
                    transition: prefersReducedMotion ? "opacity 0.2s linear" : "none",
                    pointerEvents: isCurrent && !isHandover ? "auto" : "none",
                  }}
                >
                  {/* Headline with Line-Based Reveal */}
                  <div className="space-y-1">
                    {chapter.headlineLines.map((line, lineIdx) => {
                      // Line reveal offset
                      const lineOffset = lineIdx * 0.12;
                      const enterProgress = Math.max(0, (handoverProgress - 0.35) / 0.65);
                      const lineProgress = isNext
                        ? Math.max(0, Math.min(1, (enterProgress - lineOffset) / 0.88))
                        : 1;

                      const lineTranslate = prefersReducedMotion
                        ? 0
                        : (1 - lineProgress) * 45;

                      return (
                        <div key={lineIdx} className="overflow-hidden">
                          <h2
                            style={{
                              transform: `translate3d(0, ${lineTranslate}%, 0)`,
                            }}
                            className={`font-display text-5xl sm:text-6xl lg:text-[3.5rem] xl:text-[4.5rem] 2xl:text-[5.5rem] uppercase tracking-wide leading-[0.88] ${
                              idx === 0
                                ? lineIdx === 0
                                ? "text-[#e51d24]"
                                : lineIdx === 1
                                ? "text-white"
                                : "text-[#e51d24]"
                              : "text-white"
                            }`}
                          >
                            {line}
                          </h2>
                        </div>
                      );
                    })}
                  </div>

                  {/* Optional Supporting Copy */}
                  {chapter.supporting && (
                    <div className="mt-8 max-w-xl">
                      <p className="text-base sm:text-lg xl:text-xl text-neutral-300 font-normal leading-relaxed">
                        {chapter.supporting}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ------------------------------------------------------------ */}
          {/* RIGHT: LARGE PHOTOGRAPHY (~45%)                              */}
          {/* ------------------------------------------------------------ */}
          <div className="w-[48%] xl:w-[46%] h-[74vh] max-h-[720px] relative rounded-3xl overflow-hidden bg-[#0c0e14] shadow-2xl shadow-black/80 group">
            {aboutIntroChapters.map((chapter, idx) => {
              const isCurrent = idx === currentIdx;
              const isNext = idx === nextIdx && isHandover;

              if (!isCurrent && !isNext) return null;

              // Image transition family
              const transitionStyle = getImageTransitionStyle({
                type: chapter.transitionType || "horizontal-wipe",
                isCurrent,
                isNext,
                tau: handoverProgress,
                reducedMotion: prefersReducedMotion,
              });

              return (
                <div
                  key={chapter.id}
                  className="absolute inset-0 w-full h-full overflow-hidden"
                  style={transitionStyle}
                >
                  <img
                    src={chapter.image}
                    alt={chapter.imageAlt}
                    className={`w-full h-full object-cover select-none transition-transform duration-700 ease-out group-hover:scale-105 ${
                      chapter.imagePosition || "object-center"
                    }`}
                    loading={idx <= 1 ? "eager" : "lazy"}
                  />
                  {/* Subtle edge vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08090b]/60 via-transparent to-[#08090b]/20 pointer-events-none" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MOBILE & TABLET EXPERIENCE: STACKING CARD DECK (<lg)           */}
      {/* ============================================================== */}
      <div className="block lg:hidden w-full px-4 sm:px-8 pt-8 pb-16 sm:pt-12 sm:pb-20">
        <div className="max-w-xl sm:max-w-2xl mx-auto">
          {/* Section Header */}
          <div className="mb-6 sm:mb-8 px-1">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl uppercase tracking-wide text-white">
              THE PERSON BEHIND THE FEED.
            </h2>
          </div>

          {/* Cards Stack Container */}
          <div className="relative w-full">
            {aboutIntroChapters.map((chapter, idx) => {
              const isLast = idx === totalChapters - 1;
              return (
                <article
                  key={chapter.id}
                  id={`intro-card-${chapter.id}`}
                  ref={(el) => {
                    mobileCardRefs.current[idx] = el;
                  }}
                  style={{
                    top: `calc(env(safe-area-inset-top, 0px) + ${1.25 + idx * 0.35}rem)`,
                    zIndex: 10 + idx,
                  }}
                  className={`sticky w-full rounded-2xl sm:rounded-3xl bg-[#0c0e14] border border-white/10 p-5 sm:p-7 shadow-[0_-8px_24px_-2px_rgba(0,0,0,0.9),0_16px_36px_-6px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden transition-[filter,opacity,transform] duration-200 origin-top will-change-[filter,opacity,transform] ${
                    isLast ? "mb-6 sm:mb-8" : "mb-16 sm:mb-24"
                  }`}
                >
                  {/* Corner registration brackets */}
                  <span
                    className="absolute top-2.5 left-2.5 w-2 h-2 border-t border-l border-white/20 pointer-events-none"
                    aria-hidden="true"
                  />
                  <span
                    className="absolute top-2.5 right-2.5 w-2 h-2 border-t border-r border-white/20 pointer-events-none"
                    aria-hidden="true"
                  />
                  <span
                    className="absolute bottom-2.5 left-2.5 w-2 h-2 border-b border-l border-white/20 pointer-events-none"
                    aria-hidden="true"
                  />
                  <span
                    className="absolute bottom-2.5 right-2.5 w-2 h-2 border-b border-r border-white/20 pointer-events-none"
                    aria-hidden="true"
                  />

                  {/* Architectural Folio Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 sm:mb-4 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#e51d24]">
                        CHAPTER {chapter.chapterNum}
                      </span>
                      <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-wider">
                        {/* {chapter.id.replace(/-/g, " ")} */}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-medium text-neutral-400">
                      0{idx + 1} / 0{totalChapters}
                    </span>
                  </div>

                  {/* Headline */}
                  <div className="mb-3 space-y-0.5">
                    {chapter.headlineLines.map((line, lineIdx) => (
                      <h3
                        key={lineIdx}
                        className={`font-display text-2xl sm:text-3xl md:text-4xl uppercase tracking-wide leading-[0.92] ${
                          idx === 0
                            ? lineIdx === 0
                              ? "text-[#e51d24]"
                              : lineIdx === 1
                              ? "text-white"
                              : "text-[#e51d24]"
                            : "text-white"
                        }`}
                      >
                        {line}
                      </h3>
                    ))}
                  </div>

                  {/* Photo */}
                  <div className="w-full aspect-[16/10] sm:aspect-[16/9] max-h-[220px] sm:max-h-[270px] rounded-xl overflow-hidden bg-[#12151d] border border-white/10 relative my-2 sm:my-3 group">
                    <img
                      src={chapter.image}
                      alt={chapter.imageAlt}
                      className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
                        chapter.imagePosition || "object-center"
                      }`}
                      loading={idx <= 1 ? "eager" : "lazy"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e14]/60 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Optional Supporting Text */}
                  {chapter.supporting && (
                    <p className="text-xs sm:text-sm text-neutral-300 font-normal leading-relaxed mt-2.5">
                      {chapter.supporting}
                    </p>
                  )}
                </article>
              );
            })}

            {/* Mobile card stack dwell runway (mirrors kachmo-website stackRunway) */}
            <div
              className="w-full h-[45vh] max-h-[360px] pointer-events-none"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Calculates CSS properties for the family of photo transitions.
 */
function getImageTransitionStyle({
  type,
  isCurrent,
  isNext,
  tau,
  reducedMotion,
}: {
  type: IntroChapter["transitionType"];
  isCurrent: boolean;
  isNext: boolean;
  tau: number;
  reducedMotion: boolean;
}): React.CSSProperties {
  if (reducedMotion) {
    return {
      opacity: isCurrent ? 1 - tau : tau,
      zIndex: isNext ? 20 : 10,
    };
  }

  // Chapter is fully visible with no handover
  if (isCurrent && tau === 0) {
    return {
      opacity: 1,
      transform: "translate3d(0, 0, 0) scale(1)",
      zIndex: 10,
      clipPath: "none",
    };
  }

  // 1. Horizontal Wipe
  if (type === "horizontal-wipe") {
    if (isCurrent) {
      return {
        opacity: 1 - tau,
        transform: `translate3d(${-tau * 12}%, 0, 0) scale(${1 - tau * 0.04})`,
        zIndex: 10,
      };
    }
    // Incoming from right
    return {
      opacity: 1,
      transform: `translate3d(${(1 - tau) * 8}%, 0, 0)`,
      clipPath: `inset(0 0 0 ${(1 - tau) * 100}%)`,
      zIndex: 20,
    };
  }

  // 2. Diagonal Wipe
  if (type === "diagonal-wipe") {
    if (isCurrent) {
      return {
        opacity: 1 - tau,
        transform: `scale(${1 - tau * 0.05})`,
        filter: `blur(${tau * 4}px)`,
        zIndex: 10,
      };
    }
    // Incoming with diagonal clip-path
    const insetPct = (1 - tau) * 100;
    return {
      opacity: 1,
      clipPath: `polygon(${insetPct}% 0, 100% 0, 100% 100%, ${Math.max(0, insetPct - 20)}% 100%)`,
      transform: `scale(${1.04 - tau * 0.04})`,
      zIndex: 20,
    };
  }

  // 3. Parallax Slide
  if (type === "parallax-slide") {
    if (isCurrent) {
      return {
        opacity: 1 - tau * 0.8,
        transform: `translate3d(${-tau * 15}%, 0, 0) scale(${1 - tau * 0.04})`,
        zIndex: 10,
      };
    }
    return {
      opacity: tau,
      transform: `translate3d(${(1 - tau) * 15}%, 0, 0) scale(${1.04 - tau * 0.04})`,
      zIndex: 20,
    };
  }

  // 4. Vertical Reveal
  if (type === "vertical-reveal") {
    if (isCurrent) {
      return {
        opacity: 1 - tau,
        transform: `translate3d(0, ${-tau * 8}%, 0) scale(${1 - tau * 0.03})`,
        zIndex: 10,
      };
    }
    return {
      opacity: 1,
      transform: `translate3d(0, ${(1 - tau) * 6}%, 0)`,
      clipPath: `inset(${(1 - tau) * 100}% 0 0 0)`,
      zIndex: 20,
    };
  }

  // 5. Scale + Fade (Default)
  if (isCurrent) {
    return {
      opacity: 1 - tau,
      transform: `scale(${1 - tau * 0.06})`,
      zIndex: 10,
    };
  }
  return {
    opacity: tau,
    transform: `scale(${1.06 - tau * 0.06})`,
    filter: `blur(${(1 - tau) * 4}px)`,
    zIndex: 20,
  };
}
