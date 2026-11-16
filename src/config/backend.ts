/**
 * Doodle Arena - Centralized Backend & API Configuration
 * Supports GitHub Pages static hosting with external backend (Render / Railway),
 * local development proxies, and runtime URL overrides.
 */

export const getBackendUrl = (): string => {
  // 1. Runtime override stored in localStorage (allows setting backend directly in UI)
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('doodle_backend_url');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }
  }

  // 2. Vite environment variable (injected during build or via .env)
  const envUrl =
    (import.meta.env.VITE_BACKEND_URL as string | undefined) ||
    (import.meta.env.VITE_API_URL as string | undefined);

  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // 3. Localhost development
  if (typeof window !== 'undefined') {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      // In Vite dev on port 5173, backend runs on 3001
      return window.location.port === '5173'
        ? 'http://localhost:3001'
        : window.location.origin;
    }

    // 4. GitHub Pages: automatically connect to live Render backend
    if (window.location.hostname.includes('github.io')) {
      return 'https://doddle-arena.onrender.com';
    }

    return window.location.origin;
  }

  return 'http://localhost:3001';
};

export const setBackendUrl = (url: string): void => {
  if (typeof window !== 'undefined') {
    const cleaned = url ? url.trim().replace(/\/+$/, '') : '';
    if (!cleaned) {
      localStorage.removeItem('doodle_backend_url');
    } else {
      localStorage.setItem('doodle_backend_url', cleaned);
    }
  }
};

export const getApiUrl = (endpoint: string): string => {
  const base = getBackendUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!base) {
    return cleanEndpoint;
  }
  return `${base}${cleanEndpoint}`;
};
