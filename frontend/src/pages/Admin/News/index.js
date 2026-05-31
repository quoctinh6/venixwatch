import { API_BASE, STORAGE_KEYS } from '../../../services/config.js';
import { showToast } from '../shared/ui.js';

function getAdminToken() {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || localStorage.getItem('dhat_token');
}

let newsList = [];
let currentPage = 1;
const PAGE_SIZE = 10;
let quillEditor = null;
let currentEditingId = null; // null for create, number for edit

export function renderNews(container) {
  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Quản Lý Tin Tức & Bài Viết</h2>
          <p class="text-sm text-gray-500 mt-0.5">Đăng tải, chỉnh sửa bài viết tin tức, hướng dẫn mua hàng và bài viết đánh giá đồng hồ.</p>
        </div>
        <button id="news-add-btn" class="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] hover:bg-[#b8963e] text-white rounded-lg text-sm font-semibold transition-colors duration-200 shadow-md">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Viết bài mới
        </button>
      </div>

      <!-- Main Content Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead>
              <tr class="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200 text-xs uppercase">
                <th class="px-4 py-3.5 w-24">Ảnh bìa</th>
                <th class="px-4 py-3.5">Tiêu đề bài viết</th>
                <th class="px-4 py-3.5 w-40">Tác giả</th>
                <th class="px-4 py-3.5 w-40">Ngày tạo</th>
                <th class="px-4 py-3.5 w-32">Trạng thái</th>
                <th class="px-4 py-3.5 w-28 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody id="news-tbody" class="divide-y divide-gray-100">
              <tr>
                <td colspan="6" class="py-8 text-center text-gray-400">Đang tải danh sách bài viết...</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="px-4 py-3 border-t border-gray-200 flex items-center justify-between" id="news-pagination"></div>
      </div>
    </div>

    <!-- Form Edit Modal -->
    <div id="news-modal" class="fixed inset-0 z-50 overflow-y-auto hidden bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-zinc-900 text-white">
          <h3 id="modal-title" class="font-bold text-lg">Viết bài mới</h3>
          <button id="close-modal-btn" class="text-white/60 hover:text-white transition-colors duration-200">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        
        <!-- Modal Body (Scrollable) -->
        <div class="p-6 overflow-y-auto flex-1 space-y-5 text-sm text-gray-700">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-gray-700 mb-1">Tiêu đề bài viết <span class="text-red-500">*</span></label>
              <input type="text" id="news-input-title" placeholder="Nhập tiêu đề hấp dẫn..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/25 focus:border-[#C9A84C]" />
            </div>
            <div>
              <label class="block font-semibold text-gray-700 mb-1">Đường dẫn thân thiện (Slug)</label>
              <input type="text" id="news-input-slug" placeholder="bo-sung-ve-day-tu-dong-neu-trong" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/25 focus:border-[#C9A84C] font-mono text-xs" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="md:col-span-2">
              <label class="block font-semibold text-gray-700 mb-1">Tóm tắt ngắn</label>
              <textarea id="news-input-summary" rows="3" placeholder="Tóm tắt ngắn gọn nội dung bài viết..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/25 focus:border-[#C9A84C] resize-none"></textarea>
            </div>
            <div>
              <label class="block font-semibold text-gray-700 mb-1">Ảnh đại diện bài viết</label>
              <div class="flex items-start gap-3">
                <div id="thumb-preview-box" class="w-16 h-16 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                  <span class="text-[10px] text-gray-400">Trống</span>
                </div>
                <div class="flex-1 space-y-1.5">
                  <input type="file" id="news-file-thumb" accept="image/*" class="hidden" />
                  <button type="button" id="news-upload-thumb-btn" class="px-2.5 py-1.5 border border-gray-300 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors w-full">Tải ảnh lên</button>
                  <input type="text" id="news-input-thumb-url" placeholder="Hoặc nhập URL ảnh..." class="w-full px-2.5 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none" />
                </div>
              </div>
            </div>
          </div>

          <!-- Rich Text Editor Container -->
          <div>
            <label class="block font-semibold text-gray-700 mb-1.5">Nội dung chi tiết bài viết <span class="text-red-500">*</span></label>
            <div class="border border-gray-300 rounded-lg overflow-hidden">
              <div id="news-quill-editor" style="min-h-72; max-h-96; overflow-y-auto;" class="bg-white"></div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-gray-700 mb-1">Trạng thái phát hành</label>
              <select id="news-input-status" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/25">
                <option value="draft">Bản nháp (Chỉ Admin xem thấy)</option>
                <option value="published">Xuất bản (Hiển thị ra ngoài Web)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
          <button id="cancel-modal-btn" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-semibold text-sm transition-colors duration-200">Hủy bỏ</button>
          <button id="save-news-btn" class="px-5 py-2 bg-[#C9A84C] hover:bg-[#b8963e] text-white rounded-lg font-semibold text-sm transition-colors duration-200 shadow-md">Lưu bài viết</button>
        </div>
      </div>
    </div>
  `;

  // Bind top actions
  container.querySelector('#news-add-btn').addEventListener('click', () => openFormModal(null));
  container.querySelector('#close-modal-btn').addEventListener('click', closeModal);
  container.querySelector('#cancel-modal-btn').addEventListener('click', closeModal);
  container.querySelector('#save-news-btn').addEventListener('click', saveForm);
  
  // Image upload trigger
  const fileInput = container.querySelector('#news-file-thumb');
  const uploadBtn = container.querySelector('#news-upload-thumb-btn');
  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', uploadThumbnail);
  
  // Thumbnail URL text inputs
  const urlInput = container.querySelector('#news-input-thumb-url');
  urlInput.addEventListener('input', (e) => {
    updateThumbPreview(e.target.value.trim());
  });

  // Load editor assets & Load News data
  ensureQuillLoaded().then(() => {
    loadNews(container);
  });
}

function updateThumbPreview(url) {
  const box = document.getElementById('thumb-preview-box');
  if (!box) return;
  if (url) {
    box.innerHTML = `<img src="${url}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<span class=&quot;text-[10px] text-red-500&quot;>Lỗi</span>'" />`;
  } else {
    box.innerHTML = `<span class="text-[10px] text-gray-400">Trống</span>`;
  }
}

async function uploadThumbnail(e) {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('thumbnail', file);

  const uploadBtn = document.getElementById('news-upload-thumb-btn');
  const originalText = uploadBtn.textContent;
  uploadBtn.textContent = 'Đang tải...';
  uploadBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/admin/news/upload-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getAdminToken()}` },
      body: formData
    });
    const json = await res.json();
    if (res.ok && json.success) {
      document.getElementById('news-input-thumb-url').value = json.data.url;
      updateThumbPreview(json.data.url);
      showToast('Tải lên ảnh bìa thành công!', 'success');
    } else {
      showToast(json.error || 'Lỗi tải ảnh bìa.', 'error');
    }
  } catch {
    showToast('Lỗi kết nối máy chủ khi tải ảnh.', 'error');
  } finally {
    uploadBtn.textContent = originalText;
    uploadBtn.disabled = false;
  }
}

