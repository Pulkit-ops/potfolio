"use client";

import React, { useEffect, useRef } from "react";
import { ServiceDetailedItem } from "@/data/servicesData";
import ServiceCardEditorial from "./ServiceCardEditorial";

interface HTML3DCrumpleStageProps {
  services: ServiceDetailedItem[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  stageWrapperRef: React.RefObject<HTMLDivElement | null>;
  onCardChange?: (index: number) => void;
  activeId: string;
}

// ---------------------------------------------------------------------------
// Math & Easing Helpers
// ---------------------------------------------------------------------------
const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

// Smooth cubic S-curve: f(x) = x^2 * (3 - 2x)
const smoothstep = (x: number) => x * x * (3 - 2 * x);

const TOSS_X = 960;
const TOSS_Y = -460;

/**
 * Desktop-only paper crumple & toss stage.
 *
 * Performance notes (vs. the previous version):
 *  - The spring loop used to run requestAnimationFrame forever, on every
 *    device (including phones, where this stage is display:none). It now runs
 *    only while progress is converging and sleeps otherwise.
 *  - Scroll handling attaches only while the track is near the viewport and
 *    derives progress from scrollY + cached offsets, instead of two
 *    getBoundingClientRect() calls plus offsetHeight per scroll event.
 *  - Per-frame writes are limited to transform / opacity / clip-path. The old
 *    animated border-radius and 60px inset box-shadow (a full repaint of an
 *    880×690 card each frame) are replaced by a pre-rendered shade layer whose
 *    opacity is animated.
 */
export default function HTML3DCrumpleStage({
  services,
  containerRef,
  stageWrapperRef,
  onCardChange,
  activeId,
}: HTML3DCrumpleStageProps) {
  const cardContainerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardInnerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardCreaseRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardShadeRefs = useRef<(HTMLDivElement | null)[]>([]);

  const onCardChangeRef = useRef(onCardChange);
  onCardChangeRef.current = onCardChange;

  useEffect(() => {
    const container = containerRef.current;
    const stage = stageWrapperRef.current;
    if (!container || !stage) return;

    const desktopMq = window.matchMedia("(min-width: 1024px)");
    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const N = services.length - 1;

    let current = 0;
    let target = 0;
    let lastTime = 0;
    let raf = 0;
    let lastReported = 0;
    let active = false;

    // Cached layout
    let trackTop = 0;
    let stickyTop = 0;
    let travel = 1;

    const measure = () => {
      const r = container.getBoundingClientRect();
      trackTop = r.top + window.scrollY;
      stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
      travel = Math.max(1, container.offsetHeight - stage.offsetHeight);
    };

    const setCard = (
      k: number,
      transform: string,
      opacity: number,
      visible: boolean,
      interactive: boolean,
      zIndex: number,
      crease: number,
      shade: number,
      clip: string
    ) => {
      const cardEl = cardContainerRefs.current[k];
      const innerEl = cardInnerRefs.current[k];
      if (!cardEl || !innerEl) return;
      cardEl.style.transform = transform;
      cardEl.style.opacity = String(opacity);
      cardEl.style.visibility = visible ? "visible" : "hidden";
      cardEl.style.pointerEvents = interactive ? "auto" : "none";
      cardEl.style.zIndex = String(zIndex);
      innerEl.style.clipPath = clip;
      const creaseEl = cardCreaseRefs.current[k];
      if (creaseEl) creaseEl.style.opacity = String(crease);
      const shadeEl = cardShadeRefs.current[k];
      if (shadeEl) shadeEl.style.opacity = String(shade);
    };

    const apply = (progress: number) => {
      const reduced = reduceMq.matches;
      const p = clamp(progress, 0, N);
      const baseIdx = Math.min(Math.floor(p), N - 1);
      const t = p - baseIdx;

      // The next card becomes "active" once the leaving card is mostly gone.
      const activeIdx = p >= N ? N : t >= 0.7 ? baseIdx + 1 : baseIdx;
      if (activeIdx !== lastReported) {
        lastReported = activeIdx;
        onCardChangeRef.current?.(activeIdx);
      }

      for (let k = 0; k <= N; k++) {
        // Already tossed away
        if (k < baseIdx) {
          setCard(k, `translate3d(${TOSS_X}px, ${TOSS_Y}px, -480px) rotateX(55deg) rotateY(-85deg) rotateZ(30deg) scale(0.4)`, 0, false, false, 10, 0, 0, "none");
          continue;
        }
        // Last card resting at the end of the track
        if (p >= N && k === N) {
          setCard(k, "translate3d(0, 0, 0)", 1, true, true, 50, 0, 0, "none");
          continue;
        }
        // Leaving card
        if (k === baseIdx) {
          if (reduced) {
            setCard(k, `translate3d(0, ${(-t * 50).toFixed(1)}px, 0)`, clamp(1 - t * 1.6, 0, 1), true, t <= 0.2, 50, 0, 0, "none");
            continue;
          }
          // t ∈ [0, 0.55]: flat reading dwell
          if (t <= 0.55) {
            setCard(k, "translate3d(0, 0, 0)", 1, true, true, 50, 0, 0, "none");
            continue;
          }
          const u = (t - 0.55) / 0.45;
          if (u <= 0.48) {
            // Phase A: crunch & crumple
            const c = smoothstep(u / 0.48);
            const transform = `translate3d(${(c * 120).toFixed(1)}px, ${(-c * 70).toFixed(1)}px, ${(c * 40).toFixed(1)}px) rotateX(${(c * 26).toFixed(1)}deg) rotateY(${(-c * 38).toFixed(1)}deg) rotateZ(${(c * 16).toFixed(1)}deg) scale3d(${(1 - c * 0.42).toFixed(3)}, ${(1 - c * 0.48).toFixed(3)}, ${(1 + c * 1.6).toFixed(3)})`;
            const f = (v: number) => v.toFixed(1);
            const clip = `polygon(${f(c * 10)}% ${f(c * 6)}%, ${f(50 - c * 2)}% ${f(c * 14)}%, ${f(100 - c * 10)}% ${f(c * 8)}%, ${f(100 - c * 5)}% ${f(50 - c * 5)}%, ${f(100 - c * 12)}% ${f(100 - c * 10)}%, ${f(50 + c * 2)}% ${f(100 - c * 18)}%, ${f(c * 14)}% ${f(100 - c * 8)}%, ${f(c * 6)}% 50%)`;
            setCard(k, transform, 1, true, false, 50, clamp(c * 1.3, 0, 1), c, clip);
          } else {
            // Phase B: parabolic toss
            const v = (u - 0.48) / 0.52;
            const va = Math.pow(v, 1.4);
            const posX = 120 + va * 820;
            const posY = -70 - 260 * v + 240 * v * v;
            const posZ = 40 - v * v * 480;
            const opacity = clamp(1 - (v - 0.2) / 0.75, 0, 1);
            const transform = `translate3d(${posX.toFixed(1)}px, ${posY.toFixed(1)}px, ${posZ.toFixed(1)}px) rotateX(${(26 + v * 75).toFixed(1)}deg) rotateY(${(-38 - v * 130).toFixed(1)}deg) rotateZ(${(16 + v * 50).toFixed(1)}deg) scale(${(0.55 * (1 - v * 0.35)).toFixed(3)})`;
            const clip = "polygon(10% 6%, 48% 14%, 90% 8%, 95% 45%, 88% 90%, 52% 82%, 14% 92%, 6% 50%)";
            setCard(k, transform, opacity, true, false, 50, opacity, 1, clip);
          }
          continue;
        }
        // Entering card
        if (k === baseIdx + 1) {
          if (reduced) {
            const e = clamp(t * 1.8 - 0.6, 0, 1);
            setCard(k, `translate3d(0, ${((1 - e) * 30).toFixed(1)}px, 0)`, e, true, t > 0.8, 40, 0, 0, "none");
            continue;
          }
          if (t <= 0.55) {
            setCard(k, "translate3d(0, 20px, -35px) scale(0.96)", 0.35, true, false, 40, 0, 0, "none");
          } else {
            const w = (t - 0.55) / 0.45;
            const we = 1 - Math.pow(1 - w, 3);
            setCard(k, `translate3d(0, ${(20 * (1 - we)).toFixed(1)}px, ${(-35 * (1 - we)).toFixed(1)}px) scale(${(0.96 + 0.04 * we).toFixed(3)})`, +(0.35 + 0.65 * we).toFixed(3), true, w > 0.8, 40, 0, 0, "none");
          }
          continue;
        }
        // Deep background
        setCard(k, "translate3d(0, 40px, -70px) scale(0.92)", 0, false, false, 10, 0, 0, "none");
      }
    };

    // Critically damped follow (ω = 24 rad/s): absorbs wheel-notch steps,
    // then stops scheduling frames once settled.
    const tick = (time: number) => {
      raf = 0;
      const dt = lastTime ? Math.min(0.05, (time - lastTime) / 1000) : 1 / 60;
      lastTime = time;
      const diff = target - current;
      if (Math.abs(diff) < 0.0005) {
        current = target;
        apply(current);
        lastTime = 0;
        return;
      }
      current += diff * (1 - Math.exp(-24 * dt));
      apply(current);
      raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      const scrolled = window.scrollY + stickyTop - trackTop;
      target = clamp(scrolled / travel, 0, 1) * N;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const setActive = (on: boolean) => {
      if (on === active) return;
      active = on;
      if (on) {
        measure();
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
      } else {
        window.removeEventListener("scroll", onScroll);
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        lastTime = 0;
        // Snap to the resting state for wherever the user left the track.
        current = target;
        apply(current);
      }
    };

    // display:none below lg → never intersects → nothing ever runs on phones.
    const io = new IntersectionObserver((entries) => setActive(entries[0].isIntersecting && desktopMq.matches), {
      rootMargin: "150px 0px",
    });
    io.observe(container);

    const ro = new ResizeObserver(() => {
      if (!active) return;
      measure();
      onScroll();
    });
    ro.observe(container);

    const onReduce = () => apply(current);
    reduceMq.addEventListener("change", onReduce);

    apply(0);

    return () => {
      io.disconnect();
      ro.disconnect();
      reduceMq.removeEventListener("change", onReduce);
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [containerRef, stageWrapperRef, services.length]);

  return (
    <div
      className="relative w-full h-full flex items-center justify-center select-none"
      style={{
        perspective: "1600px",
        perspectiveOrigin: "60% 50%",
      }}
    >
      {services.map((service, idx) => {
        const isCurrentActive = service.id === activeId;

        return (
          <div
            key={service.id}
            ref={(el) => {
              cardContainerRefs.current[idx] = el;
            }}
            className="absolute w-full max-w-[880px] flex items-center justify-center inset-0 m-auto h-fit"
            style={{
              willChange: "transform, opacity",
              transformOrigin: "65% 50%",
              visibility: idx <= 1 ? "visible" : "hidden",
              backfaceVisibility: "hidden",
              zIndex: idx === 0 ? 50 : 40 - idx * 10,
              opacity: idx === 0 ? 1 : 0,
              transform:
                idx === 0
                  ? "translate3d(0, 0, 0)"
                  : "translate3d(0, 20px, -35px) scale(0.96)",
            }}
          >
            {/* The Morphing Card Shell with solid opaque background */}
            <div
              ref={(el) => {
                cardInnerRefs.current[idx] = el;
              }}
              className="w-full relative rounded-3xl bg-[#0c0e13]"
            >
              {/* Crumple shading: static inset shadow, only its opacity animates */}
              <div
                ref={(el) => {
                  cardShadeRefs.current[idx] = el;
                }}
                className="absolute inset-0 pointer-events-none rounded-3xl z-20 shadow-[inset_0_0_60px_rgba(0,0,0,0.95)]"
                style={{ opacity: 0 }}
                aria-hidden="true"
              />
              {/* Dynamic Origami Crease & Fold Overlay Layer */}
              <div
                ref={(el) => {
                  cardCreaseRefs.current[idx] = el;
                }}
                className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden z-30"
                style={{ opacity: 0 }}
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 880 690"
                  preserveAspectRatio="none"
                  className="w-full h-full"
                >
                  {/* Specular Fold Ridges (White/Silver sharp highlight edges) */}
                  <line
                    x1="0"
                    y1="210"
                    x2="520"
                    y2="0"
                    stroke="rgba(255,255,255,0.75)"
                    strokeWidth="2"
                    strokeDasharray="6 3"
                  />
                  <line
                    x1="120"
                    y1="690"
                    x2="880"
                    y2="180"
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth="2.5"
                  />
                  <line
                    x1="0"
                    y1="480"
                    x2="680"
                    y2="690"
                    stroke="rgba(255,255,255,0.65)"
                    strokeWidth="1.5"
                  />
                  <line
                    x1="380"
                    y1="0"
                    x2="880"
                    y2="460"
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth="2"
                  />
                  <line
                    x1="240"
                    y1="120"
                    x2="480"
                    y2="520"
                    stroke="rgba(255,255,255,0.6)"
                    strokeWidth="1.5"
                  />

                  {/* Deep Crease Valleys (Shadow troughs) */}
                  <line
                    x1="2"
                    y1="212"
                    x2="522"
                    y2="2"
                    stroke="rgba(0,0,0,0.85)"
                    strokeWidth="3"
                  />
                  <line
                    x1="122"
                    y1="692"
                    x2="882"
                    y2="182"
                    stroke="rgba(0,0,0,0.9)"
                    strokeWidth="4"
                  />
                  <line
                    x1="2"
                    y1="482"
                    x2="682"
                    y2="692"
                    stroke="rgba(0,0,0,0.8)"
                    strokeWidth="3"
                  />
                  <line
                    x1="382"
                    y1="2"
                    x2="882"
                    y2="462"
                    stroke="rgba(0,0,0,0.85)"
                    strokeWidth="3"
                  />
                  <line
                    x1="242"
                    y1="122"
                    x2="482"
                    y2="522"
                    stroke="rgba(0,0,0,0.75)"
                    strokeWidth="3"
                  />

                  {/* Faceted Triangular Origami Shading Polygons */}
                  <polygon
                    points="0,210 520,0 240,120"
                    fill="rgba(255,255,255,0.06)"
                  />
                  <polygon
                    points="120,690 480,520 880,180"
                    fill="rgba(0,0,0,0.3)"
                  />
                  <polygon
                    points="0,480 240,120 480,520 120,690"
                    fill="rgba(0,0,0,0.2)"
                  />
                  <polygon
                    points="380,0 880,180 880,460 480,520"
                    fill="rgba(255,255,255,0.04)"
                  />
                </svg>
              </div>

              {/* The Live Editorial HTML Card */}
              <ServiceCardEditorial service={service} isActive={isCurrentActive} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
