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

function normalizeLocalProduct(p) {
  const isCo = String(p.subcategory || '').toLowerCase().includes('cơ') || String(p.movement_type || '').toLowerCase().includes('auto');
  
  let specsArray = [];
  if (p.specs) {
    if (Array.isArray(p.specs)) {
      specsArray = p.specs;
    } else if (typeof p.specs === 'object') {
      specsArray = Object.entries(p.specs).map(([label, value]) => ({ label, value }));
    } else if (typeof p.specs === 'string') {
      try {
        const parsed = JSON.parse(p.specs);
        if (Array.isArray(parsed)) specsArray = parsed;
        else if (typeof parsed === 'object') {
          specsArray = Object.entries(parsed).map(([label, value]) => ({ label, value }));
        }
      } catch (e) {}
    }
  }

  if (specsArray.length === 0) {
    const specMapping = {
      'Thương hiệu': p.brand || 'Kemil',
      'Xuất xứ thương hiệu': p.origin || 'Mỹ',
      'Đường kính mặt': p.case_size || '32mm',
      'Chống nước': p.water_resistance || '30m (3 ATM)',
      'Chất liệu vỏ': p.case_material || 'Thép không gỉ 316L',
      'Loại máy': isCo ? 'AUTOMATIC' : 'QUARTZ',
      'Giới tính': 'Nữ',
    };
    
    Object.entries(specMapping).forEach(([label, value]) => {
      if (value) {
        specsArray.push({ label, value });
      }
    });
  }

  return {
    id: p.id || Math.floor(Math.random() * 1000000),
    name: p.name,
    slug: p.slug,
    description: p.description_html || p.description || '',
    short_description: p.basic_info || '',
    long_description: null,
    price: p.price,
    sale_price: p.sale_price || null,
    stock: p.stock || 10,
    status: p.status || 'active',
    sku: p.sku || '',
    ref_number: null,
    brand: p.brand || 'Kemil',
    case_material: p.case_material || null,
    case_size: p.case_size || null,
    movement_type: p.movement_type || 'quartz',
    water_resistance: p.water_resistance || null,
    images: Array.isArray(p.images) ? p.images : [],
    is_active: 1,
    is_featured: 0,
    badge: p.sale_price ? 'SALE' : 'NEW',
    view_count: p.view_count || 120,
    sold_count: p.sold_count || 15,
    rating_avg: String(p.rating_avg || '5.0'),
    rating_count: p.rating_count || 0,
    specs: specsArray,
    category_id: 2,
    subcategory_id: isCo ? 12 : 11,
    category_name: 'Đồng Hồ Nữ',
    subcategory_name: isCo ? 'Đồng Hồ Nữ Cơ' : 'Đồng Hồ Nữ Pin',
    category_slug: 'nu',
    subcategory_slug: isCo ? 'nu-co' : 'nu-thoi-trang',
    brand_name: p.brand || 'Kemil',
    flash_sale: null
  };
}

