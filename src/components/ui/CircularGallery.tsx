"use client";

import React, { useEffect, useMemo, useRef } from "react";
import Image from "next/image";

/**
 * Curved, infinitely wrapping card gallery.
 *
 * This replaces an OGL/WebGL implementation that compiled 24 shader programs,
 * uploaded 12 textures (4 unique images × 3), allocated a DPR-2 canvas with
 * MSAA, and never released its context on unmount (route changes leaked one
 * context per visit). The arc geometry is identical — the old camera
 * (fov 45°, z = 20) projected the z = 0 plane orthographically, so every
 * card's position/rotation maps 1:1 onto a 2D CSS transform — but now each
 * card is a composited DOM layer and a frame costs 12 transform writes.
 *
 * Input model:
 *  - Page scroll: while the section is on screen, vertical page scroll turns
 *    the wheel (read from scrollY, no layout reads). Native scrolling is never
 *    intercepted, so there is no scroll fighting.
 *  - Drag / swipe: pointer events with `touch-action: pan-y`, so vertical
 *    swipes always scroll the page and only horizontal drags rotate.
 *  - Horizontal wheel / trackpad swipe and ←/→ keys.
 */

export interface CircularGalleryItem {
  image: string;
  text: string;
}

export interface CircularGalleryProps {
  items: CircularGalleryItem[];
  /** Arc depth in the original world units (0 = flat). */
  bend?: number;
  /** Corner radius as a fraction of card size (matches the old SDF uv radius). */
  borderRadius?: number;
  /** Drag multiplier (same scale as the WebGL version). */
  scrollSpeed?: number;
  /** Per-60Hz-frame easing factor. */
  scrollEase?: number;
  /** Pixels of rotation per pixel of page scroll while on screen. */
  scrollLink?: number;
  className?: string;
}

const COPIES = 3;
// World units visible vertically for fov 45° at z = 20: 2·tan(22.5°)·20.
const VIEW_UNITS = 16.5685;

