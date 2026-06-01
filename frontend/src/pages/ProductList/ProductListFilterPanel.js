import { PRICE_PRESETS, chevronRightIcon } from './ProductListConfig.js';

function getPresetClass(isActive) {
  return `rounded-[4px] border px-3 py-2 text-xs font-semibold transition ${
    isActive
      ? 'border-[#C9A961] bg-[#FAF8F3] text-[#0A0A0A]'
      : 'border-[#E8E4DC] text-zinc-600 hover:border-[#C9A961] hover:text-[#0A0A0A]'
  }`;
}

export class ProductListFilterPanel {
  constructor(options = {}) {
    this._opts = options;
    this._desktopEl = null;
    this._mobileEl = null;
    this._drawerEl = null;
    this._overlayEl = null;
    this._drawerApplyBtn = null;
  }

  renderDesktop() {
    this._desktopEl = this._renderSidebar({ mobile: false });
    return this._desktopEl;
  }

  renderMobileDrawer() {
    this._overlayEl = document.createElement('div');
    this._overlayEl.className = 'fixed inset-0 z-[110] hidden bg-black/50 opacity-0 transition-opacity duration-300 lg:hidden';

    this._drawerEl = document.createElement('aside');
    this._drawerEl.className = 'fixed inset-y-0 left-0 z-[111] hidden w-[88vw] max-w-sm -translate-x-full bg-white shadow-2xl transition-transform duration-300 lg:hidden';
    this._drawerEl.innerHTML = `
      <div class="flex h-full flex-col">
        <div class="flex h-16 items-center justify-between border-b border-[#E8E4DC] px-5">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-400">Bộ lọc</p>
            <h2 class="mt-1 text-sm font-semibold text-[#0A0A0A]">Chỉnh bộ lọc danh mục</h2>
          </div>
          <button type="button" data-close-drawer class="inline-flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-[#0A0A0A]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div id="mobile-filter-content" class="flex-1 overflow-hidden"></div>
        <div class="border-t border-[#E8E4DC] bg-white p-4">
          <div class="grid grid-cols-2 gap-3">
            <button type="button" data-clear-all class="inline-flex h-11 items-center justify-center rounded-[4px] border border-[#E8E4DC] text-[12px] font-bold uppercase tracking-[0.08em] text-zinc-600 transition hover:border-[#C9A961] hover:text-[#0A0A0A]">Xóa tất cả</button>
            <button type="button" data-apply-drawer class="inline-flex h-11 items-center justify-center rounded-[4px] bg-[#0A0A0A] px-4 text-[12px] font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#C9A961] hover:text-[#0A0A0A]">Áp dụng</button>
          </div>
        </div>
      </div>
    `;

    this._mobileEl = this._renderSidebar({ mobile: true });
    this._drawerEl.querySelector('#mobile-filter-content')?.appendChild(this._mobileEl);
    this._drawerApplyBtn = this._drawerEl.querySelector('[data-apply-drawer]');

    this._overlayEl.addEventListener('click', () => this.closeDrawer());
    this._drawerEl.querySelector('[data-close-drawer]')?.addEventListener('click', () => this.closeDrawer());
    this._drawerEl.querySelector('[data-clear-all]')?.addEventListener('click', () => this._opts.onClearAll?.(true));
    this._drawerApplyBtn?.addEventListener('click', () => this._applyPrice(this._mobileEl, true));

    return { overlay: this._overlayEl, drawer: this._drawerEl };
  }

  updateState(state) {
    this._opts = { ...this._opts, ...state };
    [this._desktopEl, this._mobileEl].forEach((sidebar) => this._syncSidebar(sidebar));
    this.setApplyCount(state.totalCount);
  }

  setApplyCount(totalCount) {
    if (this._drawerApplyBtn && typeof totalCount === 'number') {
      this._drawerApplyBtn.textContent = `Áp dụng (${totalCount} sản phẩm)`;
    }
  }

