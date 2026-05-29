import { cartService } from '../../services/cartService.js';
import { formatPrice, navigate } from '../../utils/helpers.js';
import { resolveImageUrl } from '../../services/config.js';

export default class CartPage {
  render() {
    const wrap = document.createElement('div');
    wrap.className = 'min-h-[60vh] font-sans';
    wrap.innerHTML = this._html();
    this._bindEvents(wrap);
    return wrap;
  }

  _html() {
    return `
      <div class="border-b border-zinc-200 bg-zinc-50">
        <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 class="text-3xl font-black uppercase tracking-[0.05em] text-zinc-950 sm:text-4xl">Giỏ Hàng</h1>
        </div>
      </div>
      <div id="cart-page-content" class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        ${this._cartContent()}
      </div>
    `;
  }

  _cartContent() {
    const items = cartService.getCart();
    if (items.length === 0) {
      return `
        <div class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-20 text-center shadow-sm">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#d4d4d8" stroke-width="1">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <h2 class="mt-6 text-xl font-bold text-zinc-700">Giỏ hàng của bạn đang trống</h2>
          <button data-nav="/" class="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-zinc-950 px-8 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-primary-gold hover:text-zinc-950">
            Tiếp Tục Mua Sắm
          </button>
        </div>
      `;
    }

    const total = cartService.getTotal();
    return `
      <div id="cart-grid" class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr),360px] lg:gap-10">
        <div class="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <div class="mb-4 hidden grid-cols-[minmax(0,1fr),120px,120px,120px] gap-4 border-b border-zinc-200 pb-4 text-xs font-extrabold uppercase tracking-[0.05em] text-zinc-500 md:grid">
            <span>Sản Phẩm</span>
            <span class="text-center">Đơn Giá</span>
            <span class="text-center">Số Lượng</span>
            <span class="text-right">Tổng</span>
          </div>
          <div id="cart-items-list" class="space-y-4">
            ${items.map((item) => this._itemRow(item)).join('')}
          </div>
        </div>

        <div class="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
          <h3 class="mb-6 border-b border-zinc-200 pb-4 text-sm font-black uppercase tracking-[0.05em] text-zinc-950">Tóm Tắt Đơn Hàng</h3>
          <div class="space-y-3 text-sm text-zinc-600">
            <div class="flex items-center justify-between">
              <span>Tạm tính (${items.reduce((sum, item) => sum + item.qty, 0)} sản phẩm)</span>
              <span class="font-semibold text-zinc-900">${formatPrice(total)}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Phí vận chuyển</span>
              <span class="font-semibold ${total >= 500000 ? 'text-emerald-600' : 'text-zinc-900'}">${total >= 500000 ? 'Miễn phí' : formatPrice(30000)}</span>
            </div>
          </div>

          <div class="my-5 border-y border-zinc-200 py-4">
            <div class="flex items-center justify-between text-base font-black text-zinc-950">
              <span>Tổng Cộng</span>
              <span class="text-primary-gold">${formatPrice(total + (total >= 500000 ? 0 : 30000))}</span>
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <div class="flex flex-col gap-2 sm:flex-row">
              <input id="coupon-input" type="text" placeholder="Mã giảm giá"
                class="h-11 flex-1 rounded-xl border border-zinc-200 px-3 text-sm outline-none transition focus:border-primary-gold" />
              <button id="coupon-btn" class="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-4 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-zinc-800">
                Áp Dụng
              </button>
            </div>
            <p id="coupon-msg" class="hidden text-xs"></p>
            <button id="checkout-page-btn" class="inline-flex h-12 w-full items-center justify-center rounded-xl bg-zinc-950 px-4 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-primary-gold hover:text-zinc-950">
              Tiến Hành Thanh Toán
            </button>
            <button data-nav="/nam" class="inline-flex h-12 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-900 transition hover:border-zinc-400 hover:bg-zinc-50">
              Tiếp Tục Mua Sắm
            </button>
          </div>
        </div>
      </div>
    `;
  }

