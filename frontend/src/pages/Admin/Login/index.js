import { showToast } from '../shared/ui.js';
import { API_BASE, STORAGE_KEYS } from '../../../services/config.js';

export function renderLogin(container) {
  const brandName = window.APP_SETTINGS?.brand_name || 'Venix Watch';

  container.innerHTML = `
    <div class="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
      <div class="w-full max-w-sm">
        <div class="text-center mb-8">
          <div class="text-[#C9A84C] font-bold text-2xl tracking-[0.08em] uppercase mb-1">${brandName}</div>
          <div class="text-white/40 text-sm">Admin Panel</div>
        </div>
        <div class="bg-white rounded-2xl shadow-2xl p-8">
          <h2 class="text-xl font-bold text-gray-900 mb-6">Đăng nhập</h2>
          <form id="login-form" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input id="login-email" type="email" required
                  class="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C]"
                  placeholder="admin@example.com" autocomplete="email" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input id="login-password" type="password" required
                  class="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C]"
                  placeholder="••••••••" autocomplete="current-password" />
                <button type="button" id="toggle-pw" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
            </div>
            <div id="login-error" class="text-red-600 text-sm hidden"></div>
            <button type="submit" id="login-btn"
              class="w-full bg-[#C9A84C] hover:bg-[#b8963e] text-white font-semibold py-2.5 rounded-lg transition-colors text-sm mt-2 flex items-center justify-center gap-2">
              <span id="login-btn-text">Đăng nhập</span>
            </button>
          </form>
        </div>
        <div class="text-center mt-6 text-white/30 text-xs">© 2026 ${brandName}</div>
      </div>
    </div>
  `;

  const form = container.querySelector('#login-form');
  const emailInput = container.querySelector('#login-email');
  const passwordInput = container.querySelector('#login-password');
  const errorEl = container.querySelector('#login-error');
  const btnText = container.querySelector('#login-btn-text');

  container.querySelector('#toggle-pw').addEventListener('click', () => {
    const isPw = passwordInput.type === 'password';
    passwordInput.type = isPw ? 'text' : 'password';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.add('hidden');
    btnText.textContent = 'Đang đăng nhập...';

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.value.trim(),
          password: passwordInput.value,
        }),
      });
      const data = await res.json();
      if (res.ok && (data.token || data.access_token || (data.data && data.data.token))) {
        const token = data.token || data.access_token || data.data.token;
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        localStorage.setItem('dhat_token', token);
        showToast('Đăng nhập thành công!', 'success');
        window.location.hash = '#dashboard';
        document.dispatchEvent(new CustomEvent('admin:login'));
        setTimeout(() => {
          window.location.reload();
        }, 150);
      } else {
        errorEl.textContent = data.message || 'Email hoặc mật khẩu không đúng.';
        errorEl.classList.remove('hidden');
      }
    } catch (err) {
      errorEl.textContent = 'Lỗi kết nối. Vui lòng thử lại.';
      errorEl.classList.remove('hidden');
    } finally {
      btnText.textContent = 'Đăng nhập';
    }
  });
}
