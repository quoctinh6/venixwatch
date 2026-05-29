const BADGES = [
  {
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
    title: 'Miễn Phí Vận Chuyển',
    subtitle: 'Đơn trên 500.000đ',
  },
  {
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
    title: 'Đổi Trả Dễ Dàng',
    subtitle: 'Trong vòng 30 ngày',
  },
  {
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    title: 'Bảo Hành 2 Năm',
    subtitle: 'Chính hãng tuyệt đối',
  },
  {
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    title: 'Chính Hãng 100%',
    subtitle: 'Cam kết uy tín',
  },
];

export class TrustBadges {
  render() {
    const section = document.createElement('section');
    section.className = 'border-y border-zinc-200 py-8 font-sans sm:py-10 overflow-hidden';

    const container = document.createElement('div');
    container.className = 'mx-auto grid max-w-7xl grid-cols-1 divide-y divide-zinc-200 px-4 sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:px-6 lg:grid-cols-4 lg:px-8';

    BADGES.forEach((badge, index) => {
      const item = document.createElement('div');
      item.className = 'feature-item flex items-start gap-4 px-0 py-5 transition hover:bg-zinc-50 sm:px-5 lg:px-6';
      item.style.setProperty('--item-index', index);
      if (index >= 2 && window.innerWidth >= 640 && window.innerWidth < 1024) {
        item.classList.add('sm:border-t', 'sm:border-zinc-200');
      }

      item.innerHTML = `
        <div class="feature-icon shrink-0 text-zinc-950">${badge.icon}</div>
        <div class="min-w-0">
          <p class="feature-title text-base font-bold text-zinc-950 transition-colors duration-300">${badge.title}</p>
          <p class="mt-1 text-sm text-zinc-500">${badge.subtitle}</p>
        </div>
      `;

      container.appendChild(item);
    });

    section.appendChild(container);
    return section;
  }
}
