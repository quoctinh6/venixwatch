/**
 * LiveVisitorsBadge.js — Fixed bottom-left live visitor counter
 */
import { API_BASE } from '../services/config.js';

export class LiveVisitorsBadge {
  constructor() {
    this._el = null;
    this._count = Math.floor(Math.random() * 20) + 8; // Initial realistic count
    this._pollInterval = null;
  }

  mount() {
    // Disabled per user request
    return;
  }

  _updateDisplay(count) {
    this._count = count;
    if (this._textEl) {
      this._textEl.textContent = `${count} người đang xem trang này`;
    }
  }

  _fluctuate() {
    const delta = Math.floor(Math.random() * 7) - 3; // -3 to +3
    const newCount = Math.max(3, this._count + delta);
    this._updateDisplay(newCount);
  }

  async _fetchActive() {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/active`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const count = data.active_users || data.count || data.total || null;
      if (count && typeof count === 'number') {
        this._updateDisplay(count);
        return;
      }
    } catch {
      // API unavailable — just fluctuate
    }
    this._fluctuate();
  }

  _startPolling() {
    // Initial fetch
    this._fetchActive();
    // Poll every 30s + fluctuate every 8s
    this._pollInterval = setInterval(() => this._fetchActive(), 30000);
    setInterval(() => this._fluctuate(), 8000);
  }

  destroy() {
    if (this._pollInterval) clearInterval(this._pollInterval);
    if (this._el) this._el.remove();
  }
}
