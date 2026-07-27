"use client";

import { useEffect, useState } from "react";
import { ANALYSIS_STEPS, THEATER_MS } from "@/lib/rate-messages";

interface RateAnalysisProps {
  previewUrl: string | null;
}

export function RateAnalysis({ previewUrl }: RateAnalysisProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;
    ANALYSIS_STEPS.forEach((step, i) => {
      timers.push(
        setTimeout(() => {
          setStepIndex(i);
          setProgress(((elapsedByIndex(i) + step.ms) / THEATER_MS) * 100);
        }, elapsed)
      );
      elapsed += step.ms;
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="space-y-6">
      {previewUrl && (
        <div className="mx-auto w-32 h-32 rounded-xl overflow-hidden border border-rose-200/50 dark:border-rose-700/40 shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Photo being analyzed"
            className="w-full h-full object-cover animate-pulse"
          />
        </div>
      )}

      <div className="space-y-3">
        <p
          className="text-rose-800 dark:text-rose-200 font-medium min-h-6"
          aria-live="polite"
        >
          {ANALYSIS_STEPS[stepIndex].label}
        </p>
        <div className="h-2 w-full rounded-full bg-rose-100 dark:bg-rose-900/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all ease-linear"
            style={{
              width: `${progress}%`,
              transitionDuration: `${ANALYSIS_STEPS[stepIndex].ms}ms`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function elapsedByIndex(index: number): number {
  let sum = 0;
  for (let i = 0; i < index; i++) sum += ANALYSIS_STEPS[i].ms;
  return sum;
}
