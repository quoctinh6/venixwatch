import { API_BASE, STORAGE_KEYS } from './config.js';
import { getProductsOffline } from './productService.js';

function headers() {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || localStorage.getItem('dhat_token');
  const h = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function api(method, path, body, extra = {}) {
  const opts = {
    method,
    headers: headers(),
    ...extra,
  };

  if (body) {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `HTTP ${res.status}`);
  }
  return data;
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    const mappedKey = key === 'per_page' ? 'limit' : key;
    query.set(mappedKey, String(value));
  });

  const str = query.toString();
  return str ? `?${str}` : '';
}

// Dashboard
export const getDashboardStats = () => api('GET', '/api/admin/dashboard/stats');

// Products
export const getProducts = async (params = {}) => {
  try {
    return await api('GET', `/api/admin/products${buildQuery(params)}`);
  } catch (err) {
    console.warn('admin getProducts api failed, falling back to local json:', err);
    return getProductsOffline(params);
  }
};
export const createProduct = (d) => api('POST', '/api/admin/products', d);
export const updateProduct = (id, d) => api('PUT', `/api/admin/products/${id}`, d);
export const toggleProduct = (id) => api('PATCH', `/api/admin/products/${id}/toggle`);
export const deleteProduct = (id) => api('DELETE', `/api/admin/products/${id}`);
export const getLowStock = () => api('GET', '/api/admin/products/low-stock');
export const computeBadges = () => api('POST', '/api/admin/products/compute-badges');

// Images
export const getImages = () => api('GET', '/api/admin/images');
export const deleteImage = (filename) => api('DELETE', `/api/admin/images/${filename}`);

// Categories
export const getCategories = () => api('GET', '/api/admin/categories');
export const createCategory = (d) => api('POST', '/api/admin/categories', d);
export const updateCategory = (id, d) => api('PUT', `/api/admin/categories/${id}`, d);
export const deleteCategory = (id) => api('DELETE', `/api/admin/categories/${id}`);

// Subcategories
export const getSubcategories = () => api('GET', '/api/admin/subcategories');
export const createSubcategory = (d) => api('POST', '/api/admin/subcategories', d);
export const updateSubcategory = (id, d) => api('PUT', `/api/admin/subcategories/${id}`, d);
export const deleteSubcategory = (id) => api('DELETE', `/api/admin/subcategories/${id}`);

// Brands
export const getBrands = () => api('GET', '/api/admin/brands');
export const createBrand = (d) => api('POST', '/api/admin/brands', d);
export const updateBrand = (id, d) => api('PUT', `/api/admin/brands/${id}`, d);
export const deleteBrand = (id) => api('DELETE', `/api/admin/brands/${id}`);

// Orders
export const getOrders = (params = {}) => api('GET', `/api/admin/orders${buildQuery(params)}`);
export const getOrder = (id) => api('GET', `/api/admin/orders/${id}`);
export const updateOrderStatus = (id, status) => api('PUT', `/api/admin/orders/${id}/status`, { status });

// Users
export const getUsers = (params = {}) => api('GET', `/api/admin/users${buildQuery(params)}`);
export const createUser = (d) => api('POST', '/api/admin/users', d);
export const updateUser = (id, d) => api('PUT', `/api/admin/users/${id}`, d);
export const deleteUser = (id) => api('DELETE', `/api/admin/users/${id}`);

// Roles
export const getRoles = () => api('GET', '/api/admin/roles');
export const getPermissions = () => api('GET', '/api/admin/permissions');
export const updateRolePermissions = (id, permIds) =>
  api('PUT', `/api/admin/roles/${id}/permissions`, { permission_ids: permIds });

// Warranties
export const getWarranties = (params = {}) => api('GET', `/api/admin/warranties${buildQuery(params)}`);
export const createWarranty = (d) => api('POST', '/api/admin/warranties', d);
export const updateWarranty = (id, d) => api('PUT', `/api/admin/warranties/${id}`, d);
export const deleteWarranty = (id) => api('DELETE', `/api/admin/warranties/${id}`);

// Flash Sales
export const getFlashSales = () => api('GET', '/api/admin/flash-sales');
export const createFlashSale = (d) => api('POST', '/api/admin/flash-sales', d);
export const updateFlashSale = (id, d) => api('PUT', `/api/admin/flash-sales/${id}`, d);
export const deleteFlashSale = (id) => api('DELETE', `/api/admin/flash-sales/${id}`);

// Analytics
export const getAnalytics = (params = {}) => api('GET', `/api/admin/visitors${buildQuery(params)}`);