export async function getProductsOffline(params = {}) {
  try {
    const projectPrefix = window.location.pathname.startsWith('/dong-ho-a-tuan/') ? '/dong-ho-a-tuan' : '';
    const res = await fetch(`${window.location.origin}${projectPrefix}/kemil_products.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rawData = await res.json();
    let list = rawData.map(normalizeLocalProduct);

    if (params.category_slug) {
      list = list.filter(p => p.category_slug === params.category_slug);
    }
    if (params.subcategory_slug) {
      list = list.filter(p => p.subcategory_slug === params.subcategory_slug);
    }
    if (params.brand) {
      const b = String(params.brand).toLowerCase();
      list = list.filter(p => String(p.brand || '').toLowerCase() === b);
    }
    if (params.search) {
      const q = String(params.search).toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.category_name || '').toLowerCase().includes(q) ||
        (p.subcategory_name || '').toLowerCase().includes(q)
      );
    }
    if (params.featured !== undefined) {
      list = list.filter(p => p.is_featured == params.featured);
    }
    if (params.price_min) {
      list = list.filter(p => parseFloat(p.price) >= parseFloat(params.price_min));
    }
    if (params.price_max) {
      list = list.filter(p => parseFloat(p.price) <= parseFloat(params.price_max));
    }

    const sort = params.sort || 'new';
    if (sort === 'price_asc') {
      list.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sort === 'price_desc') {
      list.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    } else if (sort === 'bestseller') {
      list.sort((a, b) => b.sold_count - a.sold_count);
    } else {
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit || params.per_page) || 12;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      success: true,
      data: paginated,
      meta: {
        current_page: page,
        last_page: Math.ceil(list.length / limit),
        per_page: limit,
        total: list.length
      },
      products: paginated,
      total: list.length,
      last_page: Math.ceil(list.length / limit),
    };
  } catch (err) {
    console.error('getProductsOffline failed:', err);
    const mock = getMockProducts(params.limit || 8);
    return {
      success: true,
      data: mock,
      meta: { current_page: 1, last_page: 1, per_page: mock.length, total: mock.length },
      products: mock,
      total: mock.length,
      last_page: 1
    };
  }
}

export async function getProductOffline(slug) {
  try {
    const projectPrefix = window.location.pathname.startsWith('/dong-ho-a-tuan/') ? '/dong-ho-a-tuan' : '';
    const res = await fetch(`${window.location.origin}${projectPrefix}/kemil_products.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rawData = await res.json();
    const found = rawData.find(p => p.slug === slug);
    if (!found) throw new Error(`Product not found: ${slug}`);
    return normalizeLocalProduct(found);
  } catch (err) {
    console.error('getProductOffline failed:', err);
    throw err;
  }
}

/**
 * Get paginated/filtered products
 * @param {Object} params — category_slug, page, limit, search, featured, sort
 */
export async function getProducts(params = {}) {
  try {
    const url = `${API_BASE}/api/products${buildQuery(params)}`;
    return await apiFetch(url);
  } catch (err) {
    console.warn('getProducts api failed, falling back to offline data:', err);
    return getProductsOffline(params);
  }
}

/**
 * Get a single product by slug
 */
export async function getProduct(slug) {
  try {
    return await apiFetch(`${API_BASE}/api/products/${encodeURIComponent(slug)}`);
  } catch (err) {
    console.warn('getProduct api failed, falling back to offline data:', err);
    return getProductOffline(slug);
  }
}

export async function getProductImages(productId) {
  try {
    return await apiFetch(`${API_BASE}/api/products/${encodeURIComponent(productId)}/images`);
  } catch (err) {
    console.warn('getProductImages failed, trying offline fallback:', err);
    try {
      const projectPrefix = window.location.pathname.startsWith('/dong-ho-a-tuan/') ? '/dong-ho-a-tuan' : '';
      const res = await fetch(`${window.location.origin}${projectPrefix}/kemil_products.json`);
      const rawData = await res.json();
      const found = rawData.find(p => String(p.id) === String(productId));
      if (found) {
        return { success: true, data: Array.isArray(found.images) ? found.images : [] };
      }
    } catch (e) {}
    throw err;
  }
}

export async function getProductSpecs(productId) {
  try {
    return await apiFetch(`${API_BASE}/api/products/${encodeURIComponent(productId)}/specs`);
  } catch (err) {
    console.warn('getProductSpecs failed, trying offline fallback:', err);
    try {
      const projectPrefix = window.location.pathname.startsWith('/dong-ho-a-tuan/') ? '/dong-ho-a-tuan' : '';
      const res = await fetch(`${window.location.origin}${projectPrefix}/kemil_products.json`);
      const rawData = await res.json();
      const found = rawData.find(p => String(p.id) === String(productId));
      if (found) {
        const normalized = normalizeLocalProduct(found);
        return { success: true, data: normalized.specs };
      }
    } catch (e) {}
    throw err;
  }
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
  try {
    return await apiFetch(`${API_BASE}/api/products/${encodeURIComponent(productId)}/related`);
  } catch (err) {
    console.warn('getRelatedProducts failed, trying offline fallback:', err);
    try {
      const projectPrefix = window.location.pathname.startsWith('/dong-ho-a-tuan/') ? '/dong-ho-a-tuan' : '';
      const res = await fetch(`${window.location.origin}${projectPrefix}/kemil_products.json`);
      const rawData = await res.json();
      const list = rawData.map(normalizeLocalProduct).filter(p => String(p.id) !== String(productId));
      return { success: true, data: list.slice(0, 10) };
    } catch (e) {}
    throw err;
  }
}

export async function getCrossSellProducts(productId) {
  try {
    return await apiFetch(`${API_BASE}/api/products/${encodeURIComponent(productId)}/cross-sell`);
  } catch (err) {
    console.warn('getCrossSellProducts failed, trying offline fallback:', err);
    try {
      const projectPrefix = window.location.pathname.startsWith('/dong-ho-a-tuan/') ? '/dong-ho-a-tuan' : '';
      const res = await fetch(`${window.location.origin}${projectPrefix}/kemil_products.json`);
      const rawData = await res.json();
      const list = rawData.map(normalizeLocalProduct).filter(p => String(p.id) !== String(productId));
      return { success: true, data: list.slice(0, 10) };
    } catch (e) {}
    throw err;
  }
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
  getProductsOffline,
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
