import { API_BASE, STORAGE_KEYS } from '../../../services/config.js';

function getAdminToken() {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || localStorage.getItem('dhat_token');
}

const NAV_ITEMS = [
  {
    id: 'dashboard', label: 'Dashboard', hash: '#dashboard',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  },
  {
    id: 'products', label: 'Sản Phẩm', hash: '#products',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    badge: 'lowstock',
  },
  {
    id: 'categories', label: 'Danh Mục', hash: '#categories',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  },
  {
    id: 'brands', label: 'Thương Hiệu', hash: '#brands',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
  },
  {
    id: 'orders', label: 'Đơn Hàng', hash: '#orders',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
    badge: 'pending',
  },
  {
    id: 'users', label: 'Người Dùng', hash: '#users',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  },
  {
    id: 'warranties', label: 'Bảo Hành', hash: '#warranties',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  },
  {
    id: 'flash-sales', label: 'Flash Sale', hash: '#flash-sales',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  },
  {
    id: 'roles', label: 'Phân Quyền', hash: '#roles',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>`,
  },
  {
    id: 'analytics', label: 'Analytics', hash: '#analytics',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  },
  {
    id: 'news', label: 'Tin Tức', hash: '#news',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M16 8h2M16 12h2M16 16h2M6 8h6v8H6z"/></svg>`,
  },
  {
    id: 'settings', label: 'Cài Đặt', hash: '#settings',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  },
];

export function renderSidebar(container, activeRoute) {
  const token = getAdminToken();
  let userName = 'Admin';
  let roleText = 'Quản trị viên';
  try {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userName = payload.full_name || payload.name || payload.email || 'Admin';
      const displayNames = payload.role_display_names || payload.roles || [];
      if (displayNames.length > 0) {
        const mapping = {
          'super_admin': 'Quản trị viên cấp cao',
          'admin': 'Quản trị viên',
          'editor': 'Biên tập viên',
          'viewer': 'Người xem',
          'user_page_editor': 'Biên tập viên trang',
          'Super Administrator': 'Quản trị viên cấp cao',
          'Administrator': 'Quản trị viên',
          'Editor': 'Biên tập viên',
          'Viewer': 'Người xem'
        };
        roleText = displayNames.map(r => mapping[r] || r).join(', ');
      }
    }
  } catch { }

  const brandName = window.APP_SETTINGS?.brand_name || 'Venix Watch';
  const logoUrl = window.APP_SETTINGS?.logo_url || '';
  const logoHtml = logoUrl 
    ? `<img src="${logoUrl}" alt="${brandName}" class="max-h-8 max-w-full object-contain" />`
    : `<div class="text-[#C9A84C] font-bold text-sm tracking-[0.08em] uppercase truncate">${brandName}</div>`;

  container.innerHTML = `
    <aside class="w-64 h-screen bg-[#1a1a1a] flex flex-col fixed left-0 top-0 z-30">
      <div class="px-6 py-5 border-b border-white/10">
        <div class="flex items-center h-8">${logoHtml}</div>
        <div class="text-white/40 text-xs mt-1.5">Admin Panel</div>
      </div>
      <nav class="flex-1 overflow-y-auto py-4 px-3" id="sidebar-nav"></nav>
      <div class="border-t border-white/10 px-4 py-4">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] font-bold text-sm">
            ${userName.charAt(0).toUpperCase()}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-white text-sm font-medium truncate">${userName}</div>
            <div class="text-white/40 text-xs truncate" title="${roleText}">${roleText}</div>
          </div>
        </div>
        <button id="sidebar-logout" class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 text-sm transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Đăng xuất
        </button>
      </div>
    </aside>
    <div class="w-64 flex-shrink-0"></div>
  `;

  const nav = container.querySelector('#sidebar-nav');
  NAV_ITEMS.forEach(item => {
    const isActive = activeRoute === item.id;
    const li = document.createElement('a');
    li.href = item.hash;
    li.className = `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-all relative ${isActive
      ? 'bg-[#C9A84C]/20 text-white border-l-2 border-[#C9A84C] pl-[10px]'
      : 'text-white/60 hover:text-white hover:bg-white/10'
      }`;
    li.innerHTML = `
      <span class="${isActive ? 'text-[#C9A84C]' : ''}">${item.icon}</span>
      <span>${item.label}</span>
      ${item.badge === 'lowstock' ? '<span id="badge-lowstock" class="ml-auto w-2 h-2 rounded-full bg-red-500 hidden"></span>' : ''}
      ${item.badge === 'pending' ? '<span id="badge-pending" class="ml-auto bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full hidden"></span>' : ''}
    `;
    nav.appendChild(li);
  });

  container.querySelector('#sidebar-logout').addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('admin:logout'));
  });

  loadBadges(container);
}

async function loadBadges(container) {
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
      const b = container.querySelector('#badge-pending');
      if (b) { b.textContent = stats.pending_orders; b.classList.remove('hidden'); }
    }
    if (stats.low_stock_count > 0) {
      const b = container.querySelector('#badge-lowstock');
      if (b) b.classList.remove('hidden');
    }
  } catch { }
}
