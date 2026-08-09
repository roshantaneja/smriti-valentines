"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { euclideanDistance, loadModels } from "@/lib/face-match";
import { fileToCanvas } from "@/lib/image-prep";

interface PhotoEntry {
  id: number;
  name: string;
  thumbUrl: string | null;
  status: "processing" | "ok" | "noface" | "multi" | "error";
  descriptor: number[] | null;
}

const OUTLIER_MEAN_DISTANCE = 0.5;

export function RateCalibrate() {
  const [entries, setEntries] = useState<PhotoEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextIdRef = useRef(0);
  const entriesRef = useRef<PhotoEntry[]>([]);
  entriesRef.current = entries;

  useEffect(() => {
    loadModels().catch(() => {});
    const urls = entriesRef.current;
    return () => {
      urls.forEach((e) => {
        if (e.thumbUrl) URL.revokeObjectURL(e.thumbUrl);
      });
    };
  }, []);

  const updateEntry = useCallback((id: number, patch: Partial<PhotoEntry>) => {
    setEntries((current) =>
      current.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  }, []);

  const handleFiles = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        const id = nextIdRef.current++;
        setEntries((current) => [
          ...current,
          {
            id,
            name: file.name,
            thumbUrl: null,
            status: "processing",
            descriptor: null,
          },
        ]);
        try {
          const { canvas, objectUrl } = await fileToCanvas(file);
          updateEntry(id, { thumbUrl: objectUrl });
          const { describeFaces } = await import("@/lib/face-match");
          const faces = await describeFaces(canvas);
          if (faces.length === 0) {
            updateEntry(id, { status: "noface" });
          } else if (faces.length > 1) {
            updateEntry(id, { status: "multi" });
          } else {
            updateEntry(id, {
              status: "ok",
              descriptor: Array.from(faces[0]),
            });
          }
        } catch {
          updateEntry(id, { status: "error" });
        }
      }
    },
    [updateEntry]
  );

  const accepted = entries.filter(
    (e): e is PhotoEntry & { descriptor: number[] } =>
      e.status === "ok" && e.descriptor !== null
  );

  const stats = pairwiseStats(accepted.map((e) => e.descriptor));

  const download = useCallback(() => {
    const payload = {
      model: "faceRecognitionNet-v1",
      generatedAt: new Date().toISOString(),
      descriptors: accepted.map((e) =>
        e.descriptor.map((v) => Number(v.toFixed(6)))
      ),
    };
    const blob = new Blob([JSON.stringify(payload)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "face-descriptors.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [accepted]);

  return (
    <div className="bg-white dark:bg-rose-950 p-8 rounded-2xl shadow-xl border border-rose-200 dark:border-rose-800 space-y-6">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(Array.from(e.dataTransfer.files));
        }}
        className="cursor-pointer rounded-xl border-2 border-dashed border-rose-300 dark:border-rose-700 hover:border-rose-400 dark:hover:border-rose-600 p-8 text-center transition-colors"
      >
        <p className="font-medium text-rose-900 dark:text-rose-100">
          Add reference photos
        </p>
        <p className="mt-1 text-sm text-rose-600 dark:text-rose-300">
          Varied lighting and angles, exactly one face per photo
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(Array.from(e.target.files));
          e.target.value = "";
        }}
      />

      {entries.length > 0 && (
        <ul className="space-y-2 text-left">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center gap-3 rounded-lg border border-rose-200 dark:border-rose-800 p-2"
            >
              <div className="w-12 h-12 rounded-md overflow-hidden bg-rose-100 dark:bg-rose-900 shrink-0">
                {entry.thumbUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.thumbUrl}
                    alt={entry.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <span className="flex-1 truncate text-sm text-rose-800 dark:text-rose-200">
                {entry.name}
              </span>
              <StatusBadge
                status={entry.status}
                outlier={isOutlier(entry, accepted)}
              />
            </li>
          ))}
        </ul>
      )}

      {stats && (
        <div className="rounded-lg bg-rose-50 dark:bg-rose-900 p-4 text-sm text-rose-800 dark:text-rose-200 text-left space-y-1">
          <p className="font-medium">
            Pairwise distances across {accepted.length} accepted photos
          </p>
          <p className="font-mono">
            min {stats.min.toFixed(3)} · mean {stats.mean.toFixed(3)} · max{" "}
            {stats.max.toFixed(3)}
          </p>
          <p
            className={
              stats.max < 0.55
                ? "text-green-700 dark:text-green-400"
                : "text-amber-700 dark:text-amber-400"
            }
          >
            {stats.max < 0.55
              ? "Looks consistent — max is comfortably under 0.55."
              : "Max distance is high — check for flagged outlier photos (bad detections) and remove them."}
          </p>
        </div>
      )}

      <button
        onClick={download}
        disabled={accepted.length === 0}
        className="px-6 py-2 rounded-full bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors"
      >
        Download face-descriptors.json ({accepted.length} descriptors)
      </button>
    </div>
  );
}

interface Stats {
  min: number;
  mean: number;
  max: number;
}

function pairwiseStats(descriptors: number[][]): Stats | null {
  if (descriptors.length < 2) return null;
  const distances: number[] = [];
  for (let i = 0; i < descriptors.length; i++) {
    for (let j = i + 1; j < descriptors.length; j++) {
      distances.push(euclideanDistance(descriptors[i], descriptors[j]));
    }
  }
  return {
    min: Math.min(...distances),
    mean: distances.reduce((a, b) => a + b, 0) / distances.length,
    max: Math.max(...distances),
  };
}

function isOutlier(
  entry: PhotoEntry,
  accepted: (PhotoEntry & { descriptor: number[] })[]
): boolean {
  if (entry.status !== "ok" || !entry.descriptor || accepted.length < 3) {
    return false;
  }
  const others = accepted.filter((e) => e.id !== entry.id);
  if (others.length === 0) return false;
  const mean =
    others.reduce(
      (sum, other) => sum + euclideanDistance(entry.descriptor!, other.descriptor),
      0
    ) / others.length;
  return mean > OUTLIER_MEAN_DISTANCE;
}

function StatusBadge({
  status,
  outlier,
}: {
  status: PhotoEntry["status"];
  outlier: boolean;
}) {
  if (status === "ok" && outlier) {
    return <Badge className="bg-amber-100 text-amber-800">outlier?</Badge>;
  }
  switch (status) {
    case "processing":
      return <Badge className="bg-rose-100 text-rose-600">analyzing…</Badge>;
    case "ok":
      return <Badge className="bg-green-100 text-green-800">✓ face</Badge>;
    case "noface":
      return <Badge className="bg-red-100 text-red-800">no face</Badge>;
    case "multi":
      return (
        <Badge className="bg-amber-100 text-amber-800">2+ faces, skipped</Badge>
      );
    case "error":
      return <Badge className="bg-red-100 text-red-800">error</Badge>;
  }
}

function Badge({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  );
}
