"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "KeyB",
  "KeyA",
];

interface EasterEggProps {
  secretMessage?: string;
  children: React.ReactNode;
}

export function EasterEgg({ secretMessage, children }: EasterEggProps) {
  const [revealed, setRevealed] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = triggerRef.current;
    if (!node || !secretMessage) return;

    let clickCount = 0;
    let clickTimer: ReturnType<typeof setTimeout>;

    const handleClick = () => {
      clickCount++;
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => {
        if (clickCount >= 3) {
          setRevealed(true);
        }
        clickCount = 0;
      }, 400);
    };

    node.addEventListener("click", handleClick);
    return () => {
      node.removeEventListener("click", handleClick);
      clearTimeout(clickTimer);
    };
  }, [secretMessage]);

  useEffect(() => {
    if (!secretMessage) return;

    let konamiIndex = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === KONAMI_CODE[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === KONAMI_CODE.length) {
          setRevealed(true);
          konamiIndex = 0;
        }
      } else {
        konamiIndex = 0;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [secretMessage]);

  const closeModal = useCallback(() => setRevealed(false), []);

  useEffect(() => {
    if (!revealed) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [revealed, closeModal]);

  return (
    <>
      <div ref={triggerRef}>{children}</div>

      {revealed && secretMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={closeModal}
          role="dialog"
          aria-modal
          aria-label="Secret message"
        >
          <div
            className="max-w-md w-full backdrop-blur-md bg-rose-50 dark:bg-rose-950/95 p-8 rounded-2xl shadow-2xl border-2 border-rose-300 dark:border-rose-700"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-rose-900 dark:text-rose-100 text-lg text-center font-serif">
              {secretMessage}
            </p>
            <button
              type="button"
              onClick={closeModal}
              className="block mx-auto mt-6 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-200 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
