import { getUser, isLoggedIn, login, logout, register } from '../../services/authService.js';
import { getOrders } from '../../services/orderService.js';
import { POST_LOGIN_KEY } from '../../utils/loginModal.js';
import { formatDate, formatPrice, navigate } from '../../utils/helpers.js';
import { API_BASE, resolveImageUrl } from '../../services/config.js';
import { cartService } from '../../services/cartService.js';

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
      container.innerHTML = `
        <h2 style="font-size:18px;font-weight:700;margin:0 0 24px;">ĐƠN HÀNG CỦA TÔI</h2>
        <p style="color:#888;font-size:14px;margin-bottom:16px;">Bạn chưa có đơn hàng nào.</p>
        <button id="shop-now-btn" class="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-8 text-xs font-bold uppercase tracking-[0.12em] text-white transition-all hover:bg-primary-gold hover:text-zinc-950 shadow-md">
          MUA SẮM NGAY
        </button>
      `;
      container.querySelector('#shop-now-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        navigate('/nam');
      });
      return;
    }

    container.innerHTML = `
      <h2 style="font-size:18px;font-weight:700;margin:0 0 24px;">ĐƠN HÀNG CỦA TÔI</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="border-bottom:2px solid #1a1a1a;">
            <th style="text-align:left;padding:10px;">Mã ĐH</th>
            <th style="text-align:left;padding:10px;">Ngày</th>
            <th style="text-align:left;padding:10px;">Tổng Tiền</th>
            <th style="text-align:left;padding:10px;">Trạng Thái</th>
            <th style="text-align:right;padding:10px;">Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map((o) => {
            const statusColors = {
              pending: '#f59e0b',
              processing: '#3b82f6',
              shipping: '#8b5cf6',
              completed: '#10b981',
              cancelled: '#ef4444'
            };
            const statusText = {
              pending: 'Chờ xác nhận',
              processing: 'Đang xử lý',
              shipping: 'Đang giao',
              completed: 'Đã hoàn thành',
              cancelled: 'Đã hủy'
            };
            const statusLabel = statusText[o.status] || o.status || '—';
            const color = statusColors[o.status] || '#555';
            
            return `
              <tr style="border-bottom:1px solid #f5f5f5;">
                <td style="padding:12px 10px;font-weight:600;">#${o.id || o.order_id}</td>
                <td style="padding:12px 10px;color:#555;">${formatDate(o.created_at)}</td>
                <td style="padding:12px 10px;font-weight:700;color:#C9A84C;">${formatPrice(o.total || o.total_amount || 0)}</td>
                <td style="padding:12px 10px;font-weight:600;color:${color};">${statusLabel}</td>
                <td style="padding:12px 10px;text-align:right;">
                  <button class="toggle-detail-btn" data-order-id="${o.id}" style="background:none;border:none;color:#C9A84C;font-size:12px;font-weight:700;cursor:pointer;outline:none;">Xem chi tiết</button>
                </td>
              </tr>
              <tr id="detail-row-${o.id}" style="display:none;background:#fcfbf9;border-bottom:1px solid #f5f5f5;">
                <td colspan="5" style="padding:20px 15px;">
                  <div style="border-bottom:1px solid #eee;padding-bottom:12px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                    <span style="font-size:12px;color:#666;"><strong>Phương thức thanh toán:</strong> ${
                      o.payment_method === 'cod' ? 'COD (Thanh toán khi nhận hàng)' :
                      o.payment_method === 'bank' ? 'Chuyển khoản ngân hàng' :
                      o.payment_method === 'momo' ? 'Ví MoMo' : o.payment_method || 'Chưa xác định'
                    }</span>
                  </div>
                  <div class="order-items-list" style="display:flex;flex-direction:column;gap:15px;">
                    ${(o.items || []).map((item, idx, arr) => {
                      const isLast = idx === arr.length - 1;
                      const borderStyle = isLast ? '' : 'border-bottom:1px dashed #eee;padding-bottom:12px;margin-bottom:12px;';
                      const imgUrl = resolveImageUrl(item.product_images?.[0]) || 'https://images.pexels.com/photos/236915/pexels-photo-236915.jpeg?auto=compress&cs=tinysrgb&w=400';
                      return `
                        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:15px;${borderStyle}">
                          <div style="display:flex;align-items:center;gap:15px;">
                            <div style="width:50px;height:50px;border:1px solid #eee;background:#fff;border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:4px;flex-shrink:0;">
                              <img src="${imgUrl}" style="max-width:100%;max-height:100%;object-fit:contain;" />
                            </div>
                            <div>
                              <a href="/san-pham/${item.product_slug}" class="dd-link" style="text-decoration:none;color:#1a1a1a;font-weight:600;font-size:13px;">${item.product_name}</a>
                              <p style="margin:4px 0 0;font-size:11px;color:#777;">Số lượng: ${item.quantity} × ${formatPrice(item.product_price)}</p>
                            </div>
                          </div>
                          <div style="display:flex;align-items:center;gap:10px;">
                            <button class="buy-again-btn" data-product-id="${item.product_id}" data-name="${item.product_name}" data-price="${item.product_price}" data-slug="${item.product_slug}" data-image="${item.product_images?.[0] || ''}" style="padding:6px 12px;background:#1a1a1a;color:#fff;border:none;border-radius:4px;font-size:11px;font-weight:700;cursor:pointer;outline:none;">Mua lại</button>
                            ${o.status === 'completed' ? `
                              <button class="review-trigger-btn" data-product-id="${item.product_id}" data-order-id="${o.id}" style="padding:6px 12px;background:none;border:1px solid #ccc;color:#555;border-radius:4px;font-size:11px;font-weight:700;cursor:pointer;outline:none;">Viết đánh giá</button>
                            ` : ''}
                          </div>
                        </div>
                        <div class="review-form-container" id="review-container-${o.id}-${item.product_id}" style="display:none;margin-top:12px;padding:16px;background:#fff;border:1px solid #eee;border-radius:8px;"></div>
                      `;
                    }).join('')}
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    // Dynamic routing link binders for product details
    container.querySelectorAll('.dd-link').forEach((a) => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (href) {
          e.preventDefault();
          navigate(href);
        }
      });
    });

    // Toggle Details Row
    container.querySelectorAll('.toggle-detail-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const orderId = btn.dataset.orderId;
        const detailRow = container.querySelector(`#detail-row-${orderId}`);
        if (detailRow) {
          const isHidden = detailRow.style.display === 'none';
          detailRow.style.display = isHidden ? 'table-row' : 'none';
          btn.textContent = isHidden ? 'Ẩn chi tiết' : 'Xem chi tiết';
        }
      });
    });

    // Buy Again Button Click
    container.querySelectorAll('.buy-again-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const product = {
          id: btn.dataset.productId,
          name: btn.dataset.name,
          slug: btn.dataset.slug,
          price: parseFloat(btn.dataset.price),
          sale_price: null,
          image: btn.dataset.image,
          category_name: ''
        };
        
        cartService.addItem(product, 1);
        
        this._showCustomSuccessAlert('Đã thêm vào giỏ hàng', `Sản phẩm <strong>${product.name}</strong> đã được thêm lại vào giỏ hàng thành công.`, () => {
          navigate('/gio-hang');
        });
      });
    });

    // Review Button Click
    container.querySelectorAll('.review-trigger-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const orderId = btn.dataset.orderId;
        const productId = btn.dataset.productId;
        
        await this._handleReviewTrigger(container, orderId, productId);
      });
    });
  }

  async _handleReviewTrigger(container, orderId, productId) {
    const containerId = `#review-container-${orderId}-${productId}`;
    const reviewFormContainer = container.querySelector(containerId);
    
    if (reviewFormContainer.style.display === 'block') {
      reviewFormContainer.style.display = 'none';
      return;
    }
    
    // Check eligibility
    reviewFormContainer.innerHTML = '<p style="font-size:12px;color:#777;margin:0;">Đang kiểm tra quyền đánh giá...</p>';
    reviewFormContainer.style.display = 'block';
    
    try {
      const token = localStorage.getItem('dhat_auth_token') || localStorage.getItem('dhat_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${API_BASE}/api/reviews/${productId}/can-review`, { headers });
      const resData = await res.json();
      
      const eligibility = resData.data || {};
      if (!eligibility.can_review) {
        let msg = 'Bạn không có quyền đánh giá sản phẩm này.';
        if (eligibility.reason === 'already_reviewed') {
          msg = 'Bạn đã đánh giá sản phẩm này rồi.';
        } else if (eligibility.reason === 'order_not_delivered') {
          msg = 'Đơn hàng chưa được giao thành công.';
        } else if (eligibility.reason === 'review_period_expired') {
          msg = 'Đã quá hạn thời gian đánh giá (90 ngày từ lúc nhận hàng).';
        } else if (eligibility.reason === 'not_purchased') {
          msg = 'Bạn chưa mua sản phẩm này.';
        }
        reviewFormContainer.innerHTML = `<p style="font-size:12px;color:#c0392b;font-weight:600;margin:0;">⚠️ ${msg}</p>`;
        return;
      }
      
      // Render review form
      this._renderReviewForm(reviewFormContainer, orderId, productId);
      
    } catch (err) {
      reviewFormContainer.innerHTML = `<p style="font-size:12px;color:#c0392b;font-weight:600;margin:0;">⚠️ Lỗi kết nối: ${err.message}</p>`;
    }
  }

  _renderReviewForm(container, orderId, productId) {
    container.innerHTML = `
      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:11px;font-weight:700;margin-bottom:6px;text-transform:uppercase;">Số sao đánh giá *</label>
        <div class="star-rating-selector" style="display:flex;gap:6px;font-size:22px;color:#ddd;cursor:pointer;user-select:none;">
          <span class="star-btn" data-value="1">★</span>
          <span class="star-btn" data-value="2">★</span>
          <span class="star-btn" data-value="3">★</span>
          <span class="star-btn" data-value="4">★</span>
          <span class="star-btn" data-value="5">★</span>
        </div>
        <input type="hidden" id="rating-val-${orderId}-${productId}" value="5" />
      </div>
      
      <div style="margin-bottom:12px;">
        <label for="review-title-${orderId}-${productId}" style="display:block;font-size:11px;font-weight:700;margin-bottom:6px;text-transform:uppercase;">Tiêu đề đánh giá (Tùy chọn)</label>
        <input type="text" id="review-title-${orderId}-${productId}" placeholder="Ví dụ: Đóng gói cẩn thận, sản phẩm đẹp..." style="width:100%;padding:10px;border:1.5px solid #e8e8e8;font-size:13px;font-family:Montserrat,sans-serif;outline:none;" />
      </div>
      
      <div style="margin-bottom:12px;">
        <label for="review-comment-${orderId}-${productId}" style="display:block;font-size:11px;font-weight:700;margin-bottom:6px;text-transform:uppercase;">Nội dung bình luận * (Tối thiểu 20 ký tự)</label>
        <textarea id="review-comment-${orderId}-${productId}" placeholder="Chia sẻ trải nghiệm thực tế về sản phẩm (từ 20 - 500 ký tự)..." rows="4" style="width:100%;padding:10px;border:1.5px solid #e8e8e8;font-size:13px;font-family:Montserrat,sans-serif;outline:none;resize:vertical;"></textarea>
        <div style="display:flex;justify-content:space-between;margin-top:4px;">
          <span id="char-count-${orderId}-${productId}" style="font-size:11px;color:#777;">0 / 500 ký tự</span>
          <span id="validation-msg-${orderId}-${productId}" style="font-size:11px;color:#c0392b;font-weight:600;display:none;">Bình luận cần ít nhất 20 ký tự.</span>
        </div>
      </div>
      
      <div style="margin-bottom:16px;display:flex;align-items:center;gap:8px;">
        <input type="checkbox" id="review-anon-${orderId}-${productId}" style="accent-color:#C9A84C;cursor:pointer;" />
        <label for="review-anon-${orderId}-${productId}" style="font-size:12px;font-weight:600;color:#555;cursor:pointer;user-select:none;">Đánh giá ẩn danh (Không hiển thị tên đầy đủ)</label>
      </div>
      
      <div style="display:flex;gap:10px;justify-content:flex-end;">
        <button class="cancel-review-btn" style="padding:8px 16px;background:#eee;color:#333;border:none;border-radius:4px;font-size:11px;font-weight:700;cursor:pointer;text-transform:uppercase;">Hủy</button>
        <button class="submit-review-btn" style="padding:8px 16px;background:#1a1a1a;color:#fff;border:none;border-radius:4px;font-size:11px;font-weight:700;cursor:pointer;text-transform:uppercase;">Gửi</button>
      </div>
      
      <p class="review-status-msg" id="review-msg-${orderId}-${productId}" style="margin-top:12px;font-size:12px;font-weight:600;display:none;"></p>
    `;

    // Star Selector Interaction
    const starBtns = container.querySelectorAll('.star-btn');
    const ratingInput = container.querySelector(`#rating-val-${orderId}-${productId}`);
    
    const updateStars = (val) => {
      ratingInput.value = val;
      starBtns.forEach((btn, idx) => {
        btn.style.color = idx < val ? '#C9A84C' : '#ddd';
      });
    };
    
    updateStars(5); // Default to 5 stars
    
    starBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.dataset.value);
        updateStars(val);
      });
    });

    // Character counter validation
    const textarea = container.querySelector(`#review-comment-${orderId}-${productId}`);
    const countSpan = container.querySelector(`#char-count-${orderId}-${productId}`);
    const validSpan = container.querySelector(`#validation-msg-${orderId}-${productId}`);
    
    textarea.addEventListener('input', () => {
      const len = textarea.value.length;
      countSpan.textContent = `${len} / 500 ký tự`;
      if (len >= 20 && len <= 500) {
        validSpan.style.display = 'none';
      }
    });

    // Cancel Button
    container.querySelector('.cancel-review-btn').addEventListener('click', (e) => {
      e.preventDefault();
      container.style.display = 'none';
    });

    // Submit Button
    container.querySelector('.submit-review-btn').addEventListener('click', async (e) => {
      e.preventDefault();
      const rating = parseInt(ratingInput.value);
      const title = container.querySelector(`#review-title-${orderId}-${productId}`).value.trim();
      const comment = textarea.value.trim();
      const isAnon = container.querySelector(`#review-anon-${orderId}-${productId}`).checked;
      const statusMsg = container.querySelector(`#review-msg-${orderId}-${productId}`);
      const submitBtn = container.querySelector('.submit-review-btn');
      
      if (comment.length < 20 || comment.length > 500) {
        validSpan.style.display = 'block';
        return;
      }
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'ĐANG GỬI...';
      
      try {
        const token = localStorage.getItem('dhat_auth_token') || localStorage.getItem('dhat_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const res = await fetch(`${API_BASE}/api/products/${productId}/reviews`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            rating,
            title,
            comment,
            is_anonymous: isAnon ? 1 : 0
          })
        });
        
        const resData = await res.json();
        
        if (!res.ok) {
          throw new Error(resData.error || 'Gửi đánh giá thất bại');
        }
        
        statusMsg.style.color = '#10b981';
        statusMsg.textContent = 'Gửi đánh giá thành công! Cảm ơn ý kiến của bạn.';
        statusMsg.style.display = 'block';
        
        setTimeout(() => {
          container.style.display = 'none';
        }, 2500);
        
      } catch (err) {
        statusMsg.style.color = '#c0392b';
        statusMsg.textContent = err.message || 'Lỗi không gửi được đánh giá.';
        statusMsg.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'GỬI';
      }
    });
  }

  _showCustomSuccessAlert(title, message, callback) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(9,9,11,0.6);backdrop-filter:blur(4px);opacity:0;transition:opacity 0.3s;';
    modal.innerHTML = `
      <div style="background:#fff;padding:24px;border-radius:24px;max-width:380px;width:100%;margin:0 16px;box-shadow:0 10px 25px rgba(0,0,0,0.15);text-align:center;transform:scale(0.95);transition:transform 0.3s;font-family:Montserrat,sans-serif;">
        <div style="width:56px;height:56px;background:#f0fdf4;color:#15803d;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h3 style="margin:0 0 10px;font-size:14px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#1a1a1a;">${title}</h3>
        <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#555;">${message}</p>
        <button id="success-alert-ok" style="width:100%;padding:12px;background:#1a1a1a;color:#fff;border:none;border-radius:12px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer;outline:none;">Xác Nhận</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Trigger animations
    setTimeout(() => {
      modal.style.opacity = '1';
      modal.querySelector('div').style.transform = 'scale(1)';
    }, 10);
    
    const close = () => {
      modal.style.opacity = '0';
      modal.querySelector('div').style.transform = 'scale(0.95)';
      setTimeout(() => {
        modal.remove();
        if (typeof callback === 'function') callback();
      }, 300);
    };
    
    modal.querySelector('#success-alert-ok').addEventListener('click', close);
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
