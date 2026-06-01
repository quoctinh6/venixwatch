import { PEXELS, resolveImageUrl } from '../../services/config.js';
import { navigate, throttle } from '../../utils/helpers.js';
import { authService } from '../../services/authService.js';
import { openQuickSettings } from '../../components/QuickSettingsModal.js?v=1.0.5';

export class CategoryBanners {
  render() {
    const user = authService.getUser();
    const hasAdminRole = user && user.roles && user.roles.some(r => {
      const name = (typeof r === 'object' && r !== null) ? r.name : r;
      return name === 'super_admin' || name === 'admin' || name === 'editor';
    });
    const canEditSettings = user && (
      (user.permissions && user.permissions.includes('settings:write')) || hasAdminRole
    );

    const section = document.createElement('section');
    section.className = 'pb-10 font-sans sm:pb-14 lg:pb-16 overflow-hidden relative';

    if (canEditSettings) {
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'absolute right-8 top-2 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 border border-zinc-200 text-[#A88840] hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all shadow-md cursor-pointer';
      editBtn.title = 'Chỉnh sửa Danh Mục Nổi Bật';
      editBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
      editBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openQuickSettings('sections', 'category_banners');
      });
      section.appendChild(editBtn);
    }

    const container = document.createElement('div');
    container.className = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8';

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5';

    const defaultImgs = [PEXELS.CATEGORY_NAM, PEXELS.CATEGORY_NU, PEXELS.CATEGORY_PHU_KIEN];
    const cb = window.APP_SETTINGS?.home_sections?.category_banners || [
      {
        img: PEXELS.CATEGORY_NAM,
        title: 'Đồng Hồ Nam',
        subtitle: 'Mạnh mẽ. Lịch lãm. Đẳng cấp.',
        href: '/nam',
      },
      {
        img: PEXELS.CATEGORY_NU,
        title: 'Đồng Hồ Nữ',
        subtitle: 'Thanh lịch. Tinh tế. Quyến rũ.',
        href: '/nu',
      },
      {
        img: PEXELS.CATEGORY_PHU_KIEN,
        title: 'Phụ Kiện',
        subtitle: 'Dây đeo. Hộp đựng. Phụ kiện cao cấp.',
        href: '/phu-kien',
      },
    ];

    cb.forEach((category, idx) => {
      const defaultImg = defaultImgs[idx] || PEXELS.CATEGORY_NAM;
      const imgUrl = resolveImageUrl(category.img) || defaultImg;
      const item = document.createElement('article');
      item.className = 'group relative aspect-[4/5] cursor-pointer overflow-hidden rounded-2xl';
      item.innerHTML = `
        <!-- Image Parallax Wrapper -->
        <div class="absolute inset-0 overflow-hidden rounded-2xl">
          <img src="${imgUrl}" alt="${category.title}"
            class="parallax-img h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
            style="will-change: transform;"
            loading="lazy"
            onerror="this.src='${PEXELS.PRODUCT_1}'" />
        </div>
        
        <!-- Overlays -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-all duration-500 group-hover:opacity-90"></div>
        <div class="absolute inset-0 bg-zinc-950/0 transition-all duration-500 group-hover:bg-zinc-950/40"></div>
        
        <!-- Golden Corner-drawn Borders -->
        <div class="category-border category-border-top absolute top-4 left-4 right-4 h-[1.5px] bg-[#C9A961]"></div>
        <div class="category-border category-border-bottom absolute bottom-4 left-4 right-4 h-[1.5px] bg-[#C9A961]"></div>
        <div class="category-border category-border-left absolute top-4 bottom-4 left-4 w-[1.5px] bg-[#C9A961]"></div>
        <div class="category-border category-border-right absolute top-4 bottom-4 right-4 w-[1.5px] bg-[#C9A961]"></div>
        
        <!-- Content -->
        <div class="absolute inset-x-0 bottom-0 p-5 sm:p-6 z-20">
          <p class="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">Danh Mục</p>
          <h3 class="text-2xl font-black uppercase tracking-[0.05em] text-white sm:text-[28px]">${category.title}</h3>
          <p class="mt-2 max-w-xs text-sm leading-6 text-white/75">${category.subtitle}</p>
          <span class="shop-now-btn mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-white transition-all duration-300 group-hover:text-[#C9A961]">
            Shop Now
            <span class="inline-block transition-transform duration-300 group-hover:translate-x-2">→</span>
          </span>
        </div>
      `;

      item.addEventListener('click', () => navigate(category.href));
      grid.appendChild(item);
    });

    container.appendChild(grid);
    section.appendChild(container);

    this._initParallax(section);
    return section;
  }

  _initParallax(section) {
    if (window.innerWidth <= 1024) return;
    this._onScroll = throttle(() => {
      const rect = section.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;

      const images = section.querySelectorAll('.parallax-img');
      images.forEach((img) => {
        const speed = 0.05;
        const relativeScroll = (window.innerHeight - rect.top) * speed;
        // Thêm scale(1.1) để trừ hao việc ảnh di dịch bị hở cạnh
        img.style.transform = `translateY(${relativeScroll - 16}px) scale(1.1)`;
      });
    }, 16);
    window.addEventListener('scroll', this._onScroll, { passive: true });
  }

  destroy() {
    if (this._onScroll) {
      window.removeEventListener('scroll', this._onScroll);
      this._onScroll = null;
    }
  }
}
