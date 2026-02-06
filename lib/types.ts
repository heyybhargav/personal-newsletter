// Core User Profile
export interface UserProfile {
  email: string;
  preferences: UserPreferences;
  sources: Source[];
  createdAt: string;
  lastDigestAt?: string;
}

export interface UserPreferences {
  email?: string; // Legacy support
  deliveryTime: string; // HH:MM
  timezone?: string; // e.g., 'Asia/Kolkata'
  digestFormat?: 'simple' | 'comprehensive';
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
  | 'custom';

export interface Source {
  id: string;
  type: SourceType;
  name: string;
  url: string;
  enabled: boolean;
  addedAt: string;
  favicon?: string; // New: For premium UI
}

export interface ContentItem {
  title: string;
  description: string;
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