export default function CircularGallery({
  items,
  bend = 1,
  borderRadius = 0.17,
  scrollSpeed = 2.5,
  scrollEase = 0.08,
  scrollLink = 0.45,
  className = "",
}: CircularGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const cards = useMemo(
    () =>
      Array.from({ length: COPIES }, (_, copy) =>
        items.map((item, i) => ({ ...item, copy, key: `${copy}-${i}` }))
      ).flat(),
    [items]
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = cardRefs.current.slice(0, cards.length);
    const n = els.length;
    if (!n) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Layout (recomputed on resize only)
    let W = 0;
    let H = 0;
    let cardW = 0;
    let spacing = 0;
    let total = 0;
    let radius = 0;
    let unit = 0;
    let docTop = 0;

    // Motion state (px)
    let dragTarget = 0;
    let linked = 0;
    let current = 0;
    let raf = 0;
    let lastTime = 0;
    let visible = false;
    let dragging = false;

    const measure = () => {
      W = root.clientWidth;
      H = root.clientHeight;
      unit = H / VIEW_UNITS;
      const cardH = (H * 920) / 1500;
      cardW = (H * 720) / 1500;
      spacing = cardW + 2 * unit;
      total = spacing * n;
      const B = Math.abs(bend) * unit;
      const half = W / 2;
      radius = B > 0 ? (half * half + B * B) / (2 * B) : 0;
      const r = root.getBoundingClientRect();
      docTop = r.top + window.scrollY + H / 2;
      root.style.setProperty("--cg-card-w", `${cardW.toFixed(2)}px`);
      root.style.setProperty("--cg-card-h", `${cardH.toFixed(2)}px`);
      root.style.setProperty("--cg-unit", `${unit.toFixed(2)}px`);
    };

    const scrollLinked = () => {
      if (reduceMotion) return 0;
      // Distance of the gallery centre from the viewport centre.
      return (window.scrollY + window.innerHeight / 2 - docTop) * scrollLink;
    };

    const place = (offset: number) => {
      const half = W / 2;
      const limit = half + cardW;
      for (let i = 0; i < n; i++) {
        const el = els[i];
        if (!el) continue;
        // Centered modulo keeps copies on both sides of the arc.
        let x = (((i * spacing - offset) % total) + total) % total;
        if (x > total / 2) x -= total;
        if (Math.abs(x) > limit) {
          if (el.dataset.off !== "1") {
            el.dataset.off = "1";
            el.style.visibility = "hidden";
          }
          continue;
        }
        if (el.dataset.off === "1") {
          el.dataset.off = "";
          el.style.visibility = "";
        }
        let y = 0;
        let rot = 0;
        if (radius > 0) {
          const ex = Math.min(Math.abs(x), half);
          y = radius - Math.sqrt(radius * radius - ex * ex);
          rot = Math.sign(bend) * Math.sign(x) * Math.asin(ex / radius);
          if (bend < 0) y = -y;
        }
        el.style.transform = `translate3d(${(half + x - cardW / 2).toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${rot.toFixed(4)}rad)`;
      }
    };

    const tick = (now: number) => {
      raf = 0;
      const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 1 / 60;
      lastTime = now;
      const target = dragTarget + linked;
      // Frame-rate independent version of the original per-frame lerp.
      const k = 1 - Math.pow(1 - scrollEase, dt * 60);
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.05) current = target;
      place(current);
      if (current !== target || dragging) {
        raf = requestAnimationFrame(tick);
      } else {
        lastTime = 0;
      }
    };

    const start = () => {
      if (!raf && visible) raf = requestAnimationFrame(tick);
    };

    const snap = () => {
      if (!spacing) return;
      const totalTarget = dragTarget + linked;
      dragTarget = Math.round(totalTarget / spacing) * spacing - linked;
      start();
    };

    // --- Page scroll link (only attached while on screen)
    const onScroll = () => {
      linked = scrollLinked();
      start();
    };

    // --- Pointer drag
    let startX = 0;
    let startTarget = 0;
    let pointerId = -1;
    const dragFactor = () => scrollSpeed * 0.025 * unit;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragging = true;
      pointerId = e.pointerId;
      startX = e.clientX;
      startTarget = dragTarget;
      if (e.pointerType === "mouse") root.setPointerCapture(e.pointerId);
      root.dataset.dragging = "";
      start();
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== pointerId) return;
      dragTarget = startTarget + (startX - e.clientX) * dragFactor();
      start();
    };
    const endDrag = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== pointerId) return;
      dragging = false;
      pointerId = -1;
      delete root.dataset.dragging;
      snap();
    };

    // --- Horizontal wheel / trackpad swipe. Vertical wheel is left to the page.
    let wheelTimer = 0;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      dragTarget += e.deltaX;
      start();
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(snap, 180);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      dragTarget += e.key === "ArrowRight" ? spacing : -spacing;
      snap();
    };

    measure();
    linked = scrollLinked();
    current = dragTarget + linked;
    place(current);
    root.dataset.ready = "";

    const ro = new ResizeObserver(() => {
      measure();
      linked = scrollLinked();
      current = dragTarget + linked;
      place(current);
    });
    ro.observe(root);

    const io = new IntersectionObserver(
      (entries) => {
        const nowVisible = entries[0].isIntersecting;
        if (nowVisible === visible) return;
        visible = nowVisible;
        if (visible) {
          window.addEventListener("scroll", onScroll, { passive: true });
          onScroll();
        } else {
          window.removeEventListener("scroll", onScroll);
          if (raf) cancelAnimationFrame(raf);
          raf = 0;
          lastTime = 0;
          // Settle instantly while unseen instead of easing off-screen.
          linked = scrollLinked();
          current = dragTarget + linked;
          place(current);
        }
      },
      { rootMargin: "0px" }
    );
    io.observe(root);

    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("pointermove", onPointerMove, { passive: true });
    root.addEventListener("pointerup", endDrag);
    root.addEventListener("pointercancel", endDrag);
    root.addEventListener("wheel", onWheel, { passive: true });
    root.addEventListener("keydown", onKeyDown);

    return () => {
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerup", endDrag);
      root.removeEventListener("pointercancel", endDrag);
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(wheelTimer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [cards.length, bend, scrollSpeed, scrollEase, scrollLink]);

  const radiusPct = `${(borderRadius * 100).toFixed(2)}%`;

  return (
    <div
      ref={rootRef}
      className={`cg-root w-full h-full min-h-[360px] sm:min-h-[500px] lg:min-h-[640px] overflow-hidden select-none relative z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e51d24]/60 rounded-2xl ${className}`}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Campaign results gallery. Drag, swipe or use the arrow keys to browse."
    >
      {cards.map((card, i) => (
        <div
          key={card.key}
          ref={(el) => {
            cardRefs.current[i] = el;
          }}
          className="cg-card"
          aria-hidden={card.copy > 0 ? true : undefined}
        >
          <div className="cg-media" style={{ borderRadius: radiusPct }}>
            <Image
              src={card.image}
              alt={card.copy > 0 ? "" : card.text}
              fill
              draggable={false}
              sizes="(min-width: 1024px) 340px, (min-width: 640px) 270px, 240px"
              className="object-cover"
            />
          </div>
          <p className="cg-title">{card.text}</p>
        </div>
      ))}
    </div>
  );
}
