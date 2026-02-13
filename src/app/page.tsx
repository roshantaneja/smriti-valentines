import { getPhotos } from "@/lib/photos";
import { FloatingPhotos } from "@/components/FloatingPhotos";

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
  const photos = await getPhotos();
  const shuffledPhotos = shuffle(photos);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-red-100 dark:from-rose-950 dark:via-pink-950 dark:to-red-950 flex flex-col items-center justify-center px-6 font-sans relative">
      <FloatingPhotos photos={shuffledPhotos} />

      <main className="max-w-lg text-center space-y-6 relative z-10">
        <div className="text-6xl">💕💕💕</div>
        <h1 className="text-4xl font-semibold tracking-tight text-rose-900 dark:text-rose-100 backdrop-blur-sm bg-white/50 p-4 rounded-lg">
          Happy Valentines!
        </h1>
      </main>
    </div>
  );
}
