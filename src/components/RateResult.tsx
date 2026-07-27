"use client";

import { useEffect, useState } from "react";
import type { RateOutcome } from "@/lib/face-match";
import {
  messageForScore,
  NO_FACE_MESSAGE,
  UNCALIBRATED_MESSAGE,
} from "@/lib/rate-messages";
import { ConfettiHearts } from "./ConfettiHearts";

interface RateResultProps {
  outcome: RateOutcome;
  previewUrl: string;
  onReset: () => void;
}

const COUNT_UP_MS = 1200;

export function RateResult({ outcome, previewUrl, onReset }: RateResultProps) {
  const score = outcome.kind === "score" ? outcome.score : 0;
  const [displayScore, setDisplayScore] = useState(0);
  const [message] = useState(() =>
    outcome.kind === "score"
      ? messageForScore(outcome.score)
      : outcome.kind === "noface"
        ? NO_FACE_MESSAGE
        : UNCALIBRATED_MESSAGE
  );
  const countUpDone = displayScore >= score;
  const isPerfect = outcome.kind === "score" && outcome.score === 10;

  useEffect(() => {
    if (score === 0) return;
    const stepMs = COUNT_UP_MS / score;
    const interval = setInterval(() => {
      setDisplayScore((current) => {
        if (current + 1 >= score) clearInterval(interval);
        return Math.min(current + 1, score);
      });
    }, stepMs);
    return () => clearInterval(interval);
  }, [score]);

  return (
    <div className="space-y-5">
      {isPerfect && countUpDone && <ConfettiHearts />}

      <div className="mx-auto w-32 h-32 rounded-xl overflow-hidden border border-rose-200/50 dark:border-rose-700/40 shadow-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="Rated photo"
          className="w-full h-full object-cover"
        />
      </div>

      {outcome.kind === "uncalibrated" ? (
        <div className="text-5xl">🏗️</div>
      ) : (
        <div className="font-serif">
          <span
            className={`text-7xl font-bold tabular-nums ${
              isPerfect
                ? "text-rose-600 dark:text-rose-400"
                : "text-rose-900 dark:text-rose-100"
            }`}
          >
            {displayScore}
          </span>
          <span className="text-2xl text-rose-600 dark:text-rose-300">
            /10
          </span>
        </div>
      )}

      <p
        className={`text-rose-800 dark:text-rose-200 transition-opacity duration-500 ${
          countUpDone ? "opacity-100" : "opacity-0"
        }`}
      >
        {message}
      </p>

      <button
        onClick={onReset}
        className="px-6 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-medium transition-colors"
      >
        Try another photo
      </button>
    </div>
  );
}
