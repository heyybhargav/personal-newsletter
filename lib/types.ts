export type SourceType = 'youtube' | 'podcast' | 'news' | 'reddit' | 'custom';

export interface Source {
  id: string;
  type: SourceType;
  name: string;
  url: string;
  enabled: boolean;
  addedAt: string;
}

export interface ContentItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  sourceType: SourceType;
}

export interface DigestSection {
  title: string;
  items: Array<{
    title: string;
    summary: string;
    link: string;
    source: string;
  }>;
}

export interface UserPreferences {
  email: string;
  deliveryTime: string; // HH:mm format
  sources: Source[];
}
