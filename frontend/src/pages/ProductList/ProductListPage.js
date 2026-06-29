import { createProductCard } from '../Home/ProductCard.js';
import { getProducts, getMockProducts } from '../../services/productService.js';
import { getCategoryTree, FALLBACK_CATEGORY_TREE } from '../../services/categoryService.js';
import { navigate } from '../../utils/helpers.js';
import { CATEGORY_DESCRIPTIONS, CATEGORY_LABELS } from './ProductListConfig.js';
import { ProductListFilterPanel } from './ProductListFilterPanel.js';
import { ProductListHeader } from './ProductListHeader.js';

export default class ProductListPage {
  constructor(params = {}) {
    const urlParams = new URLSearchParams(window.location.search);
    this._slug = params.category_slug || '';
    this._badge = params.badge || '';
    this._childSlug = urlParams.get('category') || '';
    this._search = urlParams.get('search') || '';
    this._sort = urlParams.get('sort') || 'new';
    this._viewMode = localStorage.getItem('dhat_view_mode') === 'list' ? 'list' : 'grid';
    this._priceMin = urlParams.get('price_min') || '';
    this._priceMax = urlParams.get('price_max') || '';
    this._brand = urlParams.get('brand') || '';
    this._dialColor = urlParams.get('dial_color') || '';
    this._strapType = urlParams.get('strap_type') || '';
    this._page = Math.max(1, Number(urlParams.get('page') || 1));
    this._products = [];
    this._categoryTree = [];
    this._activeTop = null;
    this._activeChild = null;
    this._totalPages = 1;
    this._totalCount = 0;
    this._gridEl = null;
    this._paginationEl = null;
    this._header = null;
    this._filters = null;
    this._isInitialLoad = true;
  }

  async render() {
    await this._loadCategories();
    this._header = this._createHeader();
    this._filters = this._createFilters();

    const wrap = document.createElement('div');
    wrap.className = 'min-h-[60vh] bg-white pb-10';
    wrap.appendChild(this._header.renderHeader(this._buildHeaderMeta()));

    const main = document.createElement('div');
    main.className = 'mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px,minmax(0,1fr)] lg:gap-8 lg:px-8 lg:py-8';
    main.appendChild(this._filters.renderDesktop());

    const right = document.createElement('div');
    right.className = 'min-w-0';
    right.appendChild(this._header.renderToolbar({ sort: this._sort, viewMode: this._viewMode }));

    this._gridEl = document.createElement('div');
    right.appendChild(this._gridEl);

    this._paginationEl = document.createElement('div');
    this._paginationEl.className = 'mt-8 flex flex-wrap items-center justify-center gap-2';
    right.appendChild(this._paginationEl);

    main.appendChild(right);
    wrap.appendChild(main);

    const drawer = this._filters.renderMobileDrawer();
    wrap.appendChild(drawer.overlay);
    wrap.appendChild(drawer.drawer);

    await this._loadProducts();
    return wrap;
  }

  async _loadCategories() {
    try {
      this._categoryTree = await getCategoryTree();
    } catch {
      this._categoryTree = FALLBACK_CATEGORY_TREE;
    }
    this._activeTop = this._categoryTree.find((category) => category.slug === this._slug) || null;
    this._activeChild = this._activeTop?.children?.find((category) => category.slug === this._childSlug) || null;
  }

  _createHeader() {
    return new ProductListHeader({
      onNavigateHome: () => navigate('/'),
      onOpenFilters: () => this._filters?.openDrawer(),
      onSortChange: (sort) => {
        this._sort = sort;
        this._page = 1;
        this._scrollToTop();
        this._loadProducts();
      },
      onViewChange: (view) => this._changeView(view),
    });
  }

