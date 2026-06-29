import { cartService } from '../services/cartService.js';
import { navigate } from '../utils/helpers.js';
import { authService } from '../services/authService.js';
import { openQuickSettings } from './QuickSettingsModal.js?v=1.0.5';

const NAM_SUBS = [
  { label: 'Đồng Hồ Nam Cổ', href: '/nam?category=nam-co' },
  { label: 'Đồng Hồ Nam Điện Tử', href: '/nam?category=nam-dien-tu' },
  { label: 'Đồng Hồ Thể Thao Nam', href: '/nam?category=nam-the-thao' },
  { label: 'Đồng Hồ Luxury Nam', href: '/nam?category=nam-luxury' },
];

const NU_SUBS = [
  { label: 'Đồng Hồ Nữ Thời Trang', href: '/nu?category=nu-thoi-trang' },
  { label: 'Đồng Hồ Nữ Cổ', href: '/nu?category=nu-co' },
  { label: 'Đồng Hồ Nữ Dây Da', href: '/nu?category=nu-day-da' },
  { label: 'Đồng Hồ Luxury Nữ', href: '/nu?category=nu-luxury' },
];

export class MainNavbar {
  constructor() {
    this._el = null;
    this._cartListener = () => this.updateCartCount();
    this._authListener = null;
  }

  updateActiveLinks() {
    if (!this._el) return;
    const currentPath = window.location.pathname;

    // Highlights normal links on mobile
    this._el.querySelectorAll('.mobile-link').forEach((link) => {
      const href = link.getAttribute('href');
      if (href) {
        const isActive = href === currentPath || (currentPath.startsWith(href) && href !== '/');
        if (isActive) {
          link.classList.add('bg-[#C9A961]/8', 'border-l-[3px]', 'border-[#C9A961]', 'text-[#C9A961]');
          link.classList.remove('text-zinc-800');
        } else {
          link.classList.remove('bg-[#C9A961]/8', 'border-l-[3px]', 'border-[#C9A961]', 'text-[#C9A961]');
          const textClass = (link.innerText?.toUpperCase().includes('SALE')) ? 'text-[#C9A961]' : 'text-zinc-800';
          link.classList.add(textClass);
        }
      }
    });

    // Auto-opens and highlights current categories matching URL path on mobile
    this._el.querySelectorAll('.mobile-accordion').forEach((acc) => {
      const content = acc.querySelector('.mobile-accordion-content');
      const toggle = acc.querySelector('.mobile-accordion-toggle');
      const chevron = toggle?.querySelector('.accordion-chevron');

      let hasActiveChild = false;
      acc.querySelectorAll('.mobile-sublink').forEach((sublink) => {
        const href = sublink.getAttribute('href');
        const isActive = href && currentPath === href;
        if (isActive) {
          sublink.classList.add('text-[#C9A961]', 'font-bold');
          sublink.classList.remove('text-zinc-650');
          hasActiveChild = true;
        } else {
          sublink.classList.remove('text-[#C9A961]', 'font-bold');
          sublink.classList.add('text-zinc-650');
        }
      });

      if (content && toggle) {
        if (hasActiveChild) {
          content.style.maxHeight = `${content.scrollHeight}px`;
          chevron?.classList.add('rotate-180');
          toggle.classList.add('bg-[#C9A961]/8', 'border-l-[3px]', 'border-[#C9A961]', 'text-[#C9A961]');
          toggle.classList.remove('text-zinc-800');
        } else {
          content.style.maxHeight = '0px';
          chevron?.classList.remove('rotate-180');
          toggle.classList.remove('bg-[#C9A961]/8', 'border-l-[3px]', 'border-[#C9A961]', 'text-[#C9A961]');
          toggle.classList.add('text-zinc-800');
        }
      }
    });

    // Highlights desktop links
    this._el.querySelectorAll('.nav-link-a').forEach((link) => {
      const href = link.getAttribute('href');
      const isActive = href && (href === currentPath || (currentPath.startsWith(href) && href !== '/'));
      link.classList.toggle('active-nav', !!isActive);
      if (isActive) {
        link.classList.add('text-[#C9A961]');
        link.classList.remove('text-[#0A0A0A]');
      } else {
        link.classList.remove('text-[#C9A961]');
        link.classList.add('text-[#0A0A0A]');
      }
    });

    // Highlights desktop dropdown buttons and child links
    this._el.querySelectorAll('.nav-dropdown').forEach((dd) => {
      const btn = dd.querySelector('button.nav-link');
      if (!btn) return;
      let isDropdownActive = false;
      dd.querySelectorAll('.dd-link').forEach((link) => {
        const href = link.getAttribute('href');
        const isActive = href && (href === currentPath || (currentPath.startsWith(href) && href !== '/'));
        link.classList.toggle('active-nav', !!isActive);
        if (isActive) isDropdownActive = true;
      });
      btn.classList.toggle('active-nav', isDropdownActive);
      if (isDropdownActive) {
        btn.classList.add('text-[#C9A961]');
        btn.classList.remove('text-[#0A0A0A]');
      } else {
        btn.classList.remove('text-[#C9A961]');
        btn.classList.add('text-[#0A0A0A]');
      }
    });
  }

