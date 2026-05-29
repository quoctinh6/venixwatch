import { navigate, throttle } from '../../utils/helpers.js';
import { PEXELS } from '../../services/config.js';
import { authService } from '../../services/authService.js';
import { openQuickSettings } from '../../components/QuickSettingsModal.js';

const SLIDES = [
  {
    img: PEXELS.HERO_1,
    eyebrow: 'Bộ Sưu Tập Mới 2025',
    title: 'Đỉnh Cao Tinh Xảo',
    subtitle: 'Khám phá những mẫu đồng hồ chính hãng cao cấp được tuyển chọn kỹ lưỡng nhất.',
    cta: 'Khám Phá Ngay',
    ctaHref: '/nam',
  },
  {
    img: PEXELS.HERO_2,
    eyebrow: 'Phong Cách Vĩnh Cửu',
    title: 'Thời Gian Là Nghệ Thuật',
    subtitle: 'Mỗi chiếc đồng hồ là một tác phẩm nghệ thuật, nói lên cá tính riêng của bạn.',
    cta: 'Xem Bộ Sưu Tập',
    ctaHref: '/nu',
  },
  {
    img: PEXELS.HERO_3,
    eyebrow: 'Sale - Đến 40% Off',
    title: 'Ưu Đãi Không Thể Bỏ Lỡ',
    subtitle: 'Những mẫu hot nhất, giá tốt nhất. Số lượng có hạn - đặt hàng ngay hôm nay.',
    cta: 'Mua Ngay',
    ctaHref: '/sale',
  },
];

function staggerText(text) {
  let charIndex = 0;
  return text.split(' ').map((word) => {
    const wordHtml = word.split('').map((char) => {
      const html = `<span class="inline-block animate-char" style="--char-index: ${charIndex};">${char}</span>`;
      charIndex++;
      return html;
    }).join('');
    return `<span class="inline-block whitespace-nowrap">${wordHtml}</span>`;
  }).join('<span class="inline-block">&nbsp;</span>');
}

function renderTitle(text) {
  return window.matchMedia('(max-width: 639px)').matches ? text : staggerText(text);
}

export class Hero {
  constructor() {
    this._current = 0;
    this._autoplayTimer = null;
    this._slideEls = [];
    this._clockTimer = null;
    this._el = null;

    // Load dynamic banners or fallback to default
    const dynamicBanners = window.APP_SETTINGS?.hero_banners;
    this._slides = Array.isArray(dynamicBanners) && dynamicBanners.length > 0 
      ? dynamicBanners 
      : SLIDES;
  }