  _createFilters() {
    return new ProductListFilterPanel({
      categoryTree: this._categoryTree,
      slug: this._slug,
      childSlug: this._childSlug,
      priceMin: this._priceMin,
      priceMax: this._priceMax,
      brand: this._brand,
      dialColor: this._dialColor,
      strapType: this._strapType,
      onNavigateCategory: (slug) => this._navigateCategory(slug),
      onNavigateSubcategory: (parent, child) => this._navigateSubcategory(parent, child),
      onPriceChange: ({ priceMin, priceMax, closeDrawer }) => this._applyPriceFilters(priceMin, priceMax, closeDrawer),
      onBrandChange: (brand, closeDrawer) => this._applyBrandFilter(brand, closeDrawer),
      onDialColorChange: (color, closeDrawer) => this._applyDialColorFilter(color, closeDrawer),
      onStrapTypeChange: (strap, closeDrawer) => this._applyStrapTypeFilter(strap, closeDrawer),
      onClearAll: (closeDrawer) => this._clearAllFilters(closeDrawer),
    });
  }

  _navigateCategory(slug) {
    this._slug = slug;
    this._childSlug = '';
    this._priceMin = '';
    this._priceMax = '';
    this._page = 1;
    this._badge = '';
    this._activeTop = this._categoryTree.find((c) => c.slug === slug) || null;
    this._activeChild = null;
    history.pushState({}, '', `/${slug}`);
    this._filters.rebuildCategories({ slug: this._slug, childSlug: '' });
    this._header.updateTitle(this._buildHeaderMeta());
    this._scrollToTop();
    this._loadProducts();
  }

  _navigateSubcategory(parent, child) {
    this._slug = parent;
    this._childSlug = child;
    this._page = 1;
    this._activeTop = this._categoryTree.find((c) => c.slug === parent) || null;
    this._activeChild = this._activeTop?.children?.find((c) => c.slug === child) || null;
    this._filters.rebuildCategories({ slug: this._slug, childSlug: this._childSlug });
    this._header.updateTitle(this._buildHeaderMeta());
    this._scrollToTop();
    this._loadProducts();
  }

  _buildHeaderMeta() {
    const title = this._activeChild?.name || this._activeTop?.name || CATEGORY_LABELS[this._slug]
      || (this._search ? `Kết quả tìm kiếm: "${this._search}"` : 'Tất cả sản phẩm');
    const description = this._activeChild?.description
      || this._activeTop?.description
      || CATEGORY_DESCRIPTIONS[this._slug]
      || '';

    return { title, description };
  }

  _changeView(view) {
    this._viewMode = view === 'list' ? 'list' : 'grid';
    localStorage.setItem('dhat_view_mode', this._viewMode);
    this._page = 1;
    this._header.syncViewMode(this._viewMode);
    this._scrollToTop();
    this._loadProducts();
  }

  _applyPriceFilters(priceMin, priceMax, closeDrawer) {
    this._priceMin = priceMin;
    this._priceMax = priceMax;
    this._page = 1;
    if (closeDrawer) this._filters.closeDrawer();
    this._scrollToTop();
    this._loadProducts();
  }

  _applyBrandFilter(brand, closeDrawer) {
    this._brand = brand;
    this._page = 1;
    if (closeDrawer) this._filters.closeDrawer();
    this._scrollToTop();
    this._loadProducts();
  }

  _applyDialColorFilter(color, closeDrawer) {
    this._dialColor = color;
    this._page = 1;
    if (closeDrawer) this._filters.closeDrawer();
    this._scrollToTop();
    this._loadProducts();
  }

  _applyStrapTypeFilter(strap, closeDrawer) {
    this._strapType = strap;
    this._page = 1;
    if (closeDrawer) this._filters.closeDrawer();
    this._scrollToTop();
    this._loadProducts();
  }

  _clearAllFilters(closeDrawer = false) {
    this._priceMin = '';
    this._priceMax = '';
    this._brand = '';
    this._dialColor = '';
    this._strapType = '';
    this._page = 1;
    if (closeDrawer) this._filters.closeDrawer();

    if (this._childSlug) {
      this._childSlug = '';
      this._activeChild = null;
      this._filters.rebuildCategories({ slug: this._slug, childSlug: '' });
    }

    this._scrollToTop();
    this._loadProducts();
  }

  _buildUrl() {
    const query = new URLSearchParams();
    if (this._childSlug) query.set('category', this._childSlug);
    if (this._brand) query.set('brand', this._brand);
    if (this._dialColor) query.set('dial_color', this._dialColor);
    if (this._strapType) query.set('strap_type', this._strapType);
    if (this._search) query.set('search', this._search);
    if (this._sort !== 'new') query.set('sort', this._sort);
    if (this._priceMin) query.set('price_min', this._priceMin);
    if (this._priceMax) query.set('price_max', this._priceMax);
    if (this._page > 1) query.set('page', String(this._page));
    const basePath = this._slug ? `/${this._slug}` : '/tim-kiem';
    return `${basePath}${query.toString() ? `?${query.toString()}` : ''}`;
  }

