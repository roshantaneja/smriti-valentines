"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

export function ConfettiHearts() {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;

    const heartShape = confetti.shapeFromText({
      text: "❤️",
      scalar: 1.5,
    });

    const fire = () => {
      firedRef.current = true;
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.6 },
        shapes: [heartShape],
        colors: ["#f43f5e", "#ec4899", "#f472b6", "#fb7185", "#e11d48"],
        scalar: 1.2,
        disableForReducedMotion: true,
      });
    };

    const timer = setTimeout(fire, 800);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
