"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PhotoLightbox } from "./PhotoLightbox";

const MAX_SLOTS = 50;
const ROTATE_INTERVAL_MS = 2500;

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

  if (failed) return null;

  if (!displaySrc) {
    return <div style={{ width: size, height: size }} aria-hidden />;
  }

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

interface SlotStyle {
  left: number;
  top: number;
  size: number;
  rotation: number;
  animationDelay: number;
  animationDuration: number;
}

const REPEL_RADIUS = 200;
const REPEL_STRENGTH = 30;

function seededRandom(seed: number, offset: number): number {
  const x = Math.sin(seed * 9999 + offset * 12345) * 10000;
  return x - Math.floor(x);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function shuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const r = (Math.sin(seed * (i + 1) * 7777) * 10000) - Math.floor((Math.sin(seed * (i + 1) * 7777) * 10000));
    const j = Math.floor(Math.abs(r) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function FloatingPhotos({ photos }: FloatingPhotosProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [cursorOffsets, setCursorOffsets] = useState<Map<number, { x: number; y: number }>>(new Map());
  const [failedSlots, setFailedSlots] = useState<Set<number>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState<Set<number>>(new Set());
  const mouseRef = useRef(mouse);
  mouseRef.current = mouse;

  const poolRef = useRef<PhotoItem[]>([]);
  const rotationKeyRef = useRef(0);

  const slotStyles = useMemo((): SlotStyle[] => {
    const cols = 6;
    const rows = Math.ceil(MAX_SLOTS / cols);
    const seed = 12345;
    const styles: SlotStyle[] = [];
    for (let i = 0; i < MAX_SLOTS; i++) {
      const r = (o: number) => seededRandom(seed + i * 7, o);
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cellWidth = 92 / cols;
      const cellHeight = 88 / rows;
      styles.push({
        left: round2(Math.min(88, (col * cellWidth) + r(1) * (cellWidth * 0.6) + 3)),
        top: round2(Math.min(85, (row * cellHeight) + r(2) * (cellHeight * 0.6) + 3)),
        size: round2(120 + r(3) * 100),
        rotation: round2(-12 + r(4) * 24),
        animationDelay: round2(r(5) * 5),
        animationDuration: round2(8 + r(6) * 6),
      });
    }
    return styles;
  }, []);

  const [displayedSlots, setDisplayedSlots] = useState<{ photo: PhotoItem; key: number }[]>(() => {
    if (photos.length === 0) return [];
    const n = Math.min(MAX_SLOTS, photos.length);
    poolRef.current = photos.slice(n);
    return photos.slice(0, n).map((photo, i) => ({ photo, key: i }));
  });

  useEffect(() => {
    if (photos.length === 0) return;
    if (displayedSlots.length === 0) {
      const n = Math.min(MAX_SLOTS, photos.length);
      poolRef.current = photos.slice(n);
      setDisplayedSlots(photos.slice(0, n).map((photo, i) => ({ photo, key: i })));
    }
  }, [photos, displayedSlots.length]);

  useEffect(() => {
    if (photos.length <= MAX_SLOTS) return;

    const interval = setInterval(() => {
      setDisplayedSlots((prev) => {
        let pool = [...poolRef.current];
        if (pool.length === 0) {
          const currentSrcs = new Set(prev.map((s) => s.photo.src));
          const unused = photos.filter((p) => !currentSrcs.has(p.src));
          pool = unused.length > 0 ? shuffle(unused, Math.random()) : shuffle(photos, Math.random());
          poolRef.current = pool;
        }
        if (pool.length === 0) return prev;

        const slotIdx = Math.floor(Math.random() * prev.length);
        const newPhoto = pool[0];
        poolRef.current = pool.slice(1);

        const next = [...prev];
        next[slotIdx] = { photo: newPhoto, key: ++rotationKeyRef.current };
        return next;
      });
    }, ROTATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [photos]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMouse({ x: e.clientX, y: e.clientY });
  }, []);

  const prevOffsetsRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const slotStylesRef = useRef(slotStyles);
  slotStylesRef.current = slotStyles;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number;
    let lastUpdate = 0;
    const THROTTLE_MS = 32;

    const update = (timestamp: number) => {
      const styles = slotStylesRef.current;
      if (styles.length === 0) {
        rafId = requestAnimationFrame(update);
        return;
      }
      const rect = container.getBoundingClientRect();
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const newOffsets = new Map<number, { x: number; y: number }>();

      styles.forEach((style, i) => {
        const photoCenterX = rect.left + rect.width * (style.left / 100) + style.size / 2;
        const photoCenterY = rect.top + rect.height * (style.top / 100) + style.size / 2;
        const dx = photoCenterX - mx;
        const dy = photoCenterY - my;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < REPEL_RADIUS && distance > 0) {
          const force = (1 - distance / REPEL_RADIUS) * REPEL_STRENGTH;
          const angle = Math.atan2(dy, dx);
          newOffsets.set(i, { x: Math.cos(angle) * force, y: Math.sin(angle) * force });
        } else {
          newOffsets.set(i, { x: 0, y: 0 });
        }
      });

      if (timestamp - lastUpdate > THROTTLE_MS) {
        const prev = prevOffsetsRef.current;
        const hasChanged = styles.some((_, i) => {
          const next = newOffsets.get(i)!;
          const p = prev.get(i);
          return !p || Math.abs(p.x - next.x) > 0.5 || Math.abs(p.y - next.y) > 0.5;
        });
        if (hasChanged) {
          lastUpdate = timestamp;
          prevOffsetsRef.current = new Map(newOffsets);
          setCursorOffsets(prevOffsetsRef.current);
        }
      }
      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);

  if (photos.length === 0 || displayedSlots.length === 0) return null;

  return (
    <>
      <div
        ref={containerRef}
        className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0"
        aria-hidden
      >
        {displayedSlots.map((slot, i) => {
          if (failedSlots.has(i)) return null;
          const style = slotStyles[i];
          const offset = cursorOffsets.get(i) ?? { x: 0, y: 0 };
          const isLoading = loadingSlots.has(i);
          return (
            <div
              key={`${i}-${slot.key}`}
              className={`absolute rounded-xl overflow-hidden shadow-xl ring-2 ring-white/50 transition-opacity duration-300 cursor-pointer pointer-events-auto hover:ring-rose-400 hover:scale-105 hover:z-10 ${
                isLoading ? "opacity-0 pointer-events-none" : ""
              }`}
              style={{
                left: `${style.left}%`,
                top: `${style.top}%`,
                width: style.size,
                height: style.size,
                transform: `rotate(${style.rotation}deg) translate(${offset.x}px, ${offset.y}px)`,
              }}
              onClick={() => !loadingSlots.has(i) && setSelectedPhoto(slot.photo)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !loadingSlots.has(i)) {
                  e.preventDefault();
                  setSelectedPhoto(slot.photo);
                }
              }}
              aria-label={`View photo: ${slot.photo.alt}`}
            >
            <div
              className="w-full h-full"
              style={{
                animation: `photo-fade-in 0.6s ease-out forwards, photo-float ${style.animationDuration}s ease-in-out ${style.animationDelay}s infinite`,
              }}
            >
              <PhotoImage
                src={slot.photo.src}
                alt={slot.photo.alt}
                size={style.size}
                className="object-cover w-full h-full"
                onLoadFailed={() => setFailedSlots((prev) => new Set(prev).add(i))}
                onLoadingChange={(loading) =>
                  setLoadingSlots((prev) => {
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

      {selectedPhoto && (
        <PhotoLightbox
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </>
  );
}