  updateCartCount() {
    const count = cartService.getCount();

    // Desktop cart badge
    const badge = document.getElementById('nav-cart-badge');
    const cartBtn = document.getElementById('nav-cart-btn');
    if (badge) {
      const oldCount = parseInt(badge.textContent) || 0;
      badge.textContent = count;
      badge.classList.toggle('hidden', count <= 0);
      badge.classList.toggle('flex', count > 0);

      if (count > oldCount && cartBtn) {
        cartBtn.classList.remove('animate-cart-bounce');
        void cartBtn.offsetWidth;
        cartBtn.classList.add('animate-cart-bounce');
        setTimeout(() => cartBtn.classList.remove('animate-cart-bounce'), 650);
      }
    }

    // Mobile cart badge
    const mobileBadge = document.getElementById('mobile-cart-badge');
    const mobileCartBtn = document.getElementById('mobile-cart-btn');
    if (mobileBadge) {
      mobileBadge.textContent = count;
      mobileBadge.classList.toggle('hidden', count <= 0);
      mobileBadge.classList.toggle('flex', count > 0);

      if (count > 0 && mobileCartBtn) {
        mobileCartBtn.classList.remove('animate-cart-bounce');
        void mobileCartBtn.offsetWidth;
        mobileCartBtn.classList.add('animate-cart-bounce');
        setTimeout(() => mobileCartBtn.classList.remove('animate-cart-bounce'), 650);
      }
    }
  }

