/**
 * analyticsService.js — Analytics API calls for Venix Watch
 */
import { API_BASE } from './config.js';
import { getSessionId, getDeviceType } from '../utils/helpers.js';

function buildPayload(extra = {}) {
  return {
    session_id: getSessionId(),
    page_url: window.location.href,
    referrer: document.referrer || '',
    device_type: getDeviceType(),
    timestamp: new Date().toISOString(),
    ...extra,
  };
}

export async function postVisit() {
  try {
    return await fetch(`${API_BASE}/api/analytics/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload({ event: 'visit' })),
    });
  } catch { /* non-critical */ }
}

export function ping() {
  const url = `${API_BASE}/api/analytics/ping`;
  const blob = new Blob(
    [JSON.stringify(buildPayload({ event: 'ping' }))],
    { type: 'application/json' }
  );
  if (navigator.sendBeacon) return navigator.sendBeacon(url, blob);
  return fetch(url, { method: 'POST', body: blob, keepalive: true }).catch(() => { });
}

export function postExit() {
  const url = `${API_BASE}/api/analytics/exit`;
  const blob = new Blob(
    [JSON.stringify(buildPayload({ event: 'exit' }))],
    { type: 'application/json' }
  );
  if (navigator.sendBeacon) return navigator.sendBeacon(url, blob);
}

export async function getActiveUsers() {
  try {
    const res = await fetch(`${API_BASE}/api/analytics/active`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export const analyticsService = { postVisit, ping, postExit, getActiveUsers };
