const MESSAGES = [
  'Miễn phí vận chuyển đơn hàng trên 500.000đ',
  'Đổi trả trong 30 ngày - Bảo hành 2 năm chính hãng',
  'Dùng code WELCOME10 giảm 10% đơn hàng đầu tiên',
];

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

    const accent = document.createElement('div');
    accent.className = 'absolute inset-y-0 left-0 w-1 bg-primary-gold';

    const text = document.createElement('span');
    text.id = 'announcement-text';
    text.className = 'max-w-[85%] leading-5 transition-opacity duration-300 sm:max-w-none';
    text.textContent = MESSAGES[0];

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
    this._startRotation(text);
    return bar;
  }

  _startRotation(textEl) {
    this._interval = setInterval(() => {
      textEl.style.opacity = '0';
      setTimeout(() => {
        this._msgIndex = (this._msgIndex + 1) % MESSAGES.length;
        textEl.textContent = MESSAGES[this._msgIndex];
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
