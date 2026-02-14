import valentinesData from "@/data/valentines.json";

export interface TimelineEvent {
  date: string;
  title: string;
  description: string;
}

export interface ValentinesConfig {
  recipientName: string;
  relationshipStartDate: string;
  loveLetter: string;
  reasons: string[];
  timeline: TimelineEvent[];
  secretMessage?: string;
}

const config = valentinesData as ValentinesConfig;

export function getValentinesConfig(): ValentinesConfig {
  return config;
}
