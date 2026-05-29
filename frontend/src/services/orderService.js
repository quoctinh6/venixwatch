/**
 * orderService.js — Order API calls for Venix Watch
 */
import { API_BASE } from './config.js';
import { getToken } from './authService.js';

async function apiFetch(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

/**
 * Create a new order
 * @param {Object} orderData
 * {
 *   customer_name, customer_email, customer_phone, shipping_address,
 *   items: [{product_id, qty, price}],
 *   total, payment_method, note
 * }
 */
export async function createOrder(orderData) {
  return apiFetch('/api/orders', 'POST', orderData);
}

/**
 * Get orders for the logged-in user
 */
export async function getOrders() {
  return apiFetch('/api/orders', 'GET');
}

/**
 * Get a single order by ID
 */
export async function getOrder(orderId) {
  return apiFetch(`/api/orders/${orderId}`, 'GET');
}

export const orderService = { createOrder, getOrders, getOrder };
