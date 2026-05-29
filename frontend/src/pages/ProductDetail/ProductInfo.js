import { cartService } from '../../services/cartService.js';
import { formatPrice, navigate } from '../../utils/helpers.js';
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

    const layoutDescFirst = this._product.layout_desc_first !== false;

    const descHtml = this._product.description ? `
      <div class="space-y-3 border-t border-gray-100 pt-5">
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-3 bg-[#C9A961] rounded-full"></span>
          <h4 class="text-[13px] font-bold uppercase tracking-wider text-[#0A0A0A]">Thông tin cơ bản</h4>
        </div>
        <div class="text-[14px] leading-7 text-[#4B5563] whitespace-pre-wrap pl-3.5 border-l border-gray-100">${this._product.description}</div>
      </div>
    ` : '';

    const excludedLabels = ['Thương hiệu', 'Bộ sưu tập', 'Mã sản phẩm', 'Loại máy'];
    const specs = (this._product.specs || []).filter(spec => !excludedLabels.includes(spec.label));
    const specsHtml = specs.length > 0 ? `
      <div class="space-y-4 border-t border-gray-100 pt-5">
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-3 bg-[#C9A961] rounded-full"></span>
          <h4 class="text-[13px] font-bold uppercase tracking-wider text-[#0A0A0A]">Thông số kỹ thuật</h4>
        </div>
        <div class="bg-[#FAF8F3] rounded-xl p-4 border border-[#E8E4DC]/60 grid grid-cols-2 gap-x-6 gap-y-4 text-[13px]">
          ${specs.map(spec => `
            <div class="border-b border-[#E8E4DC] last:border-b-0 pb-2">
              <span class="font-semibold text-gray-500 block mb-0.5 text-[11px] uppercase tracking-wider">${spec.label}</span>
              <span class="text-[#0A0A0A] font-medium leading-relaxed block">${spec.value}</span>
            </div>
          `).join('')}
        </div>
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
        <div class="space-y-3">
          <p class="inline-flex items-center gap-2 rounded-full bg-[#FEF2F2] px-3 py-1.5 text-sm font-semibold text-[#DC2626]">⚡ Còn 3 sản phẩm cuối</p>
        </div>
        
        ${layoutDescFirst ? `${descHtml} ${specsHtml}` : `${specsHtml} ${descHtml}`}

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

      <div class="rounded-[12px] bg-[#FAF8F3] p-5">
        <div class="space-y-3 text-sm text-[#4B5563]">
          <p class="flex items-start gap-3">${icon('truck')} <span>Giao hàng tận nơi: ${this._product.delivery?.delivery_eta || '2-3 ngày làm việc'}</span></p>
          <p class="flex items-start gap-3">${icon('message')} <span>Nhận tại cửa hàng: ${this._product.delivery?.pickup_store || '123 Nguyễn Huệ, Q.1, TP.HCM'}</span></p>
        </div>
        <div class="mt-4 flex gap-3">
          <input type="text" placeholder="Mã bưu điện" class="h-11 flex-1 rounded-[8px] border border-[#E8E4DC] bg-white px-3 text-sm focus:border-[#C9A961] focus:outline-none"/>
          <button type="button" class="h-11 rounded-[8px] border border-[#0A0A0A] px-4 text-xs font-bold uppercase tracking-[0.08em]">Kiểm tra</button>
        </div>
      </div>

    `;
    this._bind(wrap);
    this._mountMobileSticky();
    return wrap;
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
    const toggle = () => bar.classList.toggle('translate-y-full', window.scrollY < 200);
    window.addEventListener('scroll', toggle, { passive: true });
    window.addEventListener('page-rendered', () => {
      if (!window.location.pathname.startsWith('/san-pham/')) bar.remove();
    });
    toggle();
    bar.querySelector('[data-mobile-cart]')?.addEventListener('click', () => this._addToCart());
    bar.querySelector('[data-mobile-buy]')?.addEventListener('click', () => { this._addToCart(); navigate('/thanh-toan'); });
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
