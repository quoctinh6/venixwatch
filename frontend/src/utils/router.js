/**
 * router.js — Client-side SPA router for Venix Watch
 */
import { navigate } from './helpers.js';

const routes = [
  { path: '/', component: () => import('../pages/Home/index.js') },
  { path: '/nam', component: () => import('../pages/ProductList/index.js'), params: { category_slug: 'nam' } },
  { path: '/nu', component: () => import('../pages/ProductList/index.js'), params: { category_slug: 'nu' } },
  { path: '/phu-kien', component: () => import('../pages/ProductList/index.js'), params: { category_slug: 'phu-kien' } },
  { path: '/sale', component: () => import('../pages/ProductList/index.js'), params: { category_slug: 'sale', badge: 'SALE' } },
  { path: '/gio-hang', component: () => import('../pages/Cart/index.js') },
  { path: '/thanh-toan', component: () => import('../pages/Checkout/index.js') },
  { path: '/tai-khoan', component: () => import('../pages/Account/index.js') },
  { path: '/so-sanh', component: () => import('../pages/Compare/index.js') },
  { path: '/san-pham/:slug', component: () => import('../pages/ProductDetail/index.js') },
];

function matchRoute(pathname) {
  for (const route of routes) {
    if (route.path === pathname) {
      return { route, params: route.params || {} };
    }
    // Dynamic segments like :slug
    const routeParts = route.path.split('/');
    const pathParts = pathname.split('/');
    if (routeParts.length !== pathParts.length) continue;
    const params = {};
    let matched = true;
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        params[routeParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
      } else if (routeParts[i] !== pathParts[i]) {
        matched = false;
        break;
      }
    }
    if (matched) return { route, params: { ...(route.params || {}), ...params } };
  }
  return null;
}

let _mainNavbar = null;
let _mainFooter = null;

export async function initRouter() {
  // Lazy-load persistent layout components
  const [{ MainNavbar }, { MainFooter }] = await Promise.all([
    import('../components/MainNavbar.js'),
    import('../components/MainFooter.js'),
  ]);
  _mainNavbar = new MainNavbar();
  _mainFooter = new MainFooter();

  window.addEventListener('popstate', handleRoute);
  await handleRoute();
}

let routeSeq = 0;

async function handleRoute() {
  routeSeq++;
  const localSeq = routeSeq;

  const pathname = window.location.pathname;

  // Redirect /admin to admin panel
  if (pathname.startsWith('/admin') || pathname.startsWith('/dong-ho-a-tuan/admin')) {
    const prefix = pathname.startsWith('/dong-ho-a-tuan/') ? '/dong-ho-a-tuan' : '';
    window.location.href = `${prefix}/admin/`;
    return;
  }

  const match = matchRoute(pathname);
  const app = document.getElementById('app');
  if (!app) return;

  // Show loading
  app.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:60vh;">
      <div class="spinner"></div>
    </div>`;

  if (!match) {
    renderNotFound(app);
    return;
  }

  try {
    const mod = await match.route.component();
    if (localSeq !== routeSeq) return; // Bỏ qua nếu đã có lệnh chuyển trang mới hơn

    const PageClass = mod.default || mod[Object.keys(mod)[0]];

    app.innerHTML = '';

    // Navbar
    const navEl = _mainNavbar.render();
    app.appendChild(navEl);

    // Page content wrapper
    const pageWrapper = document.createElement('div');
    pageWrapper.className = 'page-enter';
    pageWrapper.id = 'page-content';
    app.appendChild(pageWrapper);

    // Mount page
    const page = new PageClass(match.params);
    const pageEl = await page.render();
    if (localSeq !== routeSeq) return; // Bỏ qua nếu đã có lệnh chuyển trang mới hơn

    if (pageEl) pageWrapper.appendChild(pageEl);

    // Footer
    const footerEl = _mainFooter.render();
    app.appendChild(footerEl);

    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Re-init navbar cart count
    _mainNavbar.updateCartCount();

    // Dispatch page-rendered event to activate reveals and lazy loading
    window.dispatchEvent(new CustomEvent('page-rendered'));
  } catch (err) {
    if (localSeq !== routeSeq) return; // Bỏ qua nếu đã có lệnh chuyển trang mới hơn
    console.error('[Router] Error rendering page:', err);
    renderError(app, err);
  }
}

function renderNotFound(app) {
  app.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;gap:16px;font-family:Montserrat,sans-serif;">
      <h1 style="font-size:72px;font-weight:800;color:#C9A84C;margin:0;">404</h1>
      <p style="font-size:18px;color:#1a1a1a;margin:0;">Trang không tồn tại.</p>
      <a href="/" onclick="event.preventDefault();history.pushState({},'','/');window.dispatchEvent(new PopStateEvent('popstate'));"
         style="margin-top:8px;padding:12px 32px;border:2px solid #1a1a1a;font-weight:600;letter-spacing:1.2px;text-decoration:none;color:#1a1a1a;transition:all .2s;"
         onmouseover="this.style.background='#1a1a1a';this.style.color='#fff'"
         onmouseout="this.style.background='';this.style.color='#1a1a1a'">
        VỀ TRANG CHỦ
      </a>
    </div>`;
}

function renderError(app, err) {
  app.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;gap:16px;font-family:Montserrat,sans-serif;">
      <h2 style="font-size:24px;font-weight:700;color:#c0392b;">Đã xảy ra lỗi</h2>
      <p style="color:#888;max-width:400px;text-align:center;">${err.message || 'Vui lòng thử lại sau.'}</p>
      <button onclick="window.location.reload()"
        style="padding:12px 32px;background:#1a1a1a;color:#fff;border:none;font-weight:600;letter-spacing:1.2px;cursor:pointer;">
        THỬ LẠI
      </button>
    </div>`;
}

export { navigate };
