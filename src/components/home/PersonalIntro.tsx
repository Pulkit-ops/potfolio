"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { aboutIntroChapters, IntroChapter } from "@/data/aboutIntroChapters";

const TOTAL = aboutIntroChapters.length;

const headlineColor = (chapterIdx: number, lineIdx: number) =>
  chapterIdx === 0 ? (lineIdx === 1 ? "text-white" : "text-[#e51d24]") : "text-white";

/**
 * Scroll architecture
 * -------------------
 * Before: every window scroll event (anywhere on the page, on every device)
 * read getBoundingClientRect() and called setState, re-rendering this whole
 * tree; the mobile deck animated `filter: blur()` on four sticky cards per
 * frame behind a 200ms CSS transition that made the cards lag the finger.
 *
 * Now: one passive scroll listener, attached only while the section is near
 * the viewport, schedules at most one rAF per frame. Desktop progress comes
 * from scrollY and a cached section offset (no layout reads while scrolling);
 * styles are written straight to the DOM. The mobile deck animates only
 * opacity + transform (compositor-only).
 */
export default function PersonalIntro() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lineRefs = useRef<(HTMLHeadingElement | null)[][]>(aboutIntroChapters.map(() => []));
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mobileCardRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const desktopMq = window.matchMedia("(min-width: 1024px)");
    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    let active = false;
    let raf = 0;
    let sectionTop = 0;
    let travel = 1;
    let lastProgress = -1;

    const measure = () => {
      const r = section.getBoundingClientRect();
      sectionTop = r.top + window.scrollY;
      travel = Math.max(1, section.offsetHeight - window.innerHeight);
      lastProgress = -1;
    };

    // ---------------- Desktop: pinned cinematic scene ----------------
    const renderDesktop = () => {
      const progress = Math.max(0, Math.min(1, (window.scrollY - sectionTop) / travel));
      if (progress === lastProgress) return;
      lastProgress = progress;
      const reduced = reduceMq.matches;

      const raw = progress * TOTAL;
      const currentIdx = Math.min(TOTAL - 1, Math.floor(raw));
      const localT = raw - currentIdx;
      const isHandover = localT > 0.72 && currentIdx < TOTAL - 1;
      const tau = isHandover ? (localT - 0.72) / 0.28 : 0;
      const nextIdx = isHandover ? currentIdx + 1 : currentIdx;

      for (let k = 0; k < TOTAL; k++) {
        const textEl = textRefs.current[k];
        const imgEl = imageRefs.current[k];
        const isCurrent = k === currentIdx;
        const isNext = isHandover && k === nextIdx;

        if (!isCurrent && !isNext) {
          if (textEl) {
            textEl.style.visibility = "hidden";
            textEl.style.opacity = "0";
          }
          if (imgEl) {
            imgEl.style.visibility = "hidden";
            imgEl.style.opacity = "0";
          }
          continue;
        }

        // Text: outgoing drifts up and fades in the first 45% of the handover;
        // incoming rises in after 35%, line by line.
        let opacity = 1;
        let translateY = 0;
        const enter = Math.max(0, (tau - 0.35) / 0.65);
        if (reduced) {
          opacity = isCurrent ? 1 - tau : tau;
        } else if (isCurrent && isHandover) {
          const exit = Math.min(1, tau / 0.45);
          opacity = 1 - exit;
          translateY = -exit * 28;
        } else if (isNext) {
          opacity = enter;
          translateY = (1 - enter) * 36;
        }
        if (textEl) {
          textEl.style.visibility = "visible";
          textEl.style.opacity = opacity.toFixed(3);
          textEl.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0)`;
          textEl.style.pointerEvents = isCurrent && !isHandover ? "auto" : "none";
        }
        lineRefs.current[k].forEach((line, lineIdx) => {
          if (!line) return;
          const lineProgress = isNext ? Math.max(0, Math.min(1, (enter - lineIdx * 0.12) / 0.88)) : 1;
          const lt = reduced ? 0 : (1 - lineProgress) * 45;
          line.style.transform = `translate3d(0, ${lt.toFixed(1)}%, 0)`;
        });

        if (imgEl) {
          const st = getImageTransitionStyle(
            aboutIntroChapters[k].transitionType || "horizontal-wipe",
            isCurrent,
            tau,
            reduced
          );
          imgEl.style.visibility = "visible";
          imgEl.style.opacity = st.opacity.toFixed(3);
          imgEl.style.transform = st.transform;
          imgEl.style.clipPath = st.clipPath;
          imgEl.style.zIndex = String(st.zIndex);
        }
      }
    };

    // ---------------- Mobile / tablet: stacking card deck ----------------
    const lastMobile: string[] = [];
    const renderMobile = () => {
      const cards = mobileCardRefs.current;
      const n = cards.length;
      if (n <= 1 || reduceMq.matches) return;
      // Reads first (layout is clean: only transform/opacity are ever written).
      const tops: number[] = [];
      const bottoms: number[] = [];
      for (let i = 0; i < n; i++) {
        const r = cards[i]?.getBoundingClientRect();
        tops[i] = r ? r.top : 0;
        bottoms[i] = r ? r.bottom : 0;
      }
      for (let i = 0; i < n; i++) {
        const card = cards[i];
        if (!card) continue;
        let takeover = 0;
        if (i < n - 1) {
          const h = bottoms[i] - tops[i];
          takeover = h > 0 ? Math.max(0, Math.min(1, (bottoms[i] - tops[i + 1]) / h)) : 0;
        }
        const key = takeover > 0.01 ? takeover.toFixed(3) : "0";
        if (lastMobile[i] === key) continue;
        lastMobile[i] = key;
        if (key === "0") {
          card.style.opacity = "";
          card.style.transform = "";
        } else {
          // Depth is conveyed by dimming + a slight recede instead of blur.
          card.style.opacity = (1 - takeover * 0.5).toFixed(3);
          card.style.transform = `scale(${(1 - takeover * 0.045).toFixed(4)})`;
        }
      }
    };

    const frame = () => {
      raf = 0;
      if (desktopMq.matches) renderDesktop();
      else renderMobile();
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const setActive = (on: boolean) => {
      if (on === active) return;
      active = on;
      if (on) {
        measure();
        window.addEventListener("scroll", schedule, { passive: true });
        schedule();
      } else {
        window.removeEventListener("scroll", schedule);
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const io = new IntersectionObserver((entries) => setActive(entries[0].isIntersecting), {
      rootMargin: "200px 0px",
    });
    io.observe(section);

    // Section height changes (images, fonts, breakpoint) → re-measure once.
    const ro = new ResizeObserver(() => {
      measure();
      if (active) schedule();
    });
    ro.observe(section);

    const onBreakpoint = () => {
      mobileCardRefs.current.forEach((el, i) => {
        if (el) {
          el.style.opacity = "";
          el.style.transform = "";
        }
        lastMobile[i] = "";
      });
      measure();
      schedule();
    };
    desktopMq.addEventListener("change", onBreakpoint);
    reduceMq.addEventListener("change", onBreakpoint);

    return () => {
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", schedule);
      desktopMq.removeEventListener("change", onBreakpoint);
      reduceMq.removeEventListener("change", onBreakpoint);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="personal-intro"
      style={{ "--intro-track-height": `${TOTAL * 100}vh` } as React.CSSProperties}
      className="relative w-full bg-[#08090b] h-auto lg:h-[var(--intro-track-height)]"
    >
      {/* DESKTOP (lg+): sticky pinned scene. All chapters are in the DOM (and the
          SSR HTML); scroll only toggles visibility/transform/opacity. */}
      <div className="hidden lg:flex sticky top-0 h-screen h-[100svh] w-full items-center justify-center overflow-hidden z-10">
        <div className="max-w-[1440px] w-full mx-auto px-10 xl:px-16 flex items-center justify-between gap-12 xl:gap-20 h-full py-12">
          <div className="w-[52%] xl:w-[54%] flex flex-col justify-center relative min-h-[520px]">
            {aboutIntroChapters.map((chapter, idx) => (
              <div
                key={chapter.id}
                ref={(el) => {
                  textRefs.current[idx] = el;
                }}
                className="absolute inset-0 flex flex-col justify-center select-none"
                style={idx === 0 ? undefined : { opacity: 0, visibility: "hidden" }}
              >
                <div className="space-y-1">
                  {chapter.headlineLines.map((line, lineIdx) => (
                    <div key={lineIdx} className="overflow-hidden">
                      <h2
                        ref={(el) => {
                          lineRefs.current[idx][lineIdx] = el;
                        }}
                        className={`font-display text-5xl sm:text-6xl lg:text-[3.5rem] xl:text-[4.5rem] 2xl:text-[5.5rem] uppercase tracking-wide leading-[0.88] ${headlineColor(idx, lineIdx)}`}
                      >
                        {line}
                      </h2>
                    </div>
                  ))}
                </div>
                {chapter.supporting && (
                  <div className="mt-8 max-w-xl">
                    <p className="text-base sm:text-lg xl:text-xl text-neutral-300 font-normal leading-relaxed">
                      {chapter.supporting}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="w-[48%] xl:w-[46%] h-[74vh] max-h-[720px] relative rounded-3xl overflow-hidden bg-[#0c0e14] shadow-2xl shadow-black/80 group isolate">
            {aboutIntroChapters.map((chapter, idx) => (
              <div
                key={chapter.id}
                ref={(el) => {
                  imageRefs.current[idx] = el;
                }}
                className="absolute inset-0 w-full h-full overflow-hidden will-change-transform"
                style={idx === 0 ? { zIndex: 10 } : { opacity: 0, visibility: "hidden" }}
              >
                <Image
                  src={chapter.image}
                  alt={chapter.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 70vw, 100vw"
                  className={`object-cover select-none transition-transform duration-700 ease-out group-hover:scale-105 ${
                    chapter.imagePosition || "object-center"
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#08090b]/60 via-transparent to-[#08090b]/20 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MOBILE & TABLET (<lg): sticky stacking card deck */}
      <div className="block lg:hidden w-full px-4 sm:px-8 pt-8 pb-16 sm:pt-12 sm:pb-20">
        <div className="max-w-xl sm:max-w-2xl mx-auto">
          <div className="mb-6 sm:mb-8 px-1">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl uppercase tracking-wide text-white">
              THE PERSON BEHIND THE FEED.
            </h2>
          </div>

          <div className="relative w-full">
            {aboutIntroChapters.map((chapter, idx) => {
              const isLast = idx === TOTAL - 1;
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
                  className={`sticky w-full rounded-2xl sm:rounded-3xl bg-[#0c0e14] border border-white/10 p-5 sm:p-7 shadow-[0_-8px_24px_-2px_rgba(0,0,0,0.9),0_16px_36px_-6px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden origin-top will-change-transform ${
                    isLast ? "mb-6 sm:mb-8" : "mb-16 sm:mb-24"
                  }`}
                >
                  <span className="absolute top-2.5 left-2.5 w-2 h-2 border-t border-l border-white/20 pointer-events-none" aria-hidden="true" />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 border-t border-r border-white/20 pointer-events-none" aria-hidden="true" />
                  <span className="absolute bottom-2.5 left-2.5 w-2 h-2 border-b border-l border-white/20 pointer-events-none" aria-hidden="true" />
                  <span className="absolute bottom-2.5 right-2.5 w-2 h-2 border-b border-r border-white/20 pointer-events-none" aria-hidden="true" />

                  <div className="flex items-center justify-between pb-3 mb-3 sm:mb-4 border-b border-white/[0.08]">
                    <span className="font-mono text-xs font-bold text-[#e51d24]">CHAPTER {chapter.chapterNum}</span>
                    <span className="font-mono text-xs font-medium text-neutral-400">
                      0{idx + 1} / 0{TOTAL}
                    </span>
                  </div>

                  <div className="mb-3 space-y-0.5">
                    {chapter.headlineLines.map((line, lineIdx) => (
                      <h3
                        key={lineIdx}
                        className={`font-display text-2xl sm:text-3xl md:text-4xl uppercase tracking-wide leading-[0.92] ${headlineColor(idx, lineIdx)}`}
                      >
                        {line}
                      </h3>
                    ))}
                  </div>

                  <div className="w-full aspect-[16/10] sm:aspect-[16/9] max-h-[220px] sm:max-h-[270px] rounded-xl overflow-hidden bg-[#12151d] border border-white/10 relative my-2 sm:my-3">
                    <Image
                      src={chapter.image}
                      alt={chapter.imageAlt}
                      fill
                      sizes="(min-width: 640px) 640px, calc(100vw - 2rem)"
                      className={`object-cover ${chapter.imagePosition || "object-center"}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e14]/60 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {chapter.supporting && (
                    <p className="text-xs sm:text-sm text-neutral-300 font-normal leading-relaxed mt-2.5">{chapter.supporting}</p>
                  )}
                </article>
              );
            })}

            {/* Dwell runway so the last card can settle before the section ends */}
            <div className="w-full h-[45vh] max-h-[360px] pointer-events-none" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}

interface ImageTransition {
  opacity: number;
  transform: string;
  clipPath: string;
  zIndex: number;
}

/**
 * Photo transition family. `blur()` filters were removed from the diagonal and
 * scale-fade variants: animating a filter on a ~700px image re-rasterised the
 * layer every frame. Scale + opacity carry the same beat.
 */
function getImageTransitionStyle(
  type: NonNullable<IntroChapter["transitionType"]>,
  isCurrent: boolean,
  tau: number,
  reduced: boolean
): ImageTransition {
  if (reduced) {
    return { opacity: isCurrent ? 1 - tau : tau, transform: "none", clipPath: "none", zIndex: isCurrent ? 10 : 20 };
  }
  if (isCurrent && tau === 0) {
    return { opacity: 1, transform: "translate3d(0, 0, 0)", clipPath: "none", zIndex: 10 };
  }

  switch (type) {
    case "horizontal-wipe":
      return isCurrent
        ? { opacity: 1 - tau, transform: `translate3d(${-tau * 12}%, 0, 0) scale(${1 - tau * 0.04})`, clipPath: "none", zIndex: 10 }
        : { opacity: 1, transform: `translate3d(${(1 - tau) * 8}%, 0, 0)`, clipPath: `inset(0 0 0 ${(1 - tau) * 100}%)`, zIndex: 20 };
    case "diagonal-wipe": {
      if (isCurrent) {
        return { opacity: 1 - tau, transform: `scale(${1 - tau * 0.05})`, clipPath: "none", zIndex: 10 };
      }
      const inset = (1 - tau) * 100;
      return {
        opacity: 1,
        transform: `scale(${1.04 - tau * 0.04})`,
        clipPath: `polygon(${inset}% 0, 100% 0, 100% 100%, ${Math.max(0, inset - 20)}% 100%)`,
        zIndex: 20,
      };
    }
    case "parallax-slide":
      return isCurrent
        ? { opacity: 1 - tau * 0.8, transform: `translate3d(${-tau * 15}%, 0, 0) scale(${1 - tau * 0.04})`, clipPath: "none", zIndex: 10 }
        : { opacity: tau, transform: `translate3d(${(1 - tau) * 15}%, 0, 0) scale(${1.04 - tau * 0.04})`, clipPath: "none", zIndex: 20 };
    case "vertical-reveal":
      return isCurrent
        ? { opacity: 1 - tau, transform: `translate3d(0, ${-tau * 8}%, 0) scale(${1 - tau * 0.03})`, clipPath: "none", zIndex: 10 }
        : { opacity: 1, transform: `translate3d(0, ${(1 - tau) * 6}%, 0)`, clipPath: `inset(${(1 - tau) * 100}% 0 0 0)`, zIndex: 20 };
    default:
      return isCurrent
        ? { opacity: 1 - tau, transform: `scale(${1 - tau * 0.06})`, clipPath: "none", zIndex: 10 }
        : { opacity: tau, transform: `scale(${1.06 - tau * 0.06})`, clipPath: "none", zIndex: 20 };
  }
}