async function ensureQuillLoaded() {
  if (window.Quill) return Promise.resolve();

  // Load CSS
  if (!document.getElementById('quill-css')) {
    const link = document.createElement('link');
    link.id = 'quill-css';
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css';
    document.head.appendChild(link);
  }

  // Load Script
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.js';
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

function initQuill() {
  if (quillEditor) return;
  
  quillEditor = new window.Quill('#news-quill-editor', {
    theme: 'snow',
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        ['image', 'link', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['clean']
      ]
    }
  });

  // Custom Quill Image Upload Handler
  const toolbar = quillEditor.getModule('toolbar');
  toolbar.addHandler('image', () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('image', file);

      try {
        const res = await fetch(`${API_BASE}/api/admin/news/upload-image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${getAdminToken()}` },
          body: formData
        });
        const json = await res.json();
        if (res.ok && json.success) {
          const range = quillEditor.getSelection();
          quillEditor.insertEmbed(range.index, 'image', json.data.url);
        } else {
          showToast(json.error || 'Lỗi chèn ảnh vào bài viết.', 'error');
        }
      } catch {
        showToast('Lỗi kết nối khi tải ảnh vào trình soạn thảo.', 'error');
      }
    };
  });
}

async function loadNews(container) {
  const tbody = container.querySelector('#news-tbody');
  try {
    const res = await fetch(`${API_BASE}/api/admin/news?t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${getAdminToken()}` }
    });
    const json = await res.json();
    if (res.ok && json.success) {
      newsList = json.data;
      renderTableRows(container);
      renderPagination(container);
    } else {
      tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-red-500 font-semibold">${json.error || 'Lỗi tải danh sách.'}</td></tr>`;
    }
  } catch {
    tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-red-500 font-semibold">Lỗi kết nối đến máy chủ.</td></tr>`;
  }
}

