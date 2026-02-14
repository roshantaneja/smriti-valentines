"use client";

import Image from "next/image";
import { useEffect } from "react";

interface PhotoItem {
  src: string;
  alt: string;
}

interface PhotoLightboxProps {
  photo: PhotoItem;
  onClose: () => void;
}

export function PhotoLightbox({ photo, onClose }: PhotoLightboxProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const isBlobOrApi =
    photo.src.startsWith("blob:") || photo.src.startsWith("/api/");

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-label="Photo lightbox"
    >
      <div
        className="relative max-w-4xl max-h-[90vh] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/90 hover:text-white text-3xl"
          aria-label="Close"
        >
          ×
        </button>

        <div className="relative w-full aspect-[4/3] max-h-[80vh] bg-rose-950/30 rounded-xl overflow-hidden">
          {isBlobOrApi ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo.src}
              alt={photo.alt}
              className="object-contain w-full h-full"
            />
          ) : (
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 896px"
            />
          )}
        </div>

        {photo.alt && (
          <p className="text-center text-white/90 mt-4 text-sm">{photo.alt}</p>
        )}
      </div>
    </div>
  );
}
