import { formatPrice, navigate } from '../../utils/helpers.js';
import { cartService } from '../../services/cartService.js';
import { resolveImageUrl } from '../../services/config.js';

const FALLBACK_IMG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%"><rect width="100%" height="100%" fill="%23F3F4F6"/><g transform="translate(160, 140)" stroke="%239CA3AF" stroke-width="2" fill="none"><circle cx="40" cy="40" r="30"/><line x1="40" y1="40" x2="40" y2="22"/><line x1="40" y1="40" x2="52" y2="40"/><path d="M40 10 V 2 M40 70 V 78 M10 40 H 2 M70 40 H 78"/></g><text x="50%" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="%239CA3AF" text-anchor="middle">Hình ảnh đang cập nhật</text></svg>`;
const FALLBACK_IMAGES = [
  FALLBACK_IMG
];

function getDiscountPercent(price, salePrice) {
  if (!salePrice || salePrice >= price) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}

function getCompareItems() {
  try {
    return JSON.parse(localStorage.getItem('dhat_compare') || '[]');
  } catch {
    return [];
  }
}

function setCompareItems(items) {
  localStorage.setItem('dhat_compare', JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('compare-updated', { detail: items }));
}

function createBadge(label, classes) {
  return `<span class="${classes}">${label}</span>`;
}

function iconHeart() {
  return `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
      <path d="M12 21s-6.716-4.35-9.192-8.233C1.216 10.305 2.056 6.99 4.93 5.637c1.922-.905 4.13-.465 5.57 1.048C11.94 5.172 14.148 4.732 16.07 5.637c2.875 1.353 3.715 4.668 2.122 7.13C18.716 16.65 12 21 12 21z"/>
    </svg>
  `;
}

function iconCompare() {
  return `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
      <rect x="2" y="3" width="9" height="18" rx="1.5"/>
      <rect x="13" y="3" width="9" height="18" rx="1.5"/>
    </svg>
  `;
}

function iconBag() {
  return `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
      <path d="M6 8h12l-1 11H7L6 8Z"/>
      <path d="M9 8a3 3 0 0 1 6 0"/>
    </svg>
  `;
}

function ensureListStyles() {
  if (document.getElementById('pc-list-styles')) return;
  const s = document.createElement('style');
  s.id = 'pc-list-styles';
  s.textContent = [
    'article.product-card[data-view-mode="list"]{grid-template-columns:120px minmax(0,1fr);}',
    'article.product-card[data-view-mode="list"]>div:first-child{height:100%;}',
    'article.product-card[data-view-mode="list"]>div:first-child>div:first-child{height:100%;min-height:120px;}',
    '@media(min-width:768px){',
    'article.product-card[data-view-mode="list"]{grid-template-columns:260px minmax(0,1fr);}',
    'article.product-card[data-view-mode="list"]>div:first-child>div:first-child{min-height:220px;}',
    '}',
  ].join('');
  (document.head || document.documentElement).appendChild(s);
}

export class ProductCard {
  constructor(product, options = {}) {
    this._p = product;
    this._opts = options;
    this._el = null;
  }

  render() {
    ensureListStyles();
    const p = this._p;
    const viewMode = this._opts.viewMode === 'list' ? 'list' : 'grid';
    const displayPrice = p.sale_price && p.sale_price < p.price ? p.sale_price : p.price;
    const hasSale = !!(p.sale_price && p.sale_price < p.price);
    const discountPercent = getDiscountPercent(p.price, p.sale_price);
    const fallbackIndex = Math.abs(Number(p.id || 0)) % FALLBACK_IMAGES.length;
    const img = resolveImageUrl(p.image || p.images?.[0] || p.og_image) || FALLBACK_IMAGES[fallbackIndex];
    const storedCompare = getCompareItems();
    const isCompared = storedCompare.some((item) => String(item.id) === String(p.id));
    const showNewBadge = String(p.badge || '').toUpperCase() === 'NEW';

    const card = document.createElement('article');
    card.className = `product-card product-card-reveal group relative h-full overflow-hidden rounded-[4px] border border-transparent bg-white transition-all duration-300 hover:border-[#C9A961] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] ${
      viewMode === 'list' ? 'grid' : 'grid grid-rows-[auto,1fr]'
    }`;
    card.dataset.productId = p.id;
    card.dataset.viewMode = viewMode;

    card.innerHTML = `
      <div class="relative ${viewMode === 'list' ? 'h-full' : ''}">
        <div class="relative ${viewMode === 'list' ? 'h-full' : 'aspect-square'} overflow-hidden bg-[#FAF8F3]">
          <div class="absolute inset-0 skeleton-loader transition-opacity duration-500" id="skeleton-${p.id}"></div>

          <div class="pointer-events-none absolute left-3 top-3 z-[2] flex flex-col gap-2">
            ${showNewBadge ? createBadge('NEW', 'inline-flex min-h-6 items-center rounded-[2px] bg-[#C9A961] px-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white') : ''}
          </div>

          ${hasSale && discountPercent > 0 ? `
            <div class="pointer-events-none absolute right-3 top-3 z-[2]">
              ${createBadge(`-${discountPercent}%`, 'inline-flex min-h-6 items-center rounded-[2px] bg-[#DC2626] px-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white')}
            </div>
          ` : ''}

          <img
            data-src="${img}"
            src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'></svg>"
            alt="${p.name}"
            class="lazy h-full w-full object-cover"
            onerror="this.src='${FALLBACK_IMG}'"
          />

          <button
            type="button"
            class="compare-btn absolute bottom-3 right-3 z-[3] inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#0A0A0A] shadow-sm backdrop-blur transition-all duration-300 ${isCompared ? 'opacity-100 ring-1 ring-[#C9A961] text-[#C9A961]' : 'opacity-100 md:opacity-0 md:translate-y-1 group-hover:opacity-100 group-hover:translate-y-0'}"
            aria-label="So sánh sản phẩm"
            aria-pressed="${isCompared ? 'true' : 'false'}"
            title="So sánh"
          >
            ${iconCompare()}
          </button>
        </div>
      </div>

      <div class="grid h-full grid-rows-[auto,1fr,auto] gap-3 p-4 ${viewMode === 'list' ? 'md:p-5' : ''}">
        <div class="space-y-2">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C9A961]">
            ${p.category_name || 'Đồng hồ chính hãng'}
          </p>
          <h3 class="product-title line-clamp-2 min-h-[2.75rem] text-[15px] font-semibold leading-[1.45] text-[#0A0A0A] transition-colors duration-300 group-hover:text-[#7c6837] ${viewMode === 'list' ? 'md:text-base' : ''}">
            ${p.name}
          </h3>
          <div class="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
            ${p.brand ? `<span>${p.brand}</span>` : '<span>Chính hãng</span>'}
            ${p.movement_type ? '<span class="text-zinc-300">•</span>' : ''}
            ${p.movement_type ? `<span class="uppercase">${p.movement_type}</span>` : ''}
            ${p.case_size ? '<span class="text-zinc-300">•</span>' : ''}
            ${p.case_size ? `<span>${p.case_size}</span>` : ''}
          </div>
        </div>

        <div class="flex items-end">
          <div class="flex flex-wrap items-end gap-x-3 gap-y-1">
            <span class="text-base font-bold leading-none text-[#0A0A0A] ${hasSale ? 'text-[#DC2626]' : ''} ${viewMode === 'list' ? 'md:text-[20px]' : 'md:text-[18px]'}">
              ${formatPrice(displayPrice)}
            </span>
            ${hasSale ? `
              <span class="text-[13px] font-medium leading-none text-zinc-400 line-through md:text-sm">
                ${formatPrice(p.price)}
              </span>
            ` : ''}
          </div>
        </div>

        <button
          type="button"
          class="add-to-cart-btn hidden h-10 w-full items-center justify-center gap-2 rounded-[4px] bg-[#0A0A0A] px-4 text-[12px] font-bold uppercase tracking-[0.08em] text-white transition-colors duration-300 hover:bg-[#C9A961] hover:text-[#0A0A0A] md:inline-flex"
        >
          ${iconBag()}
          <span>THÊM VÀO GIỎ</span>
        </button>
      </div>
    `;

    this._el = card;
    this._bindEvents(card, p);
    return card;
  }

