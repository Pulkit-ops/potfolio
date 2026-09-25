"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { onIdle } from "@/lib/renderTier";

const loadModal = () => import("./ContactModal");
// Not part of the initial bundle; prefetched when the browser goes idle so the
// first click still opens instantly.
const ContactModal = dynamic(loadModal, { ssr: false });

interface ContactModalContextType {
  isContactModalOpen: boolean;
  openContactModal: () => void;
  closeContactModal: () => void;
}

const ContactModalContext = createContext<ContactModalContextType>({
  isContactModalOpen: false,
  openContactModal: () => {},
  closeContactModal: () => {},
});

export function ContactModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openContactModal = useCallback(() => setIsOpen(true), []);
  const closeContactModal = useCallback(() => setIsOpen(false), []);

  useEffect(() => onIdle(() => void loadModal(), 4000), []);

  // Scroll lock + Escape. Locking the root element (not only <body>) is what
  // iOS Safari 16+ honours; the scrollbar gutter is compensated to avoid a
  // horizontal jump on desktop. No position:fixed trick, so the page never
  // jumps back to the top on close.
  useEffect(() => {
    if (!isOpen) return;
    const html = document.documentElement;
    const body = document.body;
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    const prev = { html: html.style.overflow, body: body.style.overflow, pad: body.style.paddingRight };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeContactModal();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      html.style.overflow = prev.html;
      body.style.overflow = prev.body;
      body.style.paddingRight = prev.pad;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeContactModal]);

  // Global custom event for non-React triggers
  useEffect(() => {
    const handleGlobalTrigger = () => openContactModal();
    window.addEventListener("open-contact-modal", handleGlobalTrigger);
    return () => window.removeEventListener("open-contact-modal", handleGlobalTrigger);
  }, [openContactModal]);

  const value = useMemo(
    () => ({ isContactModalOpen: isOpen, openContactModal, closeContactModal }),
    [isOpen, openContactModal, closeContactModal]
  );

  return (
    <ContactModalContext.Provider value={value}>
      {children}
      {isOpen && <ContactModal onClose={closeContactModal} />}
    </ContactModalContext.Provider>
  );
}

export function useContactModal() {
  return useContext(ContactModalContext);
}