  _replaceUrl() {
    const currentState = history.state || {};
    if (this._isInitialLoad) {
      history.replaceState({ ...currentState }, '', this._buildUrl());
    } else {
      const newState = { ...currentState };
      delete newState.scrollY;
      history.replaceState(newState, '', this._buildUrl());
    }
  }

  _updateGridLayout() {
    if (!this._gridEl) return;
    this._gridEl.className = this._viewMode === 'list'
      ? 'mt-5 grid grid-cols-1 gap-4'
      : 'mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:gap-6';
  }

  _scrollToTop() {
    if (window.lenis) {
      window.lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }

  async _loadProducts() {
    if (!this._gridEl) return;
    if (this.aborted) return;
    this._replaceUrl();
    this._updateGridLayout();

    // If grid has content, fade it softly and keep height stable. Otherwise show spinner.
    if (!this._gridEl.innerHTML || this._gridEl.querySelector('.spinner')) {
      this._gridEl.innerHTML = '<div class="col-span-full flex justify-center py-12"><div class="spinner"></div></div>';
    } else {
      this._gridEl.classList.add('transition-all', 'duration-300', 'opacity-30', 'pointer-events-none', 'blur-[0.5px]');
    }

    try {
      const res = await getProducts(this._buildProductParams());
      if (this.aborted) return;
      this._products = Array.isArray(res) ? res : (res.data || res.products || []);
      const meta = res.meta || {};
      this._totalPages = res.last_page || meta.total_pages || res.total_pages || 1;
      this._totalCount = res.total || meta.total || this._products.length;
    } catch {
      if (this.aborted) return;
      this._products = getMockProducts(9);
      this._totalPages = 1;
      this._totalCount = this._products.length;
    }

    this._header.updateCount(this._totalCount);
    this._header.updateFilterCount(this._getActiveFilterCount());
    this._filters.updateState({
      slug: this._slug,
      childSlug: this._childSlug,
      priceMin: this._priceMin,
      priceMax: this._priceMax,
      brand: this._brand,
      dialColor: this._dialColor,
      strapType: this._strapType,
      totalCount: this._totalCount,
    });

    this._renderGrid();
    this._renderPagination();

    // Softly fade products back in
    this._gridEl.classList.remove('opacity-30', 'pointer-events-none', 'blur-[0.5px]');
    window.dispatchEvent(new CustomEvent('page-rendered'));

    // Scroll to the top of the page after products render if not restoring scroll position
    const currentKey = window.location.pathname + window.location.search;
    const hasSavedScroll = (history.state && typeof history.state.scrollY === 'number' && history.state.scrollY > 0)
      || !!sessionStorage.getItem(`dhat_scroll_${currentKey}`);
    if (!hasSavedScroll) {
      if (window.lenis) {
        window.lenis.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo(0, 0);
      }
    }

    this._isInitialLoad = false;
  }

  _buildProductParams() {
    return {
      page: this._page,
      limit: 9,
      ...(this._slug && this._slug !== 'sale' ? { category_slug: this._slug } : {}),
      ...(this._childSlug ? { category: this._childSlug } : {}),
      ...(this._badge ? { badge: this._badge } : {}),
      ...(this._search ? { search: this._search } : {}),
      ...(this._sort ? { sort: this._sort } : {}),
      ...(this._priceMin ? { price_min: this._priceMin } : {}),
      ...(this._priceMax ? { price_max: this._priceMax } : {}),
      ...(this._brand ? { brand: this._brand } : {}),
      ...(this._dialColor ? { dial_color: this._dialColor } : {}),
      ...(this._strapType ? { strap_type: this._strapType } : {}),
    };
  }

  _getActiveFilterCount() {
    return (this._childSlug ? 1 : 0) + (this._priceMin || this._priceMax ? 1 : 0) + (this._brand ? 1 : 0) + (this._dialColor ? 1 : 0) + (this._strapType ? 1 : 0);
  }

  _renderGrid() {
    this._gridEl.innerHTML = '';
    if (!this._products.length) {
      this._gridEl.innerHTML = '<div class="col-span-full rounded-[4px] border border-dashed border-[#E8E4DC] px-6 py-16 text-center text-sm text-zinc-500">Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại.</div>';
      return;
    }

    this._products.forEach((product) => {
      this._gridEl.appendChild(createProductCard(product, { viewMode: this._viewMode }));
    });
  }

  _renderPagination() {
    this._paginationEl.innerHTML = '';
    if (this._totalPages <= 1) return;

    // Define the candidate pages to keep (at most 5 numbers)
    const pages = new Set();
    pages.add(1);
    if (this._totalPages >= 2) pages.add(2);
    pages.add(this._page);
    if (this._totalPages - 1 >= 1) pages.add(this._totalPages - 1);
    if (this._totalPages >= 1) pages.add(this._totalPages);

    // Filter and sort the valid page numbers
    const validPages = Array.from(pages)
      .filter((p) => p >= 1 && p <= this._totalPages)
      .sort((a, b) => a - b);

    // Build the items list including '...' for gaps > 1 page
    const items = [];
    let prev = 0;
    for (const page of validPages) {
      if (prev > 0) {
        if (page - prev > 1) {
          items.push('...');
        }
      }
      items.push(page);
      prev = page;
    }

    // Render Previous Arrow Button
    const prevButton = document.createElement('button');
    const isPrevDisabled = this._page === 1;
    prevButton.disabled = isPrevDisabled;
    prevButton.className = `inline-flex h-10 w-10 items-center justify-center rounded-[4px] border transition ${
      isPrevDisabled
        ? 'border-[#E8E4DC] bg-zinc-50 text-zinc-300 cursor-not-allowed'
        : 'border-[#E8E4DC] bg-white text-zinc-600 hover:border-[#C9A961] hover:text-[#0A0A0A]'
    }`;
    prevButton.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>`;
    prevButton.title = 'Trang trước';
    prevButton.addEventListener('click', () => {
      if (this._page > 1) {
        this._page -= 1;
        this._scrollToTop();
        this._loadProducts();
      }
    });
    this._paginationEl.appendChild(prevButton);

    // Render page numbers and ellipses
    items.forEach((item) => {
      if (item === '...') {
        const span = document.createElement('span');
        span.className = 'inline-flex h-10 min-w-10 items-center justify-center text-sm font-semibold text-zinc-400';
        span.textContent = '...';
        this._paginationEl.appendChild(span);
      } else {
        const button = document.createElement('button');
        const isActive = item === this._page;
        button.className = `inline-flex h-10 min-w-10 items-center justify-center rounded-[4px] border px-3 text-sm font-semibold transition ${
          isActive
            ? 'border-[#C9A961] bg-[#C9A961] text-[#0A0A0A]'
            : 'border-[#E8E4DC] bg-white text-zinc-600 hover:border-[#C9A961] hover:text-[#0A0A0A]'
        }`;
        button.textContent = item;
        button.addEventListener('click', () => {
          this._page = item;
          this._scrollToTop();
          this._loadProducts();
        });
        this._paginationEl.appendChild(button);
      }
    });

    // Render Next Arrow Button
    const nextButton = document.createElement('button');
    const isNextDisabled = this._page === this._totalPages;
    nextButton.disabled = isNextDisabled;
    nextButton.className = `inline-flex h-10 w-10 items-center justify-center rounded-[4px] border transition ${
      isNextDisabled
        ? 'border-[#E8E4DC] bg-zinc-50 text-zinc-300 cursor-not-allowed'
        : 'border-[#E8E4DC] bg-white text-zinc-600 hover:border-[#C9A961] hover:text-[#0A0A0A]'
    }`;
    nextButton.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>`;
    nextButton.title = 'Trang sau';
    nextButton.addEventListener('click', () => {
      if (this._page < this._totalPages) {
        this._page += 1;
        this._scrollToTop();
        this._loadProducts();
      }
    });
    this._paginationEl.appendChild(nextButton);
  }

  destroy() {
    this.aborted = true;
  }
}
