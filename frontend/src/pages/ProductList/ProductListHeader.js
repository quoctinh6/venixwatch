import { SORT_OPTIONS, filterIcon, gridIcon, listIcon } from './ProductListConfig.js';

export class ProductListHeader {
  constructor(options = {}) {
    this._opts = options;
    this._headerEl = null;
    this._countEl = null;
    this._filterCountEl = null;
    this._toolbarEl = null;
  }

  renderHeader({ title, description }) {
    const header = document.createElement('section');
    header.className = 'border-b border-[#E8E4DC] bg-gradient-to-b from-[#FAF8F3] to-white';
    header.innerHTML = `
      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <nav class="mb-3 flex flex-wrap items-center gap-2 text-[13px] text-zinc-500">
          <a href="/" data-nav class="inline-flex items-center gap-2 transition hover:text-[#C9A961]">
            <span>Trang chủ</span>
          </a>
          <span class="text-zinc-300">›</span>
          <span class="font-medium text-zinc-700">${title}</span>
        </nav>
        <div class="max-w-3xl">
          <h1 class="text-[28px] font-black uppercase tracking-[0.04em] text-[#0A0A0A] sm:text-[32px] lg:text-[36px]">${title}</h1>
          <p class="mt-3 text-sm leading-7 text-zinc-600 sm:text-[15px]">${description}</p>
        </div>
      </div>
    `;

    header.querySelector('[data-nav]')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._opts.onNavigateHome?.();
    });

    this._headerEl = header;
    return header;
  }

  renderToolbar({ sort, viewMode }) {
    const toolbar = document.createElement('div');
    toolbar.className = 'flex flex-wrap items-center gap-3 rounded-[4px] border border-[#E8E4DC] bg-white px-4 py-3';
    toolbar.innerHTML = `
      <button type="button" id="open-filter-drawer" class="inline-flex h-10 items-center gap-2 rounded-[4px] border border-[#E8E4DC] px-3 text-[12px] font-bold uppercase tracking-[0.08em] text-[#0A0A0A] transition hover:border-[#C9A961] hover:text-[#C9A961] lg:hidden">
        ${filterIcon()}
        <span>Bộ lọc</span>
        <span id="mobile-filter-count" class="rounded-full bg-[#0A0A0A] px-2 py-0.5 text-[10px] text-white">0</span>
      </button>

      <div class="min-w-[120px] flex-1 text-sm font-medium text-zinc-500">
        <span id="product-count">0 sản phẩm</span>
      </div>

      <div class="ml-auto inline-flex h-10 items-center rounded-[4px] border border-[#E8E4DC] p-1">
        <button type="button" data-view="grid" class="view-mode-btn inline-flex h-8 w-8 items-center justify-center rounded-[3px] transition" title="Xem dạng lưới">
          ${gridIcon()}
        </button>
        <button type="button" data-view="list" class="view-mode-btn inline-flex h-8 w-8 items-center justify-center rounded-[3px] transition" title="Xem dạng danh sách">
          ${listIcon()}
        </button>
      </div>

      <select id="sort-select" class="h-10 min-w-[180px] rounded-[4px] border border-[#E8E4DC] bg-white px-3 text-sm text-[#0A0A0A] outline-none transition focus:border-[#C9A961]">
        ${SORT_OPTIONS.map((option) => `<option value="${option.value}" ${option.value === sort ? 'selected' : ''}>${option.label}</option>`).join('')}
      </select>
    `;

    this._toolbarEl = toolbar;
    this._countEl = toolbar.querySelector('#product-count');
    this._filterCountEl = toolbar.querySelector('#mobile-filter-count');

    toolbar.querySelector('#open-filter-drawer')?.addEventListener('click', () => this._opts.onOpenFilters?.());
    toolbar.querySelector('#sort-select')?.addEventListener('change', (e) => this._opts.onSortChange?.(e.target.value));
    toolbar.querySelectorAll('.view-mode-btn').forEach((button) => {
      button.addEventListener('click', () => this._opts.onViewChange?.(button.dataset.view));
    });

    this.syncViewMode(viewMode);
    return toolbar;
  }

  updateTitle({ title, description }) {
    if (!this._headerEl) return;
    const h1 = this._headerEl.querySelector('h1');
    const desc = this._headerEl.querySelector('p.mt-3');
    const breadcrumb = this._headerEl.querySelector('nav span.font-medium');
    if (h1) h1.textContent = title;
    if (desc) desc.textContent = description;
    if (breadcrumb) breadcrumb.textContent = title;
  }

  updateCount(totalCount) {
    if (this._countEl) {
      this._countEl.textContent = `${totalCount} sản phẩm`;
    }
  }

  updateFilterCount(count) {
    if (this._filterCountEl) {
      this._filterCountEl.textContent = String(count);
    }
  }

  syncViewMode(viewMode) {
    this._toolbarEl?.querySelectorAll('.view-mode-btn').forEach((button) => {
      const isActive = button.dataset.view === viewMode;
      button.classList.toggle('bg-[#0A0A0A]', isActive);
      button.classList.toggle('text-white', isActive);
      button.classList.toggle('text-zinc-500', !isActive);
      button.classList.toggle('hover:text-[#0A0A0A]', !isActive);
    });
  }
}
