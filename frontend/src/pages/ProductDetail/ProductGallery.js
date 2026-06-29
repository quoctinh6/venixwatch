import { icon, normalizeImages } from './ProductDetailShared.js';

export default class ProductGallery {
  constructor(product) {
    this._product = product;
    this._images = normalizeImages(product.images || [product.image]);
    this._index = 0;
    this._touchX = 0;
  }

  render() {
    const wrap = document.createElement('section');
    wrap.className = 'grid gap-4 lg:grid-cols-[88px_minmax(0,1fr)] lg:gap-5 lg:sticky lg:top-24 lg:self-start';
    wrap.innerHTML = `
      <div class="order-2 flex gap-3 overflow-x-auto pb-1 lg:order-1 lg:flex-col lg:overflow-visible">
        ${this._images.map((src, index) => `
          <button type="button" data-thumb="${index}" class="group shrink-0 overflow-hidden rounded-[8px] border bg-[#FAF8F3] ${
            index === 0 ? 'border-[#C9A961] ring-2 ring-[#C9A961]/20' : 'border-[#E8E4DC]'
          }">
            <img src="${src}" alt="${this._product.name} ${index + 1}" loading="${index === 0 ? 'eager' : 'lazy'}" class="h-20 w-20 object-cover transition duration-300 group-hover:scale-105"/>
          </button>
        `).join('')}
      </div>

      <div class="order-1 space-y-3">
        <div class="relative overflow-hidden rounded-[12px] border border-[#E8E4DC] bg-[#FAF8F3]">
          <div class="absolute left-4 top-4 z-10 flex gap-2">
            ${String(this._product.badge || '').toUpperCase() === 'NEW' ? '<span class="rounded-[4px] bg-[#C9A961] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">NEW</span>' : ''}
            ${this._discount() > 0 ? `<span class="rounded-[4px] bg-[#DC2626] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">-${this._discount()}%</span>` : ''}
          </div>
          <button type="button" data-open-lightbox class="group aspect-square w-full" aria-label="Mở ảnh sản phẩm toàn màn hình">
            <div data-stage class="relative h-full w-full overflow-hidden lg:hover:pdp-lens-active">
              <img data-main-image src="${this._images[0]}" alt="${this._product.name}" class="h-full w-full object-cover transition duration-300"/>
            </div>
          </button>
          <div class="absolute inset-x-4 bottom-4 flex items-center justify-between">
            <button type="button" data-open-lightbox class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#0A0A0A] shadow-sm backdrop-blur" aria-label="Phóng to ảnh">
              ${icon('plus', 'h-4 w-4')}
            </button>
            <button type="button" class="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#0A0A0A] shadow-sm backdrop-blur" aria-label="Xem video 360 độ">
              ${icon('arrowRight', 'h-3.5 w-3.5')} 360°
            </button>
          </div>
        </div>

        <div class="flex items-center justify-center gap-2 lg:hidden">
          ${this._images.map((_, index) => `<button type="button" data-dot="${index}" class="h-2 rounded-full ${index === 0 ? 'w-6 bg-[#C9A961]' : 'w-2 bg-zinc-300'}" aria-label="Chuyển ảnh ${index + 1}"></button>`).join('')}
        </div>
      </div>

      <div data-lightbox class="fixed inset-0 z-[99999] hidden bg-black/95 p-4 md:p-8">
        <div class="relative flex h-full w-full items-center justify-center">
          <button type="button" data-close-lightbox class="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 transition duration-200" aria-label="Đóng xem ảnh">
            ${icon('plus', 'h-5 w-5 rotate-45')}
          </button>
          <button type="button" data-prev class="absolute left-4 top-1/2 z-10 -translate-y-1/2 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 transition duration-200" aria-label="Ảnh trước">
            ${icon('chevron', 'h-5 w-5 rotate-180')}
          </button>
          <img data-lightbox-image src="${this._images[0]}" alt="${this._product.name}" class="max-h-[92vh] max-w-[92vw] rounded-[8px] object-contain shadow-2xl transition duration-300 md:max-h-[88vh] md:max-w-[82vw] select-none"/>
          <button type="button" data-next class="absolute right-4 top-1/2 z-10 -translate-y-1/2 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 transition duration-200" aria-label="Ảnh sau">
            ${icon('chevron', 'h-5 w-5')}
          </button>
        </div>
      </div>
    `;
    this._bind(wrap);
    this._element = wrap;
    return wrap;
  }

  updateProduct(product) {
    this._product = product;
    this._images = normalizeImages(product.images || [product.image]);
    this._index = 0;
    
    if (this._element) {
      if (this._onKeyDown) {
        document.removeEventListener('keydown', this._onKeyDown);
        this._onKeyDown = null;
      }
      
      const newGallery = this.render();
      this._element.replaceWith(newGallery);
      this._element = newGallery;
    }
  }

  _bind(root) {
    const mainImage = root.querySelector('[data-main-image]');
    const stage = root.querySelector('[data-stage]');
    const lightbox = root.querySelector('[data-lightbox]');
    const lightboxImage = root.querySelector('[data-lightbox-image]');

    if (lightbox) {
      // Escape the sticky stacking context completely by moving the lightbox to document.body
      // Clean up any stale lightbox from a previous render to avoid duplicate elements
      const staleLightbox = document.body.querySelector('[data-lightbox]');
      if (staleLightbox && staleLightbox !== lightbox) {
        staleLightbox.remove();
      }
      document.body.appendChild(lightbox);
    }

    const openLightbox = () => {
      if (lightbox) {
        lightbox.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
      }
    };

    const closeLightbox = () => {
      if (lightbox) {
        lightbox.classList.add('hidden');
        document.body.style.overflow = '';
      }
    };

    const refresh = () => {
      mainImage.src = this._images[this._index];
      lightboxImage.src = this._images[this._index];
      root.querySelectorAll('[data-thumb]').forEach((thumb, index) => {
        thumb.className = `group shrink-0 overflow-hidden rounded-[8px] border bg-[#FAF8F3] ${
          index === this._index ? 'border-[#C9A961] ring-2 ring-[#C9A961]/20' : 'border-[#E8E4DC]'
        }`;
      });
      root.querySelectorAll('[data-dot]').forEach((dot, index) => {
        dot.className = `h-2 rounded-full ${index === this._index ? 'w-6 bg-[#C9A961]' : 'w-2 bg-zinc-300'}`;
      });
    };

    root.querySelectorAll('[data-thumb]').forEach((button) => {
      button.addEventListener('click', () => { this._index = Number(button.dataset.thumb); refresh(); });
    });
    root.querySelectorAll('[data-dot]').forEach((button) => {
      button.addEventListener('click', () => { this._index = Number(button.dataset.dot); refresh(); });
    });
    root.querySelectorAll('[data-open-lightbox]').forEach((button) => {
      button.addEventListener('click', openLightbox);
    });

    if (lightbox) {
      lightbox.querySelector('[data-close-lightbox]')?.addEventListener('click', closeLightbox);
      lightbox.querySelector('[data-prev]')?.addEventListener('click', () => { this._index = (this._index + this._images.length - 1) % this._images.length; refresh(); });
      lightbox.querySelector('[data-next]')?.addEventListener('click', () => { this._index = (this._index + 1) % this._images.length; refresh(); });

      // Close lightbox when clicking outside on the dark backdrop
      lightbox.addEventListener('click', (e) => {
        // If they click on the backdrop, the container, or anywhere that is not the image or buttons, close it
        if (e.target === lightbox || e.target.classList.contains('relative') || (!e.target.closest('img') && !e.target.closest('button'))) {
          closeLightbox();
        }
      });
    }

    this._onKeyDown = (e) => {
      if (!lightbox || lightbox.classList.contains('hidden')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') {
        this._index = (this._index + this._images.length - 1) % this._images.length;
        refresh();
      }
      if (e.key === 'ArrowRight') {
        this._index = (this._index + 1) % this._images.length;
        refresh();
      }
    };
    document.addEventListener('keydown', this._onKeyDown);
  }

  destroy() {
    if (this._onKeyDown) {
      document.removeEventListener('keydown', this._onKeyDown);
      this._onKeyDown = null;
    }
    const lightbox = document.querySelector('[data-lightbox]');
    if (lightbox) {
      lightbox.remove();
    }

    stage?.addEventListener('mousemove', (e) => {
      if (window.innerWidth < 1024) return;
      const rect = stage.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      mainImage.style.transformOrigin = `${x}% ${y}%`;
      stage.classList.add('pdp-lens-active');
    });
    stage?.addEventListener('mouseleave', () => {
      stage.classList.remove('pdp-lens-active');
      mainImage.style.transformOrigin = 'center center';
    });
    stage?.addEventListener('touchstart', (e) => { this._touchX = e.changedTouches[0]?.clientX || 0; }, { passive: true });
    stage?.addEventListener('touchend', (e) => {
      const delta = (e.changedTouches[0]?.clientX || 0) - this._touchX;
      if (Math.abs(delta) < 40) return;
      this._index = delta < 0 ? (this._index + 1) % this._images.length : (this._index + this._images.length - 1) % this._images.length;
      refresh();
    }, { passive: true });
  }

  _discount() {
    if (!this._product.sale_price || this._product.sale_price >= this._product.price) return 0;
    return Math.round(((this._product.price - this._product.sale_price) / this._product.price) * 100);
  }
}
