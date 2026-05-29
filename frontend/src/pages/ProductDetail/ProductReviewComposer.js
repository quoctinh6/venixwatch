import { getUser } from '../../services/authService.js';
import { canReviewProduct, createProductReview } from '../../services/productService.js';
import { showLoginModal } from '../../utils/loginModal.js';
import { showToast } from '../../utils/toast.js';

export default class ProductReviewComposer {
  constructor({ product, onSubmitted }) {
    this.product = product;
    this.onSubmitted = onSubmitted;
    this.rating = 0;
    this.eligibility = null;
    this.root = null;
  }

  mount(root) {
    this.root = root;
    root.innerHTML = this._html();
    this._bind();
  }

  _bind() {
    this.root.addEventListener('click', async (event) => {
      if (event.target.closest('[data-open-review]')) await this._handleOpen();
      if (event.target.closest('[data-cancel-review]')) this._toggleForm(false);
      if (event.target.closest('[data-star]')) this._setRating(Number(event.target.closest('[data-star]').dataset.star));
    });

    this.root.querySelector('[data-review-form]')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      await this._submit(event.currentTarget);
    });
  }

  async _handleOpen() {
    if (!getUser()) {
      showLoginModal('Vui lòng đăng nhập để đánh giá sản phẩm');
      return;
    }

    try {
      const response = await canReviewProduct(this.product.id);
      this.eligibility = response.data || response;
      if (this.eligibility.can_review) {
        this._toggleMessage(null);
        this._toggleForm(true);
        return;
      }
      this._toggleForm(false);
      this._toggleMessage(this._reasonHtml(this.eligibility));
    } catch (error) {
      showToast('error', error.message || 'Không thể kiểm tra điều kiện đánh giá.');
    }
  }

  async _submit(form) {
    const formData = new FormData(form);
    const payload = {
      rating: this.rating,
      title: String(formData.get('title') || '').trim(),
      comment: String(formData.get('comment') || '').trim(),
      is_anonymous: formData.get('is_anonymous') === 'on',
    };

    if (!payload.rating || payload.comment.length < 20 || payload.comment.length > 500) {
      this._toggleMessage('<div class="rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">Vui lòng chọn số sao và nhập nội dung từ 20 đến 500 ký tự.</div>');
      return;
    }

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'ĐANG GỬI...';

    try {
      await createProductReview(this.product.id, payload);
      showToast('success', 'Cảm ơn bạn đã đánh giá! Review sẽ được hiển thị sau khi được duyệt.');
      form.reset();
      this._setRating(0);
      this._toggleForm(false);
      this._toggleMessage('<div class="rounded-[10px] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">Đánh giá của bạn đang chờ duyệt và chỉ bạn nhìn thấy trong lúc này.</div>');
      await this.onSubmitted?.();
    } catch (error) {
      this._toggleMessage(`<div class="rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">${error.message || 'Không thể gửi đánh giá.'}</div>`);
    } finally {
      submit.disabled = false;
      submit.textContent = 'GỬI ĐÁNH GIÁ';
    }
  }

  _setRating(value) {
    this.rating = value;
    this.root.querySelectorAll('[data-star]').forEach((button) => {
      button.classList.toggle('text-[#C9A961]', Number(button.dataset.star) <= value);
      button.classList.toggle('text-[#D1D5DB]', Number(button.dataset.star) > value);
    });
  }

  _toggleForm(open) {
    this.root.querySelector('[data-review-form]')?.classList.toggle('hidden', !open);
    if (open && this.eligibility) {
      const meta = this.root.querySelector('[data-review-order]');
      if (meta) meta.textContent = `Đơn hàng: #${this.eligibility.order_code} | Ngày nhận: ${new Date(this.eligibility.delivered_at).toLocaleDateString('vi-VN')}`;
    }
  }

  _toggleMessage(html) {
    const box = this.root.querySelector('[data-review-message]');
    if (!box) return;
    box.innerHTML = html || '';
    box.classList.toggle('hidden', !html);
  }

  _reasonHtml(result) {
    const map = {
      not_purchased: 'Bạn cần mua sản phẩm này để đánh giá. Chỉ khách hàng đã nhận hàng mới có thể viết đánh giá.',
      order_not_delivered: `Đơn hàng #${result.order_code || result.order_id} đang được vận chuyển. Bạn có thể đánh giá sau khi nhận hàng thành công.`,
      already_reviewed: result.can_edit ? 'Bạn đã đánh giá sản phẩm này rồi. Bạn có thể sửa lại trong thời hạn cho phép.' : 'Bạn đã đánh giá sản phẩm này rồi.',
      review_period_expired: 'Đã quá 90 ngày kể từ ngày nhận hàng. Thời hạn đánh giá đã hết.',
    };
    return `<div class="rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">${map[result.reason] || 'Bạn chưa đủ điều kiện để đánh giá sản phẩm này.'}</div>`;
  }

  _html() {
    return `
      <div class="rounded-[12px] border border-[#E8E4DC] p-5">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 class="text-lg font-bold text-[#0A0A0A]">Đánh giá sản phẩm</h3>
            <p data-review-order class="mt-1 text-sm text-[#6B7280]">Chỉ khách hàng đã nhận hàng mới có thể gửi đánh giá.</p>
          </div>
          <button type="button" data-open-review class="inline-flex h-11 items-center justify-center rounded-[10px] bg-[#0A0A0A] px-5 text-xs font-bold uppercase tracking-[0.08em] text-white">Viết đánh giá</button>
        </div>
        <div data-review-message class="mt-4 hidden"></div>
        <form data-review-form class="mt-5 hidden space-y-4">
          <div class="flex items-center gap-3">
            <img src="${this.product.images?.[0] || ''}" alt="${this.product.name}" class="h-14 w-14 rounded-[10px] object-cover"/>
            <div><p class="font-semibold text-[#0A0A0A]">${this.product.name}</p><p class="text-xs text-[#6B7280]">Chọn số sao và chia sẻ trải nghiệm thực tế của bạn.</p></div>
          </div>
          <div class="space-y-2">
            <p class="text-sm font-semibold text-[#0A0A0A]">Chất lượng sản phẩm</p>
            <div class="flex gap-1 text-3xl">${[1, 2, 3, 4, 5].map((star) => `<button type="button" data-star="${star}" class="text-[#D1D5DB] transition-colors">★</button>`).join('')}</div>
          </div>
          <input name="title" maxlength="255" placeholder="Tiêu đề đánh giá" class="w-full rounded-[10px] border border-[#E8E4DC] px-4 py-3 text-sm focus:border-[#C9A961] focus:outline-none"/>
          <textarea name="comment" rows="5" maxlength="500" placeholder="Chia sẻ trải nghiệm của bạn... (tối thiểu 20 ký tự)" class="w-full rounded-[10px] border border-[#E8E4DC] px-4 py-3 text-sm focus:border-[#C9A961] focus:outline-none"></textarea>
          <label class="flex items-center gap-3 text-sm text-[#4B5563]"><input type="checkbox" name="is_anonymous" class="h-4 w-4 rounded border-[#D1D5DB] text-[#0A0A0A]"/> Đánh giá ẩn danh</label>
          <div class="flex flex-col gap-3 sm:flex-row">
            <button type="submit" class="inline-flex h-11 items-center justify-center rounded-[10px] bg-[#0A0A0A] px-5 text-xs font-bold uppercase tracking-[0.08em] text-white">GỬI ĐÁNH GIÁ</button>
            <button type="button" data-cancel-review class="inline-flex h-11 items-center justify-center rounded-[10px] border border-[#D1D5DB] px-5 text-xs font-bold uppercase tracking-[0.08em] text-[#4B5563]">Hủy</button>
          </div>
        </form>
      </div>
    `;
  }
}
