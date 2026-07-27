import { notFound } from "next/navigation";
import { RateCalibrate } from "@/components/RateCalibrate";

export default function CalibratePage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-red-100 dark:from-rose-950 dark:via-pink-950 dark:to-red-950 font-sans">
      <main className="min-h-screen flex flex-col items-center px-6 py-16">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-rose-900 dark:text-rose-100">
              Reference Calibration
            </h1>
            <p className="mt-2 text-rose-600 dark:text-rose-300 text-sm">
              Dev-only. Drop 10–20 varied photos of the reference person, check
              the distance stats, then download the descriptor file into{" "}
              <code className="font-mono">src/data/face-descriptors.json</code>.
            </p>
          </div>
          <RateCalibrate />
        </div>
      </main>
    </div>
  );
}
