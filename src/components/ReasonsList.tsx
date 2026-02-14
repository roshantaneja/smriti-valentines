"use client";

import { useEffect, useRef, useState } from "react";

interface ReasonsListProps {
  reasons: string[];
}

export function ReasonsList({ reasons }: ReasonsListProps) {
  const [expanded, setExpanded] = useState(false);
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
      className={`py-16 px-6 transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="max-w-xl mx-auto">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full text-center group focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 rounded-2xl"
          aria-expanded={expanded}
        >
          <h2 className="text-2xl font-semibold text-rose-900 dark:text-rose-100 mb-4 flex items-center justify-center gap-2 backdrop-blur-sm bg-white/50 p-4 rounded-lg">
            <span
              className={`inline-block transition-transform duration-300 ${
                expanded ? "rotate-180" : ""
              }`}
            >
              ❤️
            </span>
            Reasons I love you
            <span
              className={`inline-block transition-transform duration-300 ${
                expanded ? "rotate-180" : ""
              }`}
            >
              ❤️
            </span>
          </h2>
          <p className="text-rose-600 dark:text-rose-300 text-sm backdrop-blur-sm bg-white/50 p-4 rounded-lg">
            {expanded ? "Click to collapse" : "Click to open"}
          </p>
        </button>

        <div
          className={`overflow-hidden transition-all duration-500 ease-out ${
            expanded ? "max-h-[2000px] opacity-100 mt-6" : "max-h-0 opacity-0"
          }`}
        >
          <ul className="space-y-4">
            {reasons.map((reason, i) => (
              <li
                key={reason}
                className="backdrop-blur-sm bg-white/50 dark:bg-rose-950/30 p-4 rounded-xl border border-rose-200/50 dark:border-rose-800/50 animate-reason-reveal"
                style={{
                  animationDelay: `${i * 80}ms`,
                  animationFillMode: "both",
                }}
              >
                <span className="text-rose-800 dark:text-rose-200 flex items-start gap-3">
                  <span className="text-rose-500 dark:text-rose-400 shrink-0">
                    {i + 1}.
                  </span>
                  {reason}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
