// Core User Profile
export interface UserProfile {
  email: string;
  preferences: UserPreferences;
  sources: Source[];
  tier?: 'trial' | 'active' | 'expired';
  trialEndsAt?: string; // ISO date string
  polarCustomerId?: string; // Polar.sh customer ID for webhook matching
  stats?: {
    inputTokens: number;
    outputTokens: number;
    totalBriefingsSent: number;
  };
  createdAt: string;
  lastDigestAt?: string;
}

export interface UserPreferences {
  email?: string; // Legacy support
  deliveryTime: string; // HH:MM
  timezone?: string; // e.g., 'Asia/Kolkata'
  digestFormat?: 'simple' | 'comprehensive';
  llmProvider?: string;
  subscriptionStatus?: 'active' | 'paused';
  pausedUntil?: string; // ISO Date string. If null and paused -> indefinite.
}

export type SourceType =
  | 'youtube'
  | 'reddit'
  | 'substack'
  | 'medium'
  | 'hackernews'
  | 'github'
  | 'twitter'
  | 'podcast'
  | 'newsletter'
  | 'blog'
  | 'news'
  | 'rss'
  | 'instagram'
  | 'twitter'
  | 'custom';

export interface Source {
  id: string;
  type: SourceType;
  name: string;
  url: string;
  enabled: boolean;
  addedAt: string;
  favicon?: string; // New: For premium UI
  originalUrl?: string; // To track where it came from
}

export interface ContentItem {
  title: string;
  description: string;
  content: string;
  contentSnippet?: string;
  categories?: string[];
  author?: string;
  link: string;
  pubDate: string;
  source: string;
  sourceType: SourceType;
  thumbnail?: string;
}

export interface DigestSection {
  title: string;
  items: SummarizedContent[];
  summary?: string; // New: Section-level synthesis
}

export interface SummarizedContent extends ContentItem {
  summary: string;
  relevanceScore?: number;
}
