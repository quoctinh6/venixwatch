/**
 * recentlyViewed.js — Track and display recently viewed products
 */
import { formatPrice, navigate } from './helpers.js';

const STORAGE_KEY = 'dhat_recently_viewed';
const MAX_ITEMS = 8;

export class RecentlyViewed {
  constructor() {
    this._items = this._load();
  }

  _load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._items));
  }

  /** Add a product to recently viewed (deduplicates by id) */
  push(product) {
    if (!product || !product.id) return;
    this._items = this._items.filter(p => p.id !== product.id);
    this._items.unshift({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      sale_price: product.sale_price || null,
      image: product.image || product.images?.[0] || '',
      category_name: product.category_name || '',
    });
    if (this._items.length > MAX_ITEMS) this._items = this._items.slice(0, MAX_ITEMS);
    this._save();
  }

  /** Get all recently viewed products */
  get() {
    return [...this._items];
  }

  /** Clear all recently viewed */
  clear() {
    this._items = [];
    this._save();
  }

  /**
   * Render a horizontal scroll section as a DOM node
   * @param {string} excludeId — Product ID to exclude (current product)
   */
  render(excludeId = null) {
    const items = this._items.filter(p => String(p.id) !== String(excludeId));
    if (items.length === 0) return null;

    const section = document.createElement('section');
    section.className = 'py-12 border-t border-[#e8e8e8]';
    section.innerHTML = `
      <div class="container-main">
        <h3 style="font-size:18px;font-weight:700;letter-spacing:0.8px;margin-bottom:24px;text-transform:uppercase;">
          ĐÃ XEM GẦN ĐÂY
        </h3>
        <div class="rv-track" style="display:flex;gap:16px;overflow-x:auto;padding-bottom:8px;scrollbar-width:thin;scrollbar-color:#C9A84C #f1f1f1;">
          ${items.map(p => this._cardHTML(p)).join('')}
        </div>
      </div>`;

    // Bind click events
    section.querySelectorAll('[data-rv-slug]').forEach(el => {
      el.addEventListener('click', () => navigate(`/san-pham/${el.dataset.rvSlug}`));
    });

    return section;
  }

  _cardHTML(p) {
    const displayPrice = p.sale_price && p.sale_price < p.price ? p.sale_price : p.price;
    const imgSrc = p.image ||
      'https://images.pexels.com/photos/236915/pexels-photo-236915.jpeg?auto=compress&cs=tinysrgb&w=400';
    return `
      <div data-rv-slug="${p.slug}" style="
        flex:0 0 180px;cursor:pointer;
        border:1px solid #e8e8e8;border-radius:2px;overflow:hidden;
        transition:box-shadow .2s,transform .2s;
        background:#fff;"
        onmouseenter="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)';this.style.transform='translateY(-2px)'"
        onmouseleave="this.style.boxShadow='';this.style.transform=''">
        <div style="aspect-ratio:1;background:#f8f8f8;overflow:hidden;">
          <img src="${imgSrc}" alt="${p.name}"
            style="width:100%;height:100%;object-fit:contain;padding:8px;transition:transform .4s;"
            loading="lazy"
            onerror="this.src='https://images.pexels.com/photos/236915/pexels-photo-236915.jpeg?auto=compress&cs=tinysrgb&w=400'"
            onmouseenter="this.style.transform='scale(1.05)'"
            onmouseleave="this.style.transform=''" />
        </div>
        <div style="padding:10px 12px;">
          <p style="font-size:11px;color:#888;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">${p.category_name || ''}</p>
          <p style="font-size:13px;font-weight:600;margin:0 0 6px;line-height:1.4;
            display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
            ${p.name}
          </p>
          <p style="font-size:14px;font-weight:700;color:#C9A84C;margin:0;">${formatPrice(displayPrice)}</p>
        </div>
      </div>`;
  }
}

export const recentlyViewed = new RecentlyViewed();