  _bindEvents(card, p) {
    const img = card.querySelector('img');
    const addBtn = card.querySelector('.add-to-cart-btn');
    const compareBtn = card.querySelector('.compare-btn');
    const skeleton = card.querySelector(`#skeleton-${p.id}`);

    img?.addEventListener('load', () => {
      if (!skeleton) return;
      skeleton.classList.add('opacity-0');
      setTimeout(() => skeleton.remove(), 500);
    });

    card.addEventListener('click', (e) => {
      if (e.target.closest('.add-to-cart-btn') || e.target.closest('.compare-btn')) return;
      navigate(`/san-pham/${p.slug}`);
    });

    addBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      cartService.addItem(p);
      addBtn.innerHTML = `${iconBag()}<span>ĐÃ THÊM</span>`;
      addBtn.classList.remove('bg-[#0A0A0A]', 'text-white');
      addBtn.classList.add('bg-[#C9A961]', 'text-[#0A0A0A]');

      setTimeout(() => {
        addBtn.innerHTML = `${iconBag()}<span>THÊM VÀO GIỎ</span>`;
        addBtn.classList.add('bg-[#0A0A0A]', 'text-white');
        addBtn.classList.remove('bg-[#C9A961]', 'text-[#0A0A0A]');
      }, 1500);
    });

    const syncCompareState = (items = getCompareItems()) => {
      if (!compareBtn) return;
      const isCompared = items.some((item) => String(item.id) === String(p.id));
      compareBtn.setAttribute('aria-pressed', isCompared ? 'true' : 'false');
      compareBtn.classList.toggle('ring-1', isCompared);
      compareBtn.classList.toggle('ring-[#C9A961]', isCompared);
      compareBtn.classList.toggle('text-[#C9A961]', isCompared);
      compareBtn.classList.toggle('md:opacity-0', !isCompared);
      compareBtn.classList.toggle('md:translate-y-1', !isCompared);
      compareBtn.classList.toggle('md:opacity-100', isCompared);
      compareBtn.classList.toggle('md:translate-y-0', isCompared);
    };

    const onCompareUpdated = (e) => {
      if (!document.body.contains(card)) {
        window.removeEventListener('compare-updated', onCompareUpdated);
        window.removeEventListener('page-rendered', onPageRendered);
        return;
      }
      syncCompareState(e.detail || []);
    };

    const onPageRendered = () => {
      if (!document.body.contains(card)) {
        window.removeEventListener('compare-updated', onCompareUpdated);
        window.removeEventListener('page-rendered', onPageRendered);
      }
    };

    window.addEventListener('compare-updated', onCompareUpdated);
    window.addEventListener('page-rendered', onPageRendered);

    compareBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const stored = getCompareItems();
      const exists = stored.some((item) => String(item.id) === String(p.id));

      if (exists) {
        setCompareItems(stored.filter((item) => String(item.id) !== String(p.id)));
        return;
      }

      if (stored.length >= 3) {
        window.alert('Chỉ có thể so sánh tối đa 3 sản phẩm.');
        return;
      }

      setCompareItems([...stored, { id: p.id, name: p.name, slug: p.slug }]);
    });
  }
}

export function createProductCard(product, options = {}) {
  return new ProductCard(product, options).render();
}
