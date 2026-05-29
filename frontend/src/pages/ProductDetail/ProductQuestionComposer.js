import { getUser } from '../../services/authService.js';
import { createProductQuestion } from '../../services/productService.js';
import { showLoginModal } from '../../utils/loginModal.js';
import { showToast } from '../../utils/toast.js';

export default class ProductQuestionComposer {
  constructor({ product, onSubmitted }) {
    this.product = product;
    this.onSubmitted = onSubmitted;
    this.root = null;
  }

  mount(root) {
    this.root = root;
    root.innerHTML = this._html();
    root.addEventListener('click', (event) => {
      if (event.target.closest('[data-open-question]')) this._toggle(true);
      if (event.target.closest('[data-cancel-question]')) this._toggle(false);
      const suggestion = event.target.closest('[data-question-suggestion]');
      if (suggestion) {
        const input = this.root.querySelector('textarea[name="question"]');
        if (input) input.value = suggestion.dataset.questionSuggestion || '';
      }
    });
    root.querySelector('[data-question-form]')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      await this._submit(event.currentTarget);
    });
  }

  async _submit(form) {
    if (!getUser()) {
      showLoginModal('Vui lòng đăng nhập để đặt câu hỏi');
      return;
    }

    const formData = new FormData(form);
    const payload = {
      question: String(formData.get('question') || '').trim(),
      notify_email: formData.get('notify_email') === 'on',
    };

    if (payload.question.length < 10 || payload.question.length > 300) {
      this._setNote('Vui lòng nhập câu hỏi từ 10 đến 300 ký tự.', 'error');
      return;
    }

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'ĐANG GỬI...';

    try {
      await createProductQuestion(this.product.id, payload);
      showToast('success', 'Câu hỏi đã gửi! Chúng tôi sẽ trả lời trong vòng 24 giờ.');
      form.reset();
      this._toggle(false);
      this._setNote('Câu hỏi của bạn đang chờ phản hồi và chỉ bạn nhìn thấy trong lúc này.', 'info');
      await this.onSubmitted?.();
    } catch (error) {
      this._setNote(error.message || 'Không thể gửi câu hỏi.', 'error');
    } finally {
      submit.disabled = false;
      submit.textContent = 'GỬI CÂU HỎI';
    }
  }

  _toggle(open) {
    if (!getUser() && open) {
      showLoginModal('Vui lòng đăng nhập để đặt câu hỏi');
      return;
    }
    this.root.querySelector('[data-question-form]')?.classList.toggle('hidden', !open);
  }

  _setNote(message, tone) {
    const note = this.root.querySelector('[data-question-note]');
    if (!note) return;
    const palette = tone === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : 'border-sky-200 bg-sky-50 text-sky-800';
    note.className = `mt-4 rounded-[10px] border px-4 py-3 text-sm ${palette}`;
    note.textContent = message;
    note.classList.remove('hidden');
  }

  _html() {
    const suggestions = [
      'Chống nước bao nhiêu ATM?',
      'Dây thay được không?',
      'Máy cơ hay quartz?',
      'Bảo hành bao lâu?',
    ];

    return `
      <div class="rounded-[12px] border border-[#E8E4DC] p-5">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 class="text-lg font-bold text-[#0A0A0A]">Đặt câu hỏi về sản phẩm</h3>
            <p class="mt-1 text-sm text-[#6B7280]">Khách đã đăng nhập có thể hỏi trước khi mua, không cần có đơn hàng.</p>
          </div>
          <button type="button" data-open-question class="inline-flex h-11 items-center justify-center rounded-[10px] bg-[#0A0A0A] px-5 text-xs font-bold uppercase tracking-[0.08em] text-white">Đặt câu hỏi</button>
        </div>
        <div data-question-note class="mt-4 hidden"></div>
        <form data-question-form class="mt-5 hidden space-y-4">
          <div class="flex items-center gap-3">
            <img src="${this.product.images?.[0] || ''}" alt="${this.product.name}" class="h-14 w-14 rounded-[10px] object-cover"/>
            <div><p class="font-semibold text-[#0A0A0A]">${this.product.name}</p><p class="text-xs text-[#6B7280]">Tối thiểu 10 ký tự, tối đa 300 ký tự.</p></div>
          </div>
          <textarea name="question" rows="5" maxlength="300" placeholder="VD: Đồng hồ này có phù hợp cổ tay 15cm không? Dây có thể thay được không?" class="w-full rounded-[10px] border border-[#E8E4DC] px-4 py-3 text-sm focus:border-[#C9A961] focus:outline-none"></textarea>
          <div class="flex flex-wrap gap-2">${suggestions.map((item) => `<button type="button" data-question-suggestion="${item}" class="rounded-full border border-[#E8E4DC] px-3 py-2 text-xs font-medium text-[#4B5563]">${item}</button>`).join('')}</div>
          <label class="flex items-center gap-3 text-sm text-[#4B5563]"><input type="checkbox" name="notify_email" checked class="h-4 w-4 rounded border-[#D1D5DB] text-[#0A0A0A]"/> Nhận thông báo khi được trả lời</label>
          <div class="flex flex-col gap-3 sm:flex-row">
            <button type="submit" class="inline-flex h-11 items-center justify-center rounded-[10px] bg-[#0A0A0A] px-5 text-xs font-bold uppercase tracking-[0.08em] text-white">GỬI CÂU HỎI</button>
            <button type="button" data-cancel-question class="inline-flex h-11 items-center justify-center rounded-[10px] border border-[#D1D5DB] px-5 text-xs font-bold uppercase tracking-[0.08em] text-[#4B5563]">Hủy</button>
          </div>
        </form>
      </div>
    `;
  }
}
