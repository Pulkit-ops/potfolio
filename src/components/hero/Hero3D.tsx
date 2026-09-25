"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { onIdle, useRenderCaps } from "@/lib/renderTier";
import type { RipplePlateSource } from "@/components/ui/RippleDistortion";

// WebGL (OGL + shaders) is split out of the initial bundle and only fetched on
// devices that will actually run it.
const RippleDistortion = dynamic(() => import("@/components/ui/RippleDistortion"), { ssr: false });

// Integer ratios: decimal <ratio> values are not parsed by older Safari.
const LANDSCAPE = "(min-aspect-ratio: 21/20)";
const TABLET_PORTRAIT = "(min-width: 640px) and (max-aspect-ratio: 1049/1000)";

// The 1448×1086 (4:3) photos are cover-fitted at 1.05× scale. In viewports
// narrower than 4:3 they are height-bound, so the rendered width is
// 1.05 × (4/3) × viewport height ≈ 140vh — far wider than 100vw on phones.
const HERO_SIZES = "(min-aspect-ratio: 4/3) 105vw, 140vh";

const RIPPLE_PLATES: RipplePlateSource[] = [
  { media: LANDSCAPE, src: "/assets/hero-text.svg" },
  { media: TABLET_PORTRAIT, src: "/assets/hero-text-tablet.svg" },
  { src: "/assets/hero-text-mobile.svg" },
];

