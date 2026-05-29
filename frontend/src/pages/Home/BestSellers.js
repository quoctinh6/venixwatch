import { createProductCard } from './ProductCard.js';
import { navigate } from '../../utils/helpers.js';

export class BestSellers {
  constructor(products = [], opts = {}) {
    this._products = products;
    this._opts = {
      title: opts.title || 'Best Sellers',
      badge: opts.badge || null,
      showAllHref: opts.showAllHref || '/nam',
    };
  }

  render() {
    const section = document.createElement('section');
    section.className = 'py-10 font-sans sm:py-14 lg:py-16';

    const container = document.createElement('div');
    container.className = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8';

    const header = document.createElement('div');
    header.className = 'mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between';
    header.innerHTML = `
      <div>
        <h2 class="text-2xl font-black uppercase tracking-[0.05em] text-zinc-950 sm:text-3xl">${this._opts.title}</h2>
        <div class="mt-3 h-1 w-10 bg-amber-500"></div>
      </div>
      <button class="view-all-btn inline-flex h-11 items-center justify-center self-start rounded-xl border border-zinc-900 px-5 text-xs font-bold uppercase tracking-[0.12em] text-zinc-900 transition hover:bg-zinc-900 hover:text-white">
        Xem Tất Cả
      </button>
    `;

    header.querySelector('.view-all-btn').addEventListener('click', () => navigate(this._opts.showAllHref));

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5';

    let products = this._products;
    if (this._opts.badge) {
      products = products.filter((p) => p.badge === this._opts.badge || p.is_new);
    }

    if (!products.length) {
      grid.innerHTML = '<div class="col-span-full rounded-2xl border border-dashed border-zinc-300 px-6 py-16 text-center text-sm text-zinc-500">Đang tải sản phẩm...</div>';
    } else {
      products.slice(0, 10).forEach((product) => {
        grid.appendChild(createProductCard(product));
      });
    }

    container.appendChild(header);
    container.appendChild(grid);
    section.appendChild(container);

    this._mountCompareBar();
    return section;
  }

  _mountCompareBar() {
    if (document.getElementById('compare-bar')) {
      // Nếu thanh so sánh đã được tạo, kiểm tra và đồng bộ lại trạng thái hiển thị hiện tại ngay
      const bar = document.getElementById('compare-bar');
      const stored = JSON.parse(localStorage.getItem('dhat_compare') || '[]');
      if (stored.length > 0) {
        bar.style.display = 'flex';
        const names = bar.querySelector('#compare-bar-names');
        if (names) names.textContent = stored.map((item) => item.name).join(' • ');
      } else {
        bar.style.display = 'none';
      }
      return;
    }

    const bar = document.createElement('div');
    bar.id = 'compare-bar';
    bar.className = 'fixed inset-x-3 bottom-3 z-[120] hidden rounded-2xl border border-amber-500 bg-zinc-950 p-3 text-white shadow-2xl lg:inset-x-auto lg:bottom-4 lg:left-1/2 lg:flex lg:w-[min(720px,calc(100vw-32px))] lg:-translate-x-1/2 lg:items-center lg:justify-between';
    bar.innerHTML = `
      <div class="min-w-0">
        <div class="text-[11px] font-bold uppercase tracking-[0.05em] text-amber-500">So Sánh</div>
        <div id="compare-bar-names" class="mt-1 truncate text-sm text-zinc-200"></div>
      </div>
      <div class="mt-3 flex gap-2 lg:mt-0">
        <button id="compare-now-btn" class="inline-flex h-10 items-center justify-center rounded-xl bg-amber-500 px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-950">
          So Sánh Ngay
        </button>
        <button id="compare-clear-btn" class="inline-flex h-10 items-center justify-center rounded-xl border border-white/20 px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
          Xóa
        </button>
      </div>
    `;

    document.body.appendChild(bar);

    // Kiểm tra trạng thái lưu trữ ban đầu để ẩn/hiện thanh lập tức khi vừa nạp trang
    const stored = JSON.parse(localStorage.getItem('dhat_compare') || '[]');
    if (stored.length > 0) {
      bar.style.display = '';
      const names = bar.querySelector('#compare-bar-names');
      if (names) names.textContent = stored.map((item) => item.name).join(' • ');
    } else {
      bar.style.display = 'none';
    }

    window.addEventListener('compare-updated', (e) => {
      const items = e.detail || [];
      if (items.length > 0) {
        bar.style.display = '';
        const names = bar.querySelector('#compare-bar-names');
        if (names) names.textContent = items.map((item) => item.name).join(' • ');
      } else {
        bar.style.display = 'none';
      }
    });

    bar.querySelector('#compare-now-btn')?.addEventListener('click', () => navigate('/so-sanh'));
    bar.querySelector('#compare-clear-btn')?.addEventListener('click', () => {
      localStorage.removeItem('dhat_compare');
      window.dispatchEvent(new CustomEvent('compare-updated', { detail: [] }));
    });
  }
}
