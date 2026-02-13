import { getPhotos } from "@/lib/photos";
import { FloatingPhotos } from "@/components/FloatingPhotos";

export default async function Home() {
  const photos = await getPhotos();

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-red-100 dark:from-rose-950 dark:via-pink-950 dark:to-red-950 flex flex-col items-center justify-center px-6 font-sans relative">
      <FloatingPhotos photos={photos} />

      <main className="max-w-lg text-center space-y-6 relative z-10">
        <div className="text-6xl">💕</div>
        <h1 className="text-4xl font-semibold tracking-tight text-rose-900 dark:text-rose-100">
          Happy Valentines
        </h1>
        <p className="text-lg text-rose-700 dark:text-rose-300">
          A little something special, just for you
        </p>
      </main>
    </div>
  );
}
