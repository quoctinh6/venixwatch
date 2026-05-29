import { createBrand, updateBrand } from '../../../services/adminService.js';
import { slugify } from '../../../utils/helpers.js';
import { openImagePicker } from '../Products/ImagePicker.js';
import { showToast } from '../shared/ui.js';

export function openBrandForm(brand, onSaved) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';

  overlay.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" data-lenis-prevent>
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-bold text-gray-900">${brand ? 'Chỉnh sửa thương hiệu' : 'Thêm thương hiệu'}</h2>
        <button id="bf-close" class="text-gray-400 hover:text-gray-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <form id="brand-form" class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Tên hiển thị *</label>
          <input name="name" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]"
            value="${brand?.name || ''}" placeholder="Rolex Premium" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Khớp với \`products.brand\` *</label>
          <input name="source_name" id="bf-source-name" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]"
            value="${brand?.source_name || ''}" placeholder="Rolex" />
          <p class="mt-1 text-xs text-gray-400">Giá trị này dùng để đếm top thương hiệu và lọc sản phẩm ngoài storefront.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
          <div class="flex gap-2">
            <input name="slug" id="bf-slug" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]"
              value="${brand?.slug || ''}" placeholder="rolex" />
            <button type="button" id="bf-gen-slug" class="px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50 whitespace-nowrap">
              Tự động
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Logo thương hiệu</label>
          <div class="flex gap-3 items-center">
            <div id="bf-logo-preview" class="w-16 h-16 rounded-xl border border-dashed border-gray-300 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
              ${brand?.logo_url ? `<img src="${brand.logo_url}" class="w-full h-full object-contain bg-white p-2" onerror="this.remove()">` : '<span class="text-xs text-gray-300">Logo</span>'}
            </div>
            <div class="flex-1 space-y-2">
              <input name="logo_url" id="bf-logo-url" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]"
                value="${brand?.logo_url || ''}" placeholder="URL logo hoặc chọn từ thư viện ảnh..." />
              <button type="button" id="bf-pick-logo" class="px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
                Chọn logo
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Thứ tự</label>
            <input name="sort_order" type="number" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]"
              value="${brand?.sort_order ?? 0}" />
          </div>
          <div class="flex items-end pb-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_active" class="w-4 h-4 accent-[#C9A84C]" ${brand?.is_active !== false && Number(brand?.is_active ?? 1) !== 0 ? 'checked' : ''}>
              <span class="text-sm text-gray-700">Hiển thị trên nav</span>
            </label>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" id="bf-cancel" class="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">Hủy</button>
          <button type="submit" id="bf-submit" class="px-5 py-2 rounded-lg bg-[#C9A84C] text-white hover:bg-[#b8963e] text-sm font-medium">Lưu</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('#bf-close').addEventListener('click', close);
  overlay.querySelector('#bf-cancel').addEventListener('click', close);

  const nameInput = overlay.querySelector('[name="name"]');
  const sourceInput = overlay.querySelector('#bf-source-name');
  const slugInput = overlay.querySelector('#bf-slug');
  const logoInput = overlay.querySelector('#bf-logo-url');
  const preview = overlay.querySelector('#bf-logo-preview');

  const syncSlug = () => {
    if (!brand && !slugInput.dataset.edited) {
      slugInput.value = slugify(sourceInput.value || nameInput.value || '');
    }
  };

  nameInput.addEventListener('input', syncSlug);
  sourceInput.addEventListener('input', syncSlug);
  slugInput.addEventListener('input', () => {
    slugInput.dataset.edited = slugInput.value.trim() ? '1' : '';
  });
  overlay.querySelector('#bf-gen-slug').addEventListener('click', () => {
    slugInput.value = slugify(sourceInput.value || nameInput.value || '');
    slugInput.dataset.edited = slugInput.value.trim() ? '1' : '';
  });

  const updatePreview = (url) => {
    preview.innerHTML = url
      ? `<img src="${url}" class="w-full h-full object-contain bg-white p-2" onerror="this.remove()">`
      : '<span class="text-xs text-gray-300">Logo</span>';
  };

  logoInput.addEventListener('input', () => updatePreview(logoInput.value.trim()));
  overlay.querySelector('#bf-pick-logo').addEventListener('click', () => {
    openImagePicker((url) => {
      logoInput.value = url;
      updatePreview(url);
    });
  });

  overlay.querySelector('#brand-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = overlay.querySelector('#bf-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang lưu...';

    try {
      const fd = new FormData(e.target);
      const body = Object.fromEntries(fd.entries());
      body.is_active = fd.has('is_active');
      body.sort_order = Number(body.sort_order || 0);
      if (!body.logo_url) delete body.logo_url;

      if (brand) {
        await updateBrand(brand.id, body);
        showToast('Cập nhật thương hiệu thành công!');
      } else {
        await createBrand(body);
        showToast('Thêm thương hiệu thành công!');
      }

      close();
      onSaved?.();
    } catch (err) {
      showToast(err.message || 'Có lỗi xảy ra', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Lưu';
    }
  });
}
