/**
 * NewsList/index.js — Public blog/news listing page
 */
import { API_BASE } from '../../services/config.js';
import { navigate } from '../../utils/helpers.js';
import { authService } from '../../services/authService.js';

function _injectEditStyles() {
  if (document.getElementById('nl-edit-styles')) return;
  const s = document.createElement('style');
  s.id = 'nl-edit-styles';
  s.textContent = `
    @keyframes nl-card-in { from{opacity:0;transform:scale(.98)} to{opacity:1;transform:scale(1)} }
    .nl-card-editing { outline: 2px solid #C9A84C !important; outline-offset: 0; border-radius: 16px; animation: nl-card-in .18s ease; }
    .nl-card-editing .nl-title  { border-bottom: 1.5px dashed #C9A84C; padding-bottom: 2px; outline: none; caret-color: #C9A84C; }
    .nl-card-editing .nl-summary { border-bottom: 1.5px dashed #d4d4d8; padding-bottom: 2px; outline: none; caret-color: #C9A84C; }
    .nl-title[contenteditable="true"], .nl-summary[contenteditable="true"] { outline: none; cursor: text; }
    .nl-edit-badge { transition: opacity .15s, background .15s; }
  `;
  document.head.appendChild(s);
}

export default class NewsListPage {
  constructor() {
    this._articles   = [];
    this._currentPage = 1;
    this._itemsPerPage = 9;
    this._canEdit    = false;
    this._container  = null;
  }

