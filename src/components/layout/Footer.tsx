"use client";

import React from "react";
import Link from "next/link";
import { socialLinks } from "@/data/portfolioData";
import { useContactModal } from "@/components/contact/ContactModalContext";
import {
  InstagramIcon,
  LinkedInIcon,
  WhatsAppIcon,
} from "@/components/contact/ContactModal";
import { Mail } from "lucide-react";

export default function Footer() {
  const { openContactModal } = useContactModal();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderSocialIcon = (type: string) => {
    switch (type) {
      case "instagram":
        return <InstagramIcon className="w-4 h-4 group-hover:scale-110 transition-transform text-neutral-300 group-hover:text-pink-400" />;
      case "linkedin":
        return <LinkedInIcon className="w-4 h-4 group-hover:scale-110 transition-transform text-neutral-300 group-hover:text-blue-400" />;
      case "mail":
        return <Mail className="w-4 h-4 group-hover:scale-110 transition-transform text-neutral-300 group-hover:text-[#ff4d53]" />;
      case "whatsapp":
        return <WhatsAppIcon className="w-4 h-4 group-hover:scale-110 transition-transform text-neutral-300 group-hover:text-emerald-400" />;
      default:
        return null;
    }
  };

  return (
    <footer className="w-full bg-[#060709] border-t border-white/10 pt-12 sm:pt-16 pb-safe mt-16 sm:mt-24 relative z-10">
      <div className="max-w-[1240px] mx-auto px-5 sm:px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-12 border-b border-white/5">
          {/* Brand Info */}
          <div>
            <Link href="/" className="flex items-center gap-2 group text-white tracking-wider font-bold mb-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
                PK
              </span>
              <span className="text-[#e51d24] font-light text-lg">/</span>
              <span className="text-base font-semibold tracking-widest uppercase text-neutral-300">
                SOCIAL<span className="text-[#e51d24]">.</span>
              </span>
            </Link>
            <p className="text-xs text-neutral-500 font-medium tracking-wide">
              Viral Strategy • Short-Form Video • Brand Architecture
            </p>
          </div>

          {/* Quick Page Links */}
          <nav className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-neutral-400 font-medium">
            <Link href="/#personal-intro" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:text-white focus-visible:underline">
              About
            </Link>
            <Link href="/#proven-results" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:text-white focus-visible:underline">
              Results
            </Link>
            <Link href="/services" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:text-white focus-visible:underline">
              Services
            </Link>
            <button
              type="button"
              onClick={openContactModal}
              className="text-[#e51d24] hover:text-[#ff3b42] active:scale-95 transition-all cursor-pointer flex items-center gap-1 font-semibold group focus-visible:outline-none focus-visible:underline"
            >
              <span>Contact</span>
              <span className="text-xs group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">↗</span>
            </button>
          </nav>

          {/* Socials with Proper Icons */}
          <div className="flex items-center gap-2.5">
            {socialLinks.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target={s.url.startsWith("mailto:") ? undefined : "_blank"}
                rel={s.url.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                aria-label={`${s.name}: ${s.handle}`}
                title={`${s.name} (${s.handle})`}
                className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center hover:border-white/20 hover:bg-white/[0.08] active:scale-90 transition-all group cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(229,29,36,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e51d24]/60"
              >
                {renderSocialIcon(s.type)}
              </a>
            ))}
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 pb-4 text-xs text-neutral-500">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-3 text-center sm:text-left">
            <p>© {new Date().getFullYear()} Pulkit Maheshwari. All rights reserved.</p>
            <span className="hidden sm:inline text-neutral-700">•</span>
            <p>
              This site is crafted by{" "}
              <a
                href="https://www.kachmo.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors underline decoration-white/20 hover:decoration-white font-medium"
              >
                Kachmo Studios
              </a>
            </p>
          </div>
          <button
            onClick={scrollToTop}
            aria-label="Back to top"
            className="hover:text-white flex items-center gap-1.5 transition-all cursor-pointer group active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 rounded px-1"
          >
            <span>Back to Top</span>
            <span className="group-hover:-translate-y-1 transition-transform duration-200 text-[#e51d24]">↑</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
