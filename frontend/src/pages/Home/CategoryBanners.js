import { PEXELS } from '../../services/config.js';
import { navigate, throttle } from '../../utils/helpers.js';

const CATEGORIES = [
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

export class CategoryBanners {
  render() {
    const section = document.createElement('section');
    section.className = 'pb-10 font-sans sm:pb-14 lg:pb-16 overflow-hidden';

    const container = document.createElement('div');
    container.className = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8';

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5';

    CATEGORIES.forEach((category) => {
      const item = document.createElement('article');
      item.className = 'group relative aspect-[4/5] cursor-pointer overflow-hidden rounded-2xl';
      item.innerHTML = `
        <!-- Image Parallax Wrapper -->
        <div class="absolute inset-0 overflow-hidden rounded-2xl">
          <img src="${category.img}" alt="${category.title}"
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
    const onScroll = throttle(() => {
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
    window.addEventListener('scroll', onScroll, { passive: true });
  }
}
