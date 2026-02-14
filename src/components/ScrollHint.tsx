"use client";

import { useEffect, useState } from "react";

export function ScrollHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY < 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToContent = () => {
    document
      .querySelector('[data-section="love-letter"]')
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToContent}
      className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-rose-600 dark:text-rose-400 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-label="Scroll to content"
    >
      <span className="text-xs font-medium">Scroll to explore</span>
      <span className="animate-bounce text-2xl">↓</span>
    </button>
  );
}
