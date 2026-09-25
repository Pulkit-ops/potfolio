"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { ServiceDetailedItem } from "@/data/servicesData";
import { useContactModal } from "@/components/contact/ContactModalContext";
import Image from "next/image";
import styles from "./ServicesMobileMethods.module.css";

interface ServicesMobileMethodsProps {
  services: ServiceDetailedItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

// Stage node short label mapping
const RAIL_NODE_LABELS: Record<string, string> = {
  "make-people-stop": "STOP",
  "keep-them-around": "RETAIN",
  "make-it-look-like-you": "DIRECT",
  "the-whole-thing": "ALL-IN",
};

// Rich, balanced card content for mobile viewports
const MOBILE_CARD_CONTENT: Record<
  string,
  {
    sublead: string;
    description: string;
    quote: string;
    deliverableLabel: string;
    deliverables: string[];
    imagePosition: string;
  }
> = {
  "make-people-stop": {
    sublead: "MAKE PEOPLE STOP.",
    description:
      "High-retention Reels, Shorts & TikToks engineered around the first 3 seconds to halt the thumb, retain viewers, and scale organically.",
    quote: "A good idea beats good lighting every single time.",
    deliverableLabel: "VIRAL RETENTION SPRINTS",
    deliverables: [
      "Thumb-Stopping Hooks & Loops",
      "Dynamic Pacing & Color Grading",
      "Sound Design & Audio Trends",
      "Platform-Native 9:16 Cuts",
    ],
    imagePosition: "center 53%",
  },
  "keep-them-around": {
    sublead: "KEEP THEM AROUND.",
    description:
      "Posting consistently is the easy part. We build audience-first content roadmaps and drop-off analytics that turn one-off casual viewers into deeply engaged advocates.",
    quote: "Subscribers are a vanity metric. True attention is the only asset.",
    deliverableLabel: "AUDIENCE & CHANNEL ENGINE",
    deliverables: [
      "Audience-First Roadmaps",
      "Daily Publishing & Cadence",
      "Hook-Driven Copy & Captions",
      "Retention & Drop-Off Audits",
    ],
    imagePosition: "center 28%",
  },
  "make-it-look-like-you": {
    sublead: "MAKE IT LOOK LIKE YOU.",
    description:
      "Good content gets fleeting attention. Recognisable content gets remembered. We establish an unmistakable visual signature that feels like a polished editorial publication.",
    quote: "Trends come and go. Signature personality is permanent.",
    deliverableLabel: "EDITORIAL VISUAL IDENTITY",
    deliverables: [
      "Visual Feed Architecture",
      "Lighting & Photo Direction",
      "Bespoke Carousel Systems",
      "Signature Typography Rules",
    ],
    imagePosition: "center 92%",
  },
  "the-whole-thing": {
    sublead: "THE WHOLE THING.",
    description:
      "For brands and founders who need an obsessed creative partner to think through the ideas, direct monthly shooting sprints, and own the day-to-day channel presence end-to-end.",
    quote: "An in-house creative director without the corporate fluff.",
    deliverableLabel: "FULL CREATIVE STEWARDSHIP",
    deliverables: [
      "End-to-End Content Strategy",
      "Monthly Batch Video Sprints",
      "Full Daily Channel Management",
      "Direct Founder Access & Reviews",
    ],
    imagePosition: "center 50%",
  },
};

const contentFor = (service: ServiceDetailedItem) =>
  MOBILE_CARD_CONTENT[service.id] || {
    sublead: service.headline,
    description: service.tagline,
    quote: service.personalityKicker,
    deliverableLabel: "KEY DELIVERABLES",
    deliverables: service.deliverables.slice(0, 4),
    imagePosition: "center 25%",
  };

// Scroll dwell per card, as a fraction of the (stable) small viewport height.
const STEP_VH = 0.45;
const STEP_MIN = 260;
const STEP_MAX = 420;
// Dead-zone around each boundary (fraction of a step) so momentum/bounce at a
// boundary can't flicker between two cards.
const HYSTERESIS = 0.14;
// Image bay: shrinks (down to this) so the pinned card fits the screen.
const BAY_MIN = 120;
const BAY_MIN_TIGHT = 105;
const BAY_COMFORT = 180;
// Layout densities tried in order; the first one that fits the screen wins.
const DENSITIES = [
  { name: "", bayMin: BAY_MIN },
  { name: "compact", bayMin: BAY_MIN },
  { name: "tight", bayMin: BAY_MIN_TIGHT },
] as const;
const BAY_MAX = 305;

/**
 * Mobile services stage.
 *
 * Scroll-switching model: the stage pins, and the page scrolls through a
 * runway of N × STEP px; card i owns [i·STEP, (i+1)·STEP). STEP is derived
 * from the viewport, never from card height, so every card gets the same
 * dwell on every device. All four cards are rendered in one stacked grid cell
 * so the stage height never changes when the active card does.
 *
 * Pinning only happens when the whole stage fits on screen (the image bay is
 * shrunk to make it fit where possible). On screens where it can't fit, the
 * stage stays in normal flow and switches by tabs / swipe / prev-next only,
 * rather than pinning a card whose bottom half the user can't see.
 */
export default function ServicesMobileMethods({
  services,
  activeId,
  onSelect,
}: ServicesMobileMethodsProps) {
  const { openContactModal } = useContactModal();
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const runwayRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);

