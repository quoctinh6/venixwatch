import { PEXELS } from '../../services/config.js';
import { navigate, throttle } from '../../utils/helpers.js';

export class BrandStory {
  render() {
    const section = document.createElement('section');
    section.className = 'bg-white py-12 font-sans sm:py-16 lg:py-20 overflow-hidden';

    const container = document.createElement('div');
    container.className = 'mx-auto grid max-w-7xl grid-cols-1 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm lg:grid-cols-2';

    const imgWrap = document.createElement('div');
    imgWrap.className = 'group relative min-h-[340px] overflow-hidden sm:min-h-[420px] lg:min-h-[560px]';
    imgWrap.innerHTML = `
      <div class="absolute inset-0 overflow-hidden">
        <img src="${PEXELS.BRAND_STORY}" alt="Câu chuyện thương hiệu Venix Watch"
          class="parallax-img h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
          style="will-change: transform; transform-origin: center;"
          loading="lazy"
          onerror="this.src='${PEXELS.PRODUCT_1}'" />
      </div>
      <div class="absolute inset-0 bg-gradient-to-br from-[#C9A961]/15 to-transparent"></div>
      <div class="luxury-floating-badge absolute bottom-4 left-4 rounded-2xl bg-[#C9A961] px-4 py-3 text-zinc-950 shadow-lg sm:bottom-8 sm:left-8 z-10" style="will-change: transform;">
        <div class="text-3xl font-black leading-none">2010</div>
        <div class="mt-1 text-[10px] font-bold uppercase tracking-[0.05em]">Thành Lập</div>
      </div>
    `;

    const content = document.createElement('div');
    content.className = 'flex flex-col justify-center p-6 sm:p-8 lg:p-12';
    content.innerHTML = `
      <p class="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#C9A961]">Câu Chuyện Của Chúng Tôi</p>

      <!-- Heading Reveal by Line -->
      <h2 class="brand-story-heading text-3xl font-black leading-tight tracking-[0.05em] text-zinc-950 sm:text-4xl">
        <span class="block overflow-hidden"><span class="heading-line">Phong Cách Không</span></span>
        <span class="block overflow-hidden"><span class="heading-line" style="transition-delay: 0.12s;">Cần Phải Đắt</span></span>
      </h2>
      
      <div class="mt-5 h-1 w-12 bg-[#C9A961]"></div>
      <p class="mt-6 text-sm leading-8 text-zinc-600">
        <strong>Venix Watch</strong> được thành lập vào năm 2010 với mục tiêu đưa những mẫu đồng hồ chính hãng cao cấp đến gần hơn với người Việt Nam.
      </p>
      <p class="mt-4 text-sm leading-8 text-zinc-600">
        Mỗi sản phẩm đều được tuyển chọn kỹ lưỡng về chất lượng, câu chuyện và giá trị sử dụng. Chúng tôi tin rằng thời gian là thứ quý giá nhất và đồng hồ là cách đẹp để giữ nó bên mình.
      </p>

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
        Tìm Hiểu Thêm
      </button>
    `;

    content.querySelector('.brand-cta').addEventListener('click', () => navigate('/gioi-thieu'));

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
