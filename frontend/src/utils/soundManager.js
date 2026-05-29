import { API_BASE } from '../services/config.js';

export class SoundManager {
  constructor() {
    this.enabled = localStorage.getItem('dhat_sound') !== 'false';
    this._ctx = null;
    this._btn = null;
    this._bgAudio = null;

    this._initAudios();
  }

  _initAudios() {
    if (typeof window === 'undefined') return;

    const bgUrl = `${API_BASE}/sound/%C3%A2m%20thanh%20n%E1%BB%81n.wav`;

    this._bgAudio = new Audio(bgUrl);
    this._bgAudio.loop = true;
    this._bgAudio.volume = 0.25; // Soft premium background music

    this._setupInteractionListeners();
  }

  _setupInteractionListeners() {
    const startBg = () => {
      if (this.enabled && this._bgAudio && this._bgAudio.paused) {
        this._bgAudio.play().catch((err) => {
          console.log('[SoundManager] Autoplay blocked or failed:', err);
        });
      }
      // Clean up interaction listeners once triggered
      window.removeEventListener('click', startBg);
      window.removeEventListener('keydown', startBg);
      window.removeEventListener('touchstart', startBg);
    };

    window.addEventListener('click', startBg);
    window.addEventListener('keydown', startBg);
    window.addEventListener('touchstart', startBg);
  }

  _getContext() {
    if (!this._ctx) {
      try {
        this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        return null;
      }
    }
    return this._ctx;
  }

  _playTone(frequency, duration, type = 'sine', gain = 0.08) {
    if (!this.enabled) return;
    const ctx = this._getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gainNode.gain.setValueAtTime(gain, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }

  playEntrySound() {
    // Disabled beep tones as per user request
  }

  playTickOnHover(element) {
    // Disabled hover ticking as per user request
    return () => {};
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('dhat_sound', String(this.enabled));
    this._updateBtn();

    if (this.enabled) {
      if (this._bgAudio) {
        this._bgAudio.play().catch(() => {});
      }
    } else {
      if (this._bgAudio) {
        this._bgAudio.pause();
      }
    }
  }

  _updateBtn() {
    if (!this._btn) return;
    this._btn.title = this.enabled ? 'Tắt âm thanh' : 'Bật âm thanh';
    this._btn.innerHTML = this.enabled ? this._iconOn() : this._iconOff();
  }

  _iconOn() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
  }

  _iconOff() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
  }

  mountToggleButton() {
    if (document.getElementById('sound-toggle-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'sound-toggle-btn';
    btn.title = this.enabled ? 'Tắt âm thanh' : 'Bật âm thanh';
    btn.innerHTML = this.enabled ? this._iconOn() : this._iconOff();
    Object.assign(btn.style, {
      position: 'fixed',
      bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
      left: 'calc(20px + env(safe-area-inset-left, 0px))',
      zIndex: '180',
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      background: '#09090b',
      color: '#C9A961',
      border: '1.5px solid rgba(201, 169, 97, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    });
    if (window.innerWidth <= 640) {
      btn.style.left = 'calc(16px + env(safe-area-inset-left, 0px))';
      btn.style.bottom = 'calc(72px + env(safe-area-inset-bottom, 0px))';
    }
    btn.addEventListener('click', () => this.toggle());
    btn.addEventListener('mouseenter', () => {
      btn.style.borderColor = '#C9A961';
      btn.style.boxShadow = '0 0 12px rgba(201, 169, 97, 0.4)';
      btn.style.transform = 'scale(1.05)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.borderColor = 'rgba(201, 169, 97, 0.4)';
      btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      btn.style.transform = 'scale(1)';
    });
    document.body.appendChild(btn);
    this._btn = btn;
  }
}

export const soundManager = new SoundManager();
