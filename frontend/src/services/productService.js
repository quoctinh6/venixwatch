/**
 * productService.js — Product API calls for Venix Watch
 */
import { API_BASE } from './config.js';
import { getToken } from './authService.js';

async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

function buildQuery(params = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== '') q.set(k, v);
  }
  return q.toString() ? `?${q.toString()}` : '';
}

/**
 * Get paginated/filtered products
 * @param {Object} params — category_slug, page, limit, search, featured, sort
 */
export async function getProducts(params = {}) {
  const url = `${API_BASE}/api/products${buildQuery(params)}`;
  return apiFetch(url);
}

/**
 * Get a single product by slug
 */
export async function getProduct(slug) {
  return apiFetch(`${API_BASE}/api/products/${encodeURIComponent(slug)}`);
}

export async function getProductImages(productId) {
  return apiFetch(`${API_BASE}/api/products/${encodeURIComponent(productId)}/images`);
}

export async function getProductSpecs(productId) {
  return apiFetch(`${API_BASE}/api/products/${encodeURIComponent(productId)}/specs`);
}

export async function getProductReviews(productId, params = {}) {
  return apiFetch(`${API_BASE}/api/products/${encodeURIComponent(productId)}/reviews${buildQuery(params)}`);
}

export async function getProductQuestions(productId, params = {}) {
  return apiFetch(`${API_BASE}/api/products/${encodeURIComponent(productId)}/questions${buildQuery(params)}`);
}

export async function canReviewProduct(productId) {
  return apiFetch(`${API_BASE}/api/reviews/${encodeURIComponent(productId)}/can-review`);
}

export async function createProductReview(productId, payload) {
  return apiFetch(`${API_BASE}/api/products/${encodeURIComponent(productId)}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function createProductQuestion(productId, payload) {
  return apiFetch(`${API_BASE}/api/products/${encodeURIComponent(productId)}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getRelatedProducts(productId) {
  return apiFetch(`${API_BASE}/api/products/${encodeURIComponent(productId)}/related`);
}

export async function getCrossSellProducts(productId) {
  return apiFetch(`${API_BASE}/api/products/${encodeURIComponent(productId)}/cross-sell`);
}

export async function trackProductView(productId, sessionId) {
  const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(productId)}/view${buildQuery(sessionId ? { session_id: sessionId } : {})}`, {
    method: 'POST',
    headers: sessionId ? { 'X-Cart-Session': sessionId } : {},
  });
  return res.json().catch(() => ({}));
}

export async function getRecentlyViewedProducts(sessionId) {
  return apiFetch(`${API_BASE}/api/recently-viewed${buildQuery(sessionId ? { session_id: sessionId } : {})}`);
}

/**
 * Get featured products for homepage
 */
export async function getFeaturedProducts(limit = 10) {
  return getProducts({ featured: 1, limit });
}

/**
 * Get new arrivals
 */
export async function getNewArrivals(limit = 10) {
  return getProducts({ sort: 'new', limit });
}

/**
 * Get best sellers
 */
export async function getBestSellers(limit = 10) {
  return getProducts({ sort: 'bestseller', limit });
}

/**
 * Search products
 */
export async function searchProducts(query, limit = 20) {
  return getProducts({ search: query, limit });
}

/** Fallback mock products when API is unavailable */
export function getMockProducts(count = 8) {
  const images = [
    'https://images.pexels.com/photos/236915/pexels-photo-236915.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/2783873/pexels-photo-2783873.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/364822/pexels-photo-364822.jpeg?auto=compress&cs=tinysrgb&w=400',
  ];
  const names = ['Rolex Submariner', 'Omega Seamaster', 'Patek Philippe Calatrava',
    'Audemars Piguet Royal Oak', 'IWC Portugieser', 'Jaeger-LeCoultre Master',
    'Cartier Santos', 'TAG Heuer Carrera'];
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: names[i % names.length],
    slug: `dong-ho-${i + 1}`,
    price: [2990000, 4990000, 8990000, 12990000, 19990000][i % 5],
    sale_price: i % 3 === 0 ? [2490000, 3990000, 7490000][i % 3] : null,
    image: images[i % images.length],
    category_name: ['Nam', 'Nữ', 'Phụ Kiện'][i % 3],
    badge: ['NEW', 'BESTSELLER', null, 'SALE', null][i % 5],
    is_featured: i < 5,
  }));
}

export const productService = {
  getProducts,
  getProduct,
  getProductImages,
  getProductSpecs,
  getProductReviews,
  getProductQuestions,
  canReviewProduct,
  createProductReview,
  createProductQuestion,
  getRelatedProducts,
  getCrossSellProducts,
  trackProductView,
  getRecentlyViewedProducts,
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
  searchProducts,
  getMockProducts,
};