  const initialIndex = Math.max(0, services.findIndex((s) => s.id === activeId));
  const [mobileStageIndex, setMobileStageIndex] = useState(initialIndex);
  const activeIndexRef = useRef(initialIndex);

  // Shared with the scroll engine.
  const engine = useRef({
    pinned: false,
    step: 0,
    trackTop: 0,
    stickyTop: 0,
    programmaticUntil: 0,
  });

  const commit = useCallback(
    (idx: number) => {
      if (idx === activeIndexRef.current) return;
      activeIndexRef.current = idx;
      setMobileStageIndex(idx);
      onSelect?.(services[idx].id);
    },
    [services, onSelect]
  );

  // External selection (e.g. from the desktop index when resizing).
  useEffect(() => {
    const idx = services.findIndex((s) => s.id === activeId);
    if (idx !== -1 && idx !== activeIndexRef.current) {
      activeIndexRef.current = idx;
      setMobileStageIndex(idx);
    }
  }, [activeId, services]);

  // Explicit navigation (tabs, swipe, prev/next). When pinned, the page is
  // scrolled to the middle of that card's segment so scroll position and card
  // agree — otherwise the next scroll event would snap back to the old card.
  const selectStage = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= services.length) return;
      commit(idx);
      const e = engine.current;
      if (!e.pinned) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      e.programmaticUntil = performance.now() + (reduced ? 50 : 900);
      window.scrollTo({
        top: e.trackTop - e.stickyTop + (idx + 0.5) * e.step,
        behavior: reduced ? "auto" : "smooth",
      });
    },
    [services.length, commit]
  );

  // ── Scroll engine ─────────────────────────────────────────────────────────
  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    const runway = runwayRef.current;
    const probe = probeRef.current;
    if (!track || !stage || !runway || !probe) return;
    const e = engine.current;
    const N = services.length;
    let raf = 0;
    let attached = false;

    const setDensity = (name: string) => {
      if ((track.dataset.density ?? "") === name) return;
      if (name) track.dataset.density = name;
      else delete track.dataset.density;
    };

    const measure = () => {
      // svh is fixed for the page's lifetime; innerHeight changes as mobile
      // toolbars collapse, which would re-scale the runway mid-scroll.
      const vh = probe.offsetHeight || window.innerHeight;
      e.stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
      const available = vh - e.stickyTop - 12;
      const upper = Math.min(BAY_MAX, Math.max(235, window.innerWidth * 0.64));
      const bay = stage.querySelector<HTMLElement>("[data-bay]");

      // Prefer the roomiest density that still leaves a comfortable image;
      // otherwise the first that fits at all. (Runs on resize/content change
      // only, never per scroll.)
      const fitFor = (name: string) => {
        setDensity(name);
        const nonBay = stage.offsetHeight - (bay?.offsetHeight ?? 0);
        return Math.min(upper, available - nonBay);
      };
      const bays = DENSITIES.map((d) => fitFor(d.name));
      let pick = bays.findIndex((b) => b >= BAY_COMFORT);
      if (pick === -1) pick = bays.findIndex((b, i) => b >= DENSITIES[i].bayMin);
      const fits = pick !== -1;
      const fitBay = fits ? bays[pick] : 0;
      if (fits) setDensity(DENSITIES[pick].name);
      if (!fits) setDensity("");
      const targetBay = fits ? Math.floor(fitBay) : null;
      if (targetBay === null) track.style.removeProperty("--bay-h");
      else if (track.style.getPropertyValue("--bay-h") !== `${targetBay}px`) track.style.setProperty("--bay-h", `${targetBay}px`);

      e.pinned = fits;
      e.step = Math.round(Math.min(STEP_MAX, Math.max(STEP_MIN, vh * STEP_VH)));
      runway.style.height = fits ? `${e.step * N}px` : "0px";
      track.dataset.pinned = fits ? "on" : "off";
      e.trackTop = track.getBoundingClientRect().top + window.scrollY;
    };

    const update = () => {
      raf = 0;
      if (!e.pinned || performance.now() < e.programmaticUntil) return;
      const s = window.scrollY + e.stickyTop - e.trackTop;
      if (s < 0 || s > e.step * N) return;
      const f = s / e.step;
      const cur = activeIndexRef.current;
      let idx = cur;
      if (f >= cur + 1 + HYSTERESIS) idx = Math.min(N - 1, Math.floor(f - HYSTERESIS));
      else if (f < cur - HYSTERESIS) idx = Math.max(0, Math.floor(f + HYSTERESIS));
      if (idx !== cur) commit(idx);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    const io = new IntersectionObserver((entries) => {
      const on = entries[0].isIntersecting;
      if (on === attached) return;
      attached = on;
      if (on) {
        measure();
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
      } else {
        window.removeEventListener("scroll", onScroll);
      }
    });
    io.observe(track);

    // Stage content / width / font changes → re-fit. (Height changes caused by
    // our own bay resize converge after one pass.)
    const ro = new ResizeObserver(() => measure());
    ro.observe(stage);
    let lastW = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === lastW) return; // ignore toolbar-only resizes
      lastW = window.innerWidth;
      measure();
    };
    window.addEventListener("resize", onResize, { passive: true });
    measure();

    return () => {
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [services.length, commit]);

  // Horizontal swipe on the card
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (ev: React.TouchEvent) => {
    touchStart.current = { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
  };
  const handleTouchEnd = (ev: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const dx = ev.changedTouches[0].clientX - start.x;
    const dy = ev.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > Math.abs(dy) * 1.3 && Math.abs(dx) > 40) {
      selectStage(activeIndexRef.current + (dx < 0 ? 1 : -1));
    }
  };

  const fillPercentage = services.length > 1 ? (mobileStageIndex / (services.length - 1)) * 100 : 0;

  return (
    <div ref={trackRef} className={styles.mobileTrack}>
      <div ref={probeRef} className={styles.svhProbe} aria-hidden="true" />
      <div ref={stageRef} className={styles.stickyStageWrapper}>
        <nav className={styles.treeRail} aria-label="Services stage switcher" role="tablist">
          <div className={styles.treeLineBg} aria-hidden="true" />
          <div className={styles.treeLineFill} style={{ width: `${fillPercentage}%` }} aria-hidden="true" />
          {services.map((service, idx) => {
            const isCurrent = idx === mobileStageIndex;
            return (
              <button
                key={service.id}
                type="button"
                role="tab"
                id={`service-tab-${service.id}`}
                aria-selected={isCurrent}
                aria-controls={`service-panel-${service.id}`}
                className={`${styles.treeNode} ${isCurrent ? styles.treeNodeCurrent : ""} ${
                  idx < mobileStageIndex ? styles.treeNodePassed : ""
                }`}
                onClick={() => selectStage(idx)}
              >
                <span className={styles.treeNodeDot}>
                  <span className={styles.treeNodeNum}>{service.number}</span>
                </span>
                <span className={styles.treeNodeName}>
                  {RAIL_NODE_LABELS[service.id] || service.indexLabel.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </nav>

        {/* All cards share one grid cell: stage height = tallest card, constant. */}
        <div className={styles.stageDeck} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {services.map((service, idx) => {
            const content = contentFor(service);
            const active = idx === mobileStageIndex;
            return (
              <div
                key={service.id}
                id={`service-panel-${service.id}`}
                role="tabpanel"
                aria-labelledby={`service-tab-${service.id}`}
                aria-hidden={!active}
                inert={!active}
                data-active={active ? "" : undefined}
                className={styles.mobileStageCard}
              >
                <span className={styles.cornerTL} aria-hidden="true" />

                <div className={styles.cardHeaderRow}>
                  <h3 className={styles.stageMainHeading}>
                    <span className={styles.stageIndexNum}>{service.number}</span>
                    <span className={styles.stageNameHeading}>{service.title}</span>
                  </h3>
                  <span className={styles.stageProgressLabel}>
                    STAGE {service.number} / 0{services.length}
                  </span>
                </div>

                <div>
                  <h4 className={styles.cardSubLead}>{content.sublead}</h4>
                  <p className={styles.cardCopy}>{content.description}</p>
                </div>

                {content.quote && <p className={styles.personalityQuote}>&ldquo;{content.quote}&rdquo;</p>}

                <div className={styles.schematicBay} data-bay aria-hidden="true">
                  <span className={styles.schematicCornerTL} />
                  <span className={styles.schematicCornerTR} />
                  <span className={styles.schematicCornerBL} />
                  <span className={styles.schematicCornerBR} />
                  {/* 32px rendition upscaled by the browser = soft colour wash, no filter pass. */}
                  <Image src={service.image} alt="" fill sizes="32px" className={styles.schematicBackdrop} />
                  <span className={styles.schematicBackdropShade} />
                  <Image
                    src={service.image}
                    alt={service.imageAlt}
                    width={0}
                    height={0}
                    sizes="(min-width: 640px) 600px, calc(100vw - 4rem)"
                    className={styles.schematicImage}
                  />
                </div>

                <div className={styles.deliverableTag}>
                  <div className={styles.deliverableHeaderRow}>
                    <span className={styles.deliverablePrefix}>DELIVERABLES //</span>
                    <span className={styles.deliverableTitle}>{content.deliverableLabel}</span>
                  </div>
                  <div className={styles.deliverableList}>
                    {content.deliverables.map((item, dIdx) => (
                      <span key={dIdx} className={styles.deliverableItem}>
                        <span className={styles.deliverableDot} />
                        <span>{item}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.cardActionsRow}>
                  <button
                    type="button"
                    className={styles.detailBtn}
                    onClick={openContactModal}
                    aria-label={`Start a conversation for ${service.title}`}
                  >
                    <span>DISCUSS SPRINT</span>
                    <span className={styles.detailBtnArrow} aria-hidden="true">→</span>
                  </button>
                  <div className={styles.stepNavButtons}>
                    <button
                      type="button"
                      className={styles.navStepBtn}
                      onClick={() => selectStage(idx - 1)}
                      disabled={idx === 0}
                      aria-label="Previous service stage"
                    >
                      ← PREV
                    </button>
                    <button
                      type="button"
                      className={styles.navStepBtn}
                      onClick={() => selectStage(idx + 1)}
                      disabled={idx === services.length - 1}
                      aria-label="Next service stage"
                    >
                      NEXT →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scroll runway: N × step when pinned, 0 otherwise (height set by the engine). */}
      <div ref={runwayRef} className={styles.dwellRunway} aria-hidden="true" />
    </div>
  );
}
