/**
 * Centralized site configuration.
 * Always prefers the NEXT_PUBLIC_SITE_URL environment variable.
 * Falls back to localhost in development.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://siftl.com');

export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'editor@siftl.com';
export const SENDER_NAME = 'Siftl';

// Helper for absolute URLs to ensure consistency
export const getAbsoluteUrl = (path: string) => {
  const base = SITE_URL.endsWith('/') ? SITE_URL.slice(0, -1) : SITE_URL;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};
