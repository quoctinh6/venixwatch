/**
 * main.js - Application entry point for Dong Ho Anh Tuan
 */
import { initRouter } from './utils/router.js';
import { initTracker } from './utils/tracker.js';
import { CartDrawer } from './components/CartDrawer.js';
import { ContactFloater } from './components/ContactFloater.js';
import { throttle, navigate } from './utils/helpers.js';
import { soundManager } from './utils/soundManager.js';
import { API_BASE } from './services/config.js';

function initClickEffect() {
  window.addEventListener('pointerdown', (e) => {
    const ripple = document.createElement('div');
    ripple.className = 'click-ripple';
    ripple.style.left = `${e.clientX}px`;
    ripple.style.top = `${e.clientY}px`;
    document.body.appendChild(ripple);

    const removeRipple = () => {
      if (ripple.parentNode) {
        ripple.remove();
      }
    };

    ripple.addEventListener('animationend', removeRipple);
    setTimeout(removeRipple, 600);
  });
}

function initLenis() {
  if (window.innerWidth <= 1024 || typeof Lenis === 'undefined') return;

  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
    infinite: false,
  });
  window.lenis = lenis;

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);
  window.addEventListener('popstate', () => {
    lenis.scrollTo(0, { immediate: true });
  });
}

function initScrollToTop() {
  const btn = document.createElement('button');
  btn.id = 'scroll-to-top';
  btn.style.left = 'calc(20px + env(safe-area-inset-left, 0px))';
  btn.style.bottom = 'calc(20px + env(safe-area-inset-bottom, 0px))';

  if (window.innerWidth <= 640) {
    btn.style.left = 'calc(16px + env(safe-area-inset-left, 0px))';
    btn.style.bottom = 'calc(16px + env(safe-area-inset-bottom, 0px))';
  }

  btn.className = 'fixed bottom-6 left-6 z-[45] hidden flex h-12 w-12 items-center justify-center rounded-full border border-[#C9A961] bg-zinc-950 text-[#C9A961] shadow-2xl opacity-0 scale-90 translate-y-4';
  btn.title = 'Về đầu trang';
  btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>';
  document.body.appendChild(btn);

  window.addEventListener('scroll', throttle(() => {
    if (window.scrollY > 400) {
      btn.classList.remove('hidden');
      requestAnimationFrame(() => btn.classList.add('show'));
    } else {
      btn.classList.remove('show');
      setTimeout(() => {
        if (!btn.classList.contains('show')) btn.classList.add('hidden');
      }, 300);
    }
  }, 100), { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function initScrollReveals() {
  if (!('IntersectionObserver' in window)) return;

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');

      if (entry.target.classList.contains('counter-val') && !entry.target.classList.contains('counted')) {
        entry.target.classList.add('counted');
        triggerCounterAnimation(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  const observeElements = () => {
    document.querySelectorAll('.feature-item:not(.observed)').forEach((el) => {
      el.classList.add('observed');
      revealObserver.observe(el);
    });
    document.querySelectorAll('.product-card-reveal:not(.observed)').forEach((el) => {
      el.classList.add('observed');
      revealObserver.observe(el);
    });
    document.querySelectorAll('.brand-story-heading:not(.observed)').forEach((el) => {
      el.classList.add('observed');
      revealObserver.observe(el);
    });
    document.querySelectorAll('.counter-val:not(.observed)').forEach((el) => {
      el.classList.add('observed');
      revealObserver.observe(el);
    });
    document.querySelectorAll('.footer-reveal:not(.observed)').forEach((el) => {
      el.classList.add('observed');
      revealObserver.observe(el);
    });
  };

  observeElements();
  window.addEventListener('page-rendered', () => setTimeout(observeElements, 100));
}

function triggerCounterAnimation(el) {
  const target = parseInt(el.dataset.target, 10) || 0;
  const suffix = el.dataset.suffix || '';
  const duration = 2000;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.floor(eased * target);

    el.textContent = `${currentValue}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = `${target}${suffix}`;
    }
  }

  requestAnimationFrame(update);
}

function initCompareBar() {
  if (document.getElementById('compare-bar')) return;

  const bar = document.createElement('div');
  bar.id = 'compare-bar';
  bar.className = 'fixed inset-x-3 bottom-3 z-[120] flex items-center gap-3 rounded-[4px] border border-[#C9A961] bg-zinc-950 px-3 py-2.5 text-white shadow-2xl transition-all duration-300 lg:inset-x-auto lg:bottom-4 lg:left-1/2 lg:w-[min(720px,calc(100vw-32px))] lg:-translate-x-1/2 lg:px-4 lg:py-3';
  bar.style.display = 'none';
  bar.innerHTML = `
    <div class="min-w-0 flex-1">
      <p class="text-[10px] font-bold uppercase tracking-[0.06em] text-[#C9A961]">So sánh sản phẩm</p>
      <p id="compare-bar-names" class="mt-0.5 truncate text-[12px] leading-tight text-zinc-300"></p>
    </div>
    <div class="flex shrink-0 items-center gap-2">
      <button id="compare-now-btn" class="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-[4px] bg-[#C9A961] px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-950 transition-colors hover:bg-[#dcc488]">
        So sánh
      </button>
      <button id="compare-clear-btn" class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] border border-white/20 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white" title="Xóa tất cả">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
  `;

  document.body.appendChild(bar);

  const renderCompareState = (items) => {
    if (items.length >= 2) {
      bar.style.display = 'flex';
      const names = bar.querySelector('#compare-bar-names');
      if (names) {
        if (items.length === 1) {
          names.textContent = `(${items.length}) ${items[0].name} • Chọn thêm sản phẩm khác để so sánh`;
        } else {
          names.textContent = `(${items.length}) ${items.map((item) => item.name).join(' • ')}`;
        }
      }
      return;
    }

    bar.style.display = 'none';
  };

  renderCompareState(JSON.parse(localStorage.getItem('dhat_compare') || '[]'));
  window.addEventListener('compare-updated', (e) => {
    renderCompareState(e.detail || []);
  });

  bar.querySelector('#compare-now-btn')?.addEventListener('click', () => navigate('/so-sanh'));
  bar.querySelector('#compare-clear-btn')?.addEventListener('click', () => {
    localStorage.removeItem('dhat_compare');
    window.dispatchEvent(new CustomEvent('compare-updated', { detail: [] }));
  });
}

function initModalScrollLockObserver() {
  if (typeof MutationObserver === 'undefined') return;

  const observer = new MutationObserver(() => {
    let hasModal = false;
    const divs = document.querySelectorAll('div');
    for (const div of divs) {
      if (div.classList.contains('bg-black/50') && !div.classList.contains('hidden')) {
        hasModal = true;
        break;
      }
    }

    if (hasModal) {
      if (document.body.style.overflow !== 'hidden') {
        document.body.style.overflow = 'hidden';
        if (window.lenis) window.lenis.stop();
      }
    } else {
      const searchActive = document.querySelector('#search-overlay:not(.hidden)');
      const sidebarActive = document.querySelector('#sidebar-overlay:not(.hidden)');
      if (!searchActive && !sidebarActive && document.body.style.overflow === 'hidden') {
        document.body.style.overflow = '';
        if (window.lenis) window.lenis.start();
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

async function boot() {
  // Load dynamic settings on startup
  let settings = {
    brand_name: 'Venix Watch',
    logo_url: '',
    hero_banners: [],
    theme_colors: {}
  };
  try {
    const res = await fetch(`${API_BASE}/api/settings`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        settings = json.data;
      }
    }
  } catch (err) {
    console.warn('[App] Failed to fetch settings, using defaults:', err);
  }
  window.APP_SETTINGS = settings;

  // Inject CSS dynamic color variables
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
    console.warn('[App] Failed to inject dynamic colors:', err);
  }

  // Update brand title dynamic values
  if (settings.brand_name) {
    document.title = `${settings.brand_name} — Đỉnh Cao Tinh Xảo`;
    const preloaderBrand = document.getElementById('preloader-brand-name');
    if (preloaderBrand) {
      preloaderBrand.textContent = settings.brand_name;
    }
  }

  initLenis();
  initModalScrollLockObserver();
  initClickEffect();

  try {
    soundManager.mountToggleButton();
  } catch { }

  try {
    initTracker();
  } catch { }

  try {
    const floater = new ContactFloater();
    floater.mount();
  } catch { }

  try {
    new CartDrawer();
  } catch { }

  await initRouter();
  initLazyImages();
  initScrollToTop();
  initScrollReveals();

  try {
    initCompareBar();
  } catch { }

  window.addEventListener('page-rendered', () => {
    if (window.lenis) {
      window.lenis.resize();
    }
  });

  setTimeout(() => {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;
    preloader.classList.add('opacity-0');
    setTimeout(() => preloader.remove(), 700);
  }, 800);

  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href]');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('//') || href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('#')) return;
    if (anchor.target === '_blank') return;

    e.preventDefault();
    history.pushState({}, '', href);
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
}

function initLazyImages() {
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const img = entry.target;
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        img.addEventListener('load', () => {
          img.classList.add('loaded');
        });
      }

      observer.unobserve(img);
    });
  }, { rootMargin: '200px' });

  const observeAll = () => {
    document.querySelectorAll('img[data-src]:not(.observed)').forEach((img) => {
      img.classList.add('lazy', 'observed');
      observer.observe(img);
    });
  };

  observeAll();
  window.addEventListener('page-rendered', () => setTimeout(observeAll, 100));
}

window.addEventListener('unhandledrejection', (e) => {
  console.warn('[App] Unhandled promise rejection:', e.reason);
});

window.onerror = (msg, src, line) => {
  console.warn('[App] Runtime error:', msg, src, line);
};

boot().catch((err) => {
  console.error('[App] Boot failed:', err);
  document.getElementById('app').innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;gap:16px;font-family:Montserrat,sans-serif;padding:20px;text-align:center;">
      <h1 style="font-size:20px;font-weight:700;color:#1a1a1a;margin:0;">Venix Watch</h1>
      <p style="color:#888;font-size:14px;margin:0;">Đang tải ứng dụng...</p>
      <button onclick="window.location.reload()" style="padding:12px 32px;background:#C9A84C;color:#1a1a1a;border:none;font-size:12px;font-weight:700;letter-spacing:1.2px;cursor:pointer;font-family:Montserrat,sans-serif;">
        THỬ LẠI
      </button>
    </div>
  `;
});
