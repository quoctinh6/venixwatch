import { getUser, isLoggedIn, login, logout, register } from '../../services/authService.js';
import { getOrders } from '../../services/orderService.js';
import { POST_LOGIN_KEY } from '../../utils/loginModal.js';
import { formatDate, formatPrice, navigate } from '../../utils/helpers.js';

export default class AccountPage {
  constructor() {
    this._tab = new URLSearchParams(window.location.search).get('tab') === 'register' ? 'register' : 'login';
    this._wrap = null;
  }

  render() {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'font-family:Montserrat,sans-serif;min-height:60vh;';
    this._wrap = wrap;
    isLoggedIn() ? this._renderDashboard(wrap) : this._renderAuth(wrap);
    this._onAuthChanged = () => isLoggedIn() ? this._renderDashboard(wrap) : this._renderAuth(wrap);
    window.addEventListener('auth-changed', this._onAuthChanged, { once: true });
    return wrap;
  }

  _renderAuth(wrap) {
    wrap.innerHTML = `
      <div style="max-width:480px;margin:64px auto;padding:0 16px;">
        <div style="display:flex;border-bottom:2px solid #e8e8e8;margin-bottom:36px;">
          <button id="tab-login" style="flex:1;padding:14px;background:none;border:none;font-size:12px;font-weight:800;letter-spacing:1.2px;cursor:pointer;font-family:Montserrat,sans-serif;">ĐĂNG NHẬP</button>
          <button id="tab-register" style="flex:1;padding:14px;background:none;border:none;font-size:12px;font-weight:800;letter-spacing:1.2px;cursor:pointer;font-family:Montserrat,sans-serif;">ĐĂNG KÝ</button>
        </div>
        <div id="auth-form-wrap"></div>
      </div>`;

    const setTab = (tab) => {
      this._tab = tab;
      wrap.querySelector('#tab-login').style.cssText = `flex:1;padding:14px;background:none;border:none;font-size:12px;font-weight:800;letter-spacing:1.2px;cursor:pointer;font-family:Montserrat,sans-serif;border-bottom:2px solid ${tab === 'login' ? '#1a1a1a' : 'transparent'};color:${tab === 'login' ? '#1a1a1a' : '#aaa'};`;
      wrap.querySelector('#tab-register').style.cssText = `flex:1;padding:14px;background:none;border:none;font-size:12px;font-weight:800;letter-spacing:1.2px;cursor:pointer;font-family:Montserrat,sans-serif;border-bottom:2px solid ${tab === 'register' ? '#1a1a1a' : 'transparent'};color:${tab === 'register' ? '#1a1a1a' : '#aaa'};`;
      tab === 'login' ? this._renderLoginForm(wrap.querySelector('#auth-form-wrap')) : this._renderRegisterForm(wrap.querySelector('#auth-form-wrap'));
    };

    wrap.querySelector('#tab-login').addEventListener('click', () => setTab('login'));
    wrap.querySelector('#tab-register').addEventListener('click', () => setTab('register'));
    setTab(this._tab);
  }

  _field(label, type, id, placeholder, required = false) {
    if (type === 'password') {
      return `
        <div style="margin-bottom:16px;">
          <label for="${id}" style="display:block;font-size:11px;font-weight:700;letter-spacing:0.5px;margin-bottom:6px;text-transform:uppercase;">${label}</label>
          <div style="position:relative;width:100%;">
            <input type="${type}" id="${id}" placeholder="${placeholder}" ${required ? 'required' : ''} style="width:100%;padding:12px 42px 12px 12px;border:1.5px solid #e8e8e8;font-size:13px;font-family:Montserrat,sans-serif;outline:none;" />
            <button type="button" class="pw-toggle" data-target="${id}" style="position:absolute;right:0;top:0;bottom:0;width:42px;background:none;border:none;cursor:pointer;padding:0;color:#9ca3af;display:flex;align-items:center;justify-content:center;outline:none;" title="Xem mật khẩu">
              <svg class="eye-open" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg class="eye-close" style="display:none;" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </button>
          </div>
        </div>`;
    }
    return `<div style="margin-bottom:16px;"><label for="${id}" style="display:block;font-size:11px;font-weight:700;letter-spacing:0.5px;margin-bottom:6px;text-transform:uppercase;">${label}</label><input type="${type}" id="${id}" placeholder="${placeholder}" ${required ? 'required' : ''} style="width:100%;padding:12px;border:1.5px solid #e8e8e8;font-size:13px;font-family:Montserrat,sans-serif;outline:none;" /></div>`;
  }