  openDrawer() {
    if (!this._overlayEl || !this._drawerEl) return;
    this._overlayEl.classList.remove('hidden');
    this._drawerEl.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      this._overlayEl.classList.remove('opacity-0');
      this._overlayEl.classList.add('opacity-100');
      this._drawerEl.classList.remove('-translate-x-full');
      this._drawerEl.classList.add('translate-x-0');
    });
  }

  closeDrawer() {
    if (!this._overlayEl || !this._drawerEl) return;
    this._overlayEl.classList.remove('opacity-100');
    this._overlayEl.classList.add('opacity-0');
    this._drawerEl.classList.add('-translate-x-full');
    this._drawerEl.classList.remove('translate-x-0');
    document.body.style.overflow = '';
    setTimeout(() => {
      this._overlayEl?.classList.add('hidden');
      this._drawerEl?.classList.add('hidden');
    }, 300);
  }

  _renderSidebar({ mobile }) {
    const sidebar = document.createElement(mobile ? 'div' : 'aside');
    sidebar.className = mobile ? 'flex h-full flex-col' : 'hidden self-start lg:block lg:sticky lg:top-24';
    sidebar.innerHTML = `
      <div class="${mobile ? 'flex h-full flex-col bg-white' : 'rounded-[4px] border border-[#E8E4DC] bg-white p-5'}">
        <div class="${mobile ? 'flex-1 overflow-y-auto px-5 pb-5 pt-4' : ''}">
          ${this._buildContent()}
        </div>
      </div>
    `;
    this._bindEvents(sidebar, { mobile });
    return sidebar;
  }

  _buildContent() {
    const categories = this._opts.categoryTree.map((category) => this._buildCategoryBlock(category)).join('');
    return `
      <section>
        <h3 class="mb-4 text-[12px] font-bold uppercase tracking-[0.12em] text-[#0A0A0A]">Danh mục</h3>
        <div data-cats-wrapper>${categories}</div>
      </section>
      <section class="mt-8 border-t border-zinc-100 pt-6">
        <h3 class="mb-4 text-[12px] font-bold uppercase tracking-[0.12em] text-[#0A0A0A]">Thương hiệu</h3>
        <div class="space-y-2">
          ${['Carnival', 'Casio', 'Kemil'].map((brand) => {
            const isActive = String(this._opts.brand || '').toLowerCase() === brand.toLowerCase();
            return `
              <button type="button" data-brand-filter="${brand.toLowerCase()}" class="flex w-full items-center justify-between text-left text-sm transition py-1 hover:text-[#C9A961] ${
                isActive ? 'font-bold text-[#C9A961]' : 'text-zinc-600'
              }">
                <span>${brand}</span>
                ${isActive ? '<span class="text-xs">✓</span>' : ''}
              </button>
            `;
          }).join('')}
        </div>
      </section>
      <section class="mt-8 border-t border-zinc-100 pt-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-[12px] font-bold uppercase tracking-[0.12em] text-[#0A0A0A]">Khoảng giá</h3>
          <button type="button" data-clear-price class="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400 transition hover:text-[#C9A961]">Xóa giá</button>
        </div>
        <div class="grid grid-cols-2 gap-2">
          ${PRICE_PRESETS.map((preset) => `<button type="button" data-price-preset data-min="${preset.min}" data-max="${preset.max}" class="${getPresetClass(this._isPresetActive(preset))}">${preset.label}</button>`).join('')}
        </div>
        <div class="mt-4 grid grid-cols-[1fr,auto,1fr] items-center gap-2">
          <input type="number" min="0" data-price-min placeholder="Từ" value="${this._opts.priceMin || ''}" class="h-11 w-full min-w-0 rounded-[4px] border border-[#E8E4DC] px-3 text-sm outline-none transition focus:border-[#C9A961]" />
          <span class="text-zinc-300">-</span>
          <input type="number" min="0" data-price-max placeholder="Đến" value="${this._opts.priceMax || ''}" class="h-11 w-full min-w-0 rounded-[4px] border border-[#E8E4DC] px-3 text-sm outline-none transition focus:border-[#C9A961]" />
        </div>
        <button type="button" data-apply-price class="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[4px] bg-[#0A0A0A] px-4 text-[12px] font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#C9A961] hover:text-[#0A0A0A]">Áp dụng</button>
      </section>
    `;
  }

  _buildCategoryBlock(category) {
    const isActiveTop = category.slug === this._opts.slug;
    const childLinks = category.children?.length ? `
      <div class="mt-2 ml-4 space-y-1 border-l border-zinc-100 pl-4 ${isActiveTop ? '' : 'hidden'}">
        ${category.children.map((child) => {
          const isActiveChild = child.slug === this._opts.childSlug;
          return `
            <a href="/${category.slug}?category=${child.slug}" data-subcat="${child.slug}" data-parent="${category.slug}" class="group flex items-center gap-2 py-1.5 text-sm transition ${
              isActiveChild ? 'font-bold text-[#C9A961]' : 'text-zinc-500 hover:text-[#C9A961]'
            }">
              <span class="h-1.5 w-1.5 rounded-full transition-all duration-200 ${isActiveChild ? 'scale-110 bg-[#C9A961]' : 'bg-zinc-200 group-hover:bg-[#C9A961]'}"></span>
              <span>${child.name}</span>
            </a>
          `;
        }).join('')}
      </div>
    ` : '';

    return `
      <div class="border-b border-zinc-100 py-2 last:border-b-0">
        <a href="/${category.slug}" data-cat="${category.slug}" class="flex items-center justify-between rounded-[4px] border-l-[3px] py-2 pl-3 pr-2 text-sm transition ${
          isActiveTop
            ? 'border-[#C9A961] bg-[#FAF8F3] font-semibold text-[#0A0A0A]'
            : 'border-transparent text-zinc-600 hover:border-[#C9A961] hover:bg-[#FAF8F3] hover:text-[#0A0A0A]'
        }">
          <span>${category.name}</span>
          <span class="text-zinc-300 transition-transform duration-200 ${isActiveTop ? 'rotate-90 text-[#C9A961]' : ''}">${chevronRightIcon()}</span>
        </a>
        ${childLinks}
      </div>
    `;
  }

  rebuildCategories({ slug, childSlug }) {
    this._opts.slug = slug;
    this._opts.childSlug = childSlug || '';
    [{ el: this._desktopEl, mobile: false }, { el: this._mobileEl, mobile: true }].forEach(({ el, mobile }) => {
      if (!el) return;
      const wrapper = el.querySelector('[data-cats-wrapper]');
      if (!wrapper) return;
      wrapper.innerHTML = this._opts.categoryTree.map((cat) => this._buildCategoryBlock(cat)).join('');
      this._bindCategoryEvents(el, { mobile });
    });
  }

  _bindCategoryEvents(sidebar, { mobile }) {
    sidebar.querySelectorAll('[data-cat]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if (mobile) this.closeDrawer();
        this._opts.onNavigateCategory?.(link.dataset.cat);
      });
    });

    sidebar.querySelectorAll('[data-subcat]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if (mobile) this.closeDrawer();
        this._opts.onNavigateSubcategory?.(link.dataset.parent, link.dataset.subcat);
      });
    });
  }

  _bindEvents(sidebar, { mobile }) {
    this._bindCategoryEvents(sidebar, { mobile });

    sidebar.querySelectorAll('[data-brand-filter]').forEach((button) => {
      button.addEventListener('click', () => {
        const brand = button.dataset.brandFilter;
        const nextBrand = String(this._opts.brand || '').toLowerCase() === brand ? '' : brand;
        this._opts.onBrandChange?.(nextBrand, mobile);
      });
    });

    sidebar.querySelectorAll('[data-price-preset]').forEach((button) => {
      button.addEventListener('click', () => {
        this._opts.onPriceChange?.({ priceMin: button.dataset.min || '', priceMax: button.dataset.max || '', closeDrawer: mobile });
      });
    });

    sidebar.querySelector('[data-clear-price]')?.addEventListener('click', () => {
      this._opts.onPriceChange?.({ priceMin: '', priceMax: '', closeDrawer: false });
    });

    sidebar.querySelector('[data-apply-price]')?.addEventListener('click', () => this._applyPrice(sidebar, mobile));
  }

  _applyPrice(sidebar, closeDrawer) {
    const priceMin = sidebar.querySelector('[data-price-min]')?.value.trim() || '';
    const priceMax = sidebar.querySelector('[data-price-max]')?.value.trim() || '';
    this._opts.onPriceChange?.({ priceMin, priceMax, closeDrawer });
  }

  _syncSidebar(sidebar) {
    if (!sidebar) return;
    const minInput = sidebar.querySelector('[data-price-min]');
    const maxInput = sidebar.querySelector('[data-price-max]');
    if (minInput) minInput.value = this._opts.priceMin || '';
    if (maxInput) maxInput.value = this._opts.priceMax || '';

    sidebar.querySelectorAll('[data-price-preset]').forEach((button) => {
      const isActive = String(button.dataset.min || '') === String(this._opts.priceMin || '') &&
        String(button.dataset.max || '') === String(this._opts.priceMax || '');
      button.className = getPresetClass(isActive);
    });

    sidebar.querySelectorAll('[data-brand-filter]').forEach((button) => {
      const isActive = String(button.dataset.brandFilter) === String(this._opts.brand || '').toLowerCase();
      button.className = `flex w-full items-center justify-between text-left text-sm transition py-1 hover:text-[#C9A961] ${
        isActive ? 'font-bold text-[#C9A961]' : 'text-zinc-600'
      }`;
      const tick = button.querySelector('span:last-child');
      if (isActive) {
        if (!tick || tick === button.querySelector('span')) {
          const check = document.createElement('span');
          check.className = 'text-xs';
          check.textContent = '✓';
          button.appendChild(check);
        }
      } else {
        if (tick && tick !== button.querySelector('span')) {
          tick.remove();
        }
      }
    });
  }

  _isPresetActive(preset) {
    return String(this._opts.priceMin || '') === String(preset.min) &&
      String(this._opts.priceMax || '') === String(preset.max);
  }
}
