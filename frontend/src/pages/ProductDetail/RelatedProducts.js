import { cartService } from '../../services/cartService.js';
import { formatPrice, navigate } from '../../utils/helpers.js';
import { icon, PDP_FALLBACK_IMAGES } from './ProductDetailShared.js';
import { resolveImageUrl } from '../../services/config.js';

export default class RelatedProducts {
  constructor({ related, crossSell, recently }) {
    this._sections = [
      { key: 'related', title: 'Có thể bạn cũng thích', items: related || [], arrows: true },
      { key: 'cross', title: 'Sản phẩm gợi ý', items: crossSell || [], arrows: true },
      { key: 'recent', title: 'Bạn đã xem gần đây', items: recently || [], arrows: true },
    ].filter((section) => section.items.length && (section.key !== 'recent' || section.items.length >= 3));
  }

  render() {
    const wrap = document.createElement('section');
    wrap.className = 'space-y-10';
    wrap.innerHTML = this._sections.map((section) => `
      <div data-section="${section.key}" class="space-y-5">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-2xl font-bold tracking-[0.02em] text-[#0A0A0A]">${section.title}</h2>
          ${section.arrows ? `<div class="hidden items-center gap-2 md:flex">
            <button type="button" data-rail-prev="${section.key}" class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E8E4DC] bg-white shadow-sm transition-all duration-300 hover:scale-105 hover:bg-[#0A0A0A] hover:text-white hover:border-[#0A0A0A]">${icon('chevron', 'h-4 w-4 rotate-180')}</button>
            <button type="button" data-rail-next="${section.key}" class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E8E4DC] bg-white shadow-sm transition-all duration-300 hover:scale-105 hover:bg-[#0A0A0A] hover:text-white hover:border-[#0A0A0A]">${icon('chevron', 'h-4 w-4')}</button>
          </div>` : ''}
        </div>
        <div data-rail="${section.key}" class="pdp-hide-scroll flex gap-4 overflow-x-auto pb-2">
          ${section.items.map((item) => this._card(item)).join('')}
        </div>
      </div>
    `).join('');
    this._bind(wrap);
    return wrap;
  }

  _bind(root) {
    const smoothScrollRail = (rail, direction) => {
      const card = rail.querySelector('article');
      const scrollAmount = card ? (card.clientWidth + 16) : 280;
      
      // Get or initialize target scroll
      let target = rail.targetScrollLeft !== undefined ? rail.targetScrollLeft : rail.scrollLeft;
      const maxScroll = rail.scrollWidth - rail.clientWidth;
      
      // Update target based on direction
      target = target + direction * scrollAmount;
      target = Math.max(0, Math.min(target, maxScroll));
      rail.targetScrollLeft = target;

      const start = rail.scrollLeft;
      const change = target - start;
      const duration = 450; // ms for smooth glide
      const startTime = performance.now();

      if (rail.animationFrameId) {
        cancelAnimationFrame(rail.animationFrameId);
      }

      const animate = (time) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutQuart: very smooth glide to stop
        const ease = 1 - Math.pow(1 - progress, 4);
        rail.scrollLeft = start + change * ease;
        
        if (progress < 1) {
          rail.animationFrameId = requestAnimationFrame(animate);
        } else {
          rail.animationFrameId = null;
        }
      };
      rail.animationFrameId = requestAnimationFrame(animate);
    };

    root.querySelectorAll('[data-rail-prev]').forEach((button) => button.addEventListener('click', () => {
      const rail = root.querySelector(`[data-rail="${button.dataset.railPrev}"]`);
      if (rail) smoothScrollRail(rail, -1);
    }));
    root.querySelectorAll('[data-rail-next]').forEach((button) => button.addEventListener('click', () => {
      const rail = root.querySelector(`[data-rail="${button.dataset.railNext}"]`);
      if (rail) smoothScrollRail(rail, 1);
    }));
    
    // Translate mouse wheel vertical scroll to horizontal scroll when hovering anywhere inside the section
    root.querySelectorAll('[data-section]').forEach((sectionEl) => {
      const key = sectionEl.dataset.section;
      if (key === 'cross' || key === 'recent') {
        sectionEl.setAttribute('data-lenis-prevent', '');
        const rail = sectionEl.querySelector('[data-rail]');
        let isScrolling = false;

        sectionEl.addEventListener('wheel', (e) => {
          // Prevent page scroll and stop event bubbling to Lenis/other global listeners
          e.preventDefault();
          e.stopPropagation();

          if (isScrolling) return;

          const delta = e.deltaY || e.deltaX;
          if (delta !== 0) {
            isScrolling = true;
            const direction = Math.sign(delta);
            smoothScrollRail(rail, direction);
            
            setTimeout(() => {
              isScrolling = false;
            }, 300);
          }
        }, { passive: false });
      }
    });
    root.addEventListener('click', (e) => {
      const card = e.target.closest('[data-product-slug]');
      if (!card) return;
      if (e.target.closest('[data-add]')) {
        e.stopPropagation();
        cartService.addItem({
          id: card.dataset.productId,
          slug: card.dataset.productSlug,
          name: card.dataset.productName,
          price: Number(card.dataset.productPrice),
          sale_price: Number(card.dataset.productSale || 0) || null,
          image: card.dataset.productImage,
          category_name: card.dataset.productCategory,
        });
        e.target.closest('[data-add]').innerHTML = `${icon('check')} Đã thêm`;
        return;
      }
      navigate(`/san-pham/${card.dataset.productSlug}`);
    });
  }

  _card(item) {
    const display = item.sale_price && item.sale_price < item.price ? item.sale_price : item.price;
    const imgUrl = resolveImageUrl(item.image || item.images?.[0]) || PDP_FALLBACK_IMAGES[0];
    return `
      <article data-product-id="${item.id}" data-product-slug="${item.slug}" data-product-name="${item.name}" data-product-price="${item.price}" data-product-sale="${item.sale_price || ''}" data-product-image="${imgUrl}" data-product-category="${item.category_name || ''}" class="group product-card-reveal w-[240px] md:w-[calc((100%-48px)/4)] shrink-0 overflow-hidden rounded-[8px] border border-[#E8E4DC] bg-white transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-1.5 hover:border-[#C9A961]/50 hover:shadow-[0_12px_36px_rgba(201,169,97,0.12)]">
        <div class="aspect-square overflow-hidden bg-[#FAF8F3]"><img src="${imgUrl}" alt="${item.name}" loading="lazy" class="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105" onerror="this.src='${PDP_FALLBACK_IMAGES[0]}'"/></div>
        <div class="space-y-3 p-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C9A961]">${item.category_name || 'Đồng hồ chính hãng'}</p>
          <h3 class="line-clamp-2 min-h-[2.6rem] text-sm font-semibold leading-6 text-[#0A0A0A]">${item.name}</h3>
          <div class="flex items-end gap-3"><span class="text-base font-bold ${item.sale_price ? 'text-[#DC2626]' : 'text-[#0A0A0A]'}">${formatPrice(display)}</span>${item.sale_price ? `<span class="text-sm text-[#9CA3AF] line-through">${formatPrice(item.price)}</span>` : ''}</div>
          <button type="button" data-add class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-[#0A0A0A] text-xs font-bold uppercase tracking-[0.08em] text-white">${icon('bag')} Thêm vào giỏ</button>
        </div>
      </article>
    `;
  }
}
