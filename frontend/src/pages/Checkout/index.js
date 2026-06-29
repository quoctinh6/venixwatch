import { cartService } from '../../services/cartService.js';
import { createOrder } from '../../services/orderService.js';
import { formatPrice, navigate } from '../../utils/helpers.js';
import { resolveImageUrl } from '../../services/config.js';
import { getUser, isLoggedIn } from '../../services/authService.js';

export default class CheckoutPage {
  constructor() {
    this._submitting = false;
    this._showingSuccess = false;
    this._paymentCompleted = false;
    this._timerInterval = null;

    this._beforeUnloadHandler = (e) => {
      if (this._showingSuccess && !this._paymentCompleted) {
        const backupCart = sessionStorage.getItem('checkout_backup_cart');
        if (backupCart) {
          localStorage.setItem('dhat_cart', backupCart);
        }
        e.preventDefault();
        e.returnValue = 'Bạn chưa hoàn tất thanh toán. Rời khỏi trang sẽ hủy thanh toán?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', this._beforeUnloadHandler);
  }

  render() {
    const wrap = document.createElement('div');
    wrap.className = 'min-h-[60vh] font-sans';

    const items = cartService.getCart();
    if (items.length === 0) {
      wrap.innerHTML = `
        <div class="flex flex-col items-center px-4 py-20 text-center sm:px-6">
          <h2 class="text-2xl font-bold text-zinc-900">Giỏ hàng trống</h2>
          <button data-nav="/nam" class="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-zinc-950 px-8 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-primary-gold hover:text-zinc-950">
            Tiếp Tục Mua Sắm
          </button>
        </div>
      `;
      wrap.querySelector('[data-nav]').addEventListener('click', () => navigate('/nam'));
      return wrap;
    }

    const total = cartService.getTotal();
    const shipping = total >= 500000 ? 0 : 30000;

    const user = getUser();
    const defaultName = user ? (user.full_name || user.name || '') : '';
    const defaultPhone = user ? (user.phone || '') : '';
    const defaultEmail = user ? (user.email || '') : '';

    wrap.innerHTML = `
      <div class="border-b border-zinc-200 bg-zinc-50">
        <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <nav class="mb-3 flex flex-wrap items-center gap-2 text-xs tracking-[0.05em] text-zinc-500">
            <span data-nav="/" class="cursor-pointer transition hover:text-primary-gold">Trang chủ</span>
            <span>›</span>
            <span data-nav="/gio-hang" class="cursor-pointer transition hover:text-primary-gold">Giỏ hàng</span>
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
              
              <!-- Login Status Banner -->
              ${isLoggedIn() ? `
                <div class="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-3 text-emerald-800 text-xs font-semibold">
                  <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  <span>Bạn đang đặt hàng bằng tài khoản: <strong class="underline">${user.full_name || user.name || user.email}</strong>. Đơn hàng sẽ được lưu vào tài khoản của bạn.</span>
                </div>
              ` : `
                <div class="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-center justify-between gap-3 text-amber-800 text-xs font-semibold">
                  <span class="flex items-center gap-2">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Bạn đang đặt hàng với tư cách <strong>Khách (Không đăng nhập)</strong>.
                  </span>
                  <button type="button" id="checkout-login-btn" class="shrink-0 bg-zinc-900 text-white hover:bg-primary-gold hover:text-zinc-950 transition px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider">Đăng Nhập</button>
                </div>
              `}

              <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                ${this._field('Họ và Tên *', 'text', 'cust-name', 'Nguyễn Văn A', true, defaultName)}
                ${this._field('Số Điện Thoại *', 'tel', 'cust-phone', '09xx xxx xxx', true, defaultPhone)}
              </div>
              ${this._field('Email', 'email', 'cust-email', 'email@example.com', false, defaultEmail)}
            </div>

            <div>
              <h3 class="border-b-2 border-zinc-900 pb-3 text-sm font-black uppercase tracking-[0.05em] text-zinc-950">Địa Chỉ Giao Hàng</h3>
              <div class="mt-5">
                ${this._field('Địa Chỉ *', 'text', 'cust-address', 'Số nhà, đường...', true)}
              </div>
              <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div class="mb-4">
                  <label for="cust-city" class="mb-2 block text-xs font-bold uppercase tracking-[0.05em] text-zinc-700">Tỉnh / Thành Phố *</label>
                  <select id="cust-city" required class="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none transition focus:border-primary-gold bg-white">
                    <option value="">Chọn Tỉnh / Thành Phố</option>
                  </select>
                </div>
                <div class="mb-4">
                  <label for="cust-district" class="mb-2 block text-xs font-bold uppercase tracking-[0.05em] text-zinc-700">Quận / Huyện *</label>
                  <select id="cust-district" required disabled class="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none transition focus:border-primary-gold bg-white disabled:opacity-50">
                    <option value="">Chọn Quận / Huyện</option>
                  </select>
                </div>
                <div class="mb-4">
                  <label for="cust-ward" class="mb-2 block text-xs font-bold uppercase tracking-[0.05em] text-zinc-700">Phường / Xã *</label>
                  <select id="cust-ward" required disabled class="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none transition focus:border-primary-gold bg-white disabled:opacity-50">
                    <option value="">Chọn Phường / Xã</option>
                  </select>
                </div>
              </div>
              ${this._field('Ghi Chú', 'text', 'cust-note', 'Giao giờ hành chính, gói trước khi giao...')}
            </div>

            <div>
              <h3 class="border-b-2 border-zinc-900 pb-3 text-sm font-black uppercase tracking-[0.05em] text-zinc-950">Phương Thức Thanh Toán</h3>
              <div class="mt-5 space-y-3">
                ${[
        { id: 'pm-cod', value: 'cod', label: 'Thanh toán khi nhận hàng (COD)', checked: true },
        { id: 'pm-bank', value: 'bank', label: 'Chuyển khoản ngân hàng' },
      ].map((pm) => `
                  <label class="pm-label flex cursor-pointer items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-4 transition has-[input:checked]:border-primary-gold has-[input:checked]:bg-primary-gold/10">
                    <input type="radio" id="${pm.id}" name="payment_method" value="${pm.value}" ${pm.checked ? 'checked' : ''} class="h-4 w-4 accent-primary-gold" />
                    <span class="text-sm font-medium text-zinc-900">${pm.label}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <p id="checkout-error" class="hidden text-sm text-red-600"></p>
            <button type="submit" id="place-order-btn" class="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary-gold px-4 text-xs font-black uppercase tracking-[0.12em] text-zinc-950 transition hover:bg-primary-gold-dark">
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
                    <img src="${resolveImageUrl(item.image) || 'https://images.pexels.com/photos/236915/pexels-photo-236915.jpeg?auto=compress&cs=tinysrgb&w=400'}" class="h-full w-full object-contain p-2" />
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
              <span class="text-primary-gold">${formatPrice(total + shipping)}</span>
            </div>
          </div>
        </div>
      </div>

      <div id="order-success" class="mx-auto hidden max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div id="success-icon-container">
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.5" class="mx-auto mb-6">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h2 id="success-title" class="text-3xl font-black uppercase tracking-[0.05em] text-zinc-950">Đặt Hàng Thành Công</h2>
        <p id="success-desc" class="mt-4 text-sm leading-7 text-zinc-600">Cảm ơn bạn đã mua sắm tại <strong>Venix Watch</strong>.</p>
        <p id="order-id-display" class="mt-2 text-sm text-zinc-500"></p>
        
        <!-- Timer -->
        <div id="payment-timer-container" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-2xl inline-flex items-center gap-2 text-red-600 font-semibold text-sm hidden">
          <svg class="animate-pulse" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>Thời gian thanh toán còn lại: <span id="payment-countdown">05:00</span></span>
        </div>

        <div id="payment-instructions-wrap" class="mt-8 text-left hidden"></div>

        <!-- Simulated QR Payment Verification Status Area -->
        <div id="payment-sim-status-container" class="mt-8 p-6 bg-zinc-50 border border-zinc-200 rounded-2xl text-center hidden">
          <div class="flex items-center justify-center gap-3 text-sm font-semibold text-zinc-700">
            <svg id="payment-sim-spinner" class="animate-spin h-5 w-5 text-primary-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span id="payment-sim-status-text">Đang chờ quét mã thanh toán...</span>
          </div>
          <button id="payment-sim-confirm-btn" class="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-primary-gold px-6 text-xs font-bold uppercase tracking-wider text-zinc-950 transition hover:bg-primary-gold/80">
            Tôi đã chuyển khoản thành công
          </button>
        </div>

        <button id="success-home-btn" class="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-zinc-950 px-8 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-primary-gold hover:text-zinc-950">
          Về Trang Chủ
        </button>
      </div>
    `;

    this._bindEvents(wrap, items, total, shipping);
    return wrap;
  }

  _field(label, type, id, placeholder, required = false, value = '') {
    return `
      <div class="mb-4">
        <label for="${id}" class="mb-2 block text-xs font-bold uppercase tracking-[0.05em] text-zinc-700">${label}</label>
        <input type="${type}" id="${id}" placeholder="${placeholder}" ${required ? 'required' : ''} value="${value}"
          class="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none transition focus:border-primary-gold" />
      </div>
    `;
  }

  _bindEvents(wrap, items, total, shipping) {
    wrap.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.addEventListener('click', () => navigate(btn.dataset.nav));
    });

    wrap.querySelector('#checkout-login-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.setItem('dhat_post_login_redirect', '/thanh-toan');
      navigate('/tai-khoan?tab=login');
    });

    const initDivisions = async () => {
      const citySelect = wrap.querySelector('#cust-city');
      const districtSelect = wrap.querySelector('#cust-district');
      const wardSelect = wrap.querySelector('#cust-ward');

      if (!citySelect || !districtSelect || !wardSelect) return;

      const fallbackProvinces = [
        { name: 'Thành phố Hồ Chí Minh', code: 79 },
        { name: 'Thành phố Hà Nội', code: 1 },
        { name: 'Thành phố Đà Nẵng', code: 48 },
        { name: 'Thành phố Hải Phòng', code: 31 },
        { name: 'Thành phố Cần Thơ', code: 92 }
      ];

      try {
        const res = await fetch('https://provinces.open-api.vn/api/p/');
        if (!res.ok) throw new Error('API error');
        const provinces = await res.json();
        
        citySelect.innerHTML = '<option value="">Chọn Tỉnh / Thành Phố</option>' + 
          provinces.map(p => `<option value="${p.name}" data-code="${p.code}">${p.name}</option>`).join('');
      } catch (err) {
        console.warn('Failed to fetch provinces from API, using fallback:', err);
        citySelect.innerHTML = '<option value="">Chọn Tỉnh / Thành Phố</option>' + 
          fallbackProvinces.map(p => `<option value="${p.name}" data-code="${p.code}">${p.name}</option>`).join('');
      }

      citySelect.addEventListener('change', async () => {
        const selected = citySelect.options[citySelect.selectedIndex];
        const code = selected?.getAttribute('data-code');

        districtSelect.innerHTML = '<option value="">Chọn Quận / Huyện</option>';
        districtSelect.disabled = true;
        wardSelect.innerHTML = '<option value="">Chọn Phường / Xã</option>';
        wardSelect.disabled = true;

        if (!code) return;

        try {
          const res = await fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`);
          if (!res.ok) throw new Error('API error');
          const data = await res.json();
          const districts = data.districts || [];
          
          districtSelect.innerHTML = '<option value="">Chọn Quận / Huyện</option>' + 
            districts.map(d => `<option value="${d.name}" data-code="${d.code}">${d.name}</option>`).join('');
          districtSelect.disabled = false;
        } catch (err) {
          console.error('Failed to fetch districts:', err);
        }
      });

      districtSelect.addEventListener('change', async () => {
        const selected = districtSelect.options[districtSelect.selectedIndex];
        const code = selected?.getAttribute('data-code');

        wardSelect.innerHTML = '<option value="">Chọn Phường / Xã</option>';
        wardSelect.disabled = true;

        if (!code) return;

        try {
          const res = await fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`);
          if (!res.ok) throw new Error('API error');
          const data = await res.json();
          const wards = data.wards || [];
          
          wardSelect.innerHTML = '<option value="">Chọn Phường / Xã</option>' + 
            wards.map(w => `<option value="${w.name}" data-code="${w.code}">${w.name}</option>`).join('');
          wardSelect.disabled = false;
        } catch (err) {
          console.error('Failed to fetch wards:', err);
        }
      });
    };

    initDivisions();

    // Check if there is saved info to restore
    const savedInfoRaw = sessionStorage.getItem('checkout_backup_info');
    if (savedInfoRaw) {
      try {
        const info = JSON.parse(savedInfoRaw);
        const setVal = (id, val) => {
          const el = wrap.querySelector(`#${id}`);
          if (el && val !== undefined) el.value = val;
        };
        setVal('cust-name', info.name);
        setVal('cust-phone', info.phone);
        setVal('cust-email', info.email);
        setVal('cust-address', info.address);
        setVal('cust-note', info.note);
        
        if (info.payment_method) {
          const rad = wrap.querySelector(`input[name="payment_method"][value="${info.payment_method}"]`);
          if (rad) rad.checked = true;
        }
        
        // Restore dynamic city, district, ward
        setTimeout(async () => {
          const citySelect = wrap.querySelector('#cust-city');
          const districtSelect = wrap.querySelector('#cust-district');
          const wardSelect = wrap.querySelector('#cust-ward');
          
          if (citySelect && info.city) {
            citySelect.value = info.city;
            citySelect.dispatchEvent(new Event('change'));
            
            await new Promise(r => setTimeout(r, 450));
            if (districtSelect && info.district) {
              districtSelect.value = info.district;
              districtSelect.dispatchEvent(new Event('change'));
              
              await new Promise(r => setTimeout(r, 450));
              if (wardSelect && info.ward) {
                wardSelect.value = info.ward;
              }
            }
          }
        }, 800);
      } catch (e) {
        console.warn('Failed to restore checkout info backup:', e);
      }
    }

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
      const ward = get('cust-ward');
      const errEl = wrap.querySelector('#checkout-error');

      if (!name || !phone || !address || !city || !district || !ward) {
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
          shipping_address: ward ? `${address}, ${ward}, ${district}, ${city}` : `${address}, ${district}, ${city}`,
          note: get('cust-note'),
          payment_method: paymentMethod,
        items: items.map((item) => ({ product_id: item.id, quantity: item.qty, price: item.sale_price || item.price })),
          total: total + shipping,
        };

        const res = await createOrder(orderData);
        
        // Save backups to sessionStorage
        const backupInfo = {
          name: name,
          phone: phone,
          email: get('cust-email'),
          address: address,
          city: city,
          district: district,
          ward: ward,
          note: get('cust-note'),
          payment_method: paymentMethod
        };
        sessionStorage.setItem('checkout_backup_info', JSON.stringify(backupInfo));
        sessionStorage.setItem('checkout_backup_cart', JSON.stringify(items));
        
        this._showingSuccess = true;
        this._paymentCompleted = (paymentMethod === 'cod');

        cartService.clearCart();
        wrap.querySelector('#checkout-grid').style.display = 'none';
        const successEl = wrap.querySelector('#order-success');
        successEl.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const orderIdEl = wrap.querySelector('#order-id-display');
        const orderId = res?.order_id || res?.data?.id;
        if (orderIdEl && orderId) orderIdEl.textContent = `Mã đơn hàng: #${orderId}`;

        const successTitleEl = wrap.querySelector('#success-title');
        const successDescEl = wrap.querySelector('#success-desc');
        const successIconEl = wrap.querySelector('#success-icon-container');
        const simStatusContainer = wrap.querySelector('#payment-sim-status-container');
        const homeBtn = wrap.querySelector('#success-home-btn');

        if (paymentMethod === 'cod') {
          if (successTitleEl) successTitleEl.textContent = 'Đặt Hàng Thành Công';
          if (successDescEl) successDescEl.innerHTML = 'Cảm ơn bạn đã mua sắm tại <strong>Venix Watch</strong>.';
          if (successIconEl) {
            successIconEl.innerHTML = `
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.5" class="mx-auto mb-6">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            `;
          }
          simStatusContainer?.classList.add('hidden');
          homeBtn?.classList.remove('hidden');
        } else {
          if (successTitleEl) successTitleEl.textContent = 'Thanh Toán Đơn Hàng';
          if (successDescEl) successDescEl.innerHTML = 'Đơn hàng của bạn đã được khởi tạo. Vui lòng quét mã QR dưới đây để hoàn tất thanh toán.';
          if (successIconEl) {
            successIconEl.innerHTML = `
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#C9A961" stroke-width="1.5" class="mx-auto mb-6 animate-pulse">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path stroke-linecap="round" d="M7 7h2v2H7zM7 15h2v2H7zM15 7h2v2h-2zM15 15h2v2h-2zM11 11h2v2h-2z" />
              </svg>
            `;
          }
          simStatusContainer?.classList.remove('hidden');
          homeBtn?.classList.add('hidden');

          const simStatusText = wrap.querySelector('#payment-sim-status-text');
          const simSpinner = wrap.querySelector('#payment-sim-spinner');
          const simConfirmBtn = wrap.querySelector('#payment-sim-confirm-btn');
          
          if (simStatusText) simStatusText.textContent = 'Đang chờ quét mã thanh toán...';
          simSpinner?.classList.remove('hidden');
          if (simConfirmBtn) {
            simConfirmBtn.disabled = false;
            simConfirmBtn.classList.remove('opacity-50', 'cursor-not-allowed');
          }

          const simulateSuccess = () => {
            if (this._paymentCompleted) return;
            
            if (simConfirmBtn) {
              simConfirmBtn.disabled = true;
              simConfirmBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
            if (simStatusText) simStatusText.textContent = 'Đang xác thực giao dịch...';
            simSpinner?.classList.remove('hidden');
            
            if (this._simAutoTimeout) clearTimeout(this._simAutoTimeout);

            setTimeout(() => {
              this._paymentCompleted = true;
              sessionStorage.removeItem('checkout_backup_info');
              sessionStorage.removeItem('checkout_backup_cart');
              
              if (this._timerInterval) {
                clearInterval(this._timerInterval);
              }
              
              wrap.querySelector('#payment-timer-container')?.classList.add('hidden');
              wrap.querySelector('#payment-instructions-wrap')?.classList.add('hidden');
              simStatusContainer?.classList.add('hidden');
              homeBtn?.classList.remove('hidden');
              
              if (successTitleEl) successTitleEl.textContent = 'Thanh Toán Thành Công';
              if (successDescEl) successDescEl.innerHTML = 'Giao dịch đã được xác nhận! Cảm ơn bạn đã mua sắm tại <strong>Venix Watch</strong>.';
              if (successIconEl) {
                successIconEl.innerHTML = `
                  <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" class="mx-auto mb-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                `;
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 1800);
          };

          this._simAutoTimeout = setTimeout(simulateSuccess, 15000);

          if (simConfirmBtn) {
            simConfirmBtn.onclick = (evt) => {
              evt.preventDefault();
              simulateSuccess();
            };
          }
        }

        // Bind home button
        homeBtn?.addEventListener('click', (e) => {
          e.preventDefault();
          this._paymentCompleted = true;
          sessionStorage.removeItem('checkout_backup_info');
          sessionStorage.removeItem('checkout_backup_cart');
          if (this._timerInterval) {
            clearInterval(this._timerInterval);
          }
          if (this._simAutoTimeout) {
            clearTimeout(this._simAutoTimeout);
          }
          navigate('/');
        });

        if (paymentMethod !== 'cod') {
          // Start countdown timer
          const timerContainer = wrap.querySelector('#payment-timer-container');
          const countdownVal = wrap.querySelector('#payment-countdown');
          if (timerContainer && countdownVal) {
            timerContainer.classList.remove('hidden');
            let timeLeft = 300; // 5 minutes in seconds
            
            const updateCountdown = () => {
              const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
              const s = (timeLeft % 60).toString().padStart(2, '0');
              countdownVal.textContent = `${m}:${s}`;
            };
            
            updateCountdown();
            
            this._timerInterval = setInterval(() => {
              timeLeft--;
              if (timeLeft <= 0) {
                clearInterval(this._timerInterval);
                this._handlePaymentFailure(wrap, 'Hết thời gian hiển thị mã QR. Thanh toán không thành công!');
              } else {
                updateCountdown();
              }
            }, 1000);
          }

          const payWrap = wrap.querySelector('#payment-instructions-wrap');
          if (payWrap) {
            const formattedTotal = formatPrice(total + shipping);
            const footer = window.APP_SETTINGS?.footer_settings || {};
            const bankNameRaw = footer.bank_name || 'Ngân hàng TMCP Kỹ Thương Việt Nam';
            const bankAccount = footer.bank_account || '8826882699';
            const bankOwner = footer.bank_owner || 'VND-TGTT-CTTNHH THUONG MAI VA XNK LIK';
            const cleanBankAccount = bankAccount.replace(/\s+/g, '');
            
            // Parse shortcode if bank_name is in "Name | SHORTCODE" format
            let bankShortcode = '';
            let bankName = bankNameRaw;
            if (bankNameRaw.includes('|')) {
              const parts = bankNameRaw.split('|');
              bankName = parts[0].trim();
              bankShortcode = parts[1].trim();
            }

            if (!bankShortcode) {
              // Map common bank names to shortcodes for VietQR
              const lowerBank = bankName.toLowerCase();
              if (lowerBank.includes('vietcom') || lowerBank.includes('vcb')) bankShortcode = 'VCB';
              else if (lowerBank.includes('techcom') || lowerBank.includes('kỹ thương') || lowerBank.includes('tcb')) bankShortcode = 'TCB';
              else if (lowerBank.includes('vietin') || lowerBank.includes('ctg')) bankShortcode = 'CTG';
              else if (lowerBank.includes('bidv')) bankShortcode = 'BIDV';
              else if (lowerBank.includes('agri') || lowerBank.includes('vba')) bankShortcode = 'VBA';
              else if (lowerBank.includes('acb')) bankShortcode = 'ACB';
              else if (lowerBank.includes('sacom') || lowerBank.includes('stb')) bankShortcode = 'STB';
              else if (lowerBank.includes('tp') || lowerBank.includes('tpb')) bankShortcode = 'TPB';
              else if (lowerBank.includes('vp') || lowerBank.includes('vpb')) bankShortcode = 'VPB';
              else if (lowerBank.includes('mbb') || lowerBank.includes('mb bank') || lowerBank === 'mb') bankShortcode = 'MB';
              else {
                bankShortcode = bankName.replace(/\s+/g, '');
              }
            }

            let paymentHtml = '';

            if (paymentMethod === 'bank') {
              const qrUrl = `https://img.vietqr.io/image/${bankShortcode}-${cleanBankAccount}-compact2.png?amount=${total + shipping}&addInfo=VenixWatch%20${orderId}&accountName=${encodeURIComponent(bankOwner)}`;
              paymentHtml = `
                <div class="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm">
                  <div class="flex flex-col md:flex-row gap-6 items-center">
                    <div class="shrink-0 text-center">
                      <p class="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Quét mã chuyển khoản</p>
                      <div class="bg-white p-3 rounded-2xl border border-zinc-200 inline-block shadow-sm">
                        <img src="${qrUrl}" alt="VietQR Venix Watch" class="w-48 h-48 object-contain" />
                      </div>
                      <p class="text-[10px] text-zinc-500 mt-2">Sử dụng ứng dụng ngân hàng để quét</p>
                    </div>
                    <div class="flex-1 space-y-4">
                      <div class="flex items-center gap-2 border-b border-zinc-200 pb-2">
                        <span class="w-1.5 h-3 bg-[#C9A961] rounded-full"></span>
                        <h4 class="text-sm font-black uppercase tracking-[0.05em] text-zinc-950">Thông tin chuyển khoản</h4>
                      </div>
                      <div class="text-sm space-y-2 text-zinc-700">
                        <p><strong class="text-zinc-950">Ngân hàng:</strong> ${bankName}</p>
                        <p><strong class="text-zinc-950">Số tài khoản:</strong> ${bankAccount}</p>
                        <p><strong class="text-zinc-950">Chủ tài khoản:</strong> ${bankOwner}</p>
                        <p><strong class="text-zinc-950">Số tiền:</strong> <span class="font-bold text-red-600 text-base">${formattedTotal}</span></p>
                        <p><strong class="text-zinc-950">Nội dung chuyển khoản:</strong> <span class="font-bold text-zinc-950 bg-yellow-100 px-2 py-0.5 rounded font-mono">VenixWatch ${orderId}</span></p>
                      </div>
                      <div class="bg-[#C9A961]/10 rounded-xl p-3 border border-[#C9A961]/30 text-xs text-zinc-700 leading-relaxed">
                        💡 Đơn hàng của bạn sẽ được kích hoạt xử lý ngay lập tức sau khi hệ thống nhận được tiền chuyển khoản thành công.
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }

            payWrap.innerHTML = paymentHtml;
            payWrap.classList.remove('hidden');
          }
        }
      } catch (err) {
        errEl.textContent = err.message || 'Đặt hàng thất bại. Vui lòng thử lại.';
        errEl.classList.remove('hidden');
        btn.textContent = 'Đặt Hàng Ngay';
        btn.disabled = false;
      }

      this._submitting = false;
    });
  }

  _showCustomAlert(title, message, callback) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm transition-opacity duration-300 opacity-0';
    modal.id = 'dynamic-custom-alert';
    modal.innerHTML = `
      <div class="relative w-full max-w-sm scale-95 transform rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl transition-all duration-300 mx-4">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 mb-4">
          <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="animate-bounce">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="text-center text-base font-black uppercase tracking-wider text-zinc-950">${title}</h3>
        <p class="mt-3 text-center text-sm leading-relaxed text-zinc-600">${message}</p>
        <div class="mt-6">
          <button id="dynamic-alert-close-btn" class="flex h-11 w-full items-center justify-center rounded-xl bg-zinc-950 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-primary-gold hover:text-zinc-950 shadow-md">
            Xác Nhận
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Trigger transition
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      const inner = modal.querySelector('div');
      if (inner) {
        inner.classList.remove('scale-95');
        inner.classList.add('scale-100');
      }
    }, 10);
    
    const closeBtn = modal.querySelector('#dynamic-alert-close-btn');
    const closeModal = () => {
      modal.classList.add('opacity-0');
      const inner = modal.querySelector('div');
      if (inner) {
        inner.classList.remove('scale-100');
        inner.classList.add('scale-95');
      }
      setTimeout(() => {
        modal.remove();
        if (typeof callback === 'function') callback();
      }, 300);
    };
    
    closeBtn?.addEventListener('click', closeModal);
  }

  _handlePaymentFailure(wrap, message) {
    this._paymentCompleted = true; // prevent double trigger
    this._showingSuccess = false;
    
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
    }
    if (this._simAutoTimeout) {
      clearTimeout(this._simAutoTimeout);
    }
    
    // Restore cart items
    const backupCart = sessionStorage.getItem('checkout_backup_cart');
    if (backupCart) {
      localStorage.setItem('dhat_cart', backupCart);
      window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items: JSON.parse(backupCart) } }));
    }
    
    this._showCustomAlert('Thanh Toán Thất Bại', message, () => {
      // Go back to checkout input form grid
      const checkoutGrid = wrap.querySelector('#checkout-grid');
      const successEl = wrap.querySelector('#order-success');
      if (checkoutGrid && successEl) {
        checkoutGrid.style.display = 'grid';
        successEl.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Reset submit button state
        const btn = wrap.querySelector('#place-order-btn');
        if (btn) {
          btn.textContent = 'Đặt Hàng Ngay';
          btn.disabled = false;
        }
      }
    });
  }

  destroy() {
    if (this._beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this._beforeUnloadHandler);
    }
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
    }
    if (this._simAutoTimeout) {
      clearTimeout(this._simAutoTimeout);
    }
    
    if (this._showingSuccess && !this._paymentCompleted) {
      const backupCart = sessionStorage.getItem('checkout_backup_cart');
      if (backupCart) {
        localStorage.setItem('dhat_cart', backupCart);
        window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items: JSON.parse(backupCart) } }));
      }
      this._showCustomAlert('Thanh Toán Chưa Hoàn Tất', 'Giao dịch thanh toán chưa được xác nhận. Giỏ hàng của bạn đã được khôi phục.');
    }
  }
}
