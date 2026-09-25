"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Pauses infinite CSS animations inside any `[data-anim-scope]` element while
 * it is off-screen. Shiny text animates background-position (a repaint every
 * frame), and the metric bars / scan lines / pulses kept style recalculation
 * ticking at 60 Hz even when the user was reading a different section.
 *
 * One shared IntersectionObserver; re-scans after client-side navigation.
 */
export default function OffscreenAnimationPauser() {
  const pathname = usePathname();

  useEffect(() => {
    const scopes = document.querySelectorAll<HTMLElement>("[data-anim-scope]");
    if (!scopes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) delete el.dataset.offscreen;
          else el.dataset.offscreen = "";
        }
      },
      { rootMargin: "100px 0px" }
    );
    scopes.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
