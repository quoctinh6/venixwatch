/**
 * helpers.js — Utility functions for Venix Watch
 */

/**
 * Format a number as Vietnamese currency string
 * e.g. 1990000 → "1.990.000₫"
 */
export function formatPrice(num) {
  if (num === null || num === undefined || isNaN(num)) return '—';
  return Number(num).toLocaleString('vi-VN') + '₫';
}

/**
 * Generate a RFC4122-compliant UUID v4
 */
export function generateUUID() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Debounce: delay fn execution until after `wait` ms since last call
 */
export function debounce(fn, wait = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Throttle: ensure fn is called at most once per `limit` ms
 */
export function throttle(fn, limit = 200) {
  let lastRun = 0;
  let timer;
  return function (...args) {
    const now = Date.now();
    const remaining = limit - (now - lastRun);
    if (remaining <= 0) {
      lastRun = now;
      fn.apply(this, args);
    } else {
      clearTimeout(timer);
      timer = setTimeout(() => {
        lastRun = Date.now();
        fn.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * Format an ISO date string to Vietnamese locale
 * e.g. "2025-01-15T10:30:00Z" → "15/01/2025"
 */
export function formatDate(isoString, options = {}) {
  if (!isoString) return '';
  const defaults = { day: '2-digit', month: '2-digit', year: 'numeric' };
  const opts = Object.assign(defaults, options);
  try {
    return new Date(isoString).toLocaleDateString('vi-VN', opts);
  } catch {
    return isoString;
  }
}

/**
 * Truncate string to maxLength and add ellipsis
 */
export function truncate(str, maxLength = 60) {
  if (!str) return '';
  return str.length > maxLength ? str.slice(0, maxLength) + '…' : str;
}

/**
 * Slugify a Vietnamese string (basic)
 */
export function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Deep clone a plain object/array
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Get or create a persistent session ID
 */
export function getSessionId() {
  const key = 'dhat_session_id';
  try {
    let id = localStorage.getItem(key);
    if (!id) {
      id = generateUUID();
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    if (!window.sessionFallbackId) {
      window.sessionFallbackId = generateUUID();
    }
    return window.sessionFallbackId;
  }
}

/**
 * Detect device type from user agent
 */
export function getDeviceType() {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) return 'mobile';
  return 'desktop';
}

/**
 * Navigate using pushState (for SPA routing)
 */
export function navigate(path) {
  if (window.lenis) window.lenis.start();
  
  // Cancel any ongoing scroll restoration on navigation
  if (typeof window.cancelOngoingScrollRestoration === 'function') {
    window.cancelOngoingScrollRestoration();
  }
  
  // Save scroll position for the current page before navigating away
  const currentKey = window.location.pathname + window.location.search;
  sessionStorage.setItem(`dhat_scroll_${currentKey}`, String(window.scrollY));
  try {
    const currentState = history.state || {};
    history.replaceState({ ...currentState, scrollY: window.scrollY }, '');
  } catch (e) {
    // Ignore
  }

  // Clear target scroll position so forward navigation starts at the top
  sessionStorage.removeItem(`dhat_scroll_${path}`);

  history.pushState({ isForward: true }, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Navigate using replaceState (for SPA routing without polluting history stack)
 */
export function navigateReplace(path) {
  if (window.lenis) window.lenis.start();
  
  if (typeof window.cancelOngoingScrollRestoration === 'function') {
    window.cancelOngoingScrollRestoration();
  }

  // Clear target scroll position
  sessionStorage.removeItem(`dhat_scroll_${path}`);

  history.replaceState({ isForward: true }, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Clamp a number between min and max
 */
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/**
 * Wait for N milliseconds (Promise-based)
 */
export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Create an element with attributes and children
 */
export function createElement(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'className') el.className = val;
    else if (key === 'style' && typeof val === 'object') Object.assign(el.style, val);
    else el.setAttribute(key, val);
  }
  for (const child of children) {
    if (typeof child === 'string') el.appendChild(document.createTextNode(child));
    else if (child instanceof Node) el.appendChild(child);
  }
  return el;
}
