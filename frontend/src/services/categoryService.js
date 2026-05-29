import { API_BASE } from './config.js';

async function apiFetch(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || data.message || `HTTP ${res.status}`);
  }

  return data;
}

export async function getCategoryTree() {
  const res = await apiFetch('/api/categories?tree=1');
  return Array.isArray(res) ? res : (res.data || []);
}

export const FALLBACK_CATEGORY_TREE = [
  {
    name: 'Dong Ho Nam',
    slug: 'nam',
    children: [
      { name: 'Dong Ho Nam Co', slug: 'nam-co' },
      { name: 'Dong Ho Nam Dien Tu', slug: 'nam-dien-tu' },
      { name: 'Dong Ho The Thao Nam', slug: 'nam-the-thao' },
      { name: 'Dong Ho Luxury Nam', slug: 'nam-luxury' },
    ],
  },
  {
    name: 'Dong Ho Nu',
    slug: 'nu',
    children: [
      { name: 'Dong Ho Nu Thoi Trang', slug: 'nu-thoi-trang' },
      { name: 'Dong Ho Nu Co', slug: 'nu-co' },
      { name: 'Dong Ho Nu Day Da', slug: 'nu-day-da' },
      { name: 'Dong Ho Luxury Nu', slug: 'nu-luxury' },
    ],
  },
  {
    name: 'Phu Kien',
    slug: 'phu-kien',
    children: [
      { name: 'Day Dong Ho', slug: 'phu-kien-day-da' },
      { name: 'Hop Dung Dong Ho', slug: 'phu-kien-hop-dung' },
      { name: 'Dung Cu Sua Chua', slug: 'phu-kien-dung-cu' },
      { name: 'Watch Winder', slug: 'phu-kien-watch-winder' },
    ],
  },
];
