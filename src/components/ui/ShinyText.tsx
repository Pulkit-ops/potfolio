"use client";

import React from "react";

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  shineColor?: string;
}

export default function ShinyText({
  text,
  disabled = false,
  speed = 4,
  className = "",
  shineColor = "#ffffff",
}: ShinyTextProps) {
  return (
    <span
      className={`inline-block bg-clip-text text-transparent bg-gradient-to-r from-neutral-300 via-white to-neutral-400 ${
        disabled ? "" : "animate-shiny"
      } ${className}`.trim()}
      style={{
        animationDuration: `${speed}s`,
        backgroundImage: `linear-gradient(120deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.7) 35%, ${shineColor} 50%, rgba(255,255,255,0.7) 65%, rgba(255,255,255,0.7) 100%)`,
      }}
    >
      {text}
    </span>
  );
}
