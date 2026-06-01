import { authService } from '../../services/authService.js';
import { openQuickSettings } from '../../components/QuickSettingsModal.js?v=1.0.4';

const getMessages = () => {
  return window.APP_SETTINGS?.home_sections?.announcement_bar?.messages || [
    'Miễn phí vận chuyển đơn hàng trên 500.000đ',
    'Đổi trả trong 30 ngày - Bảo hành 2 năm chính hãng',
    'Dùng code WELCOME10 giảm 10% đơn hàng đầu tiên',
  ];
};

export class AnnouncementBar {
  constructor() {
    this._msgIndex = 0;
    this._interval = null;
  }

  render() {
    const dismissed = sessionStorage.getItem('dhat_announcement_dismissed');
    if (dismissed) return document.createDocumentFragment();

    const bar = document.createElement('div');
    bar.id = 'announcement-bar';
    bar.className = 'relative flex min-h-10 items-center justify-center overflow-hidden bg-zinc-800 px-10 py-2 text-center font-sans text-xs font-medium tracking-[0.05em] text-white sm:px-12';

    const user = authService.getUser();
    const hasAdminRole = user && user.roles && user.roles.some(r => {
      const name = (typeof r === 'object' && r !== null) ? r.name : r;
      return name === 'super_admin' || name === 'admin' || name === 'editor';
    });
    const canEditSettings = user && (
      (user.permissions && user.permissions.includes('settings:write')) || hasAdminRole
    );

    const accent = document.createElement('div');
    accent.className = 'absolute inset-y-0 left-0 w-1 bg-primary-gold';

    const text = document.createElement('span');
    text.id = 'announcement-text';
    text.className = 'max-w-[85%] leading-5 transition-opacity duration-300 sm:max-w-none';
    
    const messages = getMessages();
    text.textContent = messages[0] || '';

    const closeBtn = document.createElement('button');
    closeBtn.title = 'Dong';
    closeBtn.className = 'absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full p-1 text-white/60 transition hover:text-white sm:right-4';
    closeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    closeBtn.addEventListener('click', () => {
      sessionStorage.setItem('dhat_announcement_dismissed', '1');
      bar.style.maxHeight = `${bar.offsetHeight}px`;
      bar.style.transition = 'max-height 0.3s ease, opacity 0.3s ease';
      requestAnimationFrame(() => {
        bar.style.maxHeight = '0';
        bar.style.opacity = '0';
        setTimeout(() => bar.remove(), 300);
      });
      this._stopRotation();
    });

    bar.appendChild(accent);
    bar.appendChild(text);
    bar.appendChild(closeBtn);

    if (canEditSettings) {
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'absolute left-5 top-1/2 -translate-y-1/2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 border border-zinc-200 text-[#A88840] hover:bg-[#C9A84C] hover:text-white hover:border-[#C9A84C] transition-all shadow-sm cursor-pointer';
      editBtn.title = 'Chỉnh sửa dòng thông báo';
      editBtn.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
      editBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openQuickSettings('sections', 'announcement_bar');
      });
      bar.appendChild(editBtn);
    }
    this._startRotation(text);
    return bar;
  }

  _startRotation(textEl) {
    this._interval = setInterval(() => {
      const messages = getMessages();
      if (messages.length <= 1) return;
      textEl.style.opacity = '0';
      setTimeout(() => {
        this._msgIndex = (this._msgIndex + 1) % messages.length;
        textEl.textContent = messages[this._msgIndex] || '';
        textEl.style.opacity = '1';
      }, 300);
    }, 4000);
  }

  _stopRotation() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }

  destroy() {
    this._stopRotation();
  }
}
