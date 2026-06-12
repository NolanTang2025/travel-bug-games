export type MemeTrendHeat = "blazing" | "hot" | "warm";

export type MemeTrend = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  heat: MemeTrendHeat;
  platforms: string[];
  peakWindow?: string;
  expiresAt?: string;
  gist: string;
  storyPrompt: string;
  storyStarters: string[];
  viralPlaybook: string[];
  hookExamples: string[];
  hashtags: string[];
  llmBrief: string;
  gradient: string;
  coverUrl: string;
};

export type MemeTrendsManifest = {
  schemaVersion: number;
  updatedAt: string;
  refreshEveryHours: number;
  maxTrendAgeDays: number;
  region: string;
  featuredIds: string[];
  trends: MemeTrend[];
};
