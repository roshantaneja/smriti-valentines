import { getPhotos } from "@/lib/photos";
import { getValentinesConfig } from "@/lib/valentines-config";
import { FloatingPhotos } from "@/components/FloatingPhotos";
import { DateCounter } from "@/components/DateCounter";
import { LoveLetter } from "@/components/LoveLetter";
import { ReasonsList } from "@/components/ReasonsList";
import { Timeline } from "@/components/Timeline";
import { ConfettiHearts } from "@/components/ConfettiHearts";
import { EasterEgg } from "@/components/EasterEgg";
import { ScrollHint } from "@/components/ScrollHint";

export const dynamic = "force-dynamic";

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default async function Home() {
  const [photos, config] = await Promise.all([
    getPhotos(),
    Promise.resolve(getValentinesConfig()),
  ]);
  const shuffledPhotos = shuffle(photos);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-red-100 dark:from-rose-950 dark:via-pink-950 dark:to-red-950 font-sans relative overflow-x-hidden">
      <FloatingPhotos photos={shuffledPhotos} />
      <ConfettiHearts />

      <main className="relative z-10">
        <section className="min-h-screen flex flex-col items-center justify-center px-6 relative">
          <div className="max-w-lg text-center space-y-6">
            <EasterEgg secretMessage={config.secretMessage}>
              <div className="cursor-default">
                <div className="text-6xl">💕💕💕</div>
                <h1 className="text-4xl font-semibold tracking-tight text-rose-900 dark:text-rose-100 backdrop-blur-sm bg-white/50 p-4 rounded-lg">
                  Happy Valentines, {config.recipientName}!
                </h1>
              </div>
            </EasterEgg>
            <DateCounter startDate={config.relationshipStartDate} />
          </div>
          <ScrollHint />
        </section>

        <LoveLetter content={config.loveLetter} />
        <ReasonsList reasons={config.reasons} />
        <Timeline events={config.timeline} />
      </main>
    </div>
  );
}
