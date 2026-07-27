import type { Metadata } from "next";
import { RatePhoto } from "@/components/RatePhoto";

export const metadata: Metadata = {
  title: "FaceRate Pro™ 9000",
  description: "Attractiveness analysis powered by a 128-dimensional neural aesthetic engine.",
};

export default function RatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-red-100 dark:from-rose-950 dark:via-pink-950 dark:to-red-950 font-sans relative overflow-x-hidden">
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg space-y-6 text-center">
          <div>
            <div className="text-5xl mb-3">🔬</div>
            <h1 className="text-4xl font-semibold tracking-tight text-rose-900 dark:text-rose-100">
              FaceRate Pro™ 9000
            </h1>
            <p className="mt-2 text-rose-600 dark:text-rose-300 text-sm">
              Attractiveness analysis powered by a 128-dimensional neural
              aesthetic engine.
            </p>
          </div>

          <RatePhoto />

          <p className="text-xs text-rose-500 dark:text-rose-400">
            Your photo never leaves your device. The analysis runs entirely in
            your browser.
          </p>
        </div>
      </main>
    </div>
  );
}
