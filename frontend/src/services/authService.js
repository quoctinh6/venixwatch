/**
 * authService.js — Authentication service for Venix Watch
 */
import { API_BASE, STORAGE_KEYS } from './config.js';

const TOKEN_KEY = STORAGE_KEYS.AUTH_TOKEN;
const USER_KEY = STORAGE_KEYS.AUTH_USER;

function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  return !!payload?.exp && payload.exp <= Math.floor(Date.now() / 1000);
}

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

export function persistAuthSession(token, rawUser = null, emitEvent = true) {
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  const userFromPayload = payload ? {
    id: payload?.user_id,
    email: payload?.email,
    full_name: payload?.full_name,
    roles: payload?.roles || [],
    permissions: payload?.permissions || [],
  } : null;
  const user = normalizeUser(rawUser) || normalizeUser(userFromPayload);

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem('venix_auth_token', token);
  setCookie(TOKEN_KEY, token, 7);
  setCookie('venix_auth_token', token, 7);

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem('venix_auth_user', JSON.stringify(user));
  }

  if (emitEvent) {
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user } }));
  }
  return user;
}

function getStoredTokenCandidates() {
  return [
    localStorage.getItem(TOKEN_KEY),
    localStorage.getItem('venix_auth_token'),
    getCookie(TOKEN_KEY),
    getCookie('venix_auth_token'),
  ].filter(Boolean).filter((token, index, list) => list.indexOf(token) === index);
}

function removeTokenValue(token) {
  if (localStorage.getItem(TOKEN_KEY) === token) localStorage.removeItem(TOKEN_KEY);
  if (localStorage.getItem('venix_auth_token') === token) localStorage.removeItem('venix_auth_token');
  if (getCookie(TOKEN_KEY) === token) deleteCookie(TOKEN_KEY);
  if (getCookie('venix_auth_token') === token) deleteCookie('venix_auth_token');
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function setCookie(name, value, days = 7) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `; expires=${date.toUTCString()}`;
  const isHttps = window.location.protocol === 'https:';
  document.cookie = `${name}=${value || ""}${expires}; path=/; SameSite=Lax${isHttps ? '; Secure' : ''}`;
}

function deleteCookie(name) {
  const isHttps = window.location.protocol === 'https:';
  document.cookie = `${name}=; Max-Age=-99999999; path=/; SameSite=Lax${isHttps ? '; Secure' : ''}`;
}

export function getToken() {
  const tokens = getStoredTokenCandidates();
  for (const token of tokens) {
    if (isTokenExpired(token)) {
      removeTokenValue(token);
      continue;
    }

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem('venix_auth_token', token);
    setCookie(TOKEN_KEY, token, 7);
    setCookie('venix_auth_token', token, 7);
    return token;
  }

  if (tokens.length > 0) {
    logout();
  }
  return null;
}

export function getUser() {
  try {
    const userStr = localStorage.getItem(USER_KEY) || localStorage.getItem('venix_auth_user');
    const cached = JSON.parse(userStr || 'null');
    if (cached) return cached;
  } catch {
    // Fall through to JWT payload
  }

  const token = getToken();
  const payload = token ? decodeJwtPayload(token) : null;
  if (!payload) return null;
  return normalizeUser({
    id: payload?.user_id,
    email: payload?.email,
    full_name: payload?.full_name,
    roles: payload?.roles || [],
    permissions: payload?.permissions || [],
  });
}

export function isLoggedIn() {
  return !!getToken();
}

export async function login(email, password) {
  const response = await apiFetch('/api/auth/login', 'POST', { email, password });
  const data = response.data || response;
  if (data.token) persistAuthSession(data.token, data.user);
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
  if (data.token) persistAuthSession(data.token, data.user);
  return data;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('venix_auth_token');
  deleteCookie(TOKEN_KEY);
  deleteCookie('venix_auth_token');
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('venix_auth_user');
  window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: null } }));
}

export const authService = { login, register, logout, getToken, getUser, isLoggedIn, persistAuthSession };
