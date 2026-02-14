"use client";

interface DateCounterProps {
  startDate: string;
}

function getDaysTogether(startDateStr: string): number {
  const start = new Date(startDateStr);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - start.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function DateCounter({ startDate }: DateCounterProps) {
  const days = getDaysTogether(startDate);

  return (
    <p className="text-lg text-rose-700 dark:text-rose-200 backdrop-blur-sm bg-white/40 px-4 py-2 rounded-lg">
      {days} days together
    </p>
  );
}