function renderTableRows(container) {
  const tbody = container.querySelector('#news-tbody');
  tbody.innerHTML = '';

  if (newsList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-12 text-center text-gray-400">Chưa có bài viết tin tức nào được đăng.</td></tr>`;
    return;
  }

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = newsList.slice(start, start + PAGE_SIZE);

  pageItems.forEach((news, idx) => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-gray-100 hover:bg-gray-50/50 transition-all';
    
    const isPublished = news.status === 'published';
    const stt = newsList.length - (start + idx);

    tr.innerHTML = `
      <td class="px-4 py-3">
        <div class="w-16 h-12 rounded border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
          ${news.thumbnail_url 
            ? `<img src="${news.thumbnail_url}" class="w-full h-full object-cover" />` 
            : `<span class="text-[9px] text-gray-400">Không ảnh</span>`
          }
        </div>
      </td>
      <td class="px-4 py-3">
        <div class="font-semibold text-gray-900 leading-tight">${news.title}</div>
        <div class="text-[11px] text-gray-400 font-mono mt-1">Slug: ${news.slug}</div>
      </td>
      <td class="px-4 py-3 text-gray-600 font-medium">${news.author || 'Admin'}</td>
      <td class="px-4 py-3 text-gray-500 text-xs">${new Date(news.created_at).toLocaleString('vi-VN')}</td>
      <td class="px-4 py-3">
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${isPublished ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500'}">
          ${isPublished ? 'Xuất bản' : 'Bản nháp'}
        </span>
      </td>
      <td class="px-4 py-3 text-right">
        <div class="flex items-center justify-end gap-1.5">
          <button class="edit-news-btn p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Chỉnh sửa">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="delete-news-btn p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </td>
    `;

    // Bind row actions
    tr.querySelector('.edit-news-btn').addEventListener('click', () => openFormModal(news));
    tr.querySelector('.delete-news-btn').addEventListener('click', () => deletePost(news.id, news.title, container));

    tbody.appendChild(tr);
  });
}

function renderPagination(container) {
  const wrap = container.querySelector('#news-pagination');
  wrap.innerHTML = '';
  
  const totalPages = Math.ceil(newsList.length / PAGE_SIZE) || 1;
  if (totalPages <= 1) return;

  const start = (currentPage - 1) * PAGE_SIZE;
  const currentTotal = Math.min(start + PAGE_SIZE, newsList.length);

  wrap.innerHTML = `
    <div class="text-xs text-gray-500">
      Hiển thị dòng <span class="font-semibold text-gray-700">${start + 1}</span> - <span class="font-semibold text-gray-700">${currentTotal}</span> của <span class="font-semibold text-gray-700">${newsList.length}</span> bài viết
    </div>
    <div class="flex items-center gap-1">
      <button type="button" id="prev-news-page" class="p-1.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" ${currentPage === 1 ? 'disabled' : ''}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span class="text-xs font-bold text-gray-600 px-3">Trang ${currentPage} / ${totalPages}</span>
      <button type="button" id="next-news-page" class="p-1.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" ${currentPage === totalPages ? 'disabled' : ''}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  `;

  wrap.querySelector('#prev-news-page')?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderTableRows(container);
      renderPagination(container);
    }
  });

  wrap.querySelector('#next-news-page')?.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTableRows(container);
      renderPagination(container);
    }
  });
}

