"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { ServiceDetailedItem } from "@/data/servicesData";
import { useContactModal } from "@/components/contact/ContactModalContext";
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

export default function ServicesMobileMethods({
  services,
  activeId,
  onSelect,
}: ServicesMobileMethodsProps) {
  const { openContactModal } = useContactModal();
  const trackRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);

  // Find initial index from activeId or default to 0
  const initialIndex = activeId
    ? Math.max(0, services.findIndex((s) => s.id === activeId))
    : 0;

  const [mobileStageIndex, setMobileStageIndex] = useState(
    initialIndex >= 0 ? initialIndex : 0
  );

  // Active index tracking ref to avoid calling onSelect inside setState updaters
  const activeIndexRef = useRef(initialIndex >= 0 ? initialIndex : 0);

  const currentService = services[mobileStageIndex] || services[0];
  const content = MOBILE_CARD_CONTENT[currentService.id] || {
    sublead: currentService.headline,
    description: currentService.tagline,
    quote: currentService.personalityKicker,
    deliverableLabel: "KEY DELIVERABLES",
    deliverables: currentService.deliverables.slice(0, 4),
    imagePosition: "center 25%",
  };

  // Synchronize state change when external activeId prop changes
  useEffect(() => {
    const idx = services.findIndex((s) => s.id === activeId);
    if (idx !== -1 && idx !== activeIndexRef.current) {
      activeIndexRef.current = idx;
      setMobileStageIndex(idx);
    }
  }, [activeId, services]);

  // Synchronize state change to parent cleanly without render cycle conflicts
  const changeStage = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= services.length) return;
      activeIndexRef.current = idx;
      setMobileStageIndex(idx);
      if (services[idx] && onSelect) {
        onSelect(services[idx].id);
      }
    },
    [services, onSelect]
  );

  // ── SCROLL-DRIVEN STICKY DWELL ENGINE ─────────────────────────────────────
  // Locks the card in view ("sticks for a second while scrolling"),
  // advancing stages if deep scroll is present, without calling parent setState in render.
  useEffect(() => {
    let animId = 0;

    const onScroll = () => {
      if (isProgrammaticScroll.current || !trackRef.current) return;
      if (animId) return;

      animId = requestAnimationFrame(() => {
        animId = 0;
        if (!trackRef.current) return;

        const rect = trackRef.current.getBoundingClientRect();
        const totalDistance = rect.height - window.innerHeight;
        if (totalDistance <= 40) return;

        const scrolled = -rect.top;
        if (scrolled < 0 || scrolled > totalDistance) return;

        const progress = Math.max(0, Math.min(1, scrolled / totalDistance));
        const computedIdx = Math.min(
          services.length - 1,
          Math.floor(progress * services.length)
        );

        if (activeIndexRef.current !== computedIdx) {
          activeIndexRef.current = computedIdx;
          setMobileStageIndex(computedIdx);
          if (services[computedIdx] && onSelect) {
            onSelect(services[computedIdx].id);
          }
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [services, onSelect]);

  // Touch swipe gesture navigation
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Detect horizontal swipe if deltaX > deltaY and threshold exceeds 35px
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 35) {
      if (deltaX < 0) {
        changeStage(Math.min(mobileStageIndex + 1, services.length - 1));
      } else {
        changeStage(Math.max(mobileStageIndex - 1, 0));
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const fillPercentage =
    services.length > 1
      ? (mobileStageIndex / (services.length - 1)) * 100
      : 0;

  return (
    <div ref={trackRef} className={styles.mobileTrack}>
      {/* ── STICKY DOCK WRAPPER: STICKS CLEANLY WHILE SCROLLING ─────────── */}
      <div className={styles.stickyStageWrapper}>
        {/* Horizontal Tree Conduit Rail */}
        <nav className={styles.treeRail} aria-label="Services stage switcher">
          {/* Background conduit line */}
          <div className={styles.treeLineBg} aria-hidden="true" />

          {/* Animated illuminated progress line */}
          <div
            className={styles.treeLineFill}
            style={{ width: `${fillPercentage}%` }}
            aria-hidden="true"
          />

          {/* Interactive Tree Nodes */}
          {services.map((service, idx) => {
            const isCurrent = idx === mobileStageIndex;
            const isPassed = idx < mobileStageIndex;
            const shortLabel =
              RAIL_NODE_LABELS[service.id] || service.indexLabel.split(" ")[0];

            return (
              <button
                key={service.id}
                type="button"
                role="tab"
                id={`service-tab-${service.id}`}
                aria-selected={isCurrent}
                aria-controls="mobile-service-card"
                className={`${styles.treeNode} ${
                  isCurrent ? styles.treeNodeCurrent : ""
                } ${isPassed ? styles.treeNodePassed : ""}`}
                onClick={() => changeStage(idx)}
              >
                <span className={styles.treeNodeDot}>
                  <span className={styles.treeNodeNum}>{service.number}</span>
                </span>
                <span className={styles.treeNodeName}>{shortLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Active Stage Card With Smooth Morph Entrance */}
        <div
          id="mobile-service-card"
          role="tabpanel"
          aria-labelledby={`service-tab-${currentService.id}`}
          className={styles.mobileStageCard}
          key={currentService.id}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Architectural registration bracket */}
          <span className={styles.cornerTL} aria-hidden="true" />

          {/* Header Row: Index + Title + Progress Badge */}
          <div className={styles.cardHeaderRow}>
            <h3 className={styles.stageMainHeading}>
              <span className={styles.stageIndexNum}>{currentService.number}</span>
              <span className={styles.stageNameHeading}>{currentService.title}</span>
            </h3>
            <span className={styles.stageProgressLabel}>
              STAGE {currentService.number} / 0{services.length}
            </span>
          </div>

          {/* Imperative Sub-Lead (Headline) & Explanatory Copy */}
          <div>
            <h4 className={styles.cardSubLead}>{content.sublead}</h4>
            <p className={styles.cardCopy}>{content.description}</p>
          </div>

          {/* Personality Quote */}
          {content.quote && (
            <p className={styles.personalityQuote}>
              &ldquo;{content.quote}&rdquo;
            </p>
          )}

          {/* Spacious Schematic / Media Visual Bay with Corner Ticks & Uncropped Framing */}
          <div className={styles.schematicBay} aria-hidden="true">
            <span className={styles.schematicCornerTL} />
            <span className={styles.schematicCornerTR} />
            <span className={styles.schematicCornerBL} />
            <span className={styles.schematicCornerBR} />

            {/* Ambient blurred backdrop to give edge-to-edge color tone */}
            <img
              src={currentService.image}
              alt=""
              aria-hidden="true"
              className={styles.schematicBackdrop}
            />

            {/* Uncropped foreground hero image */}
            <img
              src={currentService.image}
              alt={currentService.imageAlt}
              className={styles.schematicImage}
              loading="eager"
            />
          </div>

          {/* Deliverables Tag & 2-Column Grid */}
          <div className={styles.deliverableTag}>
            <div className={styles.deliverableHeaderRow}>
              <span className={styles.deliverablePrefix}>DELIVERABLES //</span>
              <span className={styles.deliverableTitle}>
                {content.deliverableLabel}
              </span>
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

          {/* Action Controls Row: CTA & Step Navigation Buttons */}
          <div className={styles.cardActionsRow}>
            <button
              type="button"
              className={styles.detailBtn}
              onClick={openContactModal}
              aria-label={`Start a conversation for ${currentService.title}`}
            >
              <span>DISCUSS SPRINT</span>
              <span className={styles.detailBtnArrow} aria-hidden="true">
                →
              </span>
            </button>

            <div className={styles.stepNavButtons}>
              <button
                type="button"
                className={styles.navStepBtn}
                onClick={() =>
                  changeStage(Math.max(mobileStageIndex - 1, 0))
                }
                disabled={mobileStageIndex === 0}
                aria-label="Previous service stage"
              >
                ← PREV
              </button>
              <button
                type="button"
                className={styles.navStepBtn}
                onClick={() =>
                  changeStage(
                    Math.min(mobileStageIndex + 1, services.length - 1)
                  )
                }
                disabled={mobileStageIndex === services.length - 1}
                aria-label="Next service stage"
              >
                NEXT →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dwell runway for natural ~1s scroll stickiness without large void */}
      <div className={styles.dwellRunway} aria-hidden="true" />
    </div>
  );
}
