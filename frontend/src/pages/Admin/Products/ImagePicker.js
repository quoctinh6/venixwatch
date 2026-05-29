import { API_BASE } from '../../../services/config.js';

let pickerOverlay = null;

export function openImagePicker(onSelect) {
  if (pickerOverlay) pickerOverlay.remove();

  pickerOverlay = document.createElement('div');
  pickerOverlay.className = 'fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4';
  pickerOverlay.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <h3 class="text-base font-bold text-gray-900">Chọn hình ảnh</h3>
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-[#b8963e] transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
            Tải ảnh lên
            <input type="file" id="ip-upload-input" accept="image/*" class="hidden">
          </label>
          <button id="ip-close" class="text-gray-400 hover:text-gray-600 p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
      <div id="ip-alert" class="hidden mx-6 mt-4 p-3 rounded-lg text-sm flex-shrink-0"></div>
      <div class="flex-1 overflow-y-auto p-6" data-lenis-prevent>
        <div id="ip-grid" class="grid grid-cols-4 gap-3">
          <div class="col-span-4 py-10 text-center text-gray-400 text-sm">Đang tải...</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(pickerOverlay);

  const close = () => {
    pickerOverlay?.remove();
    pickerOverlay = null;
  };
  pickerOverlay.querySelector('#ip-close').addEventListener('click', close);
  pickerOverlay.addEventListener('click', (e) => {
    if (e.target === pickerOverlay) close();
  });

  pickerOverlay.querySelector('#ip-upload-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    await uploadImage(file, onSelect);
  });

  loadImages(onSelect);
}

function showAlert(msg, type = 'error') {
  const el = pickerOverlay?.querySelector('#ip-alert');
  if (!el) return;
  el.className = `mx-6 mt-4 p-3 rounded-lg text-sm flex-shrink-0 ${type === 'error' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`;
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3500);
}

async function loadImages(onSelect) {
  const grid = pickerOverlay?.querySelector('#ip-grid');
  if (!grid) return;

  try {
    const token = localStorage.getItem('dhat_auth_token') || localStorage.getItem('dhat_token');
    const res = await fetch(`${API_BASE}/api/admin/images`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const images = data.data || [];

    if (!grid) return;

    if (!images.length) {
      grid.innerHTML = `<div class="col-span-4 py-10 text-center text-gray-400 text-sm">Chưa có ảnh nào. Hãy tải ảnh lên bằng nút bên trên.</div>`;
      return;
    }

    grid.innerHTML = '';
    images.forEach(img => {
      const div = document.createElement('div');
      div.className = 'cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-[#C9A84C] transition-all group relative bg-gray-50';
      div.innerHTML = `
        <img src="${img.url}" alt="${img.filename}"
          class="w-full h-24 object-cover"
          onerror="this.parentElement.style.display='none'">
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all flex items-center justify-center">
          <svg class="opacity-0 group-hover:opacity-100 w-7 h-7 text-white drop-shadow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <p class="text-xs text-gray-500 truncate px-2 py-1 bg-white">${img.filename}</p>
      `;
      div.addEventListener('click', () => {
        onSelect(img.url);
        pickerOverlay?.remove();
        pickerOverlay = null;
      });
      grid.appendChild(div);
    });
  } catch {
    if (grid) grid.innerHTML = `<div class="col-span-4 py-10 text-center text-red-400 text-sm">Lỗi tải danh sách ảnh</div>`;
  }
}

async function uploadImage(file, onSelect) {
  showAlert('Đang tải lên...', 'info');

  try {
    const token = localStorage.getItem('dhat_auth_token') || localStorage.getItem('dhat_token');
    const fd = new FormData();
    fd.append('file', file);

    const res = await fetch(`${API_BASE}/api/admin/images/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json();

    if (!res.ok || !data.success) throw new Error(data.error || 'Upload thất bại');

    onSelect(data.data.url);
    pickerOverlay?.remove();
    pickerOverlay = null;
  } catch (err) {
    showAlert(`Lỗi: ${err.message}`);
  }
}
