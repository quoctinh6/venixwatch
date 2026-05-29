import { renderLogin } from './Login/index.js';
import { renderSidebar } from './shared/AdminSidebar.js';
import { renderTopbar } from './shared/AdminTopbar.js';
import { renderDashboard } from './Dashboard/index.js';
import { renderProducts } from './Products/index.js';
import { renderCategories } from './Categories/index.js';
import { renderBrands } from './Brands/index.js';
import { renderOrders } from './Orders/index.js';
import { renderUsers } from './Users/index.js';
import { renderRoles } from './Roles/index.js';
import { renderWarranties } from './Warranties/index.js';
import { renderFlashSales } from './FlashSales/index.js';
import { renderAnalytics } from './Analytics/index.js?v=1.0.5';
import { renderSettings } from './Settings/index.js';
import { renderNews } from './News/index.js';
import { API_BASE, STORAGE_KEYS } from '../../services/config.js';

const routeTitles = {
  dashboard: 'Dashboard',
  products: 'Sản Phẩm',
  categories: 'Danh Mục',
  brands: 'Thương Hiệu',
  orders: 'Đơn Hàng',
  users: 'Người Dùng',
  warranties: 'Bảo Hành',
  'flash-sales': 'Flash Sale',
  roles: 'Phân Quyền',
  analytics: 'Analytics',
  news: 'Quản Lý Tin Tức',
  settings: 'Cài Đặt Hệ Thống',
};

const appState = {
  root: null,
  sidebarEl: null,
  topbarEl: null,
  contentEl: null,
  listenersBound: false,
};

function getToken() {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || localStorage.getItem('dhat_token');
}

function getCurrentRoute() {
  return window.location.hash.replace('#', '') || 'dashboard';
}

function renderContent(route, container) {
  container.innerHTML = '';
  switch (route) {
    case 'dashboard': renderDashboard(container); break;
    case 'products': renderProducts(container); break;
    case 'categories': renderCategories(container); break;
    case 'brands': renderBrands(container); break;
    case 'orders': renderOrders(container); break;
    case 'users': renderUsers(container); break;
    case 'warranties': renderWarranties(container); break;
    case 'flash-sales': renderFlashSales(container); break;
    case 'roles': renderRoles(container); break;
    case 'analytics': renderAnalytics(container); break;
    case 'settings': renderSettings(container); break;
    case 'news': renderNews(container); break;
    default: renderDashboard(container);
  }
}

function renderRoute() {
  if (!appState.sidebarEl || !appState.topbarEl || !appState.contentEl) return;
  const route = getCurrentRoute();
  renderSidebar(appState.sidebarEl, route);
  renderTopbar(appState.topbarEl, routeTitles[route] || 'Dashboard');
  renderContent(route, appState.contentEl);
}

function bindListeners() {
  if (appState.listenersBound) return;
  appState.listenersBound = true;

  window.addEventListener('hashchange', renderRoute);

  document.addEventListener('admin:logout', () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem('dhat_token');
    init();
  });

  document.addEventListener('admin:login', () => {
    init();
  });
}

function mountAdminApp(root) {
  root.innerHTML = `
    <div class="flex h-screen overflow-hidden">
      <div id="admin-sidebar" class="flex-shrink-0"></div>
      <div class="flex flex-col flex-1 overflow-hidden">
        <div id="admin-topbar"></div>
        <main id="admin-content" class="flex-1 overflow-y-auto bg-gray-100 p-6"></main>
      </div>
    </div>
  `;

  appState.root = root;
  appState.sidebarEl = root.querySelector('#admin-sidebar');
  appState.topbarEl = root.querySelector('#admin-topbar');
  appState.contentEl = root.querySelector('#admin-content');

  bindListeners();
  renderRoute();
}

async function verifyToken(token) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok || res.status === 200;
  } catch {
    return true;
  }
}

async function init() {
  const root = document.getElementById('admin-root');
  if (!root) return;

  // Load dynamic settings on admin startup
  let settings = {
    brand_name: 'Venix Watch',
    logo_url: '',
    hero_banners: [],
    theme_colors: {}
  };
  try {
    const res = await fetch(`${API_BASE}/api/settings?t=${Date.now()}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        settings = json.data;
      }
    }
  } catch (err) {
    console.warn('[Admin] Failed to fetch settings, using defaults:', err);
  }
  window.APP_SETTINGS = settings;

  // Inject colors
  try {
    const colors = settings.theme_colors || {};
    let styleText = ':root {\n';
    Object.entries(colors).forEach(([key, val]) => {
      if (val) {
        styleText += `  --color-${key}: ${val};\n`;
      }
    });
    styleText += '}';
    const styleEl = document.createElement('style');
    styleEl.id = 'dynamic-theme-vars';
    styleEl.textContent = styleText;
    document.head.appendChild(styleEl);
  } catch (err) {
    console.warn('[Admin] Failed to inject dynamic colors:', err);
  }

  // Dynamic admin tab title
  if (settings.brand_name) {
    document.title = `Admin — ${settings.brand_name}`;
  }

  const token = getToken();
  if (!token) {
    renderLogin(root);
    return;
  }

  const valid = await verifyToken(token);
  if (!valid) {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem('dhat_token');
    renderLogin(root);
    return;
  }

  mountAdminApp(root);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