  _itemRow(item) {
    const price = item.sale_price && item.sale_price < item.price ? item.sale_price : item.price;
    const img = resolveImageUrl(item.image) || 'https://images.pexels.com/photos/236915/pexels-photo-236915.jpeg?auto=compress&cs=tinysrgb&w=400';

    return `
      <div class="cart-item-row rounded-2xl border border-zinc-100 p-4 md:grid md:grid-cols-[minmax(0,1fr),120px,120px,120px] md:items-center md:gap-4" data-id="${item.id}">
        <div class="flex gap-4">
          <div class="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-zinc-50" data-slug="${item.slug}">
            <img src="${img}" alt="${item.name}" class="h-full w-full object-contain p-2"
              onerror="this.src='https://images.pexels.com/photos/236915/pexels-photo-236915.jpeg?auto=compress&cs=tinysrgb&w=400'" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="cursor-pointer text-sm font-bold text-zinc-950" data-slug="${item.slug}">${item.name}</p>
            <p class="mt-1 text-xs text-zinc-500">${item.category_name || ''}</p>
            <button class="remove-btn mt-3 text-xs font-semibold uppercase tracking-[0.05em] text-zinc-400 transition hover:text-red-600" data-id="${item.id}">
              Xóa
            </button>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between md:mt-0 md:block md:text-center">
          <span class="text-xs font-semibold uppercase tracking-[0.05em] text-zinc-400 md:hidden">Đơn giá</span>
          <span class="text-sm font-semibold text-zinc-900">${formatPrice(price)}</span>
        </div>

        <div class="mt-4 flex items-center justify-between md:mt-0 md:justify-center">
          <span class="text-xs font-semibold uppercase tracking-[0.05em] text-zinc-400 md:hidden">Số lượng</span>
          <div class="flex items-center rounded-xl border border-zinc-200">
            <button class="qty-dec h-10 w-10 text-lg text-zinc-700 transition hover:bg-zinc-50" data-id="${item.id}">−</button>
            <span class="qty-val min-w-10 text-center text-sm font-bold text-zinc-950">${item.qty}</span>
            <button class="qty-inc h-10 w-10 text-lg text-zinc-700 transition hover:bg-zinc-50" data-id="${item.id}">+</button>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between md:mt-0 md:block md:text-right">
          <span class="text-xs font-semibold uppercase tracking-[0.05em] text-zinc-400 md:hidden">Tổng</span>
          <span class="text-base font-bold text-primary-gold">${formatPrice(price * item.qty)}</span>
        </div>
      </div>
    `;
  }

  _bindEvents(wrap) {
    const refresh = () => {
      const content = wrap.querySelector('#cart-page-content');
      if (content) content.innerHTML = this._cartContent();
      this._bindItemEvents(wrap);
    };

    this._bindItemEvents(wrap);

    wrap.querySelector('#checkout-page-btn')?.addEventListener('click', () => navigate('/thanh-toan'));
    wrap.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.addEventListener('click', () => navigate(btn.dataset.nav));
    });

    wrap.querySelector('#coupon-btn')?.addEventListener('click', () => {
      const code = wrap.querySelector('#coupon-input')?.value.trim().toUpperCase();
      const msgEl = wrap.querySelector('#coupon-msg');
      if (!msgEl) return;
      msgEl.classList.remove('hidden');
      if (code === 'WELCOME10' || code === 'BOGOSO') {
        msgEl.textContent = `Mã "${code}" đã được áp dụng.`;
        msgEl.className = 'text-xs text-emerald-600';
      } else {
        msgEl.textContent = 'Mã giảm giá không hợp lệ.';
        msgEl.className = 'text-xs text-red-600';
      }
    });

    this._onCartUpdated = () => refresh();
    window.addEventListener('cart-updated', this._onCartUpdated);
  }

  _bindItemEvents(wrap) {
    wrap.querySelectorAll('.remove-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        cartService.removeItem(btn.dataset.id);
        const row = wrap.querySelector(`.cart-item-row[data-id="${btn.dataset.id}"]`);
        row?.remove();
        if (cartService.getCart().length === 0) {
          const content = wrap.querySelector('#cart-page-content');
          if (content) content.innerHTML = this._cartContent();
          this._bindEvents(wrap);
        }
      });
    });

    wrap.querySelectorAll('.qty-dec').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const item = cartService.getCart().find((entry) => String(entry.id) === String(id));
        if (item) {
          cartService.updateQty(id, item.qty - 1);
          btn.closest('.cart-item-row')?.querySelector('.qty-val').textContent = Math.max(0, item.qty - 1);
        }
        if (cartService.getCart().length === 0) {
          const content = wrap.querySelector('#cart-page-content');
          if (content) {
            content.innerHTML = this._cartContent();
            this._bindEvents(wrap);
          }
        }
      });
    });

    wrap.querySelectorAll('.qty-inc').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const item = cartService.getCart().find((entry) => String(entry.id) === String(id));
        if (item) {
          cartService.updateQty(id, item.qty + 1);
          btn.closest('.cart-item-row')?.querySelector('.qty-val').textContent = item.qty + 1;
        }
      });
    });

    wrap.querySelectorAll('[data-slug]').forEach((el) => {
      el.addEventListener('click', () => {
        if (el.dataset.slug) navigate(`/san-pham/${el.dataset.slug}`);
      });
    });
  }

  destroy() {
    if (this._onCartUpdated) {
      window.removeEventListener('cart-updated', this._onCartUpdated);
      this._onCartUpdated = null;
    }
  }
}
