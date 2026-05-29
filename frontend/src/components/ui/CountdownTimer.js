/**
 * CountdownTimer.js — Countdown timer UI component
 * @param {string} endsAt — ISO timestamp when the sale ends
 * @returns {HTMLElement}
 */

export function createCountdownTimer(endsAt) {
  const endTime = new Date(endsAt).getTime();
  const container = document.createElement('div');
  container.className = 'countdown-timer';
  Object.assign(container.style, {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: '700',
  });

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function getTimeLeft() {
    const diff = Math.max(0, endTime - Date.now());
    const totalSeconds = Math.floor(diff / 1000);
    const days    = Math.floor(totalSeconds / 86400);
    const hours   = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds, diff };
  }

  function renderSegment(value, label) {
    return `
      <div style="display:flex;flex-direction:column;align-items:center;min-width:48px;">
        <div style="
          background:#1a1a1a;color:#fff;
          font-size:22px;font-weight:800;
          padding:8px 12px;border-radius:4px;
          line-height:1;letter-spacing:0.8px;
        ">${value}</div>
        <span style="font-size:9px;color:#888;letter-spacing:0.5px;margin-top:4px;text-transform:uppercase;">${label}</span>
      </div>`;
  }

  function renderSep() {
    return `<span style="font-size:22px;font-weight:800;color:#1a1a1a;margin-bottom:16px;padding:0 2px;">:</span>`;
  }

  function update() {
    const { days, hours, minutes, seconds, diff } = getTimeLeft();

    const isUrgent = diff < 3600000; // < 1 hour
    if (isUrgent) {
      container.style.animation = 'pulse 1s ease-in-out infinite';
      container.querySelectorAll('[data-time-block]').forEach(el => {
        el.style.background = '#c0392b';
      });
    }

    let html = '';
    if (days > 0) {
      html += renderSegment(pad(days), 'Ngày') + renderSep();
    }
    html += renderSegment(pad(hours), 'Giờ')    + renderSep();
    html += renderSegment(pad(minutes), 'Phút') + renderSep();
    html += renderSegment(pad(seconds), 'Giây');

    container.innerHTML = html;

    // Mark time blocks for urgency styling
    container.querySelectorAll('[style*="background:#1a1a1a"]').forEach(el => {
      el.dataset.timeBlock = '1';
    });

    if (diff <= 0) {
      clearInterval(timer);
      container.innerHTML = `<span style="color:#c0392b;font-weight:700;font-size:14px;letter-spacing:0.8px;">ĐÃ KẾT THÚC</span>`;
    }
  }

  update();
  const timer = setInterval(update, 1000);

  // Store cleanup reference
  container._destroy = () => clearInterval(timer);

  return container;
}

export default createCountdownTimer;
