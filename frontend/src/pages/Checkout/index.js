import { cartService } from '../../services/cartService.js';
import { createOrder } from '../../services/orderService.js';
import { formatPrice, navigate } from '../../utils/helpers.js';

export default class CheckoutPage {
  constructor() {
    this._submitting = false;
  }

  render() {
    const wrap = document.createElement('div');
    wrap.className = 'min-h-[60vh] font-sans';

    const items = cartService.getCart();
    if (items.length === 0) {
      wrap.innerHTML = `
        <div class="flex flex-col items-center px-4 py-20 text-center sm:px-6">
          <h2 class="text-2xl font-bold text-zinc-900">Giỏ hàng trống</h2>
          <button data-nav="/nam" class="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-zinc-950 px-8 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-amber-500 hover:text-zinc-950">
            Tiếp Tục Mua Sắm
          </button>
        </div>
      `;
      wrap.querySelector('[data-nav]').addEventListener('click', () => navigate('/nam'));
      return wrap;
    }

    const total = cartService.getTotal();
    const shipping = total >= 500000 ? 0 : 30000;

    wrap.innerHTML = `
      <div class="border-b border-zinc-200 bg-zinc-50">
        <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <nav class="mb-3 flex flex-wrap items-center gap-2 text-xs tracking-[0.05em] text-zinc-500">
            <span data-nav="/" class="cursor-pointer transition hover:text-amber-600">Trang chủ</span>
            <span>›</span>
            <span data-nav="/gio-hang" class="cursor-pointer transition hover:text-amber-600">Giỏ hàng</span>
            <span>›</span>
            <span class="font-semibold text-zinc-900">Thanh Toán</span>
          </nav>
          <h1 class="text-3xl font-black uppercase tracking-[0.05em] text-zinc-950 sm:text-4xl">Thanh Toán</h1>
        </div>
      </div>

      <div id="checkout-grid" class="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr),380px] lg:gap-10 lg:px-8 lg:py-10">
        <div class="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <form id="checkout-form" novalidate class="space-y-6">
            <div>
              <h3 class="border-b-2 border-zinc-900 pb-3 text-sm font-black uppercase tracking-[0.05em] text-zinc-950">Thông Tin Khách Hàng</h3>
              <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                ${this._field('Họ và Tên *', 'text', 'cust-name', 'Nguyễn Văn A', true)}
                ${this._field('Số Điện Thoại *', 'tel', 'cust-phone', '09xx xxx xxx', true)}
              </div>
              ${this._field('Email', 'email', 'cust-email', 'email@example.com')}
            </div>

            <div>
              <h3 class="border-b-2 border-zinc-900 pb-3 text-sm font-black uppercase tracking-[0.05em] text-zinc-950">Địa Chỉ Giao Hàng</h3>
              <div class="mt-5">
                ${this._field('Địa Chỉ *', 'text', 'cust-address', 'Số nhà, đường...', true)}
              </div>
              <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                ${this._field('Tỉnh / Thành Phố *', 'text', 'cust-city', 'TP. Hồ Chí Minh', true)}
                ${this._field('Quận / Huyện *', 'text', 'cust-district', 'Quận 1', true)}
                ${this._field('Phường / Xã', 'text', 'cust-ward', 'Phường Bến Nghé')}
              </div>
              ${this._field('Ghi Chú', 'text', 'cust-note', 'Giao giờ hành chính, gói trước khi giao...')}
            </div>

            <div>
              <h3 class="border-b-2 border-zinc-900 pb-3 text-sm font-black uppercase tracking-[0.05em] text-zinc-950">Phương Thức Thanh Toán</h3>
              <div class="mt-5 space-y-3">
                ${[
        { id: 'pm-cod', value: 'cod', label: 'Thanh toán khi nhận hàng (COD)', checked: true },
        { id: 'pm-bank', value: 'bank', label: 'Chuyển khoản ngân hàng' },
        { id: 'pm-momo', value: 'momo', label: 'Vi MoMo' },
      ].map((pm) => `
                  <label class="pm-label flex cursor-pointer items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-4 transition has-[input:checked]:border-amber-500 has-[input:checked]:bg-amber-50/50">
                    <input type="radio" id="${pm.id}" name="payment_method" value="${pm.value}" ${pm.checked ? 'checked' : ''} class="h-4 w-4 accent-amber-500" />
                    <span class="text-sm font-medium text-zinc-900">${pm.label}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <p id="checkout-error" class="hidden text-sm text-red-600"></p>
            <button type="submit" id="place-order-btn" class="inline-flex h-12 w-full items-center justify-center rounded-xl bg-amber-500 px-4 text-xs font-black uppercase tracking-[0.12em] text-zinc-950 transition hover:bg-amber-600">
              Đặt Hàng Ngay
            </button>
          </form>
        </div>

        <div class="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
          <h3 class="mb-5 border-b border-zinc-200 pb-4 text-sm font-black uppercase tracking-[0.05em] text-zinc-950">Đơn Hàng (${items.length} sản phẩm)</h3>
          <div class="space-y-4">
            ${items.map((item) => {
        const price = item.sale_price && item.sale_price < item.price ? item.sale_price : item.price;
        return `
                <div class="flex items-center gap-3">
                  <div class="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-zinc-50">
                    <img src="${item.image || 'https://images.pexels.com/photos/236915/pexels-photo-236915.jpeg?auto=compress&cs=tinysrgb&w=400'}" class="h-full w-full object-contain p-2" />
                    <span class="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-950 px-1 text-[10px] font-bold text-white">${item.qty}</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold text-zinc-900">${item.name}</p>
                    <p class="mt-1 text-xs text-zinc-500">${item.category_name || ''}</p>
                  </div>
                  <span class="text-sm font-bold text-zinc-900">${formatPrice(price * item.qty)}</span>
                </div>
              `;
      }).join('')}
          </div>

          <div class="mt-6 space-y-3 border-t border-zinc-200 pt-5 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-zinc-500">Tạm tính</span>
              <span class="font-semibold text-zinc-900">${formatPrice(total)}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-zinc-500">Vận chuyển</span>
              <span class="font-semibold ${shipping === 0 ? 'text-emerald-600' : 'text-zinc-900'}">${shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}</span>
            </div>
            <div class="flex items-center justify-between border-t border-zinc-200 pt-4 text-base font-black text-zinc-950">
              <span>Tổng Cộng</span>
              <span class="text-amber-500">${formatPrice(total + shipping)}</span>
            </div>
          </div>
        </div>
      </div>

      <div id="order-success" class="mx-auto hidden max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.5" class="mx-auto mb-6">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <h2 class="text-3xl font-black uppercase tracking-[0.05em] text-zinc-950">Đặt Hàng Thành Công</h2>
        <p class="mt-4 text-sm leading-7 text-zinc-600">Cảm ơn bạn đã mua sắm tại <strong>Venix Watch</strong>.</p>
        <p id="order-id-display" class="mt-2 text-sm text-zinc-500"></p>
        <button data-nav="/" class="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-zinc-950 px-8 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-amber-500 hover:text-zinc-950">
          Về Trang Chủ
        </button>
      </div>
    `;

    this._bindEvents(wrap, items, total, shipping);
    return wrap;
  }

  _field(label, type, id, placeholder, required = false) {
    return `
      <div class="mb-4">
        <label for="${id}" class="mb-2 block text-xs font-bold uppercase tracking-[0.05em] text-zinc-700">${label}</label>
        <input type="${type}" id="${id}" placeholder="${placeholder}" ${required ? 'required' : ''}
          class="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none transition focus:border-amber-500" />
      </div>
    `;
  }

  _bindEvents(wrap, items, total, shipping) {
    wrap.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.addEventListener('click', () => navigate(btn.dataset.nav));
    });

    const form = wrap.querySelector('#checkout-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (this._submitting) return;

      const get = (id) => wrap.querySelector(`#${id}`)?.value.trim() || '';
      const name = get('cust-name');
      const phone = get('cust-phone');
      const address = get('cust-address');
      const city = get('cust-city');
      const district = get('cust-district');
      const errEl = wrap.querySelector('#checkout-error');

      if (!name || !phone || !address || !city || !district) {
        errEl.textContent = 'Vui lòng điền đầy đủ thông tin bắt buộc.';
        errEl.classList.remove('hidden');
        return;
      }

      errEl.classList.add('hidden');
      this._submitting = true;

      const btn = wrap.querySelector('#place-order-btn');
      btn.textContent = 'Đang Xử Lý...';
      btn.disabled = true;

      const paymentMethod = wrap.querySelector('input[name="payment_method"]:checked')?.value || 'cod';

      try {
        const orderData = {
          customer_name: name,
          customer_email: get('cust-email'),
          customer_phone: phone,
          shipping_address: `${address}, ${district}, ${city}`,
          note: get('cust-note'),
          payment_method: paymentMethod,
          items: items.map((item) => ({ product_id: item.id, quantity: item.qty, price: item.sale_price || item.price })),
          total: total + shipping,
        };

        const res = await createOrder(orderData);
        cartService.clearCart();
        wrap.querySelector('#checkout-grid').style.display = 'none';
        const successEl = wrap.querySelector('#order-success');
        successEl.style.display = 'block';
        const orderIdEl = wrap.querySelector('#order-id-display');
        const orderId = res?.order_id || res?.data?.id;
        if (orderIdEl && orderId) orderIdEl.textContent = `Mã đơn hàng: #${orderId}`;
      } catch (err) {
        errEl.textContent = err.message || 'Đặt hàng thất bại. Vui lòng thử lại.';
        errEl.classList.remove('hidden');
        btn.textContent = 'Đặt Hàng Ngay';
        btn.disabled = false;
      }

      this._submitting = false;
    });
  }
}