function openFormModal(newsObj) {
  const modal = document.getElementById('news-modal');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Initialize Quill Editor dynamically
  initQuill();

  if (newsObj) {
    // Edit Mode
    currentEditingId = newsObj.id;
    document.getElementById('modal-title').textContent = 'Chỉnh sửa bài viết';
    document.getElementById('news-input-title').value = newsObj.title;
    document.getElementById('news-input-slug').value = newsObj.slug;
    document.getElementById('news-input-summary').value = newsObj.summary || '';
    document.getElementById('news-input-thumb-url').value = newsObj.thumbnail_url || '';
    document.getElementById('news-input-status').value = newsObj.status;
    
    // Load content into editor
    quillEditor.setHTML(newsObj.content || '');
    updateThumbPreview(newsObj.thumbnail_url);
  } else {
    // Create Mode
    currentEditingId = null;
    document.getElementById('modal-title').textContent = 'Viết bài mới';
    document.getElementById('news-input-title').value = '';
    document.getElementById('news-input-slug').value = '';
    document.getElementById('news-input-summary').value = '';
    document.getElementById('news-input-thumb-url').value = '';
    document.getElementById('news-input-status').value = 'draft';
    
    // Clear editor
    quillEditor.setHTML('');
    updateThumbPreview('');
  }
}

function closeModal() {
  const modal = document.getElementById('news-modal');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

async function saveForm() {
  const title = document.getElementById('news-input-title').value.trim();
  const slug = document.getElementById('news-input-slug').value.trim();
  const summary = document.getElementById('news-input-summary').value.trim();
  const thumbnailUrl = document.getElementById('news-input-thumb-url').value.trim();
  const status = document.getElementById('news-input-status').value;
  const content = quillEditor.getHTML().trim();

  if (!title) {
    showToast('Tiêu đề bài viết không được để trống.', 'error');
    return;
  }
  if (quillEditor.getText().trim() === '') {
    showToast('Nội dung bài viết không được để trống.', 'error');
    return;
  }

  const payload = { title, slug, summary, thumbnail_url: thumbnailUrl, status, content };
  const isEdit = currentEditingId !== null;
  const url = isEdit 
    ? `${API_BASE}/api/admin/news/${currentEditingId}` 
    : `${API_BASE}/api/admin/news`;
  
  const method = isEdit ? 'PUT' : 'POST';

  const saveBtn = document.getElementById('save-news-btn');
  const originalText = saveBtn.textContent;
  saveBtn.textContent = 'Đang lưu...';
  saveBtn.disabled = true;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAdminToken()}`
      },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (res.ok && json.success) {
      showToast(isEdit ? 'Đã lưu các thay đổi bài viết!' : 'Tạo mới bài viết thành công!', 'success');
      closeModal();
      loadNews(document.getElementById('admin-content'));
    } else {
      showToast(json.error || 'Lỗi khi lưu bài viết.', 'error');
    }
  } catch {
    showToast('Lỗi kết nối máy chủ.', 'error');
  } finally {
    saveBtn.textContent = originalText;
    saveBtn.disabled = false;
  }
}

async function deletePost(id, title, container) {
  if (!confirm(`Bạn có chắc chắn muốn xóa bài viết "${title}"?`)) return;

  try {
    const res = await fetch(`${API_BASE}/api/admin/news/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getAdminToken()}` }
    });
    const json = await res.json();
    if (res.ok && json.success) {
      showToast('Xóa bài viết thành công!', 'success');
      loadNews(container);
    } else {
      showToast(json.error || 'Lỗi khi xóa bài viết.', 'error');
    }
  } catch {
    showToast('Lỗi kết nối khi xóa bài viết.', 'error');
  }
}

// Add simple setHTML helper to Quill prototype for convenience
if (typeof window !== 'undefined' && !window.QuillSetHTMLAdded) {
  window.QuillSetHTMLAdded = true;
  // This helper will run after Quill is dynamically loaded and initialized.
  setTimeout(() => {
    if (window.Quill) {
      window.Quill.prototype.setHTML = function (html) {
        this.container.firstChild.innerHTML = html;
      };
      window.Quill.prototype.getHTML = function () {
        return this.container.firstChild.innerHTML;
      };
    }
  }, 1000);
}
