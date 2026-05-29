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
        <div class="mt-3 h-1 w-10 bg-primary-gold"></div>
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

    return section;
  }

}
