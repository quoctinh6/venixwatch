import { cartService } from '../../services/cartService.js';
import { formatPrice, navigate, navigateReplace } from '../../utils/helpers.js';
import {
  PDP_KEYS, dispatchCompare, formatInstallment, icon, readStoredArray, renderStars, showToast, toggleStoredItem,
} from './ProductDetailShared.js';
import { authService } from '../../services/authService.js';
import { openProductForm } from '../Admin/Products/ProductForm.js';

export default class ProductInfo {
  constructor(product, options = {}) {
    this._product = product;
    this._qty = 1;
    this._onReviewJump = options.onReviewJump || (() => {});
  }

  render() {
    const wrap = document.createElement('aside');
    wrap.className = 'space-y-6 lg:sticky lg:top-24';
    const compared = readStoredArray(PDP_KEYS.compare).some((item) => String(item.id) === String(this._product.id));
    const user = authService.getUser();
    const canQuickEdit = user && user.permissions && user.permissions.includes('products:quick_edit');

    const variants = this._product.variants || [];
    const activeStrap = this._product.strap_type || '';
    const activeColor = this._product.dial_color || '';

    const uniqueStraps = [...new Set(variants.map(v => v.strap_type).filter(Boolean))];
    const uniqueColors = [...new Set(variants.map(v => v.dial_color).filter(Boolean))];

    let variantsHtml = '';
    if (variants.length > 1) {
      variantsHtml = `
        <div class="space-y-4 border-t border-[#E8E4DC] pt-4">
          ${uniqueStraps.length > 1 ? `
            <div class="space-y-2">
              <span class="text-xs font-semibold uppercase tracking-[0.08em] text-[#0A0A0A]">Loại dây đeo: <span class="text-[#6B7280] font-normal">${activeStrap}</span></span>
              <div class="flex flex-wrap gap-2">
                ${uniqueStraps.map(strap => {
                  const isSelected = strap === activeStrap;
                  const hasCombination = variants.some(v => v.strap_type === strap && v.dial_color === activeColor);
                  return `
                    <button type="button" 
                            data-variant-strap="${strap}" 
                            class="px-4 py-2 border text-xs font-bold uppercase tracking-[0.05em] rounded-[6px] transition-all duration-200 
                                   ${isSelected 
                                     ? 'border-[#C9A961] bg-[#FAF8F3] text-[#0A0A0A] shadow-sm' 
                                     : hasCombination 
                                       ? 'border-[#E8E4DC] bg-white text-[#4B5563] hover:border-[#0A0A0A] hover:text-[#0A0A0A]' 
                                       : 'border-dashed border-[#E5E7EB] bg-white text-zinc-300 opacity-60'}"
                            ${!hasCombination && uniqueColors.length === 1 ? 'disabled' : ''}>
                      ${strap}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}

          ${uniqueColors.length > 1 ? `
            <div class="space-y-2">
              <span class="text-xs font-semibold uppercase tracking-[0.08em] text-[#0A0A0A]">Màu sắc mặt: <span class="text-[#6B7280] font-normal">${activeColor}</span></span>
              <div class="flex flex-wrap gap-2">
                ${uniqueColors.map(color => {
                  const isSelected = color === activeColor;
                  const hasCombination = variants.some(v => v.dial_color === color && v.strap_type === activeStrap);
                  
                  let colorClass = 'bg-zinc-200';
                  const cLower = color.toLowerCase();
                  if (cLower.includes('đen')) colorClass = 'bg-[#121212] border-white/20';
                  else if (cLower.includes('trắng') || cLower.includes('bạc')) colorClass = 'bg-[#F2F2F2]';
                  else if (cLower.includes('xanh dương') || cLower.includes('xanh lam')) colorClass = 'bg-[#1E3A8A]';
                  else if (cLower.includes('xanh lá') || cLower.includes('lục')) colorClass = 'bg-[#065F46]';
                  else if (cLower.includes('vàng') && cLower.includes('hồng')) colorClass = 'bg-[#E5A99E]';
                  else if (cLower.includes('vàng')) colorClass = 'bg-[#D4AF37]';
                  else if (cLower.includes('nâu') || cLower.includes('cà phê')) colorClass = 'bg-[#78350F]';
                  else if (cLower.includes('xám') || cLower.includes('ghi')) colorClass = 'bg-[#6B7280]';
                  else if (cLower.includes('đỏ')) colorClass = 'bg-[#991B1B]';
                  else if (cLower.includes('hồng')) colorClass = 'bg-[#EC4899]';
                  
                  return `
                    <button type="button" 
                            data-variant-color="${color}" 
                            class="inline-flex items-center gap-2 pl-2 pr-3 py-1.5 border text-xs font-bold uppercase tracking-[0.05em] rounded-[20px] transition-all duration-200 
                                   ${isSelected 
                                     ? 'border-[#C9A961] bg-[#FAF8F3] text-[#0A0A0A] shadow-sm' 
                                     : hasCombination 
                                       ? 'border-[#E8E4DC] bg-white text-[#4B5563] hover:border-[#0A0A0A] hover:text-[#0A0A0A]' 
                                       : 'border-dashed border-[#E5E7EB] bg-white text-zinc-300 opacity-60'}"
                            ${!hasCombination && uniqueStraps.length === 1 ? 'disabled' : ''}>
                      <span class="inline-block w-4 h-4 rounded-full border border-black/10 ${colorClass}"></span>
                      <span>${color}</span>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }

    const getShortDescription = () => {
      if (this._product.basic_info) return this._product.basic_info;
      if (this._product.short_description) return this._product.short_description;
      if (this._product.description) {
        const cleanText = this._product.description.replace(/<\/?[^>]+(>|$)/g, "").trim();
        if (cleanText.length > 220) {
          const cut = cleanText.lastIndexOf(' ', 220);
          return cleanText.substring(0, cut > 0 ? cut : 220) + '...';
        }
        return cleanText;
      }
      return '';
    };

    const shortDesc = getShortDescription();
    const shortDescHtml = shortDesc ? `
      <div class="space-y-3 border-t border-[#E8E4DC] pt-5">
        <div class="flex items-center gap-2">
          <span class="w-[5px] h-[18px] bg-[#C9A961] rounded-full"></span>
          <h4 class="text-[13px] font-bold uppercase tracking-wider text-[#0A0A0A]">Mô tả ngắn</h4>
        </div>
        <div class="text-[14px] leading-relaxed text-[#4B5563] pl-3.5 border-l border-[#E8E4DC]">${shortDesc}</div>
      </div>
    ` : '';

    wrap.innerHTML = `
      <div class="space-y-4 rounded-[12px] border border-[#E8E4DC] bg-white p-5 shadow-sm lg:p-7">
        <div class="flex flex-wrap gap-2">
          ${String(this._product.badge || '').toUpperCase() === 'NEW' ? '<span class="rounded-full bg-[#C9A961] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">NEW</span>' : ''}
          ${this._discount() > 0 ? `<span class="rounded-full bg-[#DC2626] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">SALE -${this._discount()}%</span>` : ''}
        </div>
        <p class="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#C9A961]">${this._product.category_name || 'Đồng hồ luxury'}</p>
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-4">
            <h1 class="text-[28px] font-bold leading-[1.3] tracking-[0.02em] text-[#0A0A0A] md:text-[32px]">${this._product.name}</h1>
            ${canQuickEdit ? `
              <button type="button" data-quick-edit class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#FAF8F3] text-[#C9A961] hover:bg-[#C9A961] hover:text-white transition-all shadow-sm flex-shrink-0" title="Chỉnh sửa sản phẩm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
            ` : ''}
          </div>
          <div class="flex items-center gap-2 text-[13px] text-[#6B7280]">
            <span>Mã sản phẩm: ${this._product.ref_number || this._product.slug}</span>
            <button type="button" data-copy-ref class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF8F3] text-[#0A0A0A]" aria-label="Sao chép mã sản phẩm">
              ${icon('copy')}
            </button>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[#6B7280]">
          <button type="button" data-review-jump class="inline-flex items-center gap-2 text-left">
            <span class="flex items-center gap-1">${renderStars(parseFloat(this._product.rating?.avg_rating) || 4.8)}</span>
            <span>(${parseInt(this._product.rating?.total) || 24} đánh giá)</span>
          </button>
          <span>${this._product.sold_count || 126} đã bán</span>
        </div>
        <div class="space-y-2 border-y border-[#E8E4DC] py-5">
          <div class="flex flex-wrap items-end gap-x-4 gap-y-2">
            <span class="text-[32px] font-bold ${this._product.sale_price ? 'text-[#DC2626]' : 'text-[#0A0A0A]'}">${formatPrice(this._product.sale_price || this._product.price)}</span>
            ${this._product.sale_price ? `<span class="text-base text-[#9CA3AF] line-through">${formatPrice(this._product.price)}</span>` : ''}
            ${this._discount() > 0 ? `<span class="rounded-full bg-[#FEF2F2] px-3 py-1 text-xs font-bold text-[#DC2626]">-${this._discount()}%</span>` : ''}
          </div>
          <div class="flex items-center gap-2 text-sm font-medium text-[#C9A961]">
            ${icon('credit')} Trả góp 0% từ ${formatInstallment(this._product.sale_price || this._product.price)}/tháng
          </div>
        </div>
        ${variantsHtml}
        <div class="space-y-3">
          <p class="inline-flex items-center gap-2 rounded-full bg-[#FEF2F2] px-3 py-1.5 text-sm font-semibold text-[#DC2626]">⚡ Còn 3 sản phẩm cuối</p>
        </div>

        ${shortDescHtml}

        <div class="flex items-center gap-3 border-t border-[#E8E4DC] pt-4">
          <span class="text-sm font-semibold uppercase tracking-[0.08em] text-[#0A0A0A]">Số lượng</span>
          <div class="inline-flex h-11 items-center rounded-[8px] border border-[#E5E7EB]">
            <button type="button" data-qty="dec" class="inline-flex h-11 w-11 items-center justify-center text-[#0A0A0A]">${icon('minus')}</button>
            <span data-qty-value class="inline-flex min-w-10 justify-center text-sm font-semibold">1</span>
            <button type="button" data-qty="inc" class="inline-flex h-11 w-11 items-center justify-center text-[#0A0A0A]">${icon('plus')}</button>
          </div>
        </div>
        <div class="space-y-3">
          <button type="button" data-buy-now class="pdp-gradient-gold inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[8px] px-4 text-sm font-bold uppercase tracking-[0.1em] text-[#0A0A0A] shadow-md">
            Mua ngay ${icon('arrowRight')}
          </button>
          <button type="button" data-add-cart class="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-[#0A0A0A] px-4 text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:bg-[#C9A961] hover:text-[#0A0A0A]">
            ${icon('bag')} Thêm vào giỏ
          </button>
        </div>
        <div class="flex flex-wrap gap-4 text-sm text-[#4B5563]">
          <button type="button" data-compare class="inline-flex items-center gap-2 ${compared ? 'text-[#C9A961]' : ''}">${icon('compare')} So sánh</button>
        </div>
      </div>



    `;
    this._bind(wrap);
    this._mountMobileSticky();
    this._element = wrap;
    return wrap;
  }

  updateProduct(product) {
    this._product = product;
    this._qty = 1;
    
    if (this._element) {
      if (this._toggleMobileBar) {
        window.removeEventListener('scroll', this._toggleMobileBar);
        this._toggleMobileBar = null;
      }
      if (this._onPageRendered) {
        window.removeEventListener('page-rendered', this._onPageRendered);
        this._onPageRendered = null;
      }
      const bar = document.getElementById('pdp-mobile-bar');
      if (bar) bar.remove();
      
      const newInfo = this.render();
      this._element.replaceWith(newInfo);
      this._element = newInfo;
    }
  }

  _bind(root) {
    root.querySelector('[data-copy-ref]')?.addEventListener('click', async () => {
      await navigator.clipboard?.writeText(this._product.ref_number || this._product.slug || '');
      showToast('Đã sao chép mã sản phẩm', 'success');
    });
    root.querySelector('[data-review-jump]')?.addEventListener('click', this._onReviewJump);
    root.querySelectorAll('[data-qty]').forEach((button) => button.addEventListener('click', () => {
      this._qty = button.dataset.qty === 'inc' ? this._qty + 1 : Math.max(1, this._qty - 1);
      root.querySelector('[data-qty-value]').textContent = String(this._qty);
    }));
    root.querySelector('[data-add-cart]')?.addEventListener('click', () => this._addToCart());
    root.querySelector('[data-buy-now]')?.addEventListener('click', () => { this._addToCart(); navigate('/thanh-toan'); });
    root.querySelector('[data-compare]')?.addEventListener('click', (e) => {
      const { active, items } = toggleStoredItem(PDP_KEYS.compare, { id: this._product.id, slug: this._product.slug, name: this._product.name }, 3);
      e.currentTarget.classList.toggle('text-[#C9A961]', active);
      dispatchCompare(items);
      showToast(active ? 'Đã thêm vào so sánh' : 'Đã bỏ khỏi so sánh', 'success');
    });
    root.querySelector('[data-quick-edit]')?.addEventListener('click', () => {
      openProductForm(this._product, () => {
        window.location.reload();
      });
    });

    root.querySelectorAll('[data-variant-strap]').forEach(btn => {
      btn.addEventListener('click', () => {
        const clickedStrap = btn.dataset.variantStrap;
        const variants = this._product.variants || [];
        const activeColor = this._product.dial_color || '';
        let target = variants.find(v => v.strap_type === clickedStrap && v.dial_color === activeColor);
        if (!target) {
          target = variants.find(v => v.strap_type === clickedStrap);
        }
        if (target && target.slug !== this._product.slug) {
          navigateReplace('/san-pham/' + target.slug);
        }
      });
    });

    root.querySelectorAll('[data-variant-color]').forEach(btn => {
      btn.addEventListener('click', () => {
        const clickedColor = btn.dataset.variantColor;
        const variants = this._product.variants || [];
        const activeStrap = this._product.strap_type || '';
        let target = variants.find(v => v.dial_color === clickedColor && v.strap_type === activeStrap);
        if (!target) {
          target = variants.find(v => v.dial_color === clickedColor);
        }
        if (target && target.slug !== this._product.slug) {
          navigateReplace('/san-pham/' + target.slug);
        }
      });
    });
  }

  _mountMobileSticky() {
    const oldBar = document.getElementById('pdp-mobile-bar');
    if (oldBar) oldBar.remove();
    const bar = document.createElement('div');
    bar.id = 'pdp-mobile-bar';
    bar.className = 'fixed inset-x-0 bottom-0 z-[140] translate-y-full border-t border-[#E8E4DC] bg-white px-4 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] transition-transform duration-300 md:hidden';
    bar.innerHTML = `
      <div class="flex items-center gap-2">
        <a href="https://zalo.me/0901234567" target="_blank" rel="noopener" class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E8E4DC]">${icon('message')}</a>
        <button type="button" data-mobile-cart class="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[8px] border border-[#0A0A0A] text-xs font-bold uppercase tracking-[0.08em]">${icon('bag')} + Giỏ</button>
        <button type="button" data-mobile-buy class="pdp-gradient-gold inline-flex h-10 flex-[1.4] items-center justify-center gap-2 rounded-[8px] text-xs font-bold uppercase tracking-[0.08em] text-[#0A0A0A]">Mua ngay ${icon('arrowRight')}</button>
      </div>
    `;
    document.body.appendChild(bar);
    this._toggleMobileBar = () => bar.classList.toggle('translate-y-full', window.scrollY < 200);
    window.addEventListener('scroll', this._toggleMobileBar, { passive: true });
    this._onPageRendered = () => {
      if (!window.location.pathname.startsWith('/san-pham/')) bar.remove();
    };
    window.addEventListener('page-rendered', this._onPageRendered);
    this._toggleMobileBar();
    bar.querySelector('[data-mobile-cart]')?.addEventListener('click', () => this._addToCart());
    bar.querySelector('[data-mobile-buy]')?.addEventListener('click', () => { this._addToCart(); navigate('/thanh-toan'); });
  }

  destroy() {
    if (this._toggleMobileBar) {
      window.removeEventListener('scroll', this._toggleMobileBar);
      this._toggleMobileBar = null;
    }
    if (this._onPageRendered) {
      window.removeEventListener('page-rendered', this._onPageRendered);
      this._onPageRendered = null;
    }
    const bar = document.getElementById('pdp-mobile-bar');
    if (bar) bar.remove();
  }

  _addToCart() {
    cartService.addItem(this._product, this._qty);
    showToast('Đã thêm vào giỏ hàng', 'success');
  }

  _discount() {
    if (!this._product.sale_price || this._product.sale_price >= this._product.price) return 0;
    return Math.round(((this._product.price - this._product.sale_price) / this._product.price) * 100);
  }
}
