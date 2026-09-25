import React from "react";
import Hero3D from "@/components/hero/Hero3D";
import MetricsStrip from "@/components/metrics/MetricsStrip";
import PersonalIntro from "@/components/home/PersonalIntro";
import CircularGallery from "@/components/ui/CircularGallery";
import ShinyText from "@/components/ui/ShinyText";
import { provenResultsGallery } from "@/data/portfolioData";
import ServicesStack from "@/components/services/ServicesStack";
import ContactTriggerButton from "@/components/contact/ContactTriggerButton";

export default function Home() {
  return (
    <div className="w-full">
      {/* 3D Layered Parallax Hero */}
      <Hero3D />

      {/* Metrics Strip */}
      <MetricsStrip />

      {/* Cinematic Personal Introduction (Sticky Continuous Scroll Scene) */}
      <PersonalIntro />

      {/* Part 2: Full-Bleed Proven Viral Results Section (Cards appear from ends of the screen) */}
      <section
        id="proven-results"
        className="w-full relative py-4 sm:py-12 overflow-hidden bg-gradient-to-b from-transparent via-[#0b0d12]/50 to-transparent"
      >
        {/* Stylized Section Header with ShinyText & Interactive Controls */}
        <div className="max-w-[1400px] mx-auto px-5 sm:px-12 mb-6 sm:mb-8 select-none">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-white/[0.06]">
            <div>
              {/* Stylized Heading */}
              <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight flex flex-wrap items-center gap-y-1">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-neutral-400 mr-3.5">
                  Proven
                </span>
                <ShinyText
                  text="Viral Results."
                  speed={3.5}
                  shineColor="#ff4d4d"
                  className="font-black text-transparent bg-clip-text"
                />
              </h2>
            </div>

            {/* Interaction Guide */}
            <div className="flex items-center">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/40 border border-white/10 text-xs font-mono text-neutral-400 tracking-wider">
                <span className="inline-block animate-pulse text-[#e51d24]">◄</span>
                <span>Drag or Scroll to Rotate</span>
                <span className="inline-block animate-pulse text-[#e51d24]">►</span>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Bleed Edge-to-Edge 3D Circular Gallery Stage */}
        <div className="w-full h-[380px] sm:h-[520px] lg:h-[660px] relative overflow-hidden">
          {/* Ambient central radial backlight behind the 3D arc */}
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_60%,rgba(229,29,36,0.1)_0%,rgba(139,92,246,0.04)_40%,transparent_75%)]" />

          {/* Left edge fade vignette: makes cards appear seamlessly from screen edge */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 sm:w-48 bg-gradient-to-r from-[#08090b] via-[#08090b]/80 to-transparent z-20" />

          {/* Right edge fade vignette: makes cards vanish seamlessly into screen edge */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 sm:w-48 bg-gradient-to-l from-[#08090b] via-[#08090b]/80 to-transparent z-20" />

          {/* 3D WebGL Gallery Canvas */}
          <CircularGallery
            items={provenResultsGallery}
            bend={1.1}
            borderRadius={0.16}
            scrollSpeed={2.5}
            scrollEase={0.08}
            textColor="#ffffff"
          />

          {/* Bottom edge gradient blend */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#08090b] to-transparent pointer-events-none z-20" />
        </div>
      </section>

      {/* Part 3: What I Actually Do / Redesigned Services Stack */}
      <section id="capabilities" className="w-full max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-16 pt-10 sm:pt-20 lg:pt-24 pb-14 sm:pb-20">
        <div className="mb-8 sm:mb-14 max-w-3xl">
          <h2 className="font-display text-[2.2rem] sm:text-5xl lg:text-7xl xl:text-8xl uppercase tracking-wide leading-[0.94] text-white">
            <span className="block">WHAT I</span>
            <span className="block mt-1 sm:mt-2 text-white">ACTUALLY DO.</span>
          </h2>
          <p className="mt-6 text-neutral-300 text-sm sm:text-base lg:text-lg max-w-2xl font-normal leading-relaxed">
            Good content isn't just something you post to feed an algorithm. It's
            something people genuinely stop their thumb for, remember, and talk
            about. Here is how we build it together.
          </p>
        </div>

        {/* Interactive Services Scroll Stack */}
        <ServicesStack />
      </section>

      {/* Part 4: Conversational CTA Banner */}
      <div className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-16 pb-16 sm:pb-28">
        <section
          id="contact"
          aria-label="Contact call to action"
          className="relative w-full p-7 sm:p-16 lg:p-20 rounded-3xl bg-gradient-to-b from-[#12151e] to-[#0a0c10] border border-white/10 text-center flex flex-col items-center overflow-hidden shadow-2xl shadow-black/80"
        >
          {/* Subtle Ambient Red Glow */}
          <div
            className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[#e51d24]/10 blur-3xl"
            aria-hidden="true"
          />

          <h2 className="font-display text-[2rem] sm:text-5xl lg:text-7xl uppercase tracking-wide leading-[1.05] sm:leading-[0.94] text-white max-w-3xl mb-6 relative z-10">
            <span className="block">THINK WE'D MAKE</span>
            <span className="block mt-1.5 sm:mt-2 text-[#e51d24]">GOOD WORK TOGETHER?</span>
          </h2>

          <p className="text-sm sm:text-base text-neutral-300 max-w-xl leading-relaxed mb-10 relative z-10 font-normal">
            Currently accepting select new projects for channel growth, video
            sprints, and creative direction. No 40-page corporate decks — just
            good ideas, high-retention video, and content people actually want to
            watch.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
            <ContactTriggerButton />
          </div>
        </section>
      </div>
    </div>
  );
}
