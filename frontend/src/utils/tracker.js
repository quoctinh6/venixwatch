import { getSessionId, getDeviceType } from './helpers.js';
import { API_BASE } from '../services/config.js';

const PING_INTERVAL = 30000;

let pingTimer = null;
let initialized = false;
let currentViewId = null;
let visitStartedAt = Date.now();
let maxScrollDepth = 0;

function buildPayload(extra = {}) {
  return JSON.stringify({
    session_id: getSessionId(),
    page_url: window.location.href,
    page_title: document.title || '',
    referrer: document.referrer || '',
    device_type: getDeviceType(),
    timestamp: new Date().toISOString(),
    ...extra,
  });
}

function measureScrollDepth() {
  const doc = document.documentElement;
  const scrollTop = window.scrollY || doc.scrollTop || 0;
  const viewport = window.innerHeight || doc.clientHeight || 0;
  const fullHeight = Math.max(doc.scrollHeight || 0, document.body.scrollHeight || 0, 1);
  const depth = Math.min(100, Math.round(((scrollTop + viewport) / fullHeight) * 100));
  maxScrollDepth = Math.max(maxScrollDepth, depth);
}

function resetViewState() {
  currentViewId = null;
  visitStartedAt = Date.now();
  maxScrollDepth = 0;
  measureScrollDepth();
}

function getTimeOnPage() {
  return Math.max(0, Math.round((Date.now() - visitStartedAt) / 1000));
}

export async function postVisit() {
  try {
    resetViewState();
    const res = await fetch(`${API_BASE}/api/analytics/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: buildPayload({ event: 'visit' }),
    });

    const data = await res.json().catch(() => ({}));
    currentViewId = data?.data?.view_id ?? null;
  } catch (err) {
    console.warn('[Tracker] Failed to post visit:', err);
    currentViewId = null;
  }
}

export function startPing() {
  stopPing();
  pingTimer = setInterval(() => {
    try {
      const url = `${API_BASE}/api/analytics/ping`;
      const blob = new Blob([buildPayload({ event: 'ping', view_id: currentViewId })], { type: 'application/json' });

      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, blob);
        return;
      }

      fetch(url, { method: 'POST', body: blob, keepalive: true }).catch(() => {});
    } catch (err) {
      console.warn('[Tracker] Failed to send ping:', err);
    }
  }, PING_INTERVAL);
}

export function stopPing() {
  if (pingTimer) {
    clearInterval(pingTimer);
    pingTimer = null;
  }
}

function sendExitBeacon() {
  try {
    measureScrollDepth();
    const url = `${API_BASE}/api/analytics/exit`;
    const payload = buildPayload({
      event: 'exit',
      view_id: currentViewId,
      time_on_page: getTimeOnPage(),
      scroll_depth: maxScrollDepth,
    });
    const blob = new Blob([payload], { type: 'application/json' });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, { method: 'POST', body: blob, keepalive: true }).catch(() => {});
    }
  } catch (err) {
    console.warn('[Tracker] Failed to send exit beacon:', err);
  }
}

function trackRouteChange() {
  try {
    sendExitBeacon();
    postVisit().catch(() => {});
  } catch (err) {
    console.warn('[Tracker] Failed to track route change:', err);
  }
}

export function initTracker() {
  if (initialized) return;
  initialized = true;

  postVisit().catch(() => {});
  startPing();
  window.addEventListener('scroll', measureScrollDepth, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      sendExitBeacon();
    }
  });

  window.addEventListener('beforeunload', sendExitBeacon);
  window.addEventListener('popstate', trackRouteChange);
}
