"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import ContactModal from "./ContactModal";

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

  const openContactModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeContactModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Lock body scroll and listen for Escape key
  useEffect(() => {
    if (isOpen) {
      // Prevent layout shift from scrollbar disappearing
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          closeContactModal();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
  }, [isOpen, closeContactModal]);

  // Support global custom event for non-react triggers
  useEffect(() => {
    const handleGlobalTrigger = () => openContactModal();
    window.addEventListener("open-contact-modal", handleGlobalTrigger);
    return () => window.removeEventListener("open-contact-modal", handleGlobalTrigger);
  }, [openContactModal]);

  return (
    <ContactModalContext.Provider
      value={{
        isContactModalOpen: isOpen,
        openContactModal,
        closeContactModal,
      }}
    >
      {children}
      <ContactModal isOpen={isOpen} onClose={closeContactModal} />
    </ContactModalContext.Provider>
  );
}

export function useContactModal() {
  const context = useContext(ContactModalContext);
  if (!context) {
    throw new Error("useContactModal must be used within a ContactModalProvider");
  }
  return context;
}