  render() {
    // Add dynamic style for active links if not already present
    if (!document.getElementById('navbar-active-link-styles')) {
      const style = document.createElement('style');
      style.id = 'navbar-active-link-styles';
      style.textContent = `
        .nav-dropdown>button.active-nav::after,
        .nav-link-a.active-nav::after {
          transform: scaleX(1) !important;
        }
        .dd-link.active-nav {
          color: #C9A961 !important;
          border-left-color: #C9A961 !important;
          background-color: rgba(201, 169, 97, 0.08) !important;
        }
      `;
      document.head.appendChild(style);
    }

    const nav = document.createElement('nav');
    nav.id = 'main-navbar';
    nav.className = 'sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-md transition-all duration-300';
    nav.innerHTML = this._html();
    this._el = nav;

    // Bind events before moving elements to ensure query selectors find them
    this._bindEvents(nav);

    // Move sidebar, overlay, and search overlay to body to prevent stacking context bugs with backdrop-blur
    const overlay = nav.querySelector('#sidebar-overlay');
    const sidebar = nav.querySelector('#mobile-sidebar');
    const searchOverlay = nav.querySelector('#search-overlay');

    // Clean up old elements from body if they exist from previous renders
    document.getElementById('sidebar-overlay')?.remove();
    document.getElementById('mobile-sidebar')?.remove();
    document.getElementById('search-overlay')?.remove();

    if (overlay) document.body.appendChild(overlay);
    if (sidebar) document.body.appendChild(sidebar);
    if (searchOverlay) document.body.appendChild(searchOverlay);

    // Shrink header scroll listener
    const onScroll = () => {
      const container = nav.querySelector('#navbar-container');
      if (window.scrollY > 40) {
        nav.classList.add('navbar-shrunk');
        if (container) {
          container.classList.remove('h-20');
          container.classList.add('h-16');
        }
      } else {
        nav.classList.remove('navbar-shrunk');
        if (container) {
          container.classList.remove('h-16');
          container.classList.add('h-20');
        }
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    window.removeEventListener('cart-updated', this._cartListener);
    window.addEventListener('cart-updated', this._cartListener);
    return nav;
  }

  _megaMenuHtml(gender) {
    const isNam = gender === 'nam';
    const subcats = isNam ? NAM_SUBS : NU_SUBS;
    const bannerImg = isNam
      ? 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=400'
      : 'https://images.pexels.com/photos/2113994/pexels-photo-2113994.jpeg?auto=compress&cs=tinysrgb&w=400';
    const bannerTitle = isNam ? 'Tissot T-Race Automatic' : 'Seiko Conceptual Gold';
    const bannerPriceOriginal = isNam ? '13.500.000đ' : '3.990.000đ';
    const bannerPriceSale = isNam ? '11.990.000đ' : '3.490.000đ';
    const bannerLink = isNam ? '/san-pham/tissot-t-race-automatic-t1154072704100' : '/san-pham/seiko-conceptual-srz528p1';

    // Round 2 high-fidelity SVGs (pocket watch, smartwatch, chronograph, crown)
    const icons = [
      // Đồng Hồ Cổ: Roman numerals vintage pocket watch outline
      `<svg class="w-7 h-7 text-[#C9A961] transition duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="13" r="8"/><path d="M12 5V2M10 2h4M12 9v4l2.5 1.5"/></svg>`,
      // Điện Tử: smartwatch outline with display screen
      `<svg class="w-7 h-7 text-[#C9A961] transition duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="6" width="12" height="12" rx="2.5"/><path d="M9 6V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M9 18v3a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-3M9 10h6M9 14h3"/></svg>`,
      // Thể Thao: chronograph stopwatch outline with 3 sub-dials
      `<svg class="w-7 h-7 text-[#C9A961] transition duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="13" r="8"/><path d="M12 5V2M10 2h4M8.5 5.5L7 7M15.5 5.5L17 7M12 9v4l2 1.5"/><circle cx="12" cy="11" r="1.5"/><circle cx="10" cy="14" r="1.5"/><circle cx="14" cy="14" r="1.5"/></svg>`,
      // Luxury: crown outline
      `<svg class="w-7 h-7 text-[#C9A961] transition duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 18l1.5-9 4.5 4 3-6 3 6 4.5-4 1.5 9H3z" stroke-linejoin="round"/><circle cx="4.5" cy="9" r="1"/><circle cx="9" cy="13" r="1"/><circle cx="12" cy="7" r="1"/><circle cx="15" cy="13" r="1"/><circle cx="19.5" cy="9" r="1"/></svg>`
    ];

    const listSubcats = subcats.map((item, idx) => {
      return `
        <a href="${item.href}" class="dd-link flex items-center gap-3 border-l-2 border-transparent hover:bg-[#C9A961]/8 hover:border-[#C9A961] rounded-r-xl px-4 py-3 text-sm font-semibold text-zinc-700 transition duration-200 hover:text-[#C9A961] whitespace-nowrap">
          ${icons[idx] || icons[0]}
          ${item.label}
        </a>
      `;
    }).join('');

    return `
      <!-- Column 1: Subcategories -->
      <div class="w-[260px] shrink-0">
        <h4 class="mb-4 text-[11px] font-bold uppercase tracking-[0.05em] text-[#8B7355]">
          Danh mục nổi bật
          <div class="h-0.5 w-6 bg-[#C9A961] mt-2"></div>
        </h4>
        <div class="space-y-1">
          ${listSubcats}
        </div>
      </div>

      <!-- Separator 1 -->
      <div class="w-px bg-[#F0EBE0] self-stretch my-4"></div>

      <!-- Column 2: Brands -->
      <div class="flex-1 min-w-[200px] px-2">
        <h4 class="mb-4 text-[11px] font-bold uppercase tracking-[0.05em] text-[#8B7355]">
          Thương hiệu
          <div class="h-0.5 w-6 bg-[#C9A961] mt-2"></div>
        </h4>
        <div class="space-y-1">
          ${(() => {
            let menuBrands = [];
            if (gender === 'nam') {
              menuBrands = window.APP_SETTINGS?.menu_brands_nam && window.APP_SETTINGS.menu_brands_nam.length > 0
                ? window.APP_SETTINGS.menu_brands_nam
                : (window.APP_SETTINGS?.menu_brands && window.APP_SETTINGS.menu_brands.length > 0
                  ? window.APP_SETTINGS.menu_brands
                  : []);
            } else if (gender === 'nu') {
              menuBrands = window.APP_SETTINGS?.menu_brands_nu && window.APP_SETTINGS.menu_brands_nu.length > 0
                ? window.APP_SETTINGS.menu_brands_nu
                : (window.APP_SETTINGS?.menu_brands && window.APP_SETTINGS.menu_brands.length > 0
                  ? window.APP_SETTINGS.menu_brands
                  : []);
            } else {
              menuBrands = window.APP_SETTINGS?.menu_brands && window.APP_SETTINGS.menu_brands.length > 0
                ? window.APP_SETTINGS.menu_brands
                : [];
            }
            
            if (!menuBrands || menuBrands.length === 0) {
              menuBrands = [
                { label: 'Carnival Premium', brand_key: 'carnival', icon_type: 'polygon' },
                { label: 'Casio Watch', brand_key: 'casio', icon_type: 'rect' },
                { label: 'Kemil New', brand_key: 'kemil', icon_type: 'star' }
              ];
            }
            const BRAND_ICONS = {
              polygon: `<svg class="w-5 h-5 text-zinc-400 group-hover/link:text-[#C9A961] group-hover/link:scale-110 transition duration-300" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><polygon points="12,2 19,5 22,12 19,19 12,22 5,19 2,12 5,5"/><path d="M9 10h4M9 14h4M9 10v4" stroke-linecap="round"/></svg>`,
              rect: `<svg class="w-5 h-5 text-zinc-400 group-hover/link:text-[#C9A961] group-hover/link:scale-110 transition duration-300" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/><line x1="9" y1="6" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="18"/></svg>`,
              star: `<svg class="w-5 h-5 text-zinc-400 group-hover/link:text-[#C9A961] group-hover/link:scale-110 transition duration-300" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M12 3l1 4 4 1-4 1-1 4-1-4-4-1 4-1z" stroke-linejoin="round"/></svg>`
            };
            return menuBrands.map(b => `
              <a href="/${gender}?brand=${b.brand_key}" class="group/link flex h-9 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 hover:text-[#C9A961]">
                ${BRAND_ICONS[b.icon_type] || BRAND_ICONS.star}
                ${b.label}
              </a>
            `).join('');
          })()}
        </div>
      </div>

      <!-- Separator 2 -->
      <div class="w-px bg-[#F0EBE0] self-stretch my-4"></div>

      <!-- Column 3: Price range -->
      <div class="flex-1 min-w-[200px] px-2">
        <h4 class="mb-4 text-[11px] font-bold uppercase tracking-[0.05em] text-[#8B7355]">
          Khoảng giá
          <div class="h-0.5 w-6 bg-[#C9A961] mt-2"></div>
        </h4>
        <div class="space-y-1">
          <a href="/${gender}?price_max=5000000" class="flex h-9 items-center justify-between rounded-xl px-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 hover:text-[#C9A961]">
            <span>Dưới 5 triệu</span>
            <span class="text-zinc-400 text-xs font-normal">(23)</span>
          </a>
          <a href="/${gender}?price_min=5000000&price_max=15000000" class="flex h-9 items-center justify-between rounded-xl px-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 hover:text-[#C9A961]">
            <span>5 - 15 triệu</span>
            <span class="text-zinc-400 text-xs font-normal">(45)</span>
          </a>
          <a href="/${gender}?price_min=15000000&price_max=50000000" class="flex h-9 items-center justify-between rounded-xl px-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 hover:text-[#C9A961]">
            <span>15 - 50 triệu</span>
            <span class="text-zinc-400 text-xs font-normal">(19)</span>
          </a>
          <a href="/${gender}?price_min=50000000" class="flex h-9 items-center justify-between rounded-xl px-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 hover:text-[#C9A961]">
            <span>Trên 50 triệu</span>
            <span class="text-zinc-400 text-xs font-normal">(12)</span>
          </a>
          <a href="/${gender}?price_min=100000000" class="flex h-9 items-center justify-between rounded-xl px-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 hover:text-[#C9A961]">
            <span>Trên 100 triệu</span>
            <span class="text-zinc-400 text-xs font-normal">(8)</span>
          </a>
        </div>
      </div>

      <!-- Separator 3 -->
      <div class="w-px bg-[#F0EBE0] self-stretch my-4"></div>

      <!-- Column 4: Showcase -->
      <div class="w-[280px] shrink-0 pl-2 flex flex-col justify-start gap-4">
        <div>
          <h4 class="mb-4 text-[11px] font-bold uppercase tracking-[0.05em] text-[#8B7355]">
            Nổi bật nhất
            <div class="h-0.5 w-6 bg-[#C9A961] mt-2"></div>
          </h4>
          <div class="group/item relative overflow-hidden rounded-2xl bg-zinc-50/50 p-3 hover:bg-zinc-50 transition border border-zinc-100">
            <span class="absolute top-3 left-3 bg-[#C9A961] text-white px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-[0.12em] leading-none z-10">BESTSELLER</span>
            <img src="${bannerImg}" alt="${bannerTitle}" class="h-32 w-full object-contain mix-blend-multiply transition duration-500 group-hover/item:scale-105" />
            <h5 class="mt-2.5 text-xs font-bold text-zinc-900 truncate">${bannerTitle}</h5>
            <div class="mt-1.5 flex items-baseline gap-2">
              <span class="line-through text-zinc-400 text-xs font-medium">${bannerPriceOriginal}</span>
              <span class="text-[#C9A961] font-bold text-sm">${bannerPriceSale}</span>
            </div>
          </div>
        </div>
        <a href="${bannerLink}" class="dd-link flex h-11 items-center justify-center gap-2 rounded-[4px] bg-zinc-950 px-4 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#C9A961] transition duration-300 hover:bg-[#C9A961] hover:text-zinc-950 shadow-md">
          Xem bộ sưu tập
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
        </a>
      </div>
    `;
  }

  _html() {
    const brandName = window.APP_SETTINGS?.brand_name || 'Venix Watch';
    const logoUrl = window.APP_SETTINGS?.logo_url || '';
    const user = authService.getUser();
    const hasAdminRole = user && user.roles && user.roles.some(r => {
      const name = (typeof r === 'object' && r !== null) ? r.name : r;
      return name === 'super_admin' || name === 'admin' || name === 'editor';
    });
    const canEditSettings = user && (
      (user.permissions && user.permissions.includes('settings:write')) || hasAdminRole
    );

    const menuItems = window.APP_SETTINGS?.navigation_menu || [
      {
        "label": "ĐỒNG HỒ NAM",
        "href": "/nam",
        "children": NAM_SUBS
      },
      {
        "label": "ĐỒNG HỒ NỮ",
        "href": "/nu",
        "children": NU_SUBS
      },
      {
        "label": "PHỤ KIỆN",
        "href": "/phu-kien",
        "children": []
      },
      {
        "label": "SALE",
        "href": "/sale",
        "children": [],
        "badge": "HOT"
      },
      {
        "label": "CHÍNH SÁCH",
        "href": "/van-chuyen",
        "children": [
          { "label": "Về Chúng Tôi", "href": "/gioi-thieu" },
          { "label": "Chính Sách Vận Chuyển", "href": "/van-chuyen" },
          { "label": "Đổi Trả & Hoàn Tiền", "href": "/doi-tra" },
          { "label": "Chính Sách Bảo Hành", "href": "/bao-hanh" },
          { "label": "Chính Sách Bảo Mật", "href": "/bao-mat" },
          { "label": "Điều Khoản Dịch Vụ", "href": "/dieu-khoan" },
          { "label": "Hỏi Đáp (FAQ)", "href": "/faq" }
        ]
      }
    ];

    // Auto-append CHÍNH SÁCH if not configured explicitly in navigation_menu
    if (!menuItems.some(item => item.href === '/van-chuyen' || item.label.toLowerCase() === 'chính sách')) {
      const policyItem = {
        "label": "CHÍNH SÁCH",
        "href": "/van-chuyen",
        "children": [
          { "label": "Về Chúng Tôi", "href": "/gioi-thieu" },
          { "label": "Chính Sách Vận Chuyển", "href": "/van-chuyen" },
          { "label": "Đổi Trả & Hoàn Tiền", "href": "/doi-tra" },
          { "label": "Chính Sách Bảo Hành", "href": "/bao-hanh" },
          { "label": "Chính Sách Bảo Mật", "href": "/bao-mat" },
          { "label": "Điều Khoản Dịch Vụ", "href": "/dieu-khoan" },
          { "label": "Hỏi Đáp (FAQ)", "href": "/faq" }
        ]
      };

      const newsIdx = menuItems.findIndex(item => item.href === '/tin-tuc' || item.label.toLowerCase() === 'tin tức');
      if (newsIdx !== -1) {
        menuItems.splice(newsIdx, 0, policyItem);
      } else {
        menuItems.push(policyItem);
      }
    }

    // Auto-append TIN TỨC if not configured explicitly in navigation_menu
    if (!menuItems.some(item => item.href === '/tin-tuc' || item.label.toLowerCase() === 'tin tức')) {
      menuItems.push({
        "label": "TIN TỨC",
        "href": "/tin-tuc",
        "children": []
      });
    }

    const desktopMenuHtml = menuItems.map(item => {
      const hasChildren = item.children && item.children.length > 0;
      const isNam = item.label.toUpperCase() === 'ĐỒNG HỒ NAM' || item.href === '/nam';
      const isNu = item.label.toUpperCase() === 'ĐỒNG HỒ NỮ' || item.href === '/nu';

      if (hasChildren) {
        if (isNam || isNu) {
          const genderKey = isNam ? 'nam' : 'nu';
          return `
            <div class="nav-dropdown group/menu py-6">
              <button class="nav-link flex items-center gap-1 text-sm font-semibold uppercase tracking-[0.1em] text-[#0A0A0A] hover:text-[#C9A961] transition duration-300 outline-none">
                ${item.label}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="group-hover/menu:rotate-180 transition-transform duration-300"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div class="mega-menu absolute left-1/2 top-[100%] z-50 w-[calc(100%-48px)] xl:w-full max-w-[1344px] -translate-x-1/2 opacity-0 invisible -translate-y-2 group-hover/menu:opacity-100 group-hover/menu:visible group-hover/menu:translate-y-0 transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] border-t-2 border-[#C9A961] bg-white py-8 px-10 rounded-b-[8px] flex gap-6" style="box-shadow: 0 12px 32px rgba(0,0,0,0.08);">
                ${this._megaMenuHtml(genderKey)}
              </div>
            </div>
          `;
        } else {
          return `
            <div class="nav-dropdown group/menu relative py-6">
              <button class="nav-link flex items-center gap-1 text-sm font-semibold uppercase tracking-[0.1em] text-[#0A0A0A] hover:text-[#C9A961] transition duration-300 outline-none">
                ${item.label}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="group-hover/menu:rotate-180 transition-transform duration-300"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div class="mega-menu absolute left-0 top-[100%] z-50 w-56 opacity-0 invisible -translate-y-2 group-hover/menu:opacity-100 group-hover/menu:visible group-hover/menu:translate-y-0 transition-all duration-[200ms] border-t-2 border-[#C9A961] bg-white py-2 rounded-b-[8px] flex flex-col" style="box-shadow: 0 8px 24px rgba(0,0,0,0.08);">
                ${item.children.map(child => `
                  <a href="${child.href}" class="dd-link px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-[#C9A961] transition-colors">
                    ${child.label}
                  </a>
                `).join('')}
              </div>
            </div>
          `;
        }
      } else {
        return `
          <a href="${item.href}" class="nav-link-a flex items-center text-sm font-semibold uppercase tracking-[0.1em] text-[#0A0A0A] hover:text-[#C9A961] transition duration-300">
            ${item.label}
            ${item.badge ? `<span class="ml-1.5 inline-flex items-center rounded-full bg-[#C9A961] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-zinc-950 leading-none">${item.badge}</span>` : ''}
          </a>
        `;
      }
    }).join('');

    const mobileMenuHtml = menuItems.map((item, idx) => {
      const hasChildren = item.children && item.children.length > 0;
      if (hasChildren) {
        let icon = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
        if (item.label.toUpperCase().includes('NỮ')) {
          icon = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
        } else if (item.label.toUpperCase().includes('CHÍNH SÁCH')) {
          icon = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>`;
        }
        return `
          <div class="mobile-accordion">
            <button class="mobile-accordion-toggle flex h-14 w-full items-center justify-between px-6 text-[15px] font-medium tracking-[0.08em] text-zinc-800 transition hover:bg-zinc-50 outline-none">
              <span class="flex items-center gap-4">
                ${icon}
                ${item.label}
              </span>
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="accordion-chevron transition-transform duration-300"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="mobile-accordion-content max-h-0 overflow-hidden transition-all duration-300 bg-zinc-50/50 pl-14">
              ${item.children.map(child => `
                <a href="${child.href}" class="mobile-sublink flex h-10 items-center text-sm text-zinc-600 transition hover:text-[#C9A961]">${child.label}</a>
              `).join('')}
            </div>
          </div>
        `;
      } else {
        let icon = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>`;
        if (item.label.toUpperCase().includes('SALE') || item.label.toUpperCase().includes('KHUYẾN MÃI')) {
          icon = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.125 1.125 0 001.591 0l4.318-4.318a1.125 1.125 0 000-1.591L9.568 4.591A2.25 2.25 0 009.568 3z" /></svg>`;
        } else if (item.label.toUpperCase().includes('TIN TỨC') || item.label.toUpperCase().includes('BLOG')) {
          icon = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>`;
        }
        const textClass = (item.label.toUpperCase().includes('SALE') || item.label.toUpperCase().includes('KHUYẾN MÃI')) ? 'text-[#C9A961]' : 'text-zinc-800';
        return `
          <a href="${item.href}" class="mobile-link flex h-14 items-center gap-4 px-6 text-[15px] font-medium tracking-[0.08em] ${textClass} transition hover:bg-zinc-50">
            ${icon}
            ${item.label}
            ${item.badge ? `<span class="ml-1 inline-flex items-center rounded-full bg-[#C9A961] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-zinc-950 leading-none">${item.badge}</span>` : ''}
          </a>
        `;
      }
    }).join('');

    return `
      <!-- DESKTOP NAVBAR -->
      <div id="navbar-container" class="mx-auto hidden h-20 w-full max-w-[1440px] items-center justify-between gap-8 px-12 lg:flex transition-all duration-300">
        <!-- Logo (Left) -->
        <div class="flex items-center gap-2">
          <a href="/" id="nav-logo-wrap" class="flex items-center gap-2.5">
            ${logoUrl ? `<div class="h-9 w-9 flex items-center justify-center rounded-full bg-zinc-950 border border-zinc-800 shadow-sm overflow-hidden p-1.5"><img src="${logoUrl}" alt="${brandName}" class="h-full w-full object-contain" /></div>` : `
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-gold, #C9A961)" stroke-width="1.5" class="animate-pulse">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            `}
            <span class="font-serif text-xl font-bold tracking-[0.08em] text-[#0A0A0A] hover:text-[#C9A961] transition duration-300">${brandName}</span>
          </a>
          ${canEditSettings ? `
            <button type="button" id="quick-edit-logo-desktop" class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm border border-[#E8E4DC] hover:bg-[#C9A84C] hover:text-white hover:border-[#C9A84C] text-[#A88840] transition-all shadow-sm cursor-pointer ml-1.5" title="Chỉnh sửa logo & thương hiệu">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button type="button" id="quick-edit-menu-desktop" class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm border border-[#E8E4DC] hover:bg-[#C9A84C] hover:text-white hover:border-[#C9A84C] text-[#A88840] transition-all shadow-sm cursor-pointer ml-1" title="Chỉnh sửa Menu">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          ` : ''}
        </div>

        <!-- Menu (Center) -->
        <div class="flex items-center gap-10">
          ${desktopMenuHtml}
        </div>

        <!-- Actions (Right) -->
        <div class="flex items-center gap-6">
          <button id="nav-search-btn" title="Tìm kiếm" class="text-[#0A0A0A] transition hover:text-[#C9A961] focus:text-[#C9A961] outline-none">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
          
          <a href="/tai-khoan" title="Tài khoản" class="dd-link text-[#0A0A0A] transition hover:text-[#C9A961] focus:text-[#C9A961] outline-none flex items-center gap-1.5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            ${authService.getUser() ? `<span class="nav-user-name text-xs font-semibold text-[#0A0A0A] hidden md:inline max-w-[120px] truncate ml-1">${authService.getUser().name || authService.getUser().full_name}</span>` : ''}
          </a>

          <button id="nav-cart-btn" title="Giỏ hàng" class="relative text-[#0A0A0A] transition hover:text-[#C9A961] focus:text-[#C9A961] outline-none">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <span id="nav-cart-badge" class="absolute -right-2 -top-1.5 hidden min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#C9A961] px-1 text-[9px] font-black text-zinc-950 leading-none">0</span>
          </button>
        </div>
      </div>

      <!-- MOBILE NAVBAR (breakpoint < 1024px) -->
      <div class="lg:hidden flex h-16 w-full items-center justify-between px-6 bg-white shadow-sm border-b border-zinc-100">
        <!-- Hamburger (left) -->
        <button id="nav-hamburger" class="inline-flex h-10 w-10 items-center justify-center rounded-full text-zinc-900 transition hover:text-[#C9A961] outline-none" title="Menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>

        <!-- Logo (center) -->
        <div class="flex items-center gap-1.5 justify-center">
          <a href="/" id="mobile-logo" class="flex items-center gap-2 font-serif text-base font-bold tracking-[0.08em] text-zinc-950 uppercase">
            ${logoUrl ? `<div class="h-7 w-7 flex items-center justify-center rounded-full bg-zinc-950 border border-zinc-800 shadow-sm overflow-hidden p-1"><img src="${logoUrl}" alt="${brandName}" class="h-full w-full object-contain" /></div>` : `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-gold, #C9A961)" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            `}
            <span>${brandName}</span>
          </a>
          ${canEditSettings ? `
            <button type="button" id="quick-edit-logo-mobile" class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm border border-[#E8E4DC] hover:bg-[#C9A84C] hover:text-white hover:border-[#C9A84C] text-[#A88840] transition-all shadow-sm cursor-pointer ml-1" title="Chỉnh sửa logo & thương hiệu">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button type="button" id="quick-edit-menu-mobile" class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm border border-[#E8E4DC] hover:bg-[#C9A84C] hover:text-white hover:border-[#C9A84C] text-[#A88840] transition-all shadow-sm cursor-pointer ml-0.5" title="Chỉnh sửa Menu">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          ` : ''}
        </div>

        <!-- Cart (right) -->
        <button id="mobile-cart-btn" class="relative inline-flex h-10 w-10 items-center justify-center text-zinc-900 transition hover:text-[#C9A961] outline-none" title="Giỏ hàng">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <span id="mobile-cart-badge" class="absolute right-0 top-0 hidden min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#C9A961] px-1 text-[9px] font-black text-zinc-950 leading-none">0</span>
        </button>
      </div>

      <!-- FULL-SCREEN SEARCH OVERLAY -->
      <div id="search-overlay" class="fixed inset-0 z-[100] hidden bg-zinc-950/95 backdrop-blur-md opacity-0 transition-opacity duration-300 flex items-center justify-center">
        <button id="close-search" class="absolute top-8 right-8 text-white hover:text-[#C9A961] transition duration-300 outline-none" title="Đóng">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="w-full max-w-4xl px-8 flex flex-col gap-6 text-center">
          <span class="text-xs font-black uppercase tracking-[0.18em] text-[#C9A961]">Bạn đang tìm kiếm gì?</span>
          <div class="relative border-b-2 border-zinc-700 focus-within:border-[#C9A84C] transition duration-300">
            <input id="search-overlay-input" type="text" placeholder="Gõ tên đồng hồ hoặc thương hiệu..." class="w-full py-4 bg-transparent text-white text-2xl font-medium outline-none text-center placeholder-zinc-600" />
            <svg class="absolute right-0 top-1/2 -translate-y-1/2 text-[#C9A84C]" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <p class="text-xs text-zinc-500">Ấn <kbd class="px-1.5 py-0.5 rounded bg-zinc-900 font-sans border border-zinc-800 text-zinc-400">Enter</kbd> để tìm kiếm hoặc <kbd class="px-1.5 py-0.5 rounded bg-zinc-900 font-sans border border-zinc-800 text-zinc-400">ESC</kbd> để đóng</p>
        </div>
      </div>

      <!-- MOBILE DRAWER SIDEBAR & BACKDROP OVERLAY -->
      <div id="sidebar-overlay" class="fixed inset-0 z-[60] hidden bg-black/50 backdrop-blur-sm opacity-0 transition-opacity duration-300"></div>
      
      <aside id="mobile-sidebar" class="fixed inset-y-0 right-0 z-[70] hidden w-[85vw] max-w-sm translate-x-full border-l border-zinc-200 bg-white transition-transform duration-300 ease-out flex flex-col">
        <!-- Drawer Header -->
        <div class="h-16 flex items-center justify-between border-b border-[#C9A961] px-6 shrink-0">
          <span class="flex items-center gap-2 font-serif text-base font-bold tracking-[0.08em] text-zinc-950">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A961" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            MENU
          </span>
          <button id="close-sidebar" class="inline-flex h-10 w-10 items-center justify-center rounded-full text-zinc-800 transition hover:text-[#C9A961] outline-none">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto py-4 space-y-4" data-lenis-prevent>
          <!-- Navigation list with accordion sub-menus -->
          <div class="space-y-1">
            ${mobileMenuHtml}
          </div>

          <!-- Divider -->
          <div class="mx-6 my-4 h-px bg-zinc-100"></div>

          <!-- User links -->
          <div class="space-y-1">
            <a href="/tai-khoan" class="mobile-link flex h-14 items-center gap-4 px-6 text-[15px] font-medium tracking-[0.08em] text-zinc-800 transition hover:bg-zinc-50">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span class="mobile-user-name">${authService.getUser() ? (authService.getUser().name || authService.getUser().full_name) : 'TÀI KHOẢN'}</span>
            </a>

            <!-- Giỏ hàng -->
            <a href="/gio-hang" class="mobile-link flex h-14 items-center gap-4 px-6 text-[15px] font-medium tracking-[0.08em] text-zinc-800 transition hover:bg-zinc-50">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
              GIỎ HÀNG
            </a>
          </div>
        </div>

        <!-- Drawer Bottom (Actions & Socials) -->
        <div class="p-6 border-t border-zinc-100 bg-zinc-50 shrink-0 space-y-4">
          <!-- Search input bar inside drawer bottom -->
          <div class="relative">
            <input id="drawer-search-input" type="text" placeholder="Tìm kiếm đồng hồ..." class="w-full h-11 pl-4 pr-10 text-sm bg-white rounded-xl border border-zinc-200 outline-none transition focus:border-[#C9A961]" />
            <button id="drawer-search-submit" class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#C9A961]" title="Tìm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
          </div>

          <!-- Zalo & Hotline Buttons -->
          <div class="flex gap-2.5">
            <a href="tel:0929000063" class="flex-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C9A961] to-[#A88840] hover:from-[#A88840] hover:to-[#C9A961] text-xs font-bold uppercase tracking-[0.12em] text-zinc-950 shadow-md shadow-[#C9A961]/15 transition duration-300">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.44 2 2 0 0 1 3.62 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.84a16 16 0 0 0 6.08 6.08l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.03z"/></svg>
              Hotline
            </a>
            <a href="https://zalo.me/0929000063" target="_blank" rel="noopener noreferrer" class="flex-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C9A961] to-[#A88840] hover:from-[#A88840] hover:to-[#C9A961] text-xs font-bold uppercase tracking-[0.12em] text-zinc-950 shadow-md shadow-[#C9A961]/15 transition duration-300">
              Zalo Chat
            </a>
          </div>

          <!-- Socials Row -->
          <div class="flex items-center justify-center gap-6 pt-2">
            <a href="#" class="text-zinc-400 hover:text-[#C9A961] transition" title="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="#" class="text-zinc-400 hover:text-[#C9A961] transition" title="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a href="#" class="text-zinc-400 hover:text-[#C9A961] transition" title="TikTok">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12a4 4 0 1 0 4 4V4h4v4h-4v4z"/></svg>
            </a>
          </div>
        </div>
      </aside>
    `;
  }

  _bindEvents(nav) {
    // Quick edit logo brand
    nav.querySelector('#quick-edit-logo-desktop')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openQuickSettings('brand');
    });
    nav.querySelector('#quick-edit-logo-mobile')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openQuickSettings('brand');
    });

    // Quick edit menu
    nav.querySelector('#quick-edit-menu-desktop')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openQuickSettings('menu');
    });
    nav.querySelector('#quick-edit-menu-mobile')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openQuickSettings('menu');
    });

    // Nav Dropdown Hover Effects with staggered items fade in support
    nav.querySelectorAll('.nav-dropdown').forEach((dd) => {
      const menu = dd.querySelector('.mega-menu');
      let hideTimer;
      dd.addEventListener('mouseenter', () => {
        clearTimeout(hideTimer);
        menu.classList.remove('invisible', 'opacity-0', '-translate-y-2');
        menu.classList.add('visible', 'opacity-100', 'translate-y-0');
      });
      dd.addEventListener('mouseleave', () => {
        hideTimer = setTimeout(() => {
          menu.classList.remove('visible', 'opacity-100', 'translate-y-0');
          menu.classList.add('invisible', 'opacity-0', '-translate-y-2');
        }, 150);
      });
    });

    // Normal nav anchor links routing
    nav.querySelectorAll('.dd-link, .nav-link-a, #nav-logo, #mobile-logo').forEach((a) => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (href && !href.startsWith('#')) {
          e.preventDefault();
          e.stopPropagation();
          navigate(href);
        }
      });
    });

    // Cart buttons triggers
    nav.querySelector('#nav-cart-btn')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('open-cart'));
    });
    nav.querySelector('#mobile-cart-btn')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('open-cart'));
    });

    // ─── Search Overlay bindings ───
    const searchOverlay = nav.querySelector('#search-overlay');
    const searchInput = nav.querySelector('#search-overlay-input');
    const closeSearch = nav.querySelector('#close-search');

    const openSearch = () => {
      searchOverlay.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        searchOverlay.classList.remove('opacity-0');
        searchOverlay.classList.add('opacity-100');
        searchInput?.focus();
      });
    };

    const closeSearchFn = () => {
      searchOverlay.classList.remove('opacity-100');
      searchOverlay.classList.add('opacity-0');
      setTimeout(() => {
        if (searchOverlay.classList.contains('opacity-0')) {
          searchOverlay.classList.add('hidden');
          document.body.style.overflow = '';
        }
      }, 300);
    };

    nav.querySelector('#nav-search-btn')?.addEventListener('click', openSearch);
    closeSearch?.addEventListener('click', closeSearchFn);
    searchOverlay?.addEventListener('click', (e) => {
      if (e.target === searchOverlay) closeSearchFn();
    });

    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = searchInput.value.trim();
        if (q) {
          navigate(`/tim-kiem?search=${encodeURIComponent(q)}`);
          closeSearchFn();
        }
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !searchOverlay.classList.contains('hidden')) {
        closeSearchFn();
      }
    });

    // ─── Mobile Sidebar Drawer bindings ───
    const hamburger = nav.querySelector('#nav-hamburger');
    const sidebar = nav.querySelector('#mobile-sidebar');
    const overlay = nav.querySelector('#sidebar-overlay');
    const closeSidebar = nav.querySelector('#close-sidebar');

    const openSidebar = () => {
      sidebar.classList.remove('hidden');
      overlay.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        sidebar.classList.remove('translate-x-full');
        overlay.classList.remove('opacity-0');
        overlay.classList.add('opacity-100');
      });
    };

    const closeSidebarFn = () => {
      sidebar.classList.add('translate-x-full');
      overlay.classList.remove('opacity-100');
      overlay.classList.add('opacity-0');
      document.body.style.overflow = '';
      setTimeout(() => {
        if (sidebar.classList.contains('translate-x-full')) {
          sidebar.classList.add('hidden');
          overlay.classList.add('hidden');
        }
      }, 300);
    };

    hamburger?.addEventListener('click', openSidebar);
    closeSidebar?.addEventListener('click', closeSidebarFn);
    overlay?.addEventListener('click', closeSidebarFn);

    nav.querySelectorAll('.mobile-link, .mobile-sublink').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeSidebarFn();
        const href = a.getAttribute('href');
        if (href) navigate(href);
      });
    });

    // Mobile Drawer accordion lists toggle
    nav.querySelectorAll('.mobile-accordion-toggle').forEach((toggle) => {
      toggle.addEventListener('click', () => {
        const content = toggle.nextElementSibling;
        const chevron = toggle.querySelector('.accordion-chevron');
        const isOpen = content.style.maxHeight && content.style.maxHeight !== '0px';

        // Close all other accordions first
        nav.querySelectorAll('.mobile-accordion-content').forEach((otherContent) => {
          otherContent.style.maxHeight = '0px';
          otherContent.previousElementSibling.querySelector('.accordion-chevron')?.classList.remove('rotate-180');
        });

        if (isOpen) {
          content.style.maxHeight = '0px';
          chevron?.classList.remove('rotate-180');
        } else {
          content.style.maxHeight = `${content.scrollHeight}px`;
          chevron?.classList.add('rotate-180');
        }
      });
    });

    // Auto-highlight active links and toggle matching accordions on load
    this.updateActiveLinks();

    // Drawer integrated search actions
    const drawerSearchInput = nav.querySelector('#drawer-search-input');
    const drawerSearchSubmit = nav.querySelector('#drawer-search-submit');

    const handleDrawerSearch = () => {
      const q = drawerSearchInput?.value.trim();
      if (q) {
        closeSidebarFn();
        navigate(`/tim-kiem?search=${encodeURIComponent(q)}`);
      }
    };

    drawerSearchSubmit?.addEventListener('click', handleDrawerSearch);
    drawerSearchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleDrawerSearch();
      }
    });

    // Auth changed listener to update user display dynamically
    const handleAuthChange = (e) => {
      const user = e.detail?.user || null;
      
      // Update desktop name
      const accountLink = nav.querySelector('.dd-link[href="/tai-khoan"]');
      if (accountLink) {
        let nameSpan = accountLink.querySelector('.nav-user-name');
        if (user) {
          const name = user.name || user.full_name || '';
          if (!nameSpan) {
            nameSpan = document.createElement('span');
            nameSpan.className = 'nav-user-name text-xs font-semibold text-[#0A0A0A] hidden md:inline max-w-[120px] truncate ml-1';
            accountLink.appendChild(nameSpan);
          }
          nameSpan.textContent = name;
        } else {
          nameSpan?.remove();
        }
      }

      // Update mobile sidebar name
      const mobileAccountLabel = document.querySelector('#mobile-sidebar .mobile-user-name');
      if (mobileAccountLabel) {
        mobileAccountLabel.textContent = user ? (user.name || user.full_name) : 'TÀI KHOẢN';
      }
    };

    window.removeEventListener('auth-changed', this._authListener);
    window.addEventListener('auth-changed', handleAuthChange);
    this._authListener = handleAuthChange;

    this.updateCartCount();
  }
}
