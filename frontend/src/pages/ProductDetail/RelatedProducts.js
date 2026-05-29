import { cartService } from '../../services/cartService.js';
import { formatPrice, navigate } from '../../utils/helpers.js';
import { icon, PDP_FALLBACK_IMAGES } from './ProductDetailShared.js';

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
      <div class="space-y-5">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-2xl font-bold tracking-[0.02em] text-[#0A0A0A]">${section.title}</h2>
          ${section.arrows ? `<div class="hidden items-center gap-2 md:flex">
            <button type="button" data-rail-prev="${section.key}" class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E8E4DC] bg-white shadow-sm">${icon('chevron', 'h-4 w-4 rotate-180')}</button>
            <button type="button" data-rail-next="${section.key}" class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E8E4DC] bg-white shadow-sm">${icon('chevron', 'h-4 w-4')}</button>
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
    root.querySelectorAll('[data-rail-prev]').forEach((button) => button.addEventListener('click', () => {
      root.querySelector(`[data-rail="${button.dataset.railPrev}"]`)?.scrollBy({ left: -420, behavior: 'smooth' });
    }));
    root.querySelectorAll('[data-rail-next]').forEach((button) => button.addEventListener('click', () => {
      root.querySelector(`[data-rail="${button.dataset.railNext}"]`)?.scrollBy({ left: 420, behavior: 'smooth' });
    }));
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
    const imgUrl = item.image || item.images?.[0] || PDP_FALLBACK_IMAGES[0];
    return `
      <article data-product-id="${item.id}" data-product-slug="${item.slug}" data-product-name="${item.name}" data-product-price="${item.price}" data-product-sale="${item.sale_price || ''}" data-product-image="${imgUrl}" data-product-category="${item.category_name || ''}" class="product-card-reveal w-[260px] shrink-0 overflow-hidden rounded-[8px] border border-[#E8E4DC] bg-white transition hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)]">
        <div class="aspect-square overflow-hidden bg-[#FAF8F3]"><img src="${imgUrl}" alt="${item.name}" loading="lazy" class="h-full w-full object-cover transition duration-300 hover:scale-105" onerror="this.src='${PDP_FALLBACK_IMAGES[0]}'"/></div>
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