  render() {
    const section = document.createElement('section');
    section.id = 'hero-section';
    section.className = 'relative isolate min-h-[520px] overflow-hidden sm:min-h-[620px] lg:h-[calc(100vh-96px)] lg:max-h-[760px]';

    const user = authService.getUser();
    const hasAdminRole = user && user.roles && user.roles.some(r => {
      const name = (typeof r === 'object' && r !== null) ? r.name : r;
      return name === 'super_admin' || name === 'admin' || name === 'editor';
    });
    const canEditSettings = user && (
      (user.permissions && user.permissions.includes('settings:write')) || hasAdminRole
    );

    this._slides.forEach((slide, i) => {
      const el = document.createElement('div');
      el.className = `hero-slide absolute inset-0 transition-opacity duration-700 ${i === 0 ? 'opacity-100' : 'pointer-events-none opacity-0'}`;
      el.innerHTML = `
        <div class="hero-img-wrap absolute inset-0 overflow-hidden">
          <div class="ken-burns-wrapper w-full h-full">
            <img src="${slide.img}" alt="${slide.eyebrow}"
              class="h-full w-full object-cover object-center transition-transform duration-150 will-change-transform"
              loading="${i === 0 ? 'eager' : 'lazy'}" />
          </div>
        </div>
        <div class="absolute inset-0 bg-black/45"></div>
        <div class="absolute inset-0 flex items-center justify-center px-4 py-12 sm:px-8">
          <div class="mx-auto flex max-w-3xl flex-col items-center text-center">
            <p class="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75 sm:mb-5 sm:text-xs">${slide.eyebrow}</p>
            <h1 class="max-w-[12ch] text-balance text-[clamp(2.5rem,8vw,4.5rem)] font-black uppercase leading-[1.02] tracking-[0.04em] text-white sm:max-w-none sm:text-5xl lg:text-7xl">
               ${renderTitle(slide.title)}
            </h1>
            <p class="hero-subtitle mt-4 max-w-[32ch] text-sm leading-6 text-white/85 sm:mt-6 sm:max-w-xl sm:text-base sm:leading-7">${slide.subtitle}</p>
            <a href="${slide.ctaHref}" data-hero-cta
              class="hero-cta mt-8 inline-flex h-12 items-center justify-center rounded-none px-8 text-xs font-bold uppercase tracking-[0.12em] text-white sm:h-14 sm:px-10">
              ${slide.cta}
            </a>
          </div>
        </div>
        ${canEditSettings ? `
          <button type="button" data-edit-slide="${i}" class="absolute top-24 right-6 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950/60 hover:bg-[#C9A84C] hover:text-white border border-white/20 text-[#C9A961] hover:scale-110 transition-all shadow-lg pointer-events-auto cursor-pointer animate-fade-in" title="Chỉnh sửa slide này">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        ` : ''}
      `;
      section.appendChild(el);
      this._slideEls.push(el);
    });

    const prevBtn = this._arrowBtn('left');
    const nextBtn = this._arrowBtn('right');
    prevBtn.addEventListener('click', () => this._goTo((this._current - 1 + this._slides.length) % this._slides.length));
    nextBtn.addEventListener('click', () => this._goTo((this._current + 1) % this._slides.length));
    section.appendChild(prevBtn);
    section.appendChild(nextBtn);

    const dots = document.createElement('div');
    dots.id = 'hero-dots';
    dots.className = 'absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2 sm:bottom-8';
    this._slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = `${i === 0 ? 'w-6 bg-amber-500' : 'w-2 bg-white/60'} h-2 rounded-full transition-all`;
      dot.addEventListener('click', () => this._goTo(i));
      dots.appendChild(dot);
    });
    section.appendChild(dots);

    section.appendChild(this._buildWatchFace());

    this._el = section;
    this._startAutoplay();

    setTimeout(() => {
      section.querySelectorAll('[data-hero-cta]').forEach((a) => {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          navigate(a.getAttribute('href'));
        });
      });
      // Bind quick edit slide buttons
      section.querySelectorAll('[data-edit-slide]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const slideIdx = parseInt(btn.getAttribute('data-edit-slide'), 10);
          openQuickSettings('banner', slideIdx);
        });
      });
    }, 0);

    this._initParallax();
    return section;
  }

  _arrowBtn(dir) {
    const btn = document.createElement('button');
    btn.className = `absolute top-1/2 z-10 hidden h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur sm:inline-flex ${dir === 'left' ? 'left-5 sm:left-8' : 'right-5 sm:right-8'}`;
    btn.style.cssText = 'transform: translateY(-50%); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); will-change: transform;';
    btn.innerHTML = dir === 'left'
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>`;

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-50%) scale(1.2)';
      btn.style.borderColor = '#C9A961';
      btn.style.color = '#C9A961';
      btn.style.backgroundColor = 'rgba(9, 9, 11, 0.8)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(-50%)';
      btn.style.borderColor = '';
      btn.style.color = '';
      btn.style.backgroundColor = '';
    });

    return btn;
  }

  _goTo(index) {
    this._slideEls[this._current].classList.add('pointer-events-none', 'opacity-0');
    this._slideEls[this._current].classList.remove('opacity-100');
    this._current = index;
    this._slideEls[this._current].classList.remove('pointer-events-none', 'opacity-0');
    this._slideEls[this._current].classList.add('opacity-100');
    this._updateDots();
    this._resetAutoplay();
  }

  _updateDots() {
    const dots = document.getElementById('hero-dots');
    if (!dots) return;
    dots.querySelectorAll('button').forEach((dot, i) => {
      dot.className = `${i === this._current ? 'w-6 bg-[#C9A961]' : 'w-2 bg-white/60'} h-2 rounded-full transition-all`;
    });
  }

  _startAutoplay() {
    this._autoplayTimer = setInterval(() => {
      this._goTo((this._current + 1) % this._slides.length);
    }, 5000);
  }

  _resetAutoplay() {
    clearInterval(this._autoplayTimer);
    this._startAutoplay();
  }

  _initParallax() {
    const onScroll = throttle(() => {
      const offset = window.scrollY;
      this._slideEls.forEach((slide) => {
        const img = slide.querySelector('img');
        if (img) img.style.transform = `translateY(${offset * 0.18}px) scale(1.02)`;
      });
    }, 16);
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  _buildWatchFace() {
    const wrap = document.createElement('div');
    wrap.className = 'absolute bottom-8 right-4 z-10 hidden h-10 w-10 opacity-70 transition-opacity duration-300 pointer-events-auto cursor-help hover:opacity-100 sm:bottom-10 sm:right-8 sm:block sm:h-12 sm:w-12';
    wrap.innerHTML = `
      <svg id="hero-watch" viewBox="0 0 96 96" class="h-full w-full">
        <circle cx="48" cy="48" r="44" fill="rgba(26,26,26,0.75)" stroke="#C9A961" stroke-width="1.5"/>
        ${Array.from({ length: 12 }, (_, i) => {
          const angle = (i * 30) * Math.PI / 180;
          const r1 = 38;
          const r2 = 42;
          const x1 = 48 + r1 * Math.sin(angle);
          const y1 = 48 - r1 * Math.cos(angle);
          const x2 = 48 + r2 * Math.sin(angle);
          const y2 = 48 - r2 * Math.cos(angle);
          return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#C9A961" stroke-width="${i % 3 === 0 ? 1.5 : 0.75}" opacity="0.9"/>`;
        }).join('')}
        <line id="wf-hour" x1="48" y1="48" x2="48" y2="26" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
        <line id="wf-min" x1="48" y1="48" x2="48" y2="20" stroke="#fff" stroke-width="1.75" stroke-linecap="round"/>
        <line id="wf-sec" x1="48" y1="48" x2="48" y2="16" stroke="#C9A961" stroke-width="1.25" stroke-linecap="round"/>
        <circle cx="48" cy="48" r="2.5" fill="#C9A961"/>
      </svg>
    `;

    this._startClock(wrap);
    return wrap;
  }

  _startClock(wrap) {
    const tick = () => {
      const now = new Date();
      const h = now.getHours() % 12;
      const m = now.getMinutes();
      const s = now.getSeconds();
      const hDeg = (h * 30) + (m * 0.5);
      const mDeg = m * 6;
      const sDeg = s * 6;

      const setHand = (id, deg, cx, cy, len) => {
        const el = wrap.querySelector(id);
        if (!el) return;
        const rad = deg * Math.PI / 180;
        el.setAttribute('x2', (cx + len * Math.sin(rad)).toFixed(2));
        el.setAttribute('y2', (cy - len * Math.cos(rad)).toFixed(2));
      };

      setHand('#wf-hour', hDeg, 48, 48, 22);
      setHand('#wf-min', mDeg, 48, 48, 28);
      setHand('#wf-sec', sDeg, 48, 48, 32);
    };

    tick();
    this._clockTimer = setInterval(tick, 1000);
  }
}
