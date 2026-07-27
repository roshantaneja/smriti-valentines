"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RateOutcome } from "@/lib/face-match";
import { fileToCanvas } from "@/lib/image-prep";
import { ERROR_MESSAGE, THEATER_MS } from "@/lib/rate-messages";
import { RateAnalysis } from "./RateAnalysis";
import { RateResult } from "./RateResult";

type Phase = "idle" | "analyzing" | "result" | "error";

export function RatePhoto() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [outcome, setOutcome] = useState<RateOutcome | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    // Pre-warm the ~12 MB of model weights while the visitor picks a photo,
    // so the fake analysis delay usually covers real inference.
    import("@/lib/face-match").then((m) => m.loadModels()).catch(() => {});
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPreviewUrl(null);
    setOutcome(null);
    setPhase("idle");
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setPhase("analyzing");
    try {
      const { canvas, objectUrl } = await fileToCanvas(file);
      objectUrlRef.current = objectUrl;
      setPreviewUrl(objectUrl);

      const [result] = await Promise.all([
        import("@/lib/face-match").then((m) => m.ratePhoto(canvas)),
        new Promise((r) => setTimeout(r, THEATER_MS)),
      ]);

      if (process.env.NODE_ENV === "development") {
        console.log("[FaceRate] outcome:", result);
      }
      setOutcome(result);
      setPhase("result");
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("[FaceRate] failed:", err);
      }
      setPhase("error");
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (phase === "analyzing") return;
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile, phase]
  );

  return (
    <div className="backdrop-blur-sm bg-[linear-gradient(rgba(255,255,255,0.95),rgba(255,255,255,0.9))] dark:bg-[linear-gradient(rgba(255,255,255,0.18),rgba(255,255,255,0.12))] p-8 rounded-2xl shadow-xl border border-rose-200/50 dark:border-rose-700/40">
      {phase === "idle" && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-10 transition-colors ${
            dragging
              ? "border-rose-500 bg-rose-100/60 dark:bg-rose-900/30"
              : "border-rose-300 dark:border-rose-700 hover:border-rose-400 dark:hover:border-rose-600"
          }`}
        >
          <div className="text-4xl mb-3">📸</div>
          <p className="font-medium text-rose-900 dark:text-rose-100">
            Upload a photo to be rated
          </p>
          <p className="mt-1 text-sm text-rose-600 dark:text-rose-300">
            Tap to choose or drop an image here
          </p>
        </div>
      )}

      {phase === "analyzing" && <RateAnalysis previewUrl={previewUrl} />}

      {phase === "result" && outcome && previewUrl && (
        <RateResult outcome={outcome} previewUrl={previewUrl} onReset={reset} />
      )}

      {phase === "error" && (
        <div className="space-y-4">
          <div className="text-4xl">🫣</div>
          <p className="text-rose-800 dark:text-rose-200">{ERROR_MESSAGE}</p>
          <button
            onClick={reset}
            className="px-6 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-medium transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
