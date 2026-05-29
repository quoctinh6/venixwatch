import { formatDate } from '../../utils/helpers.js';
import { getProductQuestions, getProductReviews } from '../../services/productService.js';
import ProductQuestionComposer from './ProductQuestionComposer.js';
import ProductReviewComposer from './ProductReviewComposer.js';
import { icon, renderStars } from './ProductDetailShared.js';

export default class ProductTabs {
  constructor({ product, reviews, reviewMeta, questions }) {
    this._product = product;
    this._reviews = reviews || [];
    this._reviewMeta = reviewMeta || { page: 1, total_pages: 1, total: this._reviews.length, summary: product.rating || {} };
    this._questions = questions || [];
    this._active = 'description';
    this._open = new Set(['description']);
    this._reviewFilter = 0;
    this._root = null;
    this._applyState = null;
  }

  render() {
    const section = document.createElement('section');
    section.className = 'space-y-4';
    this._root = section;
    const items = this._items();
    section.innerHTML = `
      <div class="hidden overflow-x-auto rounded-[10px] border border-[#E8E4DC] bg-white p-2 lg:sticky lg:top-[72px] lg:z-20 lg:flex">
        ${items.map((item) => `<button type="button" data-tab="${item.key}" class="rounded-[8px] px-4 py-3 text-sm font-semibold ${item.key === this._active ? 'bg-[#0A0A0A] text-white' : 'text-[#4B5563]'}">${item.label}</button>`).join('')}
      </div>
      <div class="space-y-3">
        ${items.map((item) => `
          <article data-panel="${item.key}" class="overflow-hidden rounded-[12px] border border-[#E8E4DC] bg-white">
            <button type="button" data-mobile-tab="${item.key}" class="flex w-full items-center justify-between px-5 py-4 text-left lg:hidden">
              <span class="text-base font-bold text-[#0A0A0A]">${item.label}</span>
              <span class="transition-transform ${this._open.has(item.key) ? 'rotate-90' : ''}">${icon('chevron')}</span>
            </button>
            <div data-content="${item.key}" class="${item.key === this._active ? '' : 'hidden'}">${item.html}</div>
          </article>`).join('')}
      </div>
    `;
    this._bind(section);
    this._mountComposers(section);
    return section;
  }

