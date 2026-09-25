"use client";

import React, { useState } from "react";

import { contactDetails } from "@/data/portfolioData";
import {
  X,
  Mail,
  Copy,
  Check,
  ExternalLink,
  Send,
  Sparkles,
} from "lucide-react";

// Proper brand SVG icons for authentic display
export function InstagramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function LinkedInIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export function WhatsAppIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </svg>
  );
}

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientInterest, setClientInterest] = useState("Short-Form Video");
  const [clientMessage, setClientMessage] = useState("");

  if (!isOpen) return null;

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(id);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch {
      // Fallback
      setCopiedItem(id);
      setTimeout(() => setCopiedItem(null), 2000);
    }
  };

  const projectInterests = [
    "Short-Form Video",
    "Social Management",
    "Creative Direction",
    "The Whole Thing",
  ];

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(
      `Project Inquiry: ${clientInterest} - ${clientName || "New Project"}`
    );
    const body = encodeURIComponent(
      `Hi Pulkit,\n\nName: ${clientName || "N/A"}\nFocus: ${clientInterest}\n\nProject Notes:\n${
        clientMessage || "Let's connect to discuss our social presence."
      }\n\nSent from portfolio contact modal.`
    );
    window.open(`mailto:${contactDetails.email}?subject=${subject}&body=${body}`, "_blank");
  };

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(
      `Hi Pulkit! I'm ${clientName || "interested in working together"} regarding *${clientInterest}*.\n\n${
        clientMessage || "Would love to chat about a project!"
      }`
    );
    window.open(`https://wa.me/918855049161?text=${text}`, "_blank");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 lg:p-10 animate-in fade-in duration-200"
    >
      {/* Blurred Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-xl transition-opacity cursor-pointer"
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-3xl max-h-[92dvh] sm:max-h-[88dvh] overflow-y-auto overscroll-contain rounded-t-3xl sm:rounded-3xl bg-[#0b0d13] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.95)] p-5 sm:p-8 lg:p-10 pb-8 sm:pb-8 lg:pb-10 pb-safe z-10 text-white scrollbar-thin scrollbar-thumb-white/10">
        {/* Subtle Ambient Red Glow */}
        <div
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[#e51d24]/12 blur-3xl"
          aria-hidden="true"
        />

        {/* Top Status & Close Bar */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/10 relative z-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Available for Select Sprints</span>
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono text-neutral-400">
              {contactDetails.location}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/[0.04] hover:bg-white/[0.1] active:scale-90 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e51d24]/60"
            aria-label="Close contact modal"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Heading & Intro */}
        <div className="mb-8 relative z-10">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#e51d24] block mb-2">
            [ DIRECT CONTACT ]
          </span>
          <h2
            id="contact-modal-title"
            className="font-display text-3xl sm:text-4xl lg:text-6xl uppercase tracking-wide leading-[0.92] text-white"
          >
            LET&apos;S START A <br />
            <span className="text-[#e51d24]">CONVERSATION.</span>
          </h2>
          <p className="mt-4 text-neutral-300 text-sm sm:text-base font-normal leading-relaxed max-w-xl">
            Currently accepting select new projects for channel growth, video sprints,
            and creative direction. Connect directly across any channel below.
          </p>
        </div>

        {/* 4 Direct Contact Channel Cards */}
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 relative z-10">
          {/* 1. Email Card */}
          <div className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#e51d24]/10 border border-[#e51d24]/20 flex items-center justify-center text-[#ff4d53]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    EMAIL DIRECT
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(contactDetails.email, "email")}
                  className="p-2 rounded-lg hover:bg-white/10 active:scale-90 text-neutral-400 hover:text-white transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
                  title="Copy email address"
                  aria-label="Copy email address"
                  type="button"
                >
                  {copiedItem === "email" ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                      <Check className="w-3.5 h-3.5" /> Copied
                    </span>
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <a
                href={`mailto:${contactDetails.email}`}
                className="text-sm sm:text-base font-semibold text-white hover:text-[#ff4d53] transition-colors break-all block"
              >
                {contactDetails.email}
              </a>
              <p className="text-xs text-neutral-400 mt-1">
                Best for project briefs, decks &amp; detailed inquiries
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
              <a
                href={`mailto:${contactDetails.email}`}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-neutral-300 hover:text-white group-hover:text-[#ff4d53] transition-colors"
              >
                <span>Compose Mail</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* 2. Phone / WhatsApp Card */}
          <div className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <WhatsAppIcon className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    WHATSAPP &amp; CALL
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(contactDetails.phone, "phone")}
                  className="p-2 rounded-lg hover:bg-white/10 active:scale-90 text-neutral-400 hover:text-white transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
                  title="Copy phone number"
                  aria-label="Copy phone number"
                  type="button"
                >
                  {copiedItem === "phone" ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                      <Check className="w-3.5 h-3.5" /> Copied
                    </span>
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <a
                href={contactDetails.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm sm:text-base font-semibold text-white hover:text-emerald-400 transition-colors block"
              >
                {contactDetails.phoneDisplay}
              </a>
              <p className="text-xs text-neutral-400 mt-1">
                Fastest response for brainstorms &amp; sprint timelines
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-4">
              <a
                href={contactDetails.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-400 hover:underline"
              >
                <span>Chat on WhatsApp</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-neutral-600">•</span>
              <a
                href={`tel:${contactDetails.phone}`}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-neutral-300 hover:text-white"
              >
                <span>Direct Call</span>
              </a>
            </div>
          </div>

          {/* 3. Instagram Card */}
          <div className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                    <InstagramIcon className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    INSTAGRAM
                  </span>
                </div>
              </div>

              <a
                href={contactDetails.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm sm:text-base font-semibold text-white hover:text-pink-400 transition-colors block"
              >
                {contactDetails.instagramHandle}
              </a>
              <p className="text-xs text-neutral-400 mt-1">
                DMs open for creators, founders &amp; creative talk
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
              <a
                href={contactDetails.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-neutral-300 hover:text-white group-hover:text-pink-400 transition-colors"
              >
                <span>View Profile &amp; DM</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* 4. LinkedIn Card */}
          <div className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <LinkedInIcon className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    LINKEDIN
                  </span>
                </div>
              </div>

              <a
                href={contactDetails.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm sm:text-base font-semibold text-white hover:text-blue-400 transition-colors block"
              >
                {contactDetails.linkedinHandle}
              </a>
              <p className="text-xs text-neutral-400 mt-1">
                Professional background, network &amp; endorsements
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
              <a
                href={contactDetails.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-neutral-300 hover:text-white group-hover:text-blue-400 transition-colors"
              >
                <span>Connect on LinkedIn</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Quick Inquiry Composer */}
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#e51d24]" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              QUICK PROJECT NOTE
            </span>
          </div>

          <form onSubmit={handleSendEmail} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="quick-name" className="block text-xs font-mono text-neutral-400 mb-1">
                  YOUR NAME / BRAND
                </label>
                <input
                  id="quick-name"
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Alex / Apex Labs"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#e51d24] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="quick-interest" className="block text-xs font-mono text-neutral-400 mb-1">
                  PROJECT INTEREST
                </label>
                <select
                  id="quick-interest"
                  value={clientInterest}
                  onChange={(e) => setClientInterest(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#111319] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#e51d24] transition-colors"
                >
                  {projectInterests.map((interest) => (
                    <option key={interest} value={interest}>
                      {interest}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="quick-message" className="block text-xs font-mono text-neutral-400 mb-1">
                MESSAGE / GOALS
              </label>
              <textarea
                id="quick-message"
                value={clientMessage}
                onChange={(e) => setClientMessage(e.target.value)}
                rows={3}
                placeholder="Tell me what you're building, target platforms, or approximate timeline..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#e51d24] transition-colors resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <span className="text-[11px] font-mono text-neutral-500">
                Usually responds within 24 hours. Direct founder review.
              </span>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wider transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp</span>
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#e51d24] hover:bg-[#ff2b33] active:scale-95 text-white text-xs font-semibold uppercase tracking-wider shadow-[0_0_20px_rgba(229,29,36,0.35)] hover:shadow-[0_0_25px_rgba(229,29,36,0.5)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Email</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
