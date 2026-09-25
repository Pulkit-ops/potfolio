"use client";

import React from "react";
import { useContactModal } from "./ContactModalContext";

interface ContactTriggerButtonProps {
  label?: string;
  className?: string;
}

export default function ContactTriggerButton({
  label = "START A CONVERSATION →",
  className = "group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#e51d24] hover:bg-[#ff2b33] active:scale-[0.97] text-white font-semibold text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(229,29,36,0.35)] hover:shadow-[0_0_40px_rgba(229,29,36,0.6)] hover:scale-[1.03] transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090b]",
}: ContactTriggerButtonProps) {
  const { openContactModal } = useContactModal();

  const hasArrow = label.includes("→");
  const cleanLabel = hasArrow ? label.replace("→", "").trim() : label;

  return (
    <button
      type="button"
      onClick={openContactModal}
      className={className}
      aria-label="Open contact conversation dialog"
    >
      <span>{cleanLabel}</span>
      {hasArrow && (
        <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden="true">
          →
        </span>
      )}
    </button>
  );
}
