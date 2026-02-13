"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function PhotoImage({
  src,
  alt,
  size,
  className,
  onLoadFailed,
  onLoadingChange,
}: {
  src: string;
  alt: string;
  size: number;
  className?: string;
  onLoadFailed?: () => void;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const [displaySrc, setDisplaySrc] = useState<string | null>(
    () => (src.toLowerCase().endsWith(".heic") ? null : src)
  );
  const [failed, setFailed] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!src.toLowerCase().endsWith(".heic")) {
      setDisplaySrc(src);
      onLoadingChange?.(false);
      return;
    }
    onLoadingChange?.(true);
    let cancelled = false;
    Promise.all([
      fetch(src).then((r) => r.blob()),
      import("heic2any").then((m) => m.default),
    ])
      .then(([blob, heic2any]) =>
        heic2any({ blob, toType: "image/jpeg", quality: 0.9 })
      )
      .then((result) => (Array.isArray(result) ? result[0] : result))
      .then((jpegBlob: Blob) => {
        if (!cancelled && jpegBlob) {
          const url = URL.createObjectURL(jpegBlob);
          objectUrlRef.current = url;
          setDisplaySrc(url);
          onLoadingChange?.(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          onLoadingChange?.(false);
          onLoadFailed?.();
        }
      });

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [src, onLoadFailed, onLoadingChange]);

  // Hide entirely if conversion failed
  if (failed) return null;

  // HEIC still converting - render invisible placeholder to avoid layout shift
  if (!displaySrc) {
    return <div style={{ width: size, height: size }} aria-hidden />;
  }

  // Use native <img> for blob URLs and API routes (Next/Image has query restrictions)
  if (displaySrc.startsWith("blob:") || displaySrc.startsWith("/api/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={displaySrc}
        alt={alt}
        width={size}
        height={size}
        className={className}
        style={{ objectFit: "cover", width: "100%", height: "100%" }}
      />
    );
  }

  return (
    <Image
      src={displaySrc}
      alt={alt}
      width={size}
      height={size}
      className={className}
      sizes={`${size}px`}
    />
  );
}

interface PhotoItem {
  src: string;
  alt: string;
}

interface FloatingPhotosProps {
  photos: PhotoItem[];
}

interface PhotoStyle {
  src: string;
  alt: string;
  left: number;
  top: number;
  size: number;
  rotation: number;
  animationDelay: number;
  animationDuration: number;
}

const REPEL_RADIUS = 200;
const REPEL_STRENGTH = 30;

// Deterministic "random" from string seed - same input = same output (server & client)
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) / 2147483647;
}

function seededRandom(seed: number, offset: number): number {
  const x = Math.sin(seed * 9999 + offset * 12345) * 10000;
  return x - Math.floor(x);
}

export function FloatingPhotos({ photos }: FloatingPhotosProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [cursorOffsets, setCursorOffsets] = useState<Map<number, { x: number; y: number }>>(new Map());
  const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set());
  const [loadingIndices, setLoadingIndices] = useState<Set<number>>(new Set());
  const mouseRef = useRef(mouse);
  mouseRef.current = mouse;

  const photoStyles = useMemo(() => {
    if (photos.length === 0) return [];
    const seed = hashString(photos.map((p) => p.src).join(","));
    const cols = 6;
    const rows = Math.ceil(photos.length / cols) || 1;
    return photos.map((photo, i) => {
      const r = (o: number) => seededRandom(seed + i * 7, o);
      const col = i % cols;
      const row = Math.floor(i / cols);
      // Grid layout with random offset for organic feel - ensures even spread
      const cellWidth = 92 / cols;
      const cellHeight = 88 / rows;
      const left = Math.min(88, (col * cellWidth) + r(1) * (cellWidth * 0.6) + 3);
      const top = Math.min(85, (row * cellHeight) + r(2) * (cellHeight * 0.6) + 3);
      return {
        src: photo.src,
        alt: photo.alt,
        left,
        top,
        size: 120 + r(3) * 100,
        rotation: -12 + r(4) * 24,
        animationDelay: r(5) * 5,
        animationDuration: 8 + r(6) * 6,
      };
    });
  }, [photos]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMouse({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || photoStyles.length === 0) return;

    let rafId: number;
    let lastUpdate = 0;
    const THROTTLE_MS = 32; // ~30fps for smooth cursor interaction

    const update = (timestamp: number) => {
      const rect = container.getBoundingClientRect();
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const newOffsets = new Map<number, { x: number; y: number }>();

      photoStyles.forEach((style, i) => {
        const photoCenterX = rect.left + rect.width * (style.left / 100) + style.size / 2;
        const photoCenterY = rect.top + rect.height * (style.top / 100) + style.size / 2;

        const dx = photoCenterX - mx;
        const dy = photoCenterY - my;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < REPEL_RADIUS && distance > 0) {
          const force = (1 - distance / REPEL_RADIUS) * REPEL_STRENGTH;
          const angle = Math.atan2(dy, dx);
          newOffsets.set(i, {
            x: Math.cos(angle) * force,
            y: Math.sin(angle) * force,
          });
        } else {
          newOffsets.set(i, { x: 0, y: 0 });
        }
      });

      if (timestamp - lastUpdate > THROTTLE_MS) {
        lastUpdate = timestamp;
        setCursorOffsets(new Map(newOffsets));
      }
      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [photoStyles, handleMouseMove]);

  if (photos.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0"
      aria-hidden
    >
      {photoStyles.map((style, i) => {
        if (failedIndices.has(i)) return null;
        const offset = cursorOffsets.get(i) ?? { x: 0, y: 0 };
        const isLoading = loadingIndices.has(i);
        return (
          <div
            key={style.src}
            className={`absolute rounded-xl overflow-hidden shadow-xl ring-2 ring-white/50 transition-opacity duration-300 ${
              isLoading ? "opacity-0 pointer-events-none" : ""
            }`}
            style={{
              left: `${style.left}%`,
              top: `${style.top}%`,
              width: style.size,
              height: style.size,
              transform: `rotate(${style.rotation}deg) translate(${offset.x}px, ${offset.y}px)`,
            }}
          >
            <div
              className="w-full h-full"
              style={{
                animation: `photo-float ${style.animationDuration}s ease-in-out infinite`,
                animationDelay: `${style.animationDelay}s`,
              }}
            >
              <PhotoImage
                src={style.src}
                alt={style.alt}
                size={style.size}
                className="object-cover w-full h-full"
                onLoadFailed={() =>
                  setFailedIndices((prev) => new Set(prev).add(i))
                }
                onLoadingChange={(loading) =>
                  setLoadingIndices((prev) => {
                    const next = new Set(prev);
                    if (loading) next.add(i);
                    else next.delete(i);
                    return next;
                  })
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
