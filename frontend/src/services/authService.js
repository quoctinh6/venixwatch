/**
 * authService.js — Authentication service for Venix Watch
 */
import { API_BASE, STORAGE_KEYS } from './config.js';

const TOKEN_KEY = STORAGE_KEYS.AUTH_TOKEN;
const USER_KEY = STORAGE_KEYS.AUTH_USER;

async function apiFetch(endpoint, method, body) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
}

function normalizeUser(rawUser) {
  if (!rawUser) return null;
  return {
    id: rawUser.id,
    email: rawUser.email,
    name: rawUser.full_name || rawUser.name || '',
    full_name: rawUser.full_name || rawUser.name || '',
    phone: rawUser.phone || '',
    avatar: rawUser.avatar || null,
    roles: rawUser.roles || [],
    permissions: rawUser.permissions || [],
  };
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return !!getToken() && !!getUser();
}

export async function login(email, password) {
  const response = await apiFetch('/api/auth/login', 'POST', { email, password });
  const data = response.data || response;
  const user = normalizeUser(data.user);
  if (data.token && user) {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user } }));
  }
  return data;
}

export async function register(payload) {
  const response = await apiFetch('/api/auth/register', 'POST', {
    full_name: payload.full_name || payload.name,
    email: payload.email,
    phone: payload.phone,
    password: payload.password,
  });
  const data = response.data || response;
  const user = normalizeUser(data.user);
  if (data.token && user) {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user } }));
    return data;
  }
  return login(payload.email, payload.password);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: null } }));
}

export const authService = { login, register, logout, getToken, getUser, isLoggedIn };
