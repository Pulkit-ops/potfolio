"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ui/Toast";

export default function ContactForm() {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    handle: "",
    budget: "",
    goals: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsSuccess(false);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      showToast("Inquiry received! Check your inbox shortly.");
      setFormData({
        name: "",
        email: "",
        handle: "",
        budget: "",
        goals: "",
      });

      setTimeout(() => {
        setIsSuccess(false);
      }, 6000);
    }, 900);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#0e1015]/80 border border-white/10 p-8 sm:p-10 rounded-2xl flex flex-col gap-6 shadow-2xl shadow-black/40 backdrop-blur-md"
    >
      <div className="border-b border-white/10 pb-4">
        <h3 className="font-heading text-lg font-bold text-white">
          Send a Project Brief
        </h3>
        <p className="text-xs text-neutral-400 mt-1">
          Tell me about your channel goals, timeline, and current bottlenecks.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="name"
          className="text-xs font-semibold uppercase tracking-wider text-neutral-400"
        >
          Your Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={formData.name}
          onChange={handleChange}
          placeholder="Alex Morgan"
          className="w-full bg-white/[0.03] border border-white/10 focus:border-[#e51d24] focus:ring-1 focus:ring-[#e51d24] rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="email"
            className="text-xs font-semibold uppercase tracking-wider text-neutral-400"
          >
            Work Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="alex@brand.com"
            className="w-full bg-white/[0.03] border border-white/10 focus:border-[#e51d24] focus:ring-1 focus:ring-[#e51d24] rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="handle"
            className="text-xs font-semibold uppercase tracking-wider text-neutral-400"
          >
            Brand / Handle
          </label>
          <input
            id="handle"
            name="handle"
            type="text"
            required
            value={formData.handle}
            onChange={handleChange}
            placeholder="@yourbrand"
            className="w-full bg-white/[0.03] border border-white/10 focus:border-[#e51d24] focus:ring-1 focus:ring-[#e51d24] rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="budget"
          className="text-xs font-semibold uppercase tracking-wider text-neutral-400"
        >
          Estimated Monthly Budget
        </label>
        <select
          id="budget"
          name="budget"
          required
          value={formData.budget}
          onChange={handleChange}
          className="w-full bg-[#12151d] border border-white/10 focus:border-[#e51d24] focus:ring-1 focus:ring-[#e51d24] rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none transition-all"
        >
          <option value="" disabled>
            Select investment tier
          </option>
          <option value="3k-5k">$3,000 – $5,000 / mo (Short-form sprints)</option>
          <option value="5k-8k">$5,000 – $8,000 / mo (Full channel management)</option>
          <option value="8k+">$8,000+ / mo (Enterprise & Omnichannel scale)</option>
          <option value="campaign">One-time Campaign / Launch Sprint</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="goals"
          className="text-xs font-semibold uppercase tracking-wider text-neutral-400"
        >
          What is your primary growth goal?
        </label>
        <textarea
          id="goals"
          name="goals"
          rows={3}
          required
          value={formData.goals}
          onChange={handleChange}
          placeholder="e.g. We want to scale our TikTok to 100K followers and launch our Q4 product drop with viral reels..."
          className="w-full bg-white/[0.03] border border-white/10 focus:border-[#e51d24] focus:ring-1 focus:ring-[#e51d24] rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none transition-all resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full py-3.5 rounded-xl font-heading text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>
          {isSubmitting
            ? "Sending brief..."
            : isSuccess
            ? "Brief Received!"
            : "Submit Project Inquiry"}
        </span>
        {!isSubmitting && !isSuccess && <span>→</span>}
      </button>

      {isSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium text-center animate-in fade-in duration-300">
          ✓ Thank you! I will review your goals and respond within 24 hours.
        </div>
      )}
    </form>
  );
}
