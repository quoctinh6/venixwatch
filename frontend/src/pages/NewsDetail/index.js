/**
 * NewsDetail/index.js — Public blog/news detail page with inline editing
 */
import { API_BASE } from '../../services/config.js';
import { navigate } from '../../utils/helpers.js';
import { authService } from '../../services/authService.js';

export default class NewsDetailPage {
  constructor(params = {}) {
    this._slug = params.slug || '';
    this._article = null;
    this._related = [];
    this._isEditing = false;
    this._canEdit = false;
    this._container = null;
  }

  async render() {
    const wrap = document.createElement('div');
    wrap.className = 'bg-[#FAF8F3]/40 min-h-screen font-sans pb-20';

    const container = document.createElement('div');
    container.className = 'max-w-4xl mx-auto px-6 py-8';
    this._container = container;
    wrap.appendChild(container);

    container.innerHTML = `
      <div class="space-y-6 animate-pulse">
        <div class="h-4 bg-zinc-200 rounded w-1/4"></div>
        <div class="h-10 bg-zinc-200 rounded w-3/4"></div>
        <div class="h-4 bg-zinc-200 rounded w-1/3"></div>
        <div class="h-[400px] bg-zinc-200 rounded-3xl"></div>
        <div class="space-y-3">
          <div class="h-4 bg-zinc-200 rounded"></div>
          <div class="h-4 bg-zinc-200 rounded w-5/6"></div>
          <div class="h-4 bg-zinc-200 rounded w-2/3"></div>
        </div>
      </div>`;

    try {
      const [res, listRes] = await Promise.all([
        fetch(`${API_BASE}/api/news/${this._slug}?t=${Date.now()}`),
        fetch(`${API_BASE}/api/news?t=${Date.now()}`),
      ]);
      if (res.ok) {
        const json = await res.json();
        if (json.success) this._article = json.data;
      }
      if (listRes.ok) {
        const listJson = await listRes.json();
        if (listJson.success && Array.isArray(listJson.data)) {
          this._related = listJson.data.filter(a => a.slug !== this._slug).slice(0, 3);
        }
      }
    } catch (err) {
      console.error('Error loading news details:', err);
    }

    const user = authService.getUser();
    this._canEdit = !!(user && (
      user.role === 'super_admin' || user.role === 'admin' || user.role === 'editor' ||
      (user.permissions && user.permissions.includes('settings:write'))
    ));

    if (!this._article) {
      container.innerHTML = `
        <div class="text-center py-20 bg-white border border-zinc-200/50 rounded-2xl max-w-lg mx-auto shadow-sm">
          <svg class="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <h3 class="text-zinc-900 font-bold text-lg">Không tìm thấy bài viết</h3>
          <p class="text-zinc-500 text-sm mt-2 mb-6">Bài viết không tồn tại hoặc đã bị gỡ bỏ.</p>
          <button id="go-back-btn" class="px-6 py-2.5 bg-zinc-950 hover:bg-[#C9A84C] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md">Quay lại danh sách</button>
        </div>`;
      container.querySelector('#go-back-btn')?.addEventListener('click', () => navigate('/tin-tuc'));
      return wrap;
    }

    this._renderArticle();
    this._injectStyles();
    return wrap;
  }