  _bindPwToggles(container) {
    container.querySelectorAll('.pw-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const input = container.querySelector(`#${targetId}`);
        if (!input) return;

        const isPw = input.type === 'password';
        input.type = isPw ? 'text' : 'password';

        const openIcon = btn.querySelector('.eye-open');
        const closeIcon = btn.querySelector('.eye-close');
        if (isPw) {
          openIcon.style.display = 'none';
          closeIcon.style.display = 'block';
        } else {
          openIcon.style.display = 'block';
          closeIcon.style.display = 'none';
        }
      });
    });
  }

  _renderLoginForm(container) {
    container.innerHTML = `<form id="login-form">${this._field('Email *', 'email', 'login-email', 'email@example.com', true)}${this._field('Mật Khẩu *', 'password', 'login-pass', '••••••••', true)}<p id="login-error" style="color:#c0392b;font-size:12px;margin-bottom:12px;display:none;"></p><button type="submit" style="width:100%;padding:15px;background:#1a1a1a;color:#fff;border:none;font-size:12px;font-weight:800;letter-spacing:1.4px;cursor:pointer;font-family:Montserrat,sans-serif;">ĐĂNG NHẬP</button></form>`;
    this._bindPwToggles(container);
    container.querySelector('#login-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = container.querySelector('#login-email').value.trim();
      const pass = container.querySelector('#login-pass').value;
      const error = container.querySelector('#login-error');
      const submit = container.querySelector('button[type="submit"]');
      error.style.display = 'none';
      submit.disabled = true;
      submit.textContent = 'ĐANG ĐĂNG NHẬP...';
      try {
        await login(email, pass);
        this._finishAuthRedirect();
        this._renderDashboard(this._wrap);
      } catch (err) {
        error.textContent = err.message || 'Email hoặc mật khẩu không đúng.';
        error.style.display = 'block';
        submit.disabled = false;
        submit.textContent = 'ĐĂNG NHẬP';
      }
    });
  }

  _renderRegisterForm(container) {
    container.innerHTML = `<form id="register-form">${this._field('Họ và Tên *', 'text', 'reg-name', 'Nguyễn Văn A', true)}${this._field('Email *', 'email', 'reg-email', 'email@example.com', true)}${this._field('Số Điện Thoại', 'tel', 'reg-phone', '09xx xxx xxx')}${this._field('Mật Khẩu *', 'password', 'reg-pass', 'Tối thiểu 8 ký tự', true)}${this._field('Xác Nhận Mật Khẩu *', 'password', 'reg-pass2', 'Nhập lại mật khẩu', true)}<p id="reg-error" style="color:#c0392b;font-size:12px;margin-bottom:12px;display:none;"></p><button type="submit" style="width:100%;padding:15px;background:#C9A84C;color:#1a1a1a;border:none;font-size:12px;font-weight:800;letter-spacing:1.4px;cursor:pointer;font-family:Montserrat,sans-serif;">TẠO TÀI KHOẢN</button></form>`;
    this._bindPwToggles(container);
    container.querySelector('#register-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = {
        name: container.querySelector('#reg-name').value.trim(),
        email: container.querySelector('#reg-email').value.trim(),
        phone: container.querySelector('#reg-phone').value.trim(),
        password: container.querySelector('#reg-pass').value,
      };
      const pass2 = container.querySelector('#reg-pass2').value;
      const error = container.querySelector('#reg-error');
      const submit = container.querySelector('button[type="submit"]');
      error.style.display = 'none';
      if (!payload.name || !payload.email || !payload.password) return this._showError(error, 'Vui lòng điền đầy đủ thông tin.');
      if (payload.password.length < 8) return this._showError(error, 'Mật khẩu phải có ít nhất 8 ký tự.');
      if (payload.password !== pass2) return this._showError(error, 'Mật khẩu xác nhận không khớp.');
      submit.disabled = true;
      submit.textContent = 'ĐANG XỬ LÝ...';
      try {
        await register(payload);
        this._finishAuthRedirect();
        this._renderDashboard(this._wrap);
      } catch (err) {
        this._showError(error, err.message || 'Đăng ký thất bại.');
        submit.disabled = false;
        submit.textContent = 'TẠO TÀI KHOẢN';
      }
    });
  }

  async _renderDashboard(wrap) {
    const user = getUser();
    wrap.innerHTML = `
      <div style="max-width:1280px;margin:0 auto;padding:48px 40px;">
        <div id="dash-grid" style="display:grid;grid-template-columns:240px 1fr;gap:40px;align-items:start;">
          <div style="border:1px solid #e8e8e8;padding:24px;">
            <div style="text-align:center;padding-bottom:20px;border-bottom:1px solid #e8e8e8;margin-bottom:20px;">
              <div style="width:64px;height:64px;background:#f8f8f8;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:#C9A84C;">${(user?.name || 'U')[0].toUpperCase()}</div>
              <p style="font-size:14px;font-weight:700;margin:0 0 4px;">${user?.name || 'Khách'}</p>
              <p style="font-size:12px;color:#888;margin:0;">${user?.email || ''}</p>
            </div>
            <button id="dash-orders" style="display:block;width:100%;text-align:left;padding:10px 12px;background:none;border:none;font-size:12px;font-weight:600;cursor:pointer;">Đơn Hàng Của Tôi</button>
            <button id="dash-profile" style="display:block;width:100%;text-align:left;padding:10px 12px;background:none;border:none;font-size:12px;font-weight:600;cursor:pointer;">Thông Tin Cá Nhân</button>
            <button id="logout-btn" style="display:block;width:100%;text-align:left;padding:10px 12px;background:none;border:none;font-size:12px;font-weight:600;cursor:pointer;color:#c0392b;border-top:1px solid #e8e8e8;margin-top:16px;padding-top:16px;">Đăng Xuất</button>
          </div>
          <div id="dashboard-content"><div style="display:flex;justify-content:center;padding:40px;"><div class="spinner"></div></div></div>
        </div>
      </div>
      <style>@media (max-width:768px){#dash-grid{grid-template-columns:1fr !important;padding:24px 16px !important;}}</style>`;
    wrap.querySelector('#logout-btn').addEventListener('click', () => { logout(); this._renderAuth(wrap); });
    wrap.querySelector('#dash-orders').addEventListener('click', () => this._renderOrders(wrap.querySelector('#dashboard-content')));
    wrap.querySelector('#dash-profile').addEventListener('click', () => this._renderProfile(wrap.querySelector('#dashboard-content'), user));
    this._renderOrders(wrap.querySelector('#dashboard-content'));
  }

  async _renderOrders(container) {
    container.innerHTML = `<div style="display:flex;justify-content:center;padding:40px;"><div class="spinner"></div></div>`;
    let orders = [];
    try {
      const res = await getOrders();
      orders = Array.isArray(res) ? res : (res.data || res.orders || []);
    } catch {}
    if (!orders.length) {
      container.innerHTML = `<h2 style="font-size:18px;font-weight:700;margin:0 0 24px;">ĐƠN HÀNG CỦA TÔI</h2><p style="color:#888;font-size:14px;">Bạn chưa có đơn hàng nào.</p><button style="margin-top:16px;padding:12px 32px;background:#1a1a1a;color:#fff;border:none;font-size:11px;font-weight:700;letter-spacing:1.2px;cursor:pointer;font-family:Montserrat,sans-serif;" onclick="navigate('/nam')">MUA SẮM NGAY</button>`;
      return;
    }

    container.innerHTML = `<h2 style="font-size:18px;font-weight:700;margin:0 0 24px;">ĐƠN HÀNG CỦA TÔI</h2><table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="border-bottom:2px solid #1a1a1a;"><th style="text-align:left;padding:10px;">Mã ĐH</th><th style="text-align:left;padding:10px;">Ngày</th><th style="text-align:left;padding:10px;">Tổng Tiền</th><th style="text-align:left;padding:10px;">Trạng Thái</th></tr></thead><tbody>${orders.map((o) => `<tr style="border-bottom:1px solid #f5f5f5;"><td style="padding:12px 10px;font-weight:600;">#${o.id || o.order_id}</td><td style="padding:12px 10px;color:#555;">${formatDate(o.created_at)}</td><td style="padding:12px 10px;font-weight:700;color:#C9A84C;">${formatPrice(o.total || o.total_amount || 0)}</td><td style="padding:12px 10px;">${o.status || '—'}</td></tr>`).join('')}</tbody></table>`;
  }

  _renderProfile(container, user) {
    container.innerHTML = `<h2 style="font-size:18px;font-weight:700;margin:0 0 24px;">THÔNG TIN CÁ NHÂN</h2><p style="font-size:13px;color:#555;margin:0 0 6px;"><strong>Họ tên:</strong> ${user?.name || '—'}</p><p style="font-size:13px;color:#555;margin:0 0 6px;"><strong>Email:</strong> ${user?.email || '—'}</p><p style="font-size:13px;color:#555;margin:0;"><strong>Điện thoại:</strong> ${user?.phone || '—'}</p>`;
  }

  _showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
  }

  _finishAuthRedirect() {
    const redirect = localStorage.getItem(POST_LOGIN_KEY);
    if (!redirect) return;
    localStorage.removeItem(POST_LOGIN_KEY);
    navigate(redirect);
  }

  destroy() {
    if (this._onAuthChanged) {
      window.removeEventListener('auth-changed', this._onAuthChanged);
      this._onAuthChanged = null;
    }
  }
}