  async render() {
    const wrap = document.createElement('div');
    wrap.className = 'bg-[#FAF8F3]/40 min-h-screen font-sanspb-16';

    const header = document.createElement('div');
    header.className = 'relative bg-zinc-950 py-16 px-6 text-center text-white overflow-hidden';
    header.innerHTML = `
      <div class="absolute inset-0 bg-cover bg-center opacity-25" style="background-image:url('https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg');"></div>
      <div class="relative max-w-4xl mx-auto space-y-4">
        <span class="text-xs font-black tracking-[0.2em] text-[#C9A961] uppercase">Tin Tức & Sự Kiện</span>
        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase">Venix Chronicle</h1>
        <p class="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">Cập nhật tin tức mới nhất về đồng hồ, các chương trình ưu đãi độc quyền và xu hướng thời trang thượng lưu.</p>
        <div class="h-1 w-12 bg-[#C9A961] mx-auto mt-4"></div>
      </div>`;
    wrap.appendChild(header);

    const container = document.createElement('div');
    container.className = 'max-w-7xl mx-auto px-6 py-12';
    this._container = container;
    container.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-3 gap-8">${
      Array.from({ length: 6 }).map(() => `
        <div class="border border-zinc-200/60 rounded-2xl p-4 bg-white animate-pulse space-y-4">
          <div class="h-48 bg-zinc-100 rounded-xl"></div>
          <div class="h-4 bg-zinc-200 rounded w-1/3"></div>
          <div class="h-6 bg-zinc-200 rounded w-3/4"></div>
          <div class="h-4 bg-zinc-200 rounded w-full"></div>
        </div>`).join('')
    }</div>`;
    wrap.appendChild(container);

    try {
      const res = await fetch(`${API_BASE}/api/news?t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) this._articles = json.data || [];
      }
    } catch (err) { console.error('Error fetching public news:', err); }

    const user = authService.getUser();
    this._canEdit = !!(user && (
      user.role === 'super_admin' || user.role === 'admin' || user.role === 'editor' ||
      (user.permissions && user.permissions.includes('settings:write'))
    ));

    if (this._canEdit) _injectEditStyles();
    this._renderList(container);
    return wrap;
  }

  _renderList(container) {
    if (!this._articles.length) {
      container.innerHTML = `
        <div class="text-center py-20 bg-white border border-zinc-200/50 rounded-2xl max-w-lg mx-auto shadow-sm">
          <p class="text-zinc-500 font-medium text-sm">Chưa có bài viết tin tức nào được đăng tải.</p>
        </div>`;
      return;
    }

    const startIndex = (this._currentPage - 1) * this._itemsPerPage;
    const paginated  = this._articles.slice(startIndex, startIndex + this._itemsPerPage);
    const totalPages = Math.ceil(this._articles.length / this._itemsPerPage);

    let html = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">`;

    paginated.forEach(art => {
      const dateStr   = new Date(art.created_at).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' });
      const thumbnail = art.thumbnail_url || 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=600';

      html += `
        <article class="group relative bg-white border border-zinc-200/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full"
                 data-slug="${art.slug}" data-id="${art.id}">

          <!-- Thumbnail area -->
          <div class="nl-thumb-wrap relative overflow-hidden aspect-[16/10] bg-zinc-950">
            <img class="nl-thumb-img w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                 src="${thumbnail}" alt="${art.title}" loading="lazy" />
            <span class="absolute top-4 left-4 bg-zinc-950/80 backdrop-blur-sm text-[#C9A961] text-[10px] font-bold py-1 px-3.5 rounded-full border border-zinc-800 tracking-wider pointer-events-none">TIN TỨC</span>

            ${this._canEdit ? `
            <!-- Always-visible edit badge -->
            <button class="nl-edit-badge absolute top-3 right-3 flex items-center gap-1.5 bg-zinc-950/75 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full border border-white/20 hover:bg-[#C9A84C] hover:border-[#C9A84C] z-10"
                    title="Chỉnh sửa bài viết này">
              <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Sửa
            </button>

            <!-- Thumb change bar (shown only in edit mode) -->
            <div class="nl-thumb-bar absolute bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-sm px-3 py-2 flex items-center gap-2 translate-y-full transition-transform duration-200">
              <label class="flex items-center gap-1.5 bg-white/90 text-zinc-900 text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer hover:bg-white shrink-0 transition-colors">
                <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                Tải ảnh
                <input type="file" class="nl-file-input" accept="image/*" style="display:none;" />
              </label>
              <input type="text" class="nl-url-input flex-1 min-w-0"
                     placeholder="URL ảnh..." value="${thumbnail}"
                     style="background:rgba(255,255,255,.9);border:none;border-radius:7px;padding:4px 8px;font-size:10px;outline:none;color:#18181b;" />
            </div>` : ''}
          </div>

          <!-- Card body -->
          <div class="p-6 flex-1 flex flex-col justify-between">
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-zinc-400 text-xs font-semibold">
                <span>${art.author || 'Admin'}</span>
                <span class="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
                <span>${dateStr}</span>
              </div>

              <h3 class="nl-title text-zinc-900 font-bold text-lg leading-snug"
                  spellcheck="false"
                  data-original="${art.title.replace(/"/g,'&quot;')}">${art.title}</h3>

              <p class="nl-summary text-zinc-500 text-sm leading-relaxed"
                 spellcheck="false"
                 data-original="${(art.summary||'').replace(/"/g,'&quot;')}">${art.summary || ''}</p>
            </div>

            <div class="nl-read-more pt-6 border-t border-zinc-100 flex items-center justify-between text-[#C9A961] text-xs font-bold uppercase tracking-wider cursor-pointer hover:underline">
              <span>Đọc tiếp</span>
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>

            ${this._canEdit ? `
            <!-- Save bar: shown in edit mode -->
            <div class="nl-save-bar" style="display:none;align-items:center;justify-content:space-between;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid #f4f4f5;">
              <a class="nl-open-detail text-[10px] font-bold text-[#C9A84C] cursor-pointer hover:underline flex items-center gap-1">
                Sửa nội dung bên trong →
              </a>
              <div style="display:flex;gap:6px;">
                <button class="nl-cancel-btn" style="border:1px solid #e4e4e7;padding:4px 12px;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer;background:white;color:#52525b;">Hủy</button>
                <button class="nl-save-btn" style="background:#C9A84C;color:white;border:none;padding:5px 14px;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px;">
                  <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  Lưu
                </button>
              </div>
            </div>` : ''}
          </div>
        </article>`;
    });

    html += `</div>`;

    if (totalPages > 1) {
      html += `
        <div class="flex items-center justify-center gap-2 mt-12 border-t border-zinc-200/50 pt-8">
          <button type="button" id="prev-page" class="p-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" ${this._currentPage===1?'disabled':''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div class="flex items-center gap-1.5">
            ${Array.from({length:totalPages}).map((_,i)=>{const p=i+1,a=p===this._currentPage;return`<button type="button" class="page-btn w-10 h-10 rounded-xl text-xs font-bold transition-all ${a?'bg-[#C9A84C] text-white':'border border-zinc-200 text-zinc-600 hover:bg-zinc-50'}" data-page="${p}">${p}</button>`;}).join('')}
          </div>
          <button type="button" id="next-page" class="p-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" ${this._currentPage===totalPages?'disabled':''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>`;
    }

    container.innerHTML = html;

    // ── Bind each card ──────────────────────────────────────────────────────────
    container.querySelectorAll('article[data-id]').forEach(card => {
      const id  = parseInt(card.dataset.id, 10);
      const art = this._articles.find(a => a.id === id);
      if (!art) return;

      const thumbImg  = card.querySelector('.nl-thumb-img');
      const thumbBar  = card.querySelector('.nl-thumb-bar');
      const titleEl   = card.querySelector('.nl-title');
      const summaryEl = card.querySelector('.nl-summary');
      const saveBar   = card.querySelector('.nl-save-bar');
      const readMore  = card.querySelector('.nl-read-more');
      const editBadge = card.querySelector('.nl-edit-badge');

      // Read more → navigate
      readMore?.addEventListener('click', (e) => {
        e.stopPropagation();
        navigate(`/tin-tuc/${art.slug}`);
      });

      if (!this._canEdit) return;

      let _editing = false;

      const enterEdit = () => {
        if (_editing) return;
        _editing = true;
        card.classList.add('nl-card-editing');
        // Show thumbnail change bar
        if (thumbBar) thumbBar.style.transform = 'translateY(0)';
        // Make title/summary editable
        titleEl.contentEditable   = 'true';
        summaryEl.contentEditable = 'true';
        titleEl.focus();
        // Show save bar
        if (saveBar) saveBar.style.display = 'flex';
        // Edit badge → active state
        if (editBadge) { editBadge.style.background = '#C9A84C'; editBadge.style.borderColor = '#C9A84C'; }
      };

      const exitEdit = (save) => {
        _editing = false;
        card.classList.remove('nl-card-editing');
        if (thumbBar) thumbBar.style.transform = '';
        titleEl.contentEditable   = 'false';
        summaryEl.contentEditable = 'false';
        if (saveBar) saveBar.style.display = 'none';
        if (editBadge) { editBadge.style.background = ''; editBadge.style.borderColor = ''; }
        if (!save) {
          // Restore
          titleEl.textContent   = titleEl.dataset.original;
          summaryEl.textContent = summaryEl.dataset.original;
          thumbImg.src = art.thumbnail_url || 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=600';
          const urlIn = card.querySelector('.nl-url-input');
          if (urlIn) urlIn.value = art.thumbnail_url || '';
        }
      };

      // Edit badge click → enter edit
      editBadge?.addEventListener('click', (e) => { e.stopPropagation(); enterEdit(); });

      // Prevent card navigation when in edit mode
      card.addEventListener('click', (e) => {
        if (_editing) e.stopPropagation();
      });

      // Enter on title → focus summary
      titleEl?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); summaryEl?.focus(); }
      });

      // URL input → live preview
      card.querySelector('.nl-url-input')?.addEventListener('input', (e) => {
        const v = e.target.value.trim();
        if (v) thumbImg.src = v;
      });

      // File upload
      card.querySelector('.nl-file-input')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const saveBtn = card.querySelector('.nl-save-btn');
        if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Đang tải...'; }
        try {
          const token = authService.getToken();
          const fd = new FormData();
          fd.append('thumbnail', file);
          const res  = await fetch(`${API_BASE}/api/admin/news/upload-image`, {
            method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
          });
          const json = await res.json();
          if (json.success) {
            const url = json.data.url.startsWith('http') ? json.data.url : `${API_BASE}${json.data.url}`;
            thumbImg.src = url;
            const urlIn = card.querySelector('.nl-url-input');
            if (urlIn) urlIn.value = url;
          }
        } finally {
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Lưu';
          }
        }
      });

      // Cancel
      card.querySelector('.nl-cancel-btn')?.addEventListener('click', (e) => { e.stopPropagation(); exitEdit(false); });

      // Open detail for deep edit
      card.querySelector('.nl-open-detail')?.addEventListener('click', (e) => { e.stopPropagation(); navigate(`/tin-tuc/${art.slug}`); });

      // Save
      card.querySelector('.nl-save-btn')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        const saveBtn = card.querySelector('.nl-save-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Đang lưu...';

        const urlIn    = card.querySelector('.nl-url-input');
        const newThumb = urlIn?.value.trim() || art.thumbnail_url || '';
        const data = {
          ...art,
          title:         titleEl.textContent.trim(),
          summary:       summaryEl.textContent.trim(),
          thumbnail_url: newThumb,
        };

        try {
          const token = authService.getToken();
          const res  = await fetch(`${API_BASE}/api/admin/news/${art.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(data),
          });
          const json = await res.json();
          if (res.ok && json.success) {
            Object.assign(art, data);
            titleEl.dataset.original   = data.title;
            summaryEl.dataset.original = data.summary;
            exitEdit(true);
          } else {
            alert(json.error || 'Lỗi khi lưu!');
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Lưu';
          }
        } catch {
          alert('Lỗi kết nối máy chủ.');
          saveBtn.disabled = false;
          saveBtn.innerHTML = 'Lưu';
        }
      });
    });

    // Navigate on card body click (when not editing)
    container.querySelectorAll('article[data-slug]').forEach(card => {
      // read-more already handles navigation; card body click is blocked when editing
    });

    // Pagination
    container.querySelector('#prev-page')?.addEventListener('click', () => {
      if (this._currentPage > 1) { this._currentPage--; this._renderList(container); window.scrollTo({top:0,behavior:'smooth'}); }
    });
    container.querySelector('#next-page')?.addEventListener('click', () => {
      const total = Math.ceil(this._articles.length / this._itemsPerPage);
      if (this._currentPage < total) { this._currentPage++; this._renderList(container); window.scrollTo({top:0,behavior:'smooth'}); }
    });
    container.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._currentPage = parseInt(btn.dataset.page, 10);
        this._renderList(container);
        window.scrollTo({top:0,behavior:'smooth'});
      });
    });
  }
}