  activate(key) {
    this._active = key;
    this._open.add(key);
    this._applyState?.();
    const element = this._root?.querySelector(`[data-panel="${key}"]`);
    if (!element) return;
    const y = element.getBoundingClientRect().top + window.pageYOffset - 90;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  _bind(root) {
    this._applyState = () => {
      const isDesktop = window.innerWidth >= 1024;
      root.querySelectorAll('[data-tab]').forEach((button) => {
        const active = button.dataset.tab === this._active;
        button.className = `rounded-[8px] px-4 py-3 text-sm font-semibold ${active ? 'bg-[#0A0A0A] text-white' : 'text-[#4B5563]'}`;
      });
      root.querySelectorAll('[data-panel]').forEach((panel) => {
        const key = panel.dataset.panel;
        const content = panel.querySelector('[data-content]');
        if (isDesktop) {
          panel.classList.toggle('hidden', key !== this._active);
          content.classList.remove('hidden');
        } else {
          panel.classList.remove('hidden');
          content.classList.toggle('hidden', !this._open.has(key));
        }
        panel.querySelector('[data-mobile-tab] span:last-child')?.classList.toggle('rotate-90', this._open.has(key));
      });
    };

    this._applyState();
    root.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => {
      this._active = button.dataset.tab;
      this._applyState();
    }));
    root.querySelectorAll('[data-mobile-tab]').forEach((button) => button.addEventListener('click', () => {
      const key = button.dataset.mobileTab;
      this._open.has(key) ? this._open.delete(key) : this._open.add(key);
      this._applyState();
    }));
    root.querySelector('[data-review-panel]')?.addEventListener('click', async (event) => {
      const chip = event.target.closest('[data-rating-filter]');
      if (chip) {
        this._reviewFilter = chip.dataset.ratingFilter === 'photo' ? 'photo' : Number(chip.dataset.ratingFilter);
        await this._reloadReviews(true);
      }
      if (event.target.closest('[data-load-reviews]')) await this._reloadReviews(false);
    });
  }

  _mountComposers(root) {
    new ProductReviewComposer({
      product: this._product,
      onSubmitted: async () => this._reloadReviews(true),
    }).mount(root.querySelector('[data-review-compose]'));

    new ProductQuestionComposer({
      product: this._product,
      onSubmitted: async () => this._reloadQuestions(),
    }).mount(root.querySelector('[data-question-compose]'));
  }

  _items() {
    return [
      { key: 'description', label: 'Mô tả', html: this._descriptionHtml() },
      { key: 'specs', label: 'Thông số', html: this._specsHtml() },
      { key: 'reviews', label: `Đánh giá (${this._reviewMeta.total || this._reviews.length})`, html: this._reviewsHtml() },
      { key: 'qa', label: 'Hỏi đáp', html: this._qaHtml() },
      // { key: 'policy', label: 'Chính sách', html: this._policyHtml() },
    ];
  }

  _descriptionHtml() {
    const isPremiumLayout = ['carnival', 'casio'].includes(String(this._product.brand || '').toLowerCase());
    if (isPremiumLayout) {
      const desc = this._product.description || 'Mẫu đồng hồ này cân bằng giữa độ hoàn thiện, cảm giác đeo và tính thẩm mỹ để sử dụng bền lâu trong nhiều bối cảnh.';
      return `
        <div class="space-y-6 p-5 lg:p-7">
          <div>
            <h2 class="text-2xl font-bold text-[#0A0A0A]">Về ${this._product.name}</h2>
            <div class="pdp-description-content mt-4 max-w-4xl text-[15px] leading-8 text-[#4B5563]">
              ${desc}
            </div>
          </div>
          <div class="grid gap-4 md:grid-cols-3">
            ${(this._product.images || []).slice(0, 3).map((src) => `
              <img src="${src}" alt="${this._product.name}" class="aspect-[4/5] w-full rounded-[10px] object-cover"/>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      return `
        <div class="space-y-6 p-5 lg:p-7">
          <div>
            <h2 class="text-2xl font-bold text-[#0A0A0A]">Về ${this._product.name}</h2>
            <p class="mt-4 max-w-4xl text-[15px] leading-8 text-[#4B5563]">${this._product.long_description || 'Mẫu đồng hồ này cân bằng giữa độ hoàn thiện, cảm giác đeo và tính thẩm mỹ để sử dụng bền lâu trong nhiều bối cảnh.'}</p>
          </div>
          <div class="grid gap-4 md:grid-cols-3">
            ${(this._product.images || []).slice(0, 3).map((src) => `
              <img src="${src}" alt="${this._product.name}" class="aspect-[4/5] w-full rounded-[10px] object-cover"/>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  _specsHtml() {
    const isPremiumLayout = ['carnival', 'casio'].includes(String(this._product.brand || '').toLowerCase());
    const specs = this._product.specs || [];
    if (isPremiumLayout) {
      return `
        <div class="overflow-hidden">
          <table class="w-full border-collapse text-sm">
            <tbody>
              ${specs.map((spec, index) => {
                const isLast = index === specs.length - 1;
                const borderClass = isLast ? '' : 'border-b border-[#F0EBE0]';
                return `
                  <tr class="${index % 2 === 1 ? 'bg-[#FAF8F3]' : 'bg-white'} hover:bg-gray-50/50 transition-colors">
                    <td class="w-[35%] ${borderClass} px-6 py-4 font-semibold text-[#0A0A0A]">${spec.label}</td>
                    <td class="${borderClass} px-6 py-4 text-[#0A0A0A] font-medium">${spec.value}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      return `
        <div class="overflow-hidden p-1 lg:p-2">
          <table class="w-full border-separate border-spacing-0 text-sm">
            ${specs.map((spec, index) => `
              <tr class="${index % 2 === 1 ? 'bg-[#FAF8F3]' : 'bg-white'} hover:bg-gray-50/50 transition-colors">
                <td class="w-[38%] border-b border-[#F0EBE0] px-4 py-3.5 font-semibold text-[#0A0A0A]">${spec.label}</td>
                <td class="border-b border-[#F0EBE0] px-4 py-3.5 text-[#0A0A0A] font-medium">${spec.value}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      `;
    }
  }

  _reviewsHtml() {
    const summary = this._reviewMeta.summary || this._product.rating || {};
    const avgRating = Number.parseFloat(summary.avg_rating) || 0;
    const totalReviews = Number.parseInt(summary.total, 10) || this._reviews.filter((item) => item.status === 'approved').length || 0;
    const chips = [['Tất cả', 0], ['5★', 5], ['4★', 4], ['3★', 3], ['2★', 2], ['1★', 1], ['Có ảnh', 'photo']];
    return `
      <div data-review-panel class="space-y-6 p-5 lg:p-7">
        <div class="grid gap-5 rounded-[12px] border border-[#E8E4DC] p-5 md:grid-cols-[220px,1fr]">
          <div><p class="text-5xl font-bold text-[#C9A961]">${avgRating.toFixed(1)}/5</p><div class="mt-2 flex gap-1">${renderStars(avgRating, 'h-5 w-5')}</div><p class="mt-2 text-sm text-[#6B7280]">Dựa trên ${totalReviews} đánh giá đã duyệt</p></div>
          <div class="space-y-2">${[[5, summary.five_star], [4, summary.four_star], [3, summary.three_star], [2, summary.two_star], [1, summary.one_star]].map(([star, count]) => `<div class="grid grid-cols-[34px,1fr,34px] items-center gap-3 text-sm"><span>${star}★</span><div class="h-2 rounded-full bg-zinc-100"><div class="h-2 rounded-full bg-[#C9A961]" style="width:${Math.max(0, totalReviews ? ((count || 0) / totalReviews) * 100 : 0)}%"></div></div><span class="text-right text-[#6B7280]">${count || 0}</span></div>`).join('')}</div>
        </div>
        <div data-review-compose></div>
        <div class="flex flex-wrap gap-2">${chips.map(([label, value]) => `<button type="button" data-rating-filter="${value}" class="rounded-full border border-[#E8E4DC] px-4 py-2 text-sm font-medium ${String(value) === String(this._reviewFilter) ? 'bg-[#0A0A0A] text-white' : 'bg-white text-[#4B5563]'}">${label}</button>`).join('')}</div>
        <div data-review-list class="space-y-4">${this._reviewCards(this._reviews)}</div>
        ${(this._reviewMeta.page || 1) < (this._reviewMeta.total_pages || 1) ? '<button type="button" data-load-reviews class="inline-flex h-11 items-center justify-center rounded-[8px] border border-[#0A0A0A] px-5 text-sm font-bold uppercase tracking-[0.08em]">Xem thêm đánh giá</button>' : ''}
      </div>`;
  }

  _qaHtml() {
    return `<div class="space-y-5 p-5 lg:p-7"><div data-question-compose></div><div data-question-list class="space-y-4">${this._questionCards(this._questions)}</div></div>`;
  }

  _policyHtml() {
    return `<div class="grid gap-4 p-5 text-sm leading-7 text-[#4B5563] lg:grid-cols-2 lg:p-7">${[['Bảo hành', 'Bảo hành chính hãng 2 năm, hỗ trợ kiểm tra máy và tư vấn sử dụng trong suốt quá trình đeo.'], ['Đổi trả', 'Đổi trả trong 30 ngày với sản phẩm còn nguyên tình trạng và đầy đủ phụ kiện.'], ['Vận chuyển', 'Miễn phí giao hàng toàn quốc cho đơn từ 500.000đ, có theo dõi và xác nhận khi nhận.'], ['Thanh toán', 'Hỗ trợ COD, chuyển khoản và trả góp 0% qua thẻ tín dụng.']].map(([title, text]) => `<div class="rounded-[12px] border border-[#E8E4DC] p-5"><h3 class="text-base font-bold text-[#0A0A0A]">${title}</h3><p class="mt-2">${text}</p></div>`).join('')}</div>`;
  }

  _reviewCards(reviews = []) {
    if (!reviews.length) {
      return '<div class="rounded-[12px] border border-dashed border-[#D1D5DB] p-5 text-sm text-[#6B7280]">Chưa có đánh giá nào cho sản phẩm này.</div>';
    }
    return reviews.map((item) => `<article class="rounded-[12px] border border-[#E8E4DC] p-5"><div class="flex items-start justify-between gap-4"><div><p class="font-semibold text-[#0A0A0A]">${item.is_anonymous ? this._mask(item.user_name || 'Khách hàng') : (item.user_name || 'Khách hàng')}</p><p class="mt-1 text-xs text-[#6B7280]">${formatDate(item.created_at)}${item.status === 'pending' ? ' • Đang chờ duyệt' : ' • ✓ Đã mua hàng'}</p></div><div class="flex gap-1">${renderStars(item.rating || 5)}</div></div>${item.title ? `<p class="mt-3 font-semibold text-[#0A0A0A]">${item.title}</p>` : ''}<p class="mt-2 text-sm leading-7 text-[#4B5563]">${item.comment || ''}</p>${item.photos?.length ? `<div class="mt-4 flex flex-wrap gap-3">${item.photos.map((src) => `<img src="${src}" alt="${item.title || this._product.name}" class="h-20 w-20 rounded-[10px] object-cover"/>`).join('')}</div>` : ''}${item.shop_reply ? `<div class="mt-4 rounded-[10px] bg-[#FAF8F3] p-4 text-sm text-[#4B5563]"><p class="font-semibold text-[#0A0A0A]">Phản hồi từ Venix Watch</p><p class="mt-2">${item.shop_reply}</p></div>` : ''}</article>`).join('');
  }

  _questionCards(questions = []) {
    if (!questions.length) {
      return '<div class="rounded-[12px] border border-dashed border-[#D1D5DB] p-5 text-sm text-[#6B7280]">Chưa có câu hỏi nào cho sản phẩm này.</div>';
    }
    return questions.map((item) => `<div class="rounded-[12px] border border-[#E8E4DC] p-5"><p class="text-sm font-semibold text-[#0A0A0A]">${item.question}</p><p class="mt-1 text-xs text-[#6B7280]">Hỏi bởi ${item.user_name || 'Khách hàng'} • ${formatDate(item.created_at)}</p>${item.answer ? `<p class="mt-3 rounded-[10px] bg-[#FAF8F3] p-4 text-sm leading-7 text-[#4B5563]">${item.answer}</p><p class="mt-2 text-xs text-[#6B7280]">Venix Watch trả lời ${item.answered_at ? `• ${formatDate(item.answered_at)}` : ''}</p>` : `<div class="mt-3 rounded-[10px] border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">Câu hỏi của bạn đang chờ trả lời.</div>`}</div>`).join('');
  }

  async _reloadReviews(reset = false) {
    const params = { page: reset ? 1 : (this._reviewMeta.page || 1) + 1 };
    if (this._reviewFilter === 'photo') params.has_photo = 1;
    if (Number(this._reviewFilter) >= 1) params.rating = this._reviewFilter;
    const res = await getProductReviews(this._product.id, params).catch(() => null);
    if (!res?.success) return;
    this._reviewMeta = res.meta || this._reviewMeta;
    this._reviews = reset ? (res.data || []) : [...this._reviews, ...(res.data || [])];
    this._root.querySelector('[data-review-list]').innerHTML = this._reviewCards(this._reviews);
    const loader = this._root.querySelector('[data-load-reviews]');
    if (loader) loader.toggleAttribute('hidden', (this._reviewMeta.page || 1) >= (this._reviewMeta.total_pages || 1));
    this._root.querySelectorAll('[data-rating-filter]').forEach((button) => {
      const active = String(button.dataset.ratingFilter) === String(this._reviewFilter);
      button.className = `rounded-full border border-[#E8E4DC] px-4 py-2 text-sm font-medium ${active ? 'bg-[#0A0A0A] text-white' : 'bg-white text-[#4B5563]'}`;
    });
  }

  async _reloadQuestions() {
    const res = await getProductQuestions(this._product.id).catch(() => null);
    if (!res?.success) return;
    this._questions = res.data || [];
    this._root.querySelector('[data-question-list]').innerHTML = this._questionCards(this._questions);
  }

  _mask(name) {
    if (!name) return 'Khách hàng';
    return name.length < 3 ? `${name}***` : `${name.slice(0, Math.max(2, name.length - 3))}***`;
  }
}
