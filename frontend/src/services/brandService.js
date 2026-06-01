import { API_BASE } from './config.js';

async function apiFetch(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getTopBrands(limit = 6) {
  return apiFetch(`${API_BASE}/api/brands/top?limit=${encodeURIComponent(limit)}`);
}

export function getMockTopBrands() {
  return {
    data: [
      {
        name: 'Carnival',
        source_name: 'Carnival',
        slug: 'carnival',
        logo_url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgNjAiIHdpZHRoPSIyMDAiIGhlaWdodD0iNjAiPgo8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjMGYxNzJhIiByeD0iOCIvPgo8cGF0aCBkPSJNMTAwIDEyIEwxMDYgMjAgTDExNCAxNSBMMTEwIDI1IEw5MCAyNSBMMDYgMTUgTDk0IDIwIFoiIGZpbGw9IiNDOUE4NEMiLz4KPHRleHQgeD0iNTAlIiB5PSI0NiIgZm9udC1mYW1pbHk9IidDb3Jtb3JhbnQgR2FyYW1vbmQnLCBHZW9yZ2lhLCBzZXJpZiIgZm9udC13ZWlnaHQ9IjcwMCIgZm9udC1zaXplPSIyMCIgZmlsbD0iI0M5QTg0QyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgbGV0dGVyLXNwYWNpbmc9IjMiPkNBUk5JVkFMPC90ZXh0Pgo8L3N2Zz4=',
        products_count: 501
      },
      {
        name: 'Casio',
        source_name: 'Casio',
        slug: 'casio',
        logo_url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgNjAiIHdpZHRoPSIyMDAiIGhlaWdodD0iNjAiPgo8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjMGYxNzJhIiByeD0iOCIvPgo8dGV4dCB4PSI1MCUiIHk9IjM4IiBmb250LWZhbWlseT0iTW9udHNlcnJhdCwgQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSI5MDAiIGZvbnQtc2l6ZT0iMjgiIGZpbGw9IiNmZmZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGxldHRlci1zcGFjaW5nPSI0Ij5DQVNJTzwvdGV4dD4KPC9zdmc+',
        products_count: 307
      },
      {
        name: 'Kemil',
        source_name: 'Kemil',
        slug: 'kemil',
        logo_url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgNjAiIHdpZHRoPSIyMDAiIGhlaWdodD0iNjAiPgo8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjMGYxNzJhIiByeD0iOCIvPgo8dGV4dCB4PSI1MCUiIHk9IjM4IiBmb250LWZhbWlseT0iJ01vbnRzZXJyYXQnLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iMzAwIiBmb250LXNpemU9IjI0IiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBsZXR0ZXItc3BhY2luZz0iNiI+S0VNSUw8L3RleHQ+Cjwvc3ZnPg==',
        products_count: 29
      },
    ],
  };
}
