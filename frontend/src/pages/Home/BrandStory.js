import { PEXELS } from '../../services/config.js';
import { navigate, throttle } from '../../utils/helpers.js';
import { authService } from '../../services/authService.js';
import { openQuickSettings } from '../../components/QuickSettingsModal.js?v=1.0.4';

export class BrandStory {
  render() {
    const bs = window.APP_SETTINGS?.home_sections?.brand_story || {
      title: "Phong Cách Không Cần Phải Đắt",
      subtitle: "Kể từ năm 2012",
      description: "Chúng tôi tự hào là đơn vị cung cấp các mẫu đồng hồ Casio, Seiko, Orient chính hãng uy tín hàng đầu Việt Nam. Mỗi chiếc đồng hồ trao đi là một lời cam kết về chất lượng và chế độ bảo hành hậu mãi tận tâm nhất.",
      button_label: "Tìm hiểu thêm",
      button_href: "/lien-he",
      image_url: PEXELS.BRAND_STORY
    };

    const yearMatch = (bs.subtitle || '').match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : '2012';

    const user = authService.getUser();
    const hasAdminRole = user && user.roles && user.roles.some(r => {
      const name = (typeof r === 'object' && r !== null) ? r.name : r;
      return name === 'super_admin' || name === 'admin' || name === 'editor';
    });
    const canEditSettings = user && (
      (user.permissions && user.permissions.includes('settings:write')) || hasAdminRole
    );

    const section = document.createElement('section');
    section.className = 'bg-white py-12 font-sans sm:py-16 lg:py-20 overflow-hidden relative';

    if (canEditSettings) {
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'absolute right-8 top-4 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 border border-zinc-200 text-[#A88840] hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all shadow-md cursor-pointer';
      editBtn.title = 'Chỉnh sửa Câu Chuyện Thương Hiệu';
      editBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
      editBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openQuickSettings('sections', 'brand_story');
      });
      section.appendChild(editBtn);
    }

    const container = document.createElement('div');
    container.className = 'mx-auto grid max-w-7xl grid-cols-1 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm lg:grid-cols-2';

    const imgWrap = document.createElement('div');
    imgWrap.className = 'group relative min-h-[340px] overflow-hidden sm:min-h-[420px] lg:min-h-[560px]';
    imgWrap.innerHTML = `
      <div class="absolute inset-0 overflow-hidden">
        <img src="${bs.image_url || PEXELS.BRAND_STORY}" alt="Câu chuyện thương hiệu"
          class="parallax-img h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
          style="will-change: transform; transform-origin: center;"
          loading="lazy"
          onerror="this.src='${PEXELS.PRODUCT_1}'" />
      </div>
      <div class="absolute inset-0 bg-gradient-to-br from-[#C9A961]/15 to-transparent"></div>
      <div class="luxury-floating-badge absolute bottom-4 left-4 rounded-2xl bg-[#C9A961] px-4 py-3 text-zinc-950 shadow-lg sm:bottom-8 sm:left-8 z-10" style="will-change: transform;">
        <div class="text-3xl font-black leading-none">${year}</div>
        <div class="mt-1 text-[10px] font-bold uppercase tracking-[0.05em]">Thành Lập</div>
      </div>
    `;

    const content = document.createElement('div');
    content.className = 'flex flex-col justify-center p-6 sm:p-8 lg:p-12';
    content.innerHTML = `
      <p class="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#C9A961]">${bs.subtitle || ''}</p>

      <h2 class="brand-story-heading text-3xl font-black leading-tight tracking-[0.05em] text-zinc-950 sm:text-4xl">
        <span class="block overflow-hidden"><span class="heading-line">${bs.title || ''}</span></span>
      </h2>
      
      <div class="mt-5 h-1 w-12 bg-[#C9A961]"></div>
      
      <div class="mt-6 text-sm leading-8 text-zinc-600 font-medium space-y-4">
        ${(bs.description || '').split('\n').map(p => `<p>${p}</p>`).join('')}
      </div>

      <!-- Stats Counters with scroll triggering -->
      <div class="mt-8 grid grid-cols-3 gap-4 rounded-2xl border-y border-zinc-200 py-5 text-center">
        <div>
          <div class="counter-val text-2xl font-black text-[#C9A961] sm:text-3xl" data-target="500" data-suffix="+">0+</div>
          <div class="mt-2 text-[10px] font-semibold uppercase tracking-[0.05em] text-zinc-500">Thương Hiệu</div>
        </div>
        <div>
          <div class="counter-val text-2xl font-black text-[#C9A961] sm:text-3xl" data-target="15" data-suffix="K+">0K+</div>
          <div class="mt-2 text-[10px] font-semibold uppercase tracking-[0.05em] text-zinc-500">Khách Hàng</div>
        </div>
        <div>
          <div class="counter-val text-2xl font-black text-[#C9A961] sm:text-3xl" data-target="15" data-suffix=" Năm">0 Năm</div>
          <div class="mt-2 text-[10px] font-semibold uppercase tracking-[0.05em] text-zinc-500">Kinh Nghiệm</div>
        </div>
      </div>

      <button class="brand-cta mt-8 inline-flex h-12 items-center justify-center self-start rounded-xl border border-zinc-900 px-6 text-xs font-bold uppercase tracking-[0.12em] text-zinc-900 transition hover:bg-zinc-900 hover:text-white">
        ${bs.button_label || 'Xem Chi Tiết'}
      </button>
    `;

    content.querySelector('.brand-cta').addEventListener('click', () => navigate(bs.button_href || '/gioi-thieu'));

    container.appendChild(imgWrap);
    container.appendChild(content);
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

      const img = section.querySelector('.parallax-img');
      if (img) {
        const speed = 0.06;
        const relativeScroll = (window.innerHeight - rect.top) * speed;
        img.style.transform = `translateY(${relativeScroll - 16}px) scale(1.15)`;
      }
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
