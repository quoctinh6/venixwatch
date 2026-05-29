import { renderBreadcrumb } from './AdminBreadcrumb.js';
import { API_BASE, STORAGE_KEYS } from '../../../services/config.js';

function getAdminToken() {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || localStorage.getItem('dhat_token');
}

export function renderTopbar(container, title) {
  const token = getAdminToken();
  let userName = 'Admin';
  let userEmail = '';
  try {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userName = payload.name || payload.email || 'Admin';
      userEmail = payload.email || '';
    }
  } catch {}

  container.innerHTML = `
    <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-20 sticky top-0">
      <div id="topbar-breadcrumb"></div>
      <div class="flex items-center gap-4">
        <button id="notif-btn" class="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors" title="Thông báo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span id="notif-dot" class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 hidden"></span>
        </button>
        <div class="relative" id="user-menu-wrap">
          <button id="user-menu-btn" class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <div class="w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] font-bold text-sm">
              ${userName.charAt(0).toUpperCase()}
            </div>
            <div class="text-left hidden sm:block">
              <div class="text-sm font-medium text-gray-800 leading-none">${userName}</div>
              <div class="text-xs text-gray-500 mt-0.5">${userEmail}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div id="user-dropdown" class="hidden absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
            <div class="px-4 py-2 border-b border-gray-100">
              <div class="text-sm font-medium text-gray-800">${userName}</div>
              <div class="text-xs text-gray-500">${userEmail}</div>
            </div>
            <a href="#" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Hồ sơ
            </a>
            <button id="topbar-logout" class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </header>
  `;

  renderBreadcrumb(container.querySelector('#topbar-breadcrumb'), title);

  const menuBtn = container.querySelector('#user-menu-btn');
  const dropdown = container.querySelector('#user-dropdown');
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
  });
  document.addEventListener('click', () => dropdown.classList.add('hidden'));

  container.querySelector('#topbar-logout').addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('admin:logout'));
  });

  loadNotifications(container);
}

async function loadNotifications(container) {
  const token = getAdminToken();
  if (!token) return;
  try {
    const res = await fetch(`${API_BASE}/api/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    const stats = data.data || data;
    if (stats.pending_orders > 0) {
      const dot = container.querySelector('#notif-dot');
      if (dot) dot.classList.remove('hidden');
    }
  } catch {}
}
