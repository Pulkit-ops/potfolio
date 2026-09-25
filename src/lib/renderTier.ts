"use client";

import { useEffect, useState } from "react";

/**
 * Rendering capability tiers.
 *
 *  high   – fine pointer, capable CPU/memory, motion allowed: full treatment
 *           (WebGL hero at capped DPR, pointer parallax, decorative loops).
 *  medium – touch device, or a desktop with weak hardware: WebGL hero at
 *           DPR 1 (tap ripple on touch); decorative loops kept.
 *  low    – reduced motion, Save-Data / 2G-3G, or very weak hardware: static
 *           hero, no pointer effects, decorative infinite animations disabled.
 *
 * The tier is computed once, before first paint, by TIER_BOOT_SCRIPT
 * (src/lib/tierBootScript.ts, inlined in <head>) and stored on <html data-tier data-pointer>. CSS keys off those
 * attributes directly; React reads them through useRenderCaps().
 */
export type RenderTier = "high" | "medium" | "low";

export interface RenderCaps {
  tier: RenderTier;
  finePointer: boolean;
  reducedMotion: boolean;
  /** True when the pointer-driven WebGL hero should be mounted. */
  webglHero: boolean;
  /** Canvas devicePixelRatio cap for WebGL surfaces. */
  webglDpr: number;
}

const SSR_CAPS: RenderCaps = {
  tier: "low",
  finePointer: false,
  reducedMotion: false,
  webglHero: false,
  webglDpr: 1,
};

function readCaps(): RenderCaps {
  const d = document.documentElement;
  const tier = (d.dataset.tier as RenderTier) || "medium";
  const finePointer = d.dataset.pointer === "fine";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Touch devices get the ripple too (tap-driven). The loop sleeps between
  // taps, so the steady-state cost is one idle context.
  const webglHero = tier !== "low" && !reducedMotion && d.dataset.webgl !== "off";
  const dpr = window.devicePixelRatio || 1;
  // Fullscreen fragment cost scales with DPR². 1.5 keeps edges crisp on retina
  // desktops for ~44% of the fill cost of DPR 2; phones and the medium tier
  // render at 1 (DPR 3 phones would otherwise shade 9× the pixels).
  const webglDpr = tier === "high" && finePointer ? Math.min(dpr, 1.5) : 1;
  return { tier, finePointer, reducedMotion, webglHero, webglDpr };
}

/**
 * Returns the conservative (static) caps during SSR and the first client
 * render, then upgrades after mount. Server HTML therefore always contains the
 * static, content-first version, and heavy systems are progressive enhancements.
 */
export function useRenderCaps(): RenderCaps {
  const [caps, setCaps] = useState<RenderCaps>(SSR_CAPS);
  useEffect(() => {
    setCaps(readCaps());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setCaps(readCaps());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return caps;
}

/** Subscribes to a media query; returns `initial` until mounted. */
export function useMediaQuery(query: string, initial = false): boolean {
  const [matches, setMatches] = useState(initial);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

/** Runs `cb` when the browser is idle (falls back to a timeout on Safari). */
export function onIdle(cb: () => void, timeout = 1500): () => void {
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(cb, { timeout });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(cb, 200);
  return () => window.clearTimeout(id);
}
