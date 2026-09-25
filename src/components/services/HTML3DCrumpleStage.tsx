"use client";

import React, {
  useEffect,
  useRef,
  useCallback,
} from "react";
import { ServiceDetailedItem } from "@/data/servicesData";
import ServiceCardEditorial from "./ServiceCardEditorial";

interface HTML3DCrumpleStageProps {
  services: ServiceDetailedItem[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  stageWrapperRef: React.RefObject<HTMLDivElement | null>;
  isDesktop: boolean;
  prefersReducedMotion: boolean;
  onCardChange?: (index: number) => void;
  activeId: string;
}

// ---------------------------------------------------------------------------
// Math & Easing Helpers
// ---------------------------------------------------------------------------
const clamp = (val: number, min: number, max: number) =>
  Math.min(max, Math.max(min, val));

// Smooth cubic S-curve: f(x) = x^2 * (3 - 2x)
const smoothstep = (x: number) => x * x * (3 - 2 * x);

export default function HTML3DCrumpleStage({
  services,
  containerRef,
  stageWrapperRef,
  isDesktop,
  prefersReducedMotion,
  onCardChange,
  activeId,
}: HTML3DCrumpleStageProps) {
  const stageViewportRef = useRef<HTMLDivElement>(null);
  const cardContainerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardInnerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardCreaseRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Stable ref for the onCardChange callback — avoids putting it in useCallback deps
  // which would cascade through the entire effect chain and reset the animation.
  const onCardChangeRef = useRef(onCardChange);
  onCardChangeRef.current = onCardChange;

  // Smooth scroll interpolation state (RAF loop)
  const stateRef = useRef({
    currentProgress: 0,
    targetProgress: 0,
    velocity: 0,
    lastTime: performance.now(),
    animFrameId: 0,
    lastReportedIndex: 0,
    isDisposed: false,
  });

  // Guard: applyCardTransforms(0) should only run on true first mount
  const hasMountedRef = useRef(false);


  // -------------------------------------------------------------------------
  // Core 3D Card Animation Renderer
  // Directly updates DOM styles for zero-lag, 120fps hardware acceleration
  // -------------------------------------------------------------------------
  const applyCardTransforms = useCallback(
    (progress: number) => {
      const N = services.length - 1; // 3
      const clampedP = clamp(progress, 0, N);
      const baseIdx = Math.min(Math.floor(clampedP), N - 1);
      const t = clampedP - baseIdx; // 0.0 to 1.0 between baseIdx and baseIdx + 1

      // Accurate active index reporting:
      // When t >= 0.70, the leaving card is already mostly crumpled/gone and the next card is dominant
      const currentActiveIdx =
        clampedP >= N ? N : t >= 0.7 ? baseIdx + 1 : baseIdx;
      if (currentActiveIdx !== stateRef.current.lastReportedIndex) {
        stateRef.current.lastReportedIndex = currentActiveIdx;
        onCardChangeRef.current?.(currentActiveIdx);
      }

      services.forEach((_, k) => {
        const cardEl = cardContainerRefs.current[k];
        const innerEl = cardInnerRefs.current[k];
        const creaseEl = cardCreaseRefs.current[k];
        if (!cardEl || !innerEl) return;

        // Case 1: Cards in the past (already tossed away)
        if (k < baseIdx) {
          const tossX = isDesktop ? 960 : 480;
          const tossY = isDesktop ? -460 : -340;
          cardEl.style.transform = `translate3d(${tossX}px, ${tossY}px, -480px) rotateX(55deg) rotateY(-85deg) rotateZ(30deg) scale(0.4)`;
          cardEl.style.opacity = "0";
          cardEl.style.visibility = "hidden";
          cardEl.style.pointerEvents = "none";
          cardEl.style.zIndex = "10";
          if (creaseEl) creaseEl.style.opacity = "0";
          innerEl.style.clipPath = "none";
          innerEl.style.borderRadius = "1.5rem";
          innerEl.style.boxShadow = "none";
          return;
        }

        // Case 2: The very last card at the end of the scroll track
        if (clampedP >= N && k === N) {
          cardEl.style.transform = "translate3d(0, 0, 0) scale(1)";
          cardEl.style.opacity = "1";
          cardEl.style.visibility = "visible";
          cardEl.style.pointerEvents = "auto";
          cardEl.style.zIndex = "50";
          if (creaseEl) creaseEl.style.opacity = "0";
          innerEl.style.clipPath = "none";
          innerEl.style.borderRadius = "1.5rem";
          innerEl.style.boxShadow = "0 32px 80px rgba(0,0,0,0.9)";
          return;
        }

        // Case 3: The Active Leaving Card (k === baseIdx)
        if (k === baseIdx) {
          cardEl.style.visibility = "visible";
          cardEl.style.zIndex = "50";

          // Reduced motion fallback
          if (prefersReducedMotion) {
            const fade = clamp(1 - t * 1.6, 0, 1);
            cardEl.style.transform = `translate3d(0, ${-t * 50}px, 0)`;
            cardEl.style.opacity = String(fade);
            cardEl.style.pointerEvents = t > 0.2 ? "none" : "auto";
            if (creaseEl) creaseEl.style.opacity = "0";
            return;
          }

          // -----------------------------------------------------------------
          // PHYSICAL PAPER CRUMPLE & KINETIC TOSS CHOREOGRAPHY
          //
          // t in [0.00, 0.55]: STABLE READING DWELL ZONE
          // 100% flat at (0, 0, 0), zero jitter, full cursor interactivity
          //
          // t in [0.55, 1.00]: TACTILE CRUMPLE CRUNCH & PARABOLIC TOSS
          // Progressive polygonal crunch, crease shading, and projectile flyaway
          // -----------------------------------------------------------------
          if (t <= 0.55) {
            // Resting flat in the center
            cardEl.style.transform = "translate3d(0, 0, 0) scale(1)";
            cardEl.style.opacity = "1";
            cardEl.style.pointerEvents = "auto";
            innerEl.style.clipPath = "none";
            innerEl.style.borderRadius = "1.5rem";
            innerEl.style.boxShadow = "0 32px 80px rgba(0,0,0,0.9)";
            if (creaseEl) creaseEl.style.opacity = "0";
          } else {
            // Transition progress u from 0.0 to 1.0
            const u = (t - 0.55) / 0.45;

            if (u <= 0.48) {
              // PHASE A: CRUNCH & PAPER CRUMPLE (u in [0.00, 0.48])
              const c = u / 0.48; // 0 to 1
              const cEased = smoothstep(c);

              // 3D torsional rotation during crumple
              const rotX = cEased * 26;
              const rotY = -cEased * 38;
              const rotZ = cEased * 16;

              // Compressive scale
              const scaleX = 1 - cEased * 0.42;
              const scaleY = 1 - cEased * 0.48;
              const scaleZ = 1 + cEased * 1.6;

              // Lateral lift off surface
              const posX = cEased * (isDesktop ? 120 : 60);
              const posY = -cEased * (isDesktop ? 70 : 40);
              const posZ = cEased * 40;

              cardEl.style.transform = `translate3d(${posX.toFixed(1)}px, ${posY.toFixed(1)}px, ${posZ.toFixed(1)}px) rotateX(${rotX.toFixed(1)}deg) rotateY(${rotY.toFixed(1)}deg) rotateZ(${rotZ.toFixed(1)}deg) scale3d(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)}, ${scaleZ.toFixed(3)})`;
              cardEl.style.opacity = "1";
              cardEl.style.pointerEvents = "none";

              // Morphing irregular crumple edge polygon
              const p0x = (cEased * 10).toFixed(1);
              const p0y = (cEased * 6).toFixed(1);
              const p1x = (50 - cEased * 2).toFixed(1);
              const p1y = (cEased * 14).toFixed(1);
              const p2x = (100 - cEased * 10).toFixed(1);
              const p2y = (cEased * 8).toFixed(1);
              const p3x = (100 - cEased * 5).toFixed(1);
              const p3y = (50 - cEased * 5).toFixed(1);
              const p4x = (100 - cEased * 12).toFixed(1);
              const p4y = (100 - cEased * 10).toFixed(1);
              const p5x = (50 + cEased * 2).toFixed(1);
              const p5y = (100 - cEased * 18).toFixed(1);
              const p6x = (cEased * 14).toFixed(1);
              const p6y = (100 - cEased * 8).toFixed(1);
              const p7x = (cEased * 6).toFixed(1);
              const p7y = "50";

              innerEl.style.clipPath = `polygon(${p0x}% ${p0y}%, ${p1x}% ${p1y}%, ${p2x}% ${p2y}%, ${p3x}% ${p3y}%, ${p4x}% ${p4y}%, ${p5x}% ${p5y}%, ${p6x}% ${p6y}%, ${p7x}% ${p7y}%)`;
              innerEl.style.borderRadius = `${(24 + cEased * 30).toFixed(0)}px`;
              innerEl.style.boxShadow = `inset 0 0 ${(cEased * 60).toFixed(0)}px rgba(0,0,0,0.95), 0 30px 60px rgba(0,0,0,0.85)`;

              // Crease lines opacity ramp
              if (creaseEl) {
                creaseEl.style.opacity = String(clamp(cEased * 1.3, 0, 1));
              }
            } else {
              // PHASE B: KINETIC PARABOLIC TOSS (u in [0.48, 1.00])
              const v = (u - 0.48) / 0.52; // 0 to 1
              const vAccel = Math.pow(v, 1.4);

              const startX = isDesktop ? 120 : 60;
              const startY = isDesktop ? -70 : -40;
              const startZ = 40;

              const tossDistX = isDesktop ? 820 : 420;
              const posX = startX + vAccel * tossDistX;
              // Ballistic flight arc (rises then arcs down)
              const posY = startY - 260 * v + 240 * (v * v);
              const posZ = startZ - Math.pow(v, 2) * (isDesktop ? 480 : 360);

              const rotX = 26 + v * (isDesktop ? 75 : 55);
              const rotY = -38 - v * (isDesktop ? 130 : 90);
              const rotZ = 16 + v * (isDesktop ? 50 : 35);
              const scale = (0.55 * (1 - v * 0.35)).toFixed(3);

              // Clean fade dissolve
              const opacity = clamp(1 - (v - 0.2) / 0.75, 0, 1);

              cardEl.style.transform = `translate3d(${posX.toFixed(1)}px, ${posY.toFixed(1)}px, ${posZ.toFixed(1)}px) rotateX(${rotX.toFixed(1)}deg) rotateY(${rotY.toFixed(1)}deg) rotateZ(${rotZ.toFixed(1)}deg) scale(${scale})`;
              cardEl.style.opacity = String(opacity);
              cardEl.style.pointerEvents = "none";

              if (creaseEl) {
                creaseEl.style.opacity = String(clamp(opacity, 0, 1));
              }
            }
          }
          return;
        }

        // Case 4: The Entering Card (k === baseIdx + 1)
        if (k === baseIdx + 1) {
          cardEl.style.visibility = "visible";
          cardEl.style.zIndex = "40";
          innerEl.style.clipPath = "none";
          innerEl.style.borderRadius = "1.5rem";
          innerEl.style.boxShadow = "0 32px 80px rgba(0,0,0,0.9)";
          if (creaseEl) creaseEl.style.opacity = "0";

          if (prefersReducedMotion) {
            const enterFade = clamp(t * 1.8 - 0.6, 0, 1);
            cardEl.style.transform = `translate3d(0, ${(1 - enterFade) * 30}px, 0)`;
            cardEl.style.opacity = String(enterFade);
            cardEl.style.pointerEvents = t > 0.8 ? "auto" : "none";
            return;
          }

          if (t <= 0.55) {
            // Waiting neatly underneath in stack
            cardEl.style.transform = "translate3d(0, 20px, -35px) scale(0.96)";
            cardEl.style.opacity = "0.35";
            cardEl.style.pointerEvents = "none";
          } else {
            // Smoothly elevates and un-dims as Card k crunches & tosses away
            const w = (t - 0.55) / 0.45; // 0 to 1
            const wEased = 1 - Math.pow(1 - w, 3); // cubic ease-out

            const curY = 20 * (1 - wEased);
            const curZ = -35 * (1 - wEased);
            const curScale = 0.96 + 0.04 * wEased;
            const curOpacity = 0.35 + 0.65 * wEased;

            cardEl.style.transform = `translate3d(0, ${curY.toFixed(1)}px, ${curZ.toFixed(1)}px) scale(${curScale.toFixed(3)})`;
            cardEl.style.opacity = String(curOpacity.toFixed(3));
            cardEl.style.pointerEvents = w > 0.8 ? "auto" : "none";
          }
          return;
        }

        // Case 5: Deep background cards (k > baseIdx + 1)
        if (k > baseIdx + 1) {
          cardEl.style.transform = "translate3d(0, 40px, -70px) scale(0.92)";
          cardEl.style.opacity = "0";
          cardEl.style.visibility = "hidden";
          cardEl.style.pointerEvents = "none";
          cardEl.style.zIndex = "10";
          if (creaseEl) creaseEl.style.opacity = "0";
        }
      });
    },
    [isDesktop, prefersReducedMotion, services]
  );

  // -------------------------------------------------------------------------
  // High-Performance Spring Animation Loop (120 FPS, Zero React Re-renders)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const state = stateRef.current;
    state.isDisposed = false;

    const renderLoop = (time: number) => {
      if (state.isDisposed) return;
      state.animFrameId = requestAnimationFrame(renderLoop);

      const dt = Math.min(0.05, (time - state.lastTime) / 1000);
      state.lastTime = time;

      // Critically damped spring physics:
      // Snappy responsiveness (omega = 24 rad/s) catches up instantly to rapid scroll
      // yet filters out discrete mousewheel notch clicks with zero latency.
      const diff = state.targetProgress - state.currentProgress;

      if (Math.abs(diff) > 0.0001) {
        const decay = 1 - Math.exp(-24 * dt);
        state.currentProgress += diff * decay;
        applyCardTransforms(state.currentProgress);
      }
    };

    state.animFrameId = requestAnimationFrame(renderLoop);

    return () => {
      state.isDisposed = true;
      cancelAnimationFrame(state.animFrameId);
    };
  }, [applyCardTransforms]);

  // -------------------------------------------------------------------------
  // Direct Window Scroll Listener
  // Calculates exact progress without triggering React state updates
  // -------------------------------------------------------------------------
  useEffect(() => {
    const onScroll = () => {
      const container = containerRef.current;
      const stage = stageWrapperRef.current;
      if (!container || !stage) return;

      const stageRect = stage.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Foolproof sticky progress:
      // When stage enters sticky position, container scrolls up relative to stage
      const scrolledPx = stageRect.top - containerRect.top;
      const scrollDistance = container.offsetHeight - stage.offsetHeight;

      if (scrollDistance <= 0) return;

      const rawProgress = scrolledPx / scrollDistance;
      const clamped = clamp(rawProgress, 0, 1);

      // Raw uncompressed target progress across cards (0.0 to services.length - 1)
      const target = clamped * (services.length - 1);
      stateRef.current.targetProgress = target;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    // Initial mount styling guarantee — only on true first mount,
    // NOT on every effect re-run (which would reset cards to position 0)
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      applyCardTransforms(0);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [containerRef, stageWrapperRef, applyCardTransforms, services.length]);

  return (
    <div
      ref={stageViewportRef}
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
              className="w-full relative rounded-3xl bg-[#0c0e13] shadow-2xl"
              style={{
                willChange: "clip-path, border-radius, box-shadow",
              }}
            >
              {/* Dynamic Origami Crease & Fold Overlay Layer */}
              <div
                ref={(el) => {
                  cardCreaseRefs.current[idx] = el;
                }}
                className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden z-30"
                style={{ opacity: 0, willChange: "opacity" }}
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
              <ServiceCardEditorial
                service={service}
                isActive={isCurrentActive}
                index={idx}
                total={services.length}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
