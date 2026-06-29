/**
 * router.js — Client-side SPA router for Venix Watch
 */
import { navigate } from './helpers.js';

const routes = [
  { path: '/', component: () => import('../pages/Home/index.js') },
  { path: '/tim-kiem', component: () => import('../pages/ProductList/index.js') },
  { path: '/nam', component: () => import('../pages/ProductList/index.js'), params: { category_slug: 'nam' } },
  { path: '/nu', component: () => import('../pages/ProductList/index.js'), params: { category_slug: 'nu' } },
  { path: '/phu-kien', component: () => import('../pages/ProductList/index.js'), params: { category_slug: 'phu-kien' } },
  { path: '/sale', component: () => import('../pages/ProductList/index.js'), params: { category_slug: 'sale', badge: 'SALE' } },
  { path: '/gio-hang', component: () => import('../pages/Cart/index.js') },
  { path: '/thanh-toan', component: () => import('../pages/Checkout/index.js?v=1.0.1') },
  { path: '/tai-khoan', component: () => import('../pages/Account/index.js?v=1.0.1') },
  { path: '/so-sanh', component: () => import('../pages/Compare/index.js') },
  { path: '/san-pham/:slug', component: () => import('../pages/ProductDetail/index.js') },
  { path: '/tin-tuc', component: () => import('../pages/NewsList/index.js') },
  { path: '/tin-tuc/:slug', component: () => import('../pages/NewsDetail/index.js') },
  { path: '/gioi-thieu', component: () => import('../pages/StaticPolicy/index.js'), params: { policyType: 'gioi-thieu' } },
  { path: '/van-chuyen', component: () => import('../pages/StaticPolicy/index.js'), params: { policyType: 'van-chuyen' } },
  { path: '/doi-tra', component: () => import('../pages/StaticPolicy/index.js'), params: { policyType: 'doi-tra' } },
  { path: '/bao-hanh', component: () => import('../pages/StaticPolicy/index.js'), params: { policyType: 'bao-hanh' } },
  { path: '/bao-mat', component: () => import('../pages/StaticPolicy/index.js'), params: { policyType: 'bao-mat' } },
  { path: '/dieu-khoan', component: () => import('../pages/StaticPolicy/index.js'), params: { policyType: 'dieu-khoan' } },
  { path: '/faq', component: () => import('../pages/StaticPolicy/index.js'), params: { policyType: 'faq' } },
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
let _currentPageInstance = null;
let _loadingPageInstance = null;

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

  // Clean up previous loading and active pages
  if (_loadingPageInstance) {
    _loadingPageInstance.aborted = true;
    if (typeof _loadingPageInstance.destroy === 'function') {
      try { _loadingPageInstance.destroy(); } catch (err) { console.warn('[Router] Failed to destroy loading page:', err); }
    }
    _loadingPageInstance = null;
  }

  if (_currentPageInstance) {
    _currentPageInstance.aborted = true;
    if (typeof _currentPageInstance.destroy === 'function') {
      try { _currentPageInstance.destroy(); } catch (err) { console.warn('[Router] Failed to destroy current page:', err); }
    }
    _currentPageInstance = null;
  }

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

    // Check if current page is the same class and can be updated in-place
    if (_currentPageInstance && _currentPageInstance.constructor === PageClass) {
      if (typeof _currentPageInstance.updateParams === 'function') {
        _currentPageInstance.updateParams(match.params);
      }
      if (_mainNavbar && typeof _mainNavbar.updateActiveLinks === 'function') {
        _mainNavbar.updateActiveLinks();
      }
      window.dispatchEvent(new CustomEvent('page-rendered'));
      return;
    }

    app.innerHTML = '';

    // Navbar
    const navEl = _mainNavbar.render();
    app.appendChild(navEl);

    // Page content wrapper
    const pageWrapper = document.createElement('div');
    pageWrapper.className = 'page-enter';
    pageWrapper.id = 'page-content';
    // Show spinner inside page content wrapper while loading the page content
    pageWrapper.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:60vh;">
        <div class="spinner"></div>
      </div>`;
    app.appendChild(pageWrapper);

    // Mount page
    const page = new PageClass(match.params);
    _loadingPageInstance = page;
    const pageEl = await page.render();
    if (localSeq !== routeSeq) {
      if (typeof page.destroy === 'function') {
        try { page.destroy(); } catch (e) { console.warn('[Router] Failed to destroy page:', e); }
      }
      return; // Bỏ qua nếu đã có lệnh chuyển trang mới hơn
    }

    // Clear spinner and mount page content
    pageWrapper.innerHTML = '';
    if (pageEl) pageWrapper.appendChild(pageEl);
    _currentPageInstance = page;
    _loadingPageInstance = null;

    // Footer
    const footerEl = _mainFooter.render();
    app.appendChild(footerEl);

    // Scroll to top on navigation if not restoring scroll position
    const currentKey = window.location.pathname + window.location.search;
    const hasSavedScroll = (history.state && typeof history.state.scrollY === 'number' && history.state.scrollY > 0)
      || !!sessionStorage.getItem(`dhat_scroll_${currentKey}`);
    if (!hasSavedScroll) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

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
