import { showToast } from '../shared/ui.js';
import { createCategory, updateCategory, getCategories, createSubcategory, updateSubcategory } from '../../../services/adminService.js';
import { openImagePicker } from '../Products/ImagePicker.js';

export function openCategoryForm(category, onSaved) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';

  const isSub = category ? !!category.is_subcategory : false;

  overlay.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" data-lenis-prevent>
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-bold text-gray-900">${category ? (isSub ? 'Chỉnh sửa danh mục con' : 'Chỉnh sửa danh mục cha') : 'Thêm danh mục'}</h2>
        <button id="cf-close" class="text-gray-400 hover:text-gray-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <form id="cat-form" class="p-6 space-y-4">

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Tên danh mục *</label>
          <input name="name" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]"
            value="${category?.name || ''}" placeholder="Đồng hồ nam..."/>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
          <div class="flex gap-2">
            <input name="slug" id="cf-slug"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]"
              value="${category?.slug || ''}"/>
            <button type="button" id="cf-gen-slug"
              class="px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50 whitespace-nowrap flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
              Tự động
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Danh mục cha</label>
          ${category ? `<input type="hidden" name="parent_id" value="${category.category_id || ''}">` : ''}
          <select name="parent_id" ${category ? 'disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"' : 'class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]"'} id="cf-parent">
            <option value="">-- Không có (Danh mục cha) --</option>
          </select>
          ${category ? `<p class="text-xs text-gray-400 mt-1">Không thể đổi loại danh mục sau khi tạo</p>` : ''}
        </div>

        <div id="cf-img-section">
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Hình ảnh danh mục</label>
          <div class="flex gap-2 items-center">
            <div id="cf-img-preview" class="w-14 h-14 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex-shrink-0 overflow-hidden flex items-center justify-center">
              ${category?.image_url
                ? `<img src="${category.image_url}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'20\\' height=\\'20\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23d1d5db\\' stroke-width=\\'2\\'><rect x=\\'3\\' y=\\'3\\' width=\\'18\\' height=\\'18\\' rx=\\'2\\'/><circle cx=\\'8.5\\' cy=\\'8.5\\' r=\\'1.5\\'/><polyline points=\\'21 15 16 10 5 21\\'/></svg>'">`
                : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`}
            </div>
            <div class="flex-1 flex flex-col gap-2">
              <input id="cf-image-url" name="image_url" type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]"
                value="${category?.image_url || ''}" placeholder="URL ảnh hoặc chọn từ thư viện..."/>
              <button type="button" id="cf-pick-img"
                class="px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50 flex items-center gap-1 self-start">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                Chọn từ thư viện ảnh
              </button>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
          <textarea name="description" rows="6"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C] resize-y min-h-[100px]">${category?.description || ''}</textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Thứ tự</label>
            <input name="sort_order" type="number"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]"
              value="${category?.sort_order ?? 0}"/>
          </div>
          <div class="flex items-end pb-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_active" class="w-4 h-4 accent-[#C9A84C]" ${category?.is_active !== false ? 'checked' : ''}>
              <span class="text-sm text-gray-700">Kích hoạt</span>
            </label>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" id="cf-cancel" class="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">Hủy</button>
          <button type="submit" id="cf-submit" class="px-5 py-2 rounded-lg bg-[#C9A84C] text-white hover:bg-[#b8963e] text-sm font-medium">Lưu</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('#cf-close').addEventListener('click', close);
  overlay.querySelector('#cf-cancel').addEventListener('click', close);

  const nameInput = overlay.querySelector('[name="name"]');
  const slugInput = overlay.querySelector('#cf-slug');
  const imageUrlInput = overlay.querySelector('#cf-image-url');
  const imgPreview = overlay.querySelector('#cf-img-preview');
  const parentSelect = overlay.querySelector('#cf-parent');
  const imgSection = overlay.querySelector('#cf-img-section');

  const toggleImageSection = () => {
    if (parentSelect.value) {
      imgSection.style.display = 'none';
      if (imageUrlInput) imageUrlInput.value = '';
    } else {
      imgSection.style.display = 'block';
    }
  };

  parentSelect.addEventListener('change', toggleImageSection);

  loadParents(overlay, category?.category_id || category?.parent_id, category?.id).then(toggleImageSection);

  nameInput.addEventListener('input', () => {
    if (!category) slugInput.value = slugify(nameInput.value);
  });

  overlay.querySelector('#cf-gen-slug').addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (name) slugInput.value = slugify(name);
  });

  // Image URL manual input → update preview
  imageUrlInput.addEventListener('input', () => {
    updatePreview(imgPreview, imageUrlInput.value.trim());
  });

  // Image picker button
  overlay.querySelector('#cf-pick-img').addEventListener('click', () => {
    openImagePicker((url) => {
      imageUrlInput.value = url;
      updatePreview(imgPreview, url);
    });
  });

  overlay.querySelector('#cat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = overlay.querySelector('#cf-submit');
    btn.textContent = 'Đang lưu...'; btn.disabled = true;
    try {
      const fd = new FormData(e.target);
      const body = Object.fromEntries(fd.entries());
      body.is_active = fd.has('is_active');
      body.sort_order = Number(body.sort_order);

      const parentId = body.parent_id ? Number(body.parent_id) : null;
      delete body.parent_id;

      if (parentId) {
        body.category_id = parentId;
        if (category) {
          await updateSubcategory(category.id, body);
        } else {
          await createSubcategory(body);
        }
      } else {
        if (!body.image_url) delete body.image_url;
        if (category) {
          await updateCategory(category.id, body);
        } else {
          await createCategory(body);
        }
      }

      showToast(category ? 'Cập nhật thành công!' : 'Thêm danh mục thành công!');
      close();
      if (onSaved) onSaved();
    } catch (err) {
      showToast(err.message || 'Có lỗi xảy ra', 'error');
    } finally {
      btn.textContent = 'Lưu'; btn.disabled = false;
    }
  });
}

function updatePreview(previewEl, url) {
  if (!url) {
    previewEl.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
    return;
  }
  previewEl.innerHTML = `<img src="${url}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'20\\' height=\\'20\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23d1d5db\\' stroke-width=\\'2\\'><rect x=\\'3\\' y=\\'3\\' width=\\'18\\' height=\\'18\\' rx=\\'2\\'/></svg>'">`;
}

function slugify(text) {
  const map = {
    'àáạảãâầấậẩẫăằắặẳẵ': 'a', 'èéẹẻẽêềếệểễ': 'e', 'ìíịỉĩ': 'i',
    'òóọỏõôồốộổỗơờớợởỡ': 'o', 'ùúụủũưừứựửữ': 'u', 'ỳýỵỷỹ': 'y', 'đ': 'd',
  };
  let s = text.toLowerCase().trim();
  for (const [chars, rep] of Object.entries(map)) {
    for (const ch of [...chars]) s = s.replaceAll(ch, rep);
  }
  return s.replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-').replace(/^-+|-+$/g, '');
}

async function loadParents(overlay, selectedId, excludeId) {
  try {
    const res = await getCategories();
    const cats = res.data || res;
    const sel = overlay.querySelector('#cf-parent');
    (Array.isArray(cats) ? cats : []).forEach(c => {
      if (c.id == excludeId) return;
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      if (c.id == selectedId) opt.selected = true;
      sel.appendChild(opt);
    });
  } catch {}
}