  _renderArticle() {
    const art = this._article;
    const dateStr = new Date(art.created_at).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

    this._container.innerHTML = `
      <div class="flex items-center gap-2 text-xs text-zinc-400 font-semibold mb-6">
        <a href="/" data-nav class="hover:text-zinc-800 transition-colors">Trang chủ</a>
        <span>&rsaquo;</span>
        <a href="/tin-tuc" data-nav class="hover:text-zinc-800 transition-colors">Tin tức</a>
        <span>&rsaquo;</span>
        <span class="text-zinc-800 truncate max-w-[200px]">${art.title}</span>
      </div>

      <article id="news-article-main" class="bg-white border border-zinc-200/50 rounded-3xl shadow-sm p-6 sm:p-10 space-y-8">
        <div class="space-y-4">
          <div class="flex items-start justify-between gap-4">
            <span class="inline-block bg-[#C9A961]/10 text-[#C9A961] text-[10px] font-bold py-1 px-3.5 rounded-full border border-[#C9A961]/25 tracking-wider uppercase shrink-0">TIN TỨC CHÍNH HÃNG</span>
            ${this._canEdit ? `
              <button id="news-detail-edit-btn" class="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 hover:text-[#C9A84C] border border-zinc-200 hover:border-[#C9A84C]/40 px-3 py-1.5 rounded-lg transition-all shrink-0 bg-white shadow-sm">
                <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Chỉnh sửa
              </button>` : ''}
          </div>
          <h1 id="news-article-title" class="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 leading-tight">${art.title}</h1>
          <div class="flex items-center gap-3 text-zinc-400 text-xs font-semibold pt-2 border-t border-zinc-100">
            <span class="text-zinc-700">${art.author || 'Admin'}</span>
            <span class="w-1 h-1 rounded-full bg-zinc-300"></span>
            <span>Đăng ngày ${dateStr}</span>
          </div>
        </div>

        <div id="news-thumb-section" class="${art.thumbnail_url ? '' : 'hidden'}">
          <div class="relative w-full aspect-[21/9] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-200/40 shadow-sm group/thumb">
            <img id="news-thumb-img" src="${art.thumbnail_url || ''}" alt="${art.title}" class="w-full h-full object-cover" />
            <div id="news-thumb-edit-overlay" class="absolute inset-0 bg-zinc-950/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex-col items-center justify-center gap-3 hidden">
              <label style="cursor:pointer;background:rgba(255,255,255,.92);border-radius:10px;padding:8px 16px;font-size:11px;font-weight:700;color:#18181b;display:flex;align-items:center;gap:6px;">
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                Tải ảnh bìa lên
                <input type="file" id="news-thumb-file" accept="image/*" style="display:none;" />
              </label>
              <div style="display:flex;align-items:center;gap:6px;">
                <input type="text" id="news-thumb-url-input" placeholder="Hoặc nhập URL ảnh..." value="${art.thumbnail_url || ''}" style="background:rgba(255,255,255,.92);border:none;border-radius:8px;padding:7px 12px;font-size:11px;width:280px;outline:none;color:#18181b;" />
                <button id="news-thumb-url-apply" style="background:#C9A84C;color:white;border:none;border-radius:8px;padding:7px 12px;font-size:11px;font-weight:700;cursor:pointer;">OK</button>
              </div>
            </div>
          </div>
        </div>

        <div id="news-article-content" class="news-article-content prose max-w-none text-zinc-700 text-sm leading-relaxed space-y-6">
          ${art.content}
        </div>
      </article>

      ${this._related.length > 0 ? `
        <div class="mt-16 space-y-6">
          <div class="flex items-center justify-between border-b border-zinc-200/60 pb-3">
            <h2 class="text-lg font-bold text-zinc-900 uppercase tracking-wide">Các bài viết mới khác</h2>
            <a href="/tin-tuc" data-nav class="text-[#C9A961] hover:underline text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              Xem tất cả
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            ${this._related.map(rel => `
              <div class="group bg-white border border-zinc-200/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer" data-slug="${rel.slug}">
                <div class="aspect-[16/10] overflow-hidden bg-zinc-950 relative">
                  <img src="${rel.thumbnail_url || 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=400'}" alt="${rel.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div class="p-4 flex-1 flex flex-col justify-between">
                  <h3 class="text-zinc-900 group-hover:text-[#C9A961] font-bold text-xs leading-snug transition-colors line-clamp-2">${rel.title}</h3>
                  <div class="pt-3 text-[10px] text-zinc-400 font-semibold flex items-center justify-between">
                    <span>${new Date(rel.created_at).toLocaleDateString('vi-VN')}</span>
                    <span class="text-[#C9A961] uppercase tracking-wider group-hover:underline">Đọc bài &rsaquo;</span>
                  </div>
                </div>
              </div>`).join('')}
          </div>
        </div>` : ''}
    `;

    // Bind nav/slug links
    this._container.querySelectorAll('[data-nav], [data-slug]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const slug = el.dataset.slug;
        const href = el.getAttribute('href');
        if (slug) navigate(`/tin-tuc/${slug}`);
        else if (href) navigate(href);
      });
    });

    // Bind edit button
    if (this._canEdit) {
      this._container.querySelector('#news-detail-edit-btn')?.addEventListener('click', () => this._startEdit());
    }
  }

  // ── Inline edit ──────────────────────────────────────────────────────────────

  _startEdit() {
    if (this._isEditing) return;
    this._isEditing = true;

    const titleEl  = this._container.querySelector('#news-article-title');
    const contentEl = this._container.querySelector('#news-article-content');
    const editBtn  = this._container.querySelector('#news-detail-edit-btn');
    const thumbSection = this._container.querySelector('#news-thumb-section');
    const thumbOverlay = this._container.querySelector('#news-thumb-edit-overlay');

    // Save originals
    this._origTitle   = titleEl.textContent;
    this._origContent = contentEl.innerHTML;
    this._origThumb   = this._article.thumbnail_url || '';

    // Hide edit button, show active state on article
    if (editBtn) editBtn.style.display = 'none';
    this._container.querySelector('#news-article-main').style.outline = '2px dashed #C9A84C';
    this._container.querySelector('#news-article-main').style.borderRadius = '24px';

    // Make title editable
    titleEl.contentEditable = 'true';
    titleEl.style.cssText = 'outline:none;border-bottom:2px dashed #C9A84C;padding-bottom:4px;cursor:text;caret-color:#C9A84C;';
    titleEl.focus();

    // Make content editable
    contentEl.contentEditable = 'true';
    contentEl.style.cssText = 'outline:2px dashed #C9A84C;border-radius:12px;padding:16px;cursor:text;caret-color:#C9A84C;min-height:200px;';

    // Show thumbnail edit overlay
    if (thumbSection && !thumbSection.classList.contains('hidden')) {
      if (thumbOverlay) {
        thumbOverlay.classList.remove('hidden');
        thumbOverlay.style.display = 'flex';
      }
    }

    // Insert format bar above content
    const formatBar = this._buildFormatBar(contentEl);
    contentEl.parentElement.insertBefore(formatBar, contentEl);

    // Add image upload / url handlers for thumbnail
    this._bindThumbEdit();

    // Bottom save/cancel bar
    this._showSaveBar(titleEl, contentEl);
  }

  _bindThumbEdit() {
    const thumbSection = this._container.querySelector('#news-thumb-section');
    if (!thumbSection) return;

    this._container.querySelector('#news-thumb-file')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const token = authService.getToken();
        const fd = new FormData();
        fd.append('thumbnail', file);
        const res = await fetch(`${API_BASE}/api/admin/news/upload-image`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
        });
        const json = await res.json();
        if (json.success) {
          const url = json.data.url.startsWith('http') ? json.data.url : `${API_BASE}${json.data.url}`;
          this._container.querySelector('#news-thumb-img').src = url;
          this._container.querySelector('#news-thumb-url-input').value = url;
          thumbSection.classList.remove('hidden');
        }
      } catch { /* ignore upload errors silently */ }
    });

    this._container.querySelector('#news-thumb-url-apply')?.addEventListener('click', () => {
      const url = this._container.querySelector('#news-thumb-url-input').value.trim();
      if (url) {
        this._container.querySelector('#news-thumb-img').src = url;
        thumbSection.classList.remove('hidden');
      }
    });
  }

  _showSaveBar(titleEl, contentEl) {
    document.getElementById('news-save-bar')?.remove();

    const bar = document.createElement('div');
    bar.id = 'news-save-bar';
    bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9000;display:flex;align-items:center;justify-content:space-between;padding:12px 24px;background:rgba(255,255,255,.95);backdrop-filter:blur(12px);border-top:1px solid #e4e4e7;box-shadow:0 -4px 24px rgba(0,0,0,.08);font-family:inherit;';
    bar.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:11px;color:#71717a;">Đang chỉnh sửa bài viết</span>
        <button id="nsd-undo" style="font-size:11px;font-weight:600;color:#52525b;border:1px solid #e4e4e7;padding:4px 10px;border-radius:6px;background:white;cursor:pointer;">Hoàn tác</button>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <button id="nsd-cancel" style="border:1px solid #e4e4e7;padding:8px 18px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;background:white;color:#52525b;">Hủy</button>
        <button id="nsd-save" style="background:#C9A84C;color:white;border:none;padding:9px 22px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Lưu thay đổi
        </button>
      </div>`;
    document.body.appendChild(bar);

    bar.querySelector('#nsd-undo').addEventListener('click', () => document.execCommand('undo'));
    bar.querySelector('#nsd-cancel').addEventListener('click', () => this._endEdit(false));
    bar.querySelector('#nsd-save').addEventListener('click', async () => {
      const saveBtn = bar.querySelector('#nsd-save');
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<div style="width:12px;height:12px;border:2px solid rgba(255,255,255,.4);border-top-color:white;border-radius:50%;animation:spin .6s linear infinite;"></div> Đang lưu...';

      const newTitle   = titleEl.textContent.trim();
      const newContent = this._cleanForSave(contentEl);
      const newThumb   = this._container.querySelector('#news-thumb-url-input')?.value.trim()
                        || this._container.querySelector('#news-thumb-img')?.src
                        || this._origThumb;

      const token = authService.getToken();
      try {
        const res = await fetch(`${API_BASE}/api/admin/news/${this._article.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            ...this._article,
            title: newTitle,
            content: newContent,
            thumbnail_url: newThumb,
          }),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          this._article.title   = newTitle;
          this._article.content = newContent;
          this._article.thumbnail_url = newThumb;
          this._endEdit(true);
        } else {
          alert(json.error || 'Lỗi khi lưu!');
          saveBtn.disabled = false;
          saveBtn.innerHTML = 'Lưu thay đổi';
        }
      } catch {
        alert('Lỗi kết nối máy chủ.');
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Lưu thay đổi';
      }
    });
  }

  _endEdit(saved) {
    this._isEditing = false;
    document.getElementById('news-format-bar')?.remove();
    document.getElementById('news-save-bar')?.remove();

    if (!saved) {
      // Restore originals
      const titleEl = this._container.querySelector('#news-article-title');
      const contentEl = this._container.querySelector('#news-article-content');
      if (titleEl) titleEl.textContent = this._origTitle;
      if (contentEl) contentEl.innerHTML = this._origContent;
      const thumbImg = this._container.querySelector('#news-thumb-img');
      if (thumbImg) thumbImg.src = this._origThumb;
    }

    // Re-render for clean state
    this._renderArticle();
    this._injectStyles();
  }

  _cleanForSave(contentEl) {
    const clone = contentEl.cloneNode(true);
    clone.removeAttribute('contenteditable');
    clone.style.cssText = '';
    // Remove any editor controls injected
    clone.querySelectorAll('[data-ne-ctrl]').forEach(el => el.remove());
    return clone.innerHTML;
  }

  // ── Format bar ──────────────────────────────────────────────────────────────

  _buildFormatBar(contentEl) {
    document.getElementById('news-format-bar')?.remove();

    const bar = document.createElement('div');
    bar.id = 'news-format-bar';
    bar.style.cssText = 'display:flex;align-items:center;flex-wrap:wrap;gap:2px;padding:6px 10px;background:#fafafa;border:1px solid #e4e4e7;border-radius:12px;margin-bottom:8px;user-select:none;';

    const TOOLS = [
      { cmd: 'bold',      label: '<b style="font-size:12px;">B</b>',  title: 'Đậm' },
      { cmd: 'italic',    label: '<i style="font-size:12px;">I</i>',  title: 'Nghiêng' },
      { cmd: 'underline', label: '<u style="font-size:12px;">U</u>',  title: 'Gạch chân' },
      { sep: true },
      { cmd: 'formatBlock', val: 'H2', label: 'H2', title: 'Tiêu đề lớn' },
      { cmd: 'formatBlock', val: 'H3', label: 'H3', title: 'Tiêu đề vừa' },
      { cmd: 'formatBlock', val: 'P',  label: '¶',  title: 'Đoạn văn' },
      { sep: true },
      { cmd: 'insertUnorderedList', label: '• List', title: 'Danh sách' },
      { cmd: 'insertOrderedList',   label: '1. List', title: 'Danh sách số' },
      { sep: true },
      { action: 'insertImage', label: '📷 Ảnh', title: 'Chèn ảnh' },
      { action: 'insertLink',  label: '🔗 Link', title: 'Chèn liên kết' },
    ];

    const btnBase = 'padding:3px 8px;border:1px solid transparent;border-radius:5px;background:transparent;cursor:pointer;font-size:11px;font-weight:600;color:#3f3f46;transition:all .12s;white-space:nowrap;';

    TOOLS.forEach(t => {
      if (t.sep) {
        const s = document.createElement('span');
        s.style.cssText = 'width:1px;height:18px;background:#e4e4e7;margin:0 3px;flex-shrink:0;';
        bar.appendChild(s);
        return;
      }

      const btn = document.createElement('button');
      btn.innerHTML = t.label;
      btn.title = t.title || '';
      btn.style.cssText = btnBase;
      btn.addEventListener('mouseover', () => { btn.style.background = '#f4f4f5'; btn.style.borderColor = '#d4d4d8'; });
      btn.addEventListener('mouseout',  () => { btn.style.background = 'transparent'; btn.style.borderColor = 'transparent'; });

      if (t.cmd) {
        btn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          contentEl.focus();
          document.execCommand(t.cmd, false, t.val || null);
        });
      } else if (t.action === 'insertImage') {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this._insertImageDialog(contentEl);
        });
      } else if (t.action === 'insertLink') {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const url = prompt('Nhập URL liên kết:');
          if (url) { contentEl.focus(); document.execCommand('createLink', false, url); }
        });
      }

      bar.appendChild(btn);
    });

    return bar;
  }

  _insertImageDialog(contentEl) {
    document.getElementById('news-img-dialog')?.remove();

    const dialog = document.createElement('div');
    dialog.id = 'news-img-dialog';
    dialog.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);';
    dialog.innerHTML = `
      <div style="background:white;border-radius:14px;box-shadow:0 16px 60px rgba(0,0,0,.2);width:100%;max-width:460px;overflow:hidden;font-family:inherit;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 18px;background:#fafafa;border-bottom:1px solid #f4f4f5;">
          <span style="font-size:12px;font-weight:700;color:#18181b;">Chèn ảnh vào bài viết</span>
          <button id="nid-close" style="width:26px;height:26px;border:none;background:transparent;cursor:pointer;font-size:16px;color:#a1a1aa;">×</button>
        </div>
        <div style="padding:16px;display:flex;flex-direction:column;gap:12px;">
          <div>
            <label style="font-size:9px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:.07em;display:block;margin-bottom:6px;">Tải ảnh lên</label>
            <label style="display:inline-flex;align-items:center;gap:6px;padding:7px 14px;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;color:#52525b;">
              <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              Chọn file ảnh
              <input type="file" id="nid-file" accept="image/*" style="display:none;" />
            </label>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="flex:1;height:1px;background:#e4e4e7;"></div>
            <span style="font-size:10px;color:#a1a1aa;font-weight:600;">hoặc</span>
            <div style="flex:1;height:1px;background:#e4e4e7;"></div>
          </div>
          <div>
            <label style="font-size:9px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:.07em;display:block;margin-bottom:6px;">URL ảnh</label>
            <input type="text" id="nid-url" placeholder="https://..." style="width:100%;padding:8px 12px;border:1px solid #e4e4e7;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box;" />
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;padding:12px 18px;border-top:1px solid #f4f4f5;background:#fafafa;">
          <button id="nid-cancel" style="border:1px solid #e4e4e7;padding:7px 16px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;background:white;color:#52525b;">Hủy</button>
          <button id="nid-insert" style="background:#C9A84C;color:white;border:none;padding:7px 18px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">Chèn ảnh</button>
        </div>
      </div>`;

    document.body.appendChild(dialog);

    const close = () => dialog.remove();
    dialog.querySelector('#nid-close').addEventListener('click', close);
    dialog.querySelector('#nid-cancel').addEventListener('click', close);
    dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });

    dialog.querySelector('#nid-file').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const insertBtn = dialog.querySelector('#nid-insert');
      insertBtn.disabled = true;
      insertBtn.textContent = 'Đang tải...';
      try {
        const token = authService.getToken();
        const fd = new FormData();
        fd.append('image', file);
        const res = await fetch(`${API_BASE}/api/admin/news/upload-image`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
        });
        const json = await res.json();
        if (json.success) {
          const url = json.data.url.startsWith('http') ? json.data.url : `${API_BASE}${json.data.url}`;
          dialog.querySelector('#nid-url').value = url;
        }
      } finally {
        insertBtn.disabled = false;
        insertBtn.textContent = 'Chèn ảnh';
      }
    });

    dialog.querySelector('#nid-insert').addEventListener('click', () => {
      const url = dialog.querySelector('#nid-url').value.trim();
      if (!url) return;
      contentEl.focus();
      document.execCommand('insertHTML', false, `<img src="${url}" alt="" style="max-width:100%;border-radius:12px;margin:16px auto;display:block;" />`);
      close();
    });
  }

  _injectStyles() {
    const id = 'news-detail-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes spin { to { transform: rotate(360deg); } }
      .news-article-content { font-family: inherit; color: #374151; }
      .news-article-content p { line-height: 1.85 !important; margin-bottom: 1.5rem !important; font-size: 15px !important; }
      .news-article-content h1, .news-article-content h2, .news-article-content h3, .news-article-content h4 {
        color: #111827; font-weight: 800; margin-top: 2rem; margin-bottom: 1rem; line-height: 1.3;
      }
      .news-article-content h1 { font-size: 24px; }
      .news-article-content h2 { font-size: 20px; }
      .news-article-content h3 { font-size: 18px; }
      .news-article-content img { max-width: 100%; height: auto; border-radius: 16px; margin: 2rem auto; display: block; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
      .news-article-content blockquote { border-left: 4px solid #C9A961; padding-left: 1.5rem; font-style: italic; color: #4B5563; margin: 2rem 0; }
      .news-article-content ul, .news-article-content ol { margin-left: 1.5rem; margin-bottom: 1.5rem; list-style-position: outside; }
      .news-article-content ul { list-style-type: disc; }
      .news-article-content ol { list-style-type: decimal; }
      .news-article-content li { margin-bottom: 0.5rem; line-height: 1.7; }
      .news-article-content a { color: #C9A961; text-decoration: underline; font-weight: 600; }
      .news-article-content a:hover { color: #A88840; }
      .news-article-content[contenteditable="true"] a { pointer-events: none; }
    `;
    document.head.appendChild(style);
  }
}
