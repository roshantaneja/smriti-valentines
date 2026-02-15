"use client";

import { useEffect, useRef, useState } from "react";

interface LoveLetterProps {
  content: string;
}

export function LoveLetter({ content }: LoveLetterProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      data-section="love-letter"
      className={`py-16 px-6 transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold text-rose-900 dark:text-rose-100 mb-6 text-center">
          A letter for you
        </h2>
        <div className="backdrop-blur-sm bg-[linear-gradient(rgba(0,0,0,0.12),rgba(0,0,0,0.12)),rgba(255,255,255,0.7)] dark:bg-rose-950/50 p-8 rounded-2xl shadow-xl border border-rose-200/50 dark:border-rose-800/50">
          <p className="text-rose-800 dark:text-rose-200 leading-relaxed whitespace-pre-line font-serif text-lg">
            {content}
          </p>
        </div>
      </div>
    </section>
  );
}
