"use client";

import { useEffect, useRef, useState } from "react";
import type { TimelineEvent } from "@/lib/valentines-config";

interface TimelineProps {
  events: TimelineEvent[];
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function Timeline({ events }: TimelineProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (events.length === 0) return null;

  return (
    <section
      ref={ref}
      className={`py-16 px-6 transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold text-rose-900 dark:text-rose-100 mb-12 text-center">
          Our story
        </h2>

        <div className="relative">
          <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-rose-300 dark:bg-rose-700" />

          <ul className="space-y-8">
            {events.map((event) => (
              <li key={`${event.date}-${event.title}`} className="relative flex gap-6 pl-4">
                <div className="absolute left-[15px] w-8 h-8 rounded-full bg-rose-400 dark:bg-rose-600 ring-4 ring-white dark:ring-rose-950 shrink-0 -translate-x-1/2" />

                <div className="pt-0.5 pl-2 flex-1 min-w-0">
                  <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
                    {formatDate(event.date)}
                  </p>
                  <h3 className="text-lg font-semibold text-rose-900 dark:text-rose-100 mt-1">
                    {event.title}
                  </h3>
                  <p className="text-rose-700 dark:text-rose-200 mt-2 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
