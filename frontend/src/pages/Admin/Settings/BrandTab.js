import { showToast } from '../shared/ui.js';

export function renderBrandTab(settings) {
  return `
    <div class="space-y-8">
      <h3 class="text-base font-bold text-gray-900 border-b pb-3">Cấu Hình Thương Hiệu & Logo</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Left: Brand Settings Form -->
        <div class="space-y-6">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Tên thương hiệu</label>
            <input type="text" id="setting-brand-name" value="${settings.brand_name}" 
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/25 focus:border-[#C9A84C]" />
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Logo hình ảnh (Ảnh tải lên)</label>
            <div class="flex items-start gap-4">
              <div id="logo-preview-box" class="w-20 h-20 border border-gray-200 rounded-xl ${settings.logo_url ? 'bg-zinc-950 p-2' : 'bg-gray-50'} flex items-center justify-center overflow-hidden">
                ${settings.logo_url 
                  ? `<img src="${settings.logo_url}" class="max-h-full max-w-full object-contain" />` 
                  : `<span class="text-xs text-gray-400">Trống</span>`
                }
              </div>
              <div class="flex-1 space-y-2">
                <input type="file" id="logo-file-input" accept="image/*" class="hidden" />
                <div class="flex gap-2">
                  <button id="upload-logo-trigger" class="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs px-3 py-2 rounded-lg transition-colors">Tải ảnh lên</button>
                  ${settings.logo_url ? `<button id="delete-logo-btn" class="border border-red-200 hover:bg-red-50 text-red-600 font-semibold text-xs px-3 py-2 rounded-lg transition-colors">Xóa logo</button>` : ''}
                </div>
                <p class="text-[11px] text-gray-400">Khuyên dùng logo dạng nằm ngang, kích cỡ tối đa 3MB, nền trong suốt (PNG/SVG).</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Small preview layout -->
        <div class="bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col justify-center">
          <h4 class="text-xs font-bold uppercase text-gray-400 mb-3">Hiển thị thử trên Thanh điều hướng</h4>
          <div class="bg-white p-4 border rounded-xl shadow-sm flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              ${settings.logo_url 
                ? `<div class="h-7 w-7 flex items-center justify-center rounded-full bg-zinc-950 border border-zinc-800 shadow-sm p-1"><img src="${settings.logo_url}" class="h-full w-full object-contain" /></div>` 
                : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A961" stroke-width="2" class="animate-pulse"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
              }
              <span class="font-serif text-sm font-bold tracking-wider text-gray-900">${settings.brand_name}</span>
            </div>
            <div class="flex gap-3 text-[10px] font-bold text-gray-400 uppercase">
              <span>Nam</span><span>Nữ</span><span>Liên hệ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function bindBrandTab(container, settings, token, API_BASE, ctx) {
  const brandInput = container.querySelector('#setting-brand-name');
  if (brandInput) {
    brandInput.addEventListener('input', (e) => {
      settings.brand_name = e.target.value.trim();
    });
  }

  // Upload Logo Action
  const uploadTrigger = container.querySelector('#upload-logo-trigger');
  const fileInput = container.querySelector('#logo-file-input');
  const deleteLogoBtn = container.querySelector('#delete-logo-btn');

  uploadTrigger?.addEventListener('click', () => fileInput.click());

  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    uploadTrigger.textContent = 'Đang tải lên...';
    uploadTrigger.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/api/admin/settings/upload-logo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        settings.logo_url = data.data.url;
        showToast('Tải lên ảnh logo thành công và lưu cấu hình!', 'success');
        ctx.loadData(); // Reload all info
      } else {
        showToast(data.error || 'Lỗi tải logo.', 'error');
      }
    } catch (err) {
      showToast('Lỗi kết nối khi tải logo.', 'error');
    } finally {
      uploadTrigger.textContent = 'Tải ảnh lên';
      uploadTrigger.disabled = false;
    }
  });

  // Delete logo immediately
  deleteLogoBtn?.addEventListener('click', async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa logo và chuyển về logo chữ mặc định?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ logo_url: '' })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast('Đã xóa logo thành công.', 'success');
        ctx.loadData();
      } else {
        showToast(json.error || 'Lỗi khi xóa logo.', 'error');
      }
    } catch {
      showToast('Lỗi kết nối khi xóa logo.', 'error');
    }
  });
}
