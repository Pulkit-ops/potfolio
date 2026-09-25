"use client";

import React from "react";
import FlowingMenu from "@/components/ui/FlowingMenu";
import ShinyText from "@/components/ui/ShinyText";
import { metricsData } from "@/data/portfolioData";

export default function MetricsStrip() {
  const statTags = [
    "VIRAL RETENTION SPRINT",
    "CROSS-PLATFORM GROWTH",
    "CONVERSION FUNNEL ARCHITECTURE",
    "THUMB-STOPPING HOOKS",
  ];

  const flowingItems = metricsData.map((metric, idx) => ({
    value: metric.value,
    accent: metric.accent,
    label: metric.label,
    index: `0${idx + 1} // 04`,
    tag: statTags[idx] || "VERIFIED IMPACT",
    image: metric.image || "/assets/camera-sunset.jpg",
    marqueeText: metric.marqueeText,
    link: metric.link || "#proven-results",
    marqueeBgColor: "#e51d24",
    marqueeTextColor: "#ffffff",
  }));

  return (
    <section
      id="explore-section"
      className="w-full relative z-20 pt-16 sm:pt-28 lg:pt-40 pb-4 sm:pb-10 bg-gradient-to-b from-[#08090b] via-[#090b10] to-[#0c0e14] border-b border-white/5 overflow-hidden"
    >
      {/* Clean, Refined Minimalist Heading */}
      <div className="w-full px-6 sm:px-12 md:px-16 lg:px-24 pb-8">
        <h2 className="font-heading text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-neutral-300">
          Scale That Speaks In{" "}
          <span className="text-white font-bold inline-flex items-baseline">
            <ShinyText
              text="Pure Numbers"
              speed={4.2}
              className="text-white font-bold inline-block"
              shineColor="#ffffff"
            />
            <span className="text-[#e51d24] font-black">.</span>
          </span>
        </h2>
      </div>

      {/* Full-Bleed Edge-to-Edge Flowing Menu */}
      <div className="w-full">
        <FlowingMenu
          items={flowingItems}
          speed={15}
          marqueeBgColor="#e51d24"
          marqueeTextColor="#ffffff"
          borderColor="rgba(255, 255, 255, 0.08)"
          className="w-full bg-[#07080a]/40 backdrop-blur-sm"
        />
      </div>
    </section>
  );
}
