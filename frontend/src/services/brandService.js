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
      { name: 'Rolex', source_name: 'Rolex', slug: 'rolex', logo_url: '', products_count: 12 },
      { name: 'Omega', source_name: 'Omega', slug: 'omega', logo_url: '', products_count: 10 },
      { name: 'Tissot', source_name: 'Tissot', slug: 'tissot', logo_url: '', products_count: 9 },
      { name: 'Seiko', source_name: 'Seiko', slug: 'seiko', logo_url: '', products_count: 7 },
      { name: 'Citizen', source_name: 'Citizen', slug: 'citizen', logo_url: '', products_count: 6 },
      { name: 'Casio', source_name: 'Casio', slug: 'casio', logo_url: '', products_count: 5 },
    ],
  };
}