export default function Hero3D() {
  const containerRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLImageElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const subjectRef = useRef<HTMLImageElement>(null);
  const caps = useRenderCaps();

  // WebGL hero: mounted after the page is idle, then revealed over the static
  // plate only once its first frame is on screen (no blank flash).
  const [mountWebgl, setMountWebgl] = useState(false);
  const [webglReady, setWebglReady] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    if (!caps.webglHero || webglFailed) return;
    return onIdle(() => setMountWebgl(true), 2500);
  }, [caps.webglHero, webglFailed]);

  const handleReady = useCallback(() => setWebglReady(true), []);
  const handleFailure = useCallback(() => {
    setWebglFailed(true);
    setWebglReady(false);
    setMountWebgl(false);
  }, []);

  // Pointer parallax: fine pointers only, rAF-batched, sleeps when settled or
  // off-screen. Touch devices never attach these listeners.
  const parallax = caps.finePointer && !caps.reducedMotion && caps.tier !== "low";
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !parallax) return;
    container.dataset.parallax = "on";
    const layers = [bgRef.current, subjectRef.current, textRef.current];

    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    let raf = 0;
    let isVisible = true;
    let rect: DOMRect | null = null;

    const render = () => {
      raf = 0;
      if (!isVisible) return;
      currentX += (mouseX - currentX) * 0.08;
      currentY += (mouseY - currentY) * 0.08;
      const sx = (currentX * 14).toFixed(2);
      const sy = (currentY * 10).toFixed(2);
      const scene = `scale(1.05) translate3d(${sx}px, ${sy}px, 0)`;
      if (bgRef.current) bgRef.current.style.transform = scene;
      if (subjectRef.current) subjectRef.current.style.transform = scene;
      if (textRef.current) {
        textRef.current.style.transform = `translate3d(${(-currentX * 18).toFixed(2)}px, ${(-currentY * 14).toFixed(2)}px, 0)`;
      }
      if (Math.abs(mouseX - currentX) < 0.0004 && Math.abs(mouseY - currentY) < 0.0004) {
        currentX = mouseX;
        currentY = mouseY;
        return;
      }
      raf = requestAnimationFrame(render);
    };
    const start = () => {
      if (!raf && isVisible) raf = requestAnimationFrame(render);
    };

    const onEnter = () => {
      rect = container.getBoundingClientRect();
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (!rect) rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      mouseX = (e.clientX - rect.left) / rect.width - 0.5;
      mouseY = (e.clientY - rect.top) / rect.height - 0.5;
      start();
    };
    const onLeave = () => {
      mouseX = 0;
      mouseY = 0;
      rect = null;
      start();
    };
    // Cached rect goes stale when the page scrolls; drop it so the next move re-reads once.
    const onScroll = () => {
      rect = null;
    };

    const io = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
        if (!isVisible && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { threshold: 0 }
    );
    io.observe(container);

    container.addEventListener("pointerenter", onEnter, { passive: true });
    container.addEventListener("pointermove", onMove, { passive: true });
    container.addEventListener("pointerleave", onLeave, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      io.disconnect();
      container.removeEventListener("pointerenter", onEnter);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      delete container.dataset.parallax;
      layers.forEach((el) => {
        if (el) el.style.transform = "";
      });
    };
  }, [parallax]);

  const handleScrollCue = () => {
    document.getElementById("explore-section")?.scrollIntoView({
      behavior: caps.reducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <section
      ref={containerRef}
      className="hero"
      id="hero"
      data-anim-scope
      data-webgl={webglReady ? "ready" : undefined}
    >
      <h1 className="sr-only">Pulkit Maheshwari — Social Media Manager, Creative Director &amp; Social Strategist</h1>
      <div className="hero-stage">
        {/* Layer 1: Base background photo (LCP element) */}
        <Image
          ref={bgRef}
          src="/assets/hero-bg.webp"
          alt=""
          fill
          priority
          sizes={HERO_SIZES}
          className="hero-layer hero-layer-bg"
        />

        {/* Layer 2: Typography */}
        <div ref={textRef} className="hero-layer hero-layer-text">
          {/* 2A: Static liquid-ruby plate. Always in the HTML, so the hero is complete
              before any JS runs; it doubles as the no-WebGL / low-tier experience. */}
          <picture className="hero-text-plate hero-text-static">
            <source media={LANDSCAPE} srcSet="/assets/hero-text-static.svg" />
            <source media={TABLET_PORTRAIT} srcSet="/assets/hero-text-tablet-static.svg" />
            <img src="/assets/hero-text-mobile-static.svg" alt="" decoding="async" fetchPriority="high" />
          </picture>

          {/* 2B: Interactive ripple: hover + click on desktop, tap on touch */}
          {mountWebgl && (
            <div className="hero-text-webgl" aria-hidden="true">
              <RippleDistortion
                sources={RIPPLE_PLATES}
                interactionTarget={containerRef}
                dpr={caps.webglDpr}
                quality={caps.tier === "high" && caps.finePointer ? "high" : "low"}
                brushSize={88}
                strength={0.23}
                swirl={0.42}
                rings={3}
                hoverRings={1.3}
                spread={2.5}
                fade={2.8}
                speed={0.7}
                spacing={5}
                dispersion={0.035}
                glint={0.92}
                tint="#e51d24"
                tintAmount={0.2}
                highlightColor="#ffffff"
                trigger="both"
                clickStrength={2.4}
                onReady={handleReady}
                onFailure={handleFailure}
              />
            </div>
          )}

          {/* 2C: Crisp vector borders above the fill */}
          <picture className="hero-text-plate hero-text-borders">
            <source media={LANDSCAPE} srcSet="/assets/hero-text-borders.svg" />
            <source media={TABLET_PORTRAIT} srcSet="/assets/hero-text-borders-tablet.svg" />
            <img src="/assets/hero-text-borders-mobile.svg" alt="" decoding="async" />
          </picture>
        </div>

        {/* Layer 3: Foreground subject cutout (same framing as the background) */}
        <Image
          ref={subjectRef}
          src="/assets/hero-subject.webp"
          alt="Pulkit Maheshwari"
          fill
          priority
          sizes={HERO_SIZES}
          className="hero-layer hero-layer-subject"
        />

        {/* Cinematic grading + feathered blend into the page */}
        <div className="hero-color-grade" aria-hidden="true" />
        <div className="hero-film-tone" aria-hidden="true" />
        <div className="hero-bottom-blend" aria-hidden="true" />
      </div>

      <button onClick={handleScrollCue} className="scroll-cue" aria-label="Scroll to explore" type="button">
        <span className="scroll-mouse" aria-hidden="true">
          <span className="scroll-wheel" />
        </span>
        <span className="scroll-text">Scroll to explore</span>
      </button>
    </section>
  );
}
