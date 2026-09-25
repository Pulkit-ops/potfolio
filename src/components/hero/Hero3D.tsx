"use client";

import React, { useRef, useEffect, useState } from "react";
import RippleDistortion from "@/components/ui/RippleDistortion";

export default function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLImageElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const subjectRef = useRef<HTMLImageElement>(null);
  const [layoutMode, setLayoutMode] = useState<"desktop" | "tablet" | "mobile">(() => {
    if (typeof window === "undefined") return "desktop";
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w / h >= 1.05) return "desktop";
    if (w >= 640) return "tablet";
    return "mobile";
  });

  useEffect(() => {
    const checkLayout = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isPortrait = w / h < 1.05;

      if (!isPortrait) {
        // Landscape orientation (Desktop, Laptop, Tablet landscape, Mobile landscape)
        setLayoutMode("desktop");
      } else if (w >= 640) {
        // Portrait tablets (iPad 768x1024, iPad Pro 834x1194, 1024x1366)
        setLayoutMode("tablet");
      } else {
        // Portrait mobile phones (320px to 430px)
        setLayoutMode("mobile");
      }
    };
    checkLayout();
    window.addEventListener("resize", checkLayout, { passive: true });
    return () => window.removeEventListener("resize", checkLayout);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    const lerpFactor = 0.08;
    let animationFrameId: number | null = null;
    let isAnimating = false;
    let isVisible = true;
    let cachedRect: DOMRect | null = null;

    const updateCachedRect = () => {
      if (container) {
        cachedRect = container.getBoundingClientRect();
      }
    };

    const startAnimation = () => {
      if (!isAnimating && isVisible) {
        isAnimating = true;
        animationFrameId = requestAnimationFrame(render);
      }
    };

    const isTouchDevice =
      typeof window !== "undefined" &&
      window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onMouseEnter = () => {
      if (isTouchDevice || prefersReduced) return;
      updateCachedRect();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isVisible || isTouchDevice || prefersReduced) return;
      if (!cachedRect) updateCachedRect();
      if (!cachedRect || cachedRect.width === 0 || cachedRect.height === 0) return;
      
      mouseX = (e.clientX - cachedRect.left) / cachedRect.width - 0.5;
      mouseY = (e.clientY - cachedRect.top) / cachedRect.height - 0.5;
      startAnimation();
    };

    const onMouseLeave = () => {
      if (isTouchDevice) return;
      mouseX = 0;
      mouseY = 0;
      startAnimation();
    };

    const render = () => {
      if (!isVisible) {
        isAnimating = false;
        animationFrameId = null;
        return;
      }

      currentX += (mouseX - currentX) * lerpFactor;
      currentY += (mouseY - currentY) * lerpFactor;

      const diffX = Math.abs(mouseX - currentX);
      const diffY = Math.abs(mouseY - currentY);

      // Parallax Shifts
      const sceneShiftX = currentX * 14;
      const sceneShiftY = currentY * 10;
      const textShiftX = -currentX * 18;
      const textShiftY = -currentY * 14;

      if (bgRef.current) {
        bgRef.current.style.transform = `scale(1.05) translate3d(${sceneShiftX.toFixed(
          2
        )}px, ${sceneShiftY.toFixed(2)}px, 0)`;
      }
      if (subjectRef.current) {
        subjectRef.current.style.transform = `scale(1.05) translate3d(${sceneShiftX.toFixed(
          2
        )}px, ${sceneShiftY.toFixed(2)}px, 0)`;
      }
      if (textRef.current) {
        textRef.current.style.transform = `translate3d(${textShiftX.toFixed(
          2
        )}px, ${textShiftY.toFixed(2)}px, 0)`;
      }

      // If settled and reached rest state, pause RAF until next user interaction
      if (diffX < 0.0004 && diffY < 0.0004) {
        currentX = mouseX;
        currentY = mouseY;
        isAnimating = false;
        animationFrameId = null;
        return;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    // Viewport Intersection Observer: completely sleep when scrolled out of view
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisible = entry.isIntersecting;
        if (isVisible) {
          updateCachedRect();
          startAnimation();
        } else {
          if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }
          isAnimating = false;
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    container.addEventListener("mouseenter", onMouseEnter, { passive: true });
    container.addEventListener("mousemove", onMouseMove, { passive: true });
    container.addEventListener("mouseleave", onMouseLeave, { passive: true });
    window.addEventListener("resize", updateCachedRect, { passive: true });

    // Initial render setup
    startAnimation();

    return () => {
      observer.disconnect();
      container.removeEventListener("mouseenter", onMouseEnter);
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", updateCachedRect);
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  const handleScrollCue = () => {
    const el = document.getElementById("explore-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section ref={containerRef} className="hero" id="hero">
      <div className="hero-stage">
        {/* Layer 1: Base Background Landscape Photo */}
        <img
          ref={bgRef}
          src="/assets/hero-bg.webp"
          alt="Golden landscape field background"
          className="hero-layer hero-layer-bg"
          loading="eager"
        />

        {/* Layer 2: Typography Layer with React Bits Ripple Distortion & Higher Borders */}
        <div ref={textRef} className="hero-layer hero-layer-text pointer-events-auto">
          {/* Sublayer 2A: React Bits Ripple Distortion (Strictly clipped inside text silhouette) */}
          <div
            className="absolute inset-0 w-full h-full pointer-events-auto hero-text-mask"
            style={{
              zIndex: 1,
            }}
          >
            <RippleDistortion
              key={layoutMode}
              src={
                layoutMode === "mobile"
                  ? "/assets/hero-text-mobile.svg"
                  : layoutMode === "tablet"
                  ? "/assets/hero-text-tablet.svg"
                  : "/assets/hero-text.svg"
              }
              brushSize={88}
              strength={0.23}
              swirl={0.42}
              rings={3}
              hoverRings={1.3}
              spread={2.5}
              fade={2.8}
              speed={0.70}
              spacing={5}
              dispersion={0.035}
              glint={0.92}
              tint="#e51d24"
              tintAmount={0.20}
              grayscale={false}
              highlightColor="#ffffff"
              trigger="both"
              clickStrength={2.4}
              quality="high"
            />
          </div>

          {/* Sublayer 2B: The Higher Layer - Crisp static text borders sitting above the ripple */}
          <picture className="hero-text-vector-plate pointer-events-none" style={{ zIndex: 2 }}>
            <source media="(min-aspect-ratio: 1.05/1)" srcSet="/assets/hero-text-borders.svg" />
            <source media="(min-width: 640px) and (max-aspect-ratio: 1.049/1)" srcSet="/assets/hero-text-borders-tablet.svg" />
            <img
              src="/assets/hero-text-borders-mobile.svg"
              alt="SOCIAL MEDIA MANAGER Borders"
              className="w-full h-full object-cover object-top pointer-events-none"
            />
          </picture>
        </div>

        {/* Layer 3: Foreground Subject Cutout (Identical photo coordinate lock) */}
        <img
          ref={subjectRef}
          src="/assets/hero-subject.webp"
          alt="Pulkit Maheshwari Social Media Manager Cutout"
          className="hero-layer hero-layer-subject"
          loading="eager"
        />

        {/* Cinematic Film Color Grading Layers */}
        <div className="hero-color-grade" aria-hidden="true" />
        <div className="hero-film-tone" aria-hidden="true" />

        {/* Seamless Feathered Blend into Next Page / Content */}
        <div className="hero-bottom-blend" aria-hidden="true" />
      </div>

      {/* Lowkey Scroll Cue in the Bottom Right Corner */}
      <button
        onClick={handleScrollCue}
        className="scroll-cue"
        aria-label="Scroll to explore"
        type="button"
      >
        <span className="scroll-mouse" aria-hidden="true">
          <span className="scroll-wheel" />
        </span>
        <span className="scroll-text">Scroll to explore</span>
      </button>
    </section>
  );
}
