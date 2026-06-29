/**
 * StaticPolicy/index.js — Tab-based policy page with inline editing
 */
import { authService } from '../../services/authService.js';
import { API_BASE, STORAGE_KEYS } from '../../services/config.js';

const POLICY_MENU = [
  { key: 'gioi-thieu', label: 'Về Chúng Tôi', path: '/gioi-thieu', icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>` },
  { key: 'van-chuyen', label: 'Chính Sách Vận Chuyển', path: '/van-chuyen', icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path d="M13 9h4l3 5v3h-1m-4 0H9m-2 0H5m4 0h6m-9 0V6a2 2 0 012-2h6a2 2 0 012 2v2m-6 5h6"></path></svg>` },
  { key: 'doi-tra', label: 'Đổi Trả & Hoàn Tiền', path: '/doi-tra', icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 6H16"></path></svg>` },
  { key: 'bao-hanh', label: 'Chính Sách Bảo Hành', path: '/bao-hanh', icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>` },
  { key: 'bao-mat', label: 'Chính Sách Bảo Mật', path: '/bao-mat', icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>` },
  { key: 'dieu-khoan', label: 'Điều Khoản Dịch Vụ', path: '/dieu-khoan', icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>` },
  { key: 'faq', label: 'Câu Hỏi Thường Gặp', path: '/faq', icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>` },
];

export default class StaticPolicyPage {
  constructor(params = {}) {
    this._activeKey = params.policyType || 'gioi-thieu';
    this._el = null;
    this._contentEl = null;
    this._isEditing = false;
    this._editOriginal = '';
  }

  async render() {
    const brandName = window.APP_SETTINGS?.brand_name || 'Venix Watch';
    const activeMenu = POLICY_MENU.find(m => m.key === this._activeKey) || POLICY_MENU[0];
    document.title = `${activeMenu.label} — ${brandName}`;

    const container = document.createElement('div');
    container.className = 'w-full bg-[#fcfbfa] min-h-[100vh] py-12 md:py-20 font-sans';
    this._el = container;

    container.innerHTML = `
      <style>
        @keyframes policy-fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .policy-panel-enter { animation: policy-fade-in 0.28s ease forwards; }
        .faq-accordion-item.active { border-color: #C9A84C; box-shadow: 0 4px 20px rgba(201,168,76,0.05); }
        #policy-inner-content[contenteditable="true"] {
          outline: 2px dashed #C9A84C;
          border-radius: 12px;
          cursor: text;
          caret-color: #C9A84C;
        }
        #policy-inner-content[contenteditable="true"] a { pointer-events: none; }
        #policy-inner-content[contenteditable="true"] button { pointer-events: none; }
        #policy-inner-content[contenteditable="true"] .pe-ctrl,
        #policy-inner-content[contenteditable="true"] .pe-ctrl button,
        #policy-inner-content[contenteditable="true"] .pe-add { pointer-events: auto !important; cursor: pointer !important; user-select: none; }
        #policy-inner-content[contenteditable="true"] .pe-ctrl button:hover { opacity: 1 !important; }
      </style>

      <div class="max-w-container mx-auto px-4 md:px-10">
        <div class="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-400 mb-8 md:mb-12">
          <a href="/" onclick="event.preventDefault();history.pushState({},'','/');window.dispatchEvent(new PopStateEvent('popstate'));"
             class="hover:text-[#C9A84C] transition-colors font-semibold">Trang chủ</a>
          <svg class="w-3 h-3 text-zinc-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"></path></svg>
          <span class="text-zinc-650 font-bold" id="policy-breadcrumb-label">${activeMenu.label}</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8 md:gap-12">
          <!-- Sidebar -->
          <div class="lg:col-span-1">
            <div class="bg-white border border-zinc-100 rounded-xl p-6 shadow-sm sticky top-28">
              <h3 class="text-[12px] font-extrabold uppercase tracking-[0.15em] text-zinc-900 border-b border-zinc-100 pb-4 mb-4">
                Hỗ Trợ Khách Hàng
              </h3>
              <nav class="flex flex-col gap-1.5" id="policy-sidebar-nav">
                ${POLICY_MENU.map(item => this._renderNavBtn(item, item.key === this._activeKey)).join('')}
              </nav>
            </div>
          </div>

          <!-- Content Panel -->
          <div class="lg:col-span-3">
            <div class="bg-white border border-zinc-100 rounded-xl shadow-sm relative" id="policy-content-panel">
              ${this._renderPanel(this._activeKey)}
            </div>
          </div>
        </div>
      </div>
    `;

    this._contentEl = container.querySelector('#policy-content-panel');

    // Sidebar nav
    container.querySelector('#policy-sidebar-nav').addEventListener('click', (e) => {
      const btn = e.target.closest('.policy-nav-btn');
      if (!btn) return;
      if (this._isEditing) return;
      const key = btn.dataset.policyKey;
      const path = btn.dataset.policyPath;
      if (key === this._activeKey) return;
      history.pushState({}, '', path);
      this._switchTo(key);
    });

    // Bind edit button + faq for initial render
    this._bindPanelEvents(this._activeKey);

    return container;
  }

  updateParams(params = {}) {
    const key = params.policyType || 'gioi-thieu';
    if (key !== this._activeKey) this._switchTo(key);
  }

  destroy() {
    this._removeEditBar();
  }

  // ─── helpers ────────────────────────────────────────────────────────────────

  _canEdit() {
    const user = authService.getUser();
    if (!user) return false;
    const hasRole = user.roles?.some(r => {
      const n = typeof r === 'object' ? r.name : r;
      return ['super_admin', 'admin', 'editor'].includes(n);
    });
    return hasRole || !!user.permissions?.includes('settings:write');
  }

  _getToken() {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || localStorage.getItem('dhat_token');
  }

  _renderNavBtn(item, isActive) {
    const activeClass = 'bg-zinc-950 text-[#C9A961] shadow-md translate-x-1';
    const inactiveClass = 'text-zinc-550 hover:bg-zinc-50 hover:text-zinc-950 hover:translate-x-1';
    return `
      <button data-policy-key="${item.key}" data-policy-path="${item.path}"
        class="policy-nav-btn flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-[13px] font-bold transition-all duration-300 group ${isActive ? activeClass : inactiveClass}">
        <span class="policy-nav-icon transition-colors ${isActive ? 'text-[#C9A961]' : 'text-zinc-400 group-hover:text-zinc-900'}">
          ${item.icon}
        </span>
        <span>${item.label}</span>
      </button>`;
  }

  _applyNavBtnState(btn, isActive) {
    const icon = btn.querySelector('.policy-nav-icon');
    if (isActive) {
      btn.className = 'policy-nav-btn flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-[13px] font-bold transition-all duration-300 group bg-zinc-950 text-[#C9A961] shadow-md translate-x-1';
      if (icon) icon.className = 'policy-nav-icon text-[#C9A961] transition-colors';
    } else {
      btn.className = 'policy-nav-btn flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-[13px] font-bold transition-all duration-300 group text-zinc-550 hover:bg-zinc-50 hover:text-zinc-950 hover:translate-x-1';
      if (icon) icon.className = 'policy-nav-icon text-zinc-400 group-hover:text-zinc-900 transition-colors';
    }
  }

  _renderPanel(key) {
    const content = this._getContent(key);
    const editBtn = this._canEdit() ? `
      <button class="policy-inline-edit-btn absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-white border border-zinc-200 hover:border-[#C9A84C] text-zinc-500 hover:text-[#C9A84C] text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all duration-200" title="Chỉnh sửa trực tiếp nội dung trang này">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Chỉnh sửa
      </button>` : '';
    return `
      ${editBtn}
      <div class="p-8 md:p-12 policy-panel-enter" id="policy-inner-content">
        ${content}
      </div>`;
  }

  _bindPanelEvents(key) {
    const editBtn = this._contentEl?.querySelector('.policy-inline-edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => this._startInlineEdit(key));
    }
    if (key === 'faq') this._bindFaqAccordion(this._contentEl);
  }

  _switchTo(key) {
    this._activeKey = key;
    const brandName = window.APP_SETTINGS?.brand_name || 'Venix Watch';
    const activeMenu = POLICY_MENU.find(m => m.key === key) || POLICY_MENU[0];
    document.title = `${activeMenu.label} — ${brandName}`;

    const breadcrumb = this._el?.querySelector('#policy-breadcrumb-label');
    if (breadcrumb) breadcrumb.textContent = activeMenu.label;

    this._el?.querySelectorAll('.policy-nav-btn').forEach(btn => {
      this._applyNavBtnState(btn, btn.dataset.policyKey === key);
    });

    if (this._contentEl) {
      this._contentEl.innerHTML = this._renderPanel(key);
      this._bindPanelEvents(key);
    }

    const scrollTarget = (this._contentEl?.getBoundingClientRect().top ?? 0) + window.scrollY - 120;
    if (window.lenis) window.lenis.scrollTo(scrollTarget, { duration: 0.6 });
    else window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
  }

  // ─── inline editing ──────────────────────────────────────────────────────────

  _startInlineEdit(key) {
    if (this._isEditing) return;
    this._isEditing = true;

    const innerEl = this._contentEl?.querySelector('#policy-inner-content');
    if (!innerEl) return;

    const editBtn = this._contentEl?.querySelector('.policy-inline-edit-btn');
    if (editBtn) editBtn.style.display = 'none';

    this._editOriginal = innerEl.innerHTML;

    // Insert format toolbar before the editable area
    const formatBar = _buildFormatBar(innerEl);
    innerEl.parentElement.insertBefore(formatBar, innerEl);

    // Make content editable
    innerEl.setAttribute('contenteditable', 'true');
    innerEl.setAttribute('data-lenis-prevent', '');

    // Strip formatting on paste — prevents Word/Docs inline styles bleeding in
    innerEl.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
    });

    // Inject per-element controls (delete buttons, add-item buttons)
    _injectBlockControls(innerEl);

    innerEl.focus();
    try {
      const range = document.createRange();
      range.setStart(innerEl, 0);
      range.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    } catch {}

    this._showEditBar(key, innerEl);
  }

  _showEditBar(key, innerEl) {
    const menu = POLICY_MENU.find(m => m.key === key) || POLICY_MENU[0];

    const bar = document.createElement('div');
    bar.id = 'policy-edit-bar';
    bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9998;display:flex;align-items:center;justify-content:space-between;padding:14px 24px;background:#0a0a0a;border-top:1px solid rgba(201,168,76,0.25);font-family:inherit;gap:12px;';
    bar.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;min-width:0;">
        <span style="display:flex;align-items:center;gap:6px;color:#C9A961;font-size:12px;font-weight:700;white-space:nowrap;">
          <span style="width:7px;height:7px;border-radius:50%;background:#C9A961;display:inline-block;animation:pulse 2s infinite;"></span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Đang chỉnh sửa:
        </span>
        <span style="color:white;font-size:13px;font-weight:700;white-space:nowrap;">${menu.label}</span>
        <span style="color:#52525b;font-size:11px;white-space:nowrap;display:none;" class="edit-bar-hint">— Nhấp trực tiếp vào chữ để chỉnh sửa</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;shrink:0;">
        <button id="policy-edit-undo" style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:1px solid #3f3f46;border-radius:8px;background:transparent;color:#a1a1aa;cursor:pointer;transition:all .15s;" title="Hoàn tác (Ctrl+Z)" onmouseover="this.style.borderColor='#71717a';this.style.color='#fff';" onmouseout="this.style.borderColor='#3f3f46';this.style.color='#a1a1aa';">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
        </button>
        <button id="policy-edit-cancel" style="border:1px solid #3f3f46;background:transparent;color:#d4d4d8;font-weight:600;font-size:13px;padding:7px 18px;border-radius:8px;cursor:pointer;transition:all .15s;" onmouseover="this.style.background='#27272a';this.style.color='#fff';" onmouseout="this.style.background='transparent';this.style.color='#d4d4d8';">Hủy</button>
        <button id="policy-edit-save" style="background:#C9A84C;color:white;font-weight:700;font-size:13px;padding:8px 20px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;gap:6px;transition:background .15s;" onmouseover="this.style.background='#b8963e';" onmouseout="this.style.background='#C9A84C';">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Lưu thay đổi
        </button>
      </div>`;

    document.body.appendChild(bar);
    if (this._el) this._el.style.paddingBottom = '76px';

    // Show hint on wider screens
    if (window.innerWidth >= 768) {
      const hint = bar.querySelector('.edit-bar-hint');
      if (hint) hint.style.display = 'inline';
    }

    bar.querySelector('#policy-edit-undo')?.addEventListener('click', () => {
      document.execCommand('undo');
      innerEl.focus();
    });

    bar.querySelector('#policy-edit-cancel')?.addEventListener('click', () => {
      innerEl.innerHTML = this._editOriginal;
      this._endInlineEdit(key, false);
    });

    bar.querySelector('#policy-edit-save')?.addEventListener('click', async () => {
      const saveBtn = bar.querySelector('#policy-edit-save');
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<div style="width:14px;height:14px;border:2px solid rgba(255,255,255,0.35);border-top-color:white;border-radius:50%;animation:spin .6s linear infinite;"></div> Đang lưu...';
      // Clone and clean edit-control elements before saving
      const cleanEl = innerEl.cloneNode(true);
      _cleanEditControls(cleanEl);
      await this._saveContent(key, cleanEl.innerHTML, saveBtn);
    });
  }

  _endInlineEdit(key, rerender = true) {
    this._isEditing = false;
    this._editOriginal = '';

    document.getElementById('policy-format-bar')?.remove();
    _hidePropPanel(this._contentEl?.querySelector('#policy-inner-content'));

    const innerEl = this._contentEl?.querySelector('#policy-inner-content');
    if (innerEl) {
      innerEl.removeAttribute('contenteditable');
      innerEl.removeAttribute('data-lenis-prevent');
    }

    this._removeEditBar();

    if (rerender && this._contentEl) {
      this._contentEl.innerHTML = this._renderPanel(key);
      this._bindPanelEvents(key);
    } else {
      const editBtn = this._contentEl?.querySelector('.policy-inline-edit-btn');
      if (editBtn) editBtn.style.display = '';
    }
  }

  _removeEditBar() {
    document.getElementById('policy-edit-bar')?.remove();
    if (this._el) this._el.style.paddingBottom = '';
  }

  async _saveContent(key, html, saveBtn) {
    const currentSettings = window.APP_SETTINGS || {};
    const policyContent = { ...(currentSettings.policy_content || {}) };
    policyContent[key] = html;

    const token = this._getToken();
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...currentSettings, policy_content: policyContent })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        window.APP_SETTINGS = { ...currentSettings, policy_content: policyContent };
        this._endInlineEdit(key, true);
        _showToast('Đã lưu nội dung thành công!', 'success');
      } else {
        _showToast(json.error || 'Lỗi khi lưu nội dung.', 'error');
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Lưu thay đổi';
        }
      }
    } catch {
      _showToast('Lỗi kết nối máy chủ.', 'error');
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Lưu thay đổi';
      }
    }
  }

  // ─── content getters ─────────────────────────────────────────────────────────

  _getContent(key) {
    const saved = window.APP_SETTINGS?.policy_content?.[key];
    return saved || this._getDefaultHtml(key);
  }

  _getDefaultHtml(key) {
    switch (key) {
      case 'gioi-thieu':  return this._getAboutUsHtml();
      case 'van-chuyen':  return this._getShippingHtml();
      case 'doi-tra':     return this._getRefundHtml();
      case 'bao-hanh':    return this._getWarrantyHtml();
      case 'bao-mat':     return this._getPrivacyHtml();
      case 'dieu-khoan':  return this._getTermsHtml();
      case 'faq':         return this._getFaqHtml();
      default:            return this._getAboutUsHtml();
    }
  }

  _bindFaqAccordion(root) {
    root?.querySelectorAll('.faq-accordion-header').forEach(header => {
      header.addEventListener('click', () => {
        const item = header.parentElement;
        const body = item.querySelector('.faq-accordion-body');
        const icon = header.querySelector('.faq-accordion-icon');
        const isActive = item.classList.contains('active');
        root.querySelectorAll('.faq-accordion-item').forEach(other => {
          if (other !== item) {
            other.classList.remove('active');
            other.querySelector('.faq-accordion-body').style.maxHeight = '0px';
            other.querySelector('.faq-accordion-icon').style.transform = 'rotate(0deg)';
          }
        });
        if (isActive) {
          item.classList.remove('active');
          body.style.maxHeight = '0px';
          icon.style.transform = 'rotate(0deg)';
        } else {
          item.classList.add('active');
          body.style.maxHeight = body.scrollHeight + 'px';
          icon.style.transform = 'rotate(180deg)';
        }
      });
    });
  }

  // ─── default HTML content ────────────────────────────────────────────────────

  _getAboutUsHtml() {
    return `
      <div class="font-sans">
        <h2 class="text-3xl font-extrabold font-serif text-zinc-900 tracking-tight mb-2">Về Chúng Tôi</h2>
        <div class="w-16 h-1 bg-[#C9A84C] mb-8"></div>
        <div class="space-y-6 text-zinc-600 leading-relaxed text-[15px]">
          <p class="font-medium text-zinc-800 text-lg italic">Venix Watch được xây dựng với mong muốn mang đến những chiếc đồng hồ chất lượng, tinh tế và đáng tin cậy dành cho khách hàng Việt Nam.</p>
          <p>Chúng tôi tin rằng một chiếc đồng hồ không chỉ là phụ kiện xem giờ mà còn là sự phản chiếu của phong cách, cá tính và những giá trị mà mỗi người theo đuổi. Vì vậy, mỗi sản phẩm tại Venix Watch đều được lựa chọn dựa trên các tiêu chí về chất lượng, thiết kế và trải nghiệm sử dụng lâu dài.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-10">
          <div class="bg-[#FAF8F3] border border-zinc-100 p-6 rounded-xl relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <div class="absolute top-0 right-0 w-24 h-24 bg-[#C9A84C]/5 rounded-bl-full flex items-center justify-center transition-all group-hover:scale-110">
              <svg class="w-8 h-8 text-[#C9A84C]" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            </div>
            <h3 class="text-lg font-bold text-zinc-900 mb-3 uppercase tracking-wider font-serif">Tầm Nhìn</h3>
            <p class="text-zinc-650 text-[14px] leading-relaxed">Trở thành thương hiệu đồng hồ được khách hàng Việt Nam tin tưởng lựa chọn nhờ chất lượng vượt trội và dịch vụ tận tâm.</p>
          </div>
          <div class="bg-[#FAF8F3] border border-zinc-100 p-6 rounded-xl relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <div class="absolute top-0 right-0 w-24 h-24 bg-[#C9A84C]/5 rounded-bl-full flex items-center justify-center transition-all group-hover:scale-110">
              <svg class="w-8 h-8 text-[#C9A84C]" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h3 class="text-lg font-bold text-zinc-900 mb-3 uppercase tracking-wider font-serif">Sứ Mệnh</h3>
            <p class="text-zinc-650 text-[14px] leading-relaxed">Mang đến những chiếc đồng hồ chất lượng, tinh tế và đáng tin cậy, giúp khách hàng tự tin thể hiện phong cách của riêng mình.</p>
          </div>
        </div>
        <div>
          <h3 class="text-xl font-bold text-zinc-900 mb-6 uppercase tracking-wider font-serif">Giá Trị Cốt Lõi</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            ${[
              { title: 'Chính trực', desc: 'Minh bạch và trung thực trong mọi cam kết.' },
              { title: 'Chất lượng', desc: 'Lấy chất lượng sản phẩm và dịch vụ làm nền tảng.' },
              { title: 'Tận tâm', desc: 'Luôn đặt khách hàng làm trung tâm.' },
              { title: 'Tinh tế', desc: 'Chú trọng từng chi tiết trong sản phẩm.' },
              { title: 'Bền vững', desc: 'Xây dựng niềm tin và giá trị lâu dài.' }
            ].map((v, i) => `
              <div class="bg-white border border-zinc-100 p-5 rounded-lg text-center hover:border-[#C9A84C]/45 transition-colors">
                <div class="w-8 h-8 rounded-full bg-[#C9A84C]/10 text-[#C9A84C] flex items-center justify-center mx-auto mb-3 font-bold text-sm">0${i+1}</div>
                <h4 class="font-bold text-zinc-900 mb-1 text-[14px]">${v.title}</h4>
                <p class="text-[12px] text-zinc-550 leading-snug">${v.desc}</p>
              </div>`).join('')}
          </div>
        </div>
        <div class="mt-10 p-6 bg-zinc-950 text-white rounded-xl text-center relative overflow-hidden">
          <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full pointer-events-none"></div>
          <p class="text-zinc-350 text-[14.5px] italic leading-relaxed max-w-2xl mx-auto">"Venix Watch cam kết không ngừng hoàn thiện để mang đến những sản phẩm chất lượng cùng trải nghiệm mua sắm đáng tin cậy cho mọi khách hàng."</p>
        </div>
      </div>`;
  }

  _getShippingHtml() {
    return `
      <div class="font-sans">
        <h2 class="text-3xl font-extrabold font-serif text-zinc-900 tracking-tight mb-2">Chính Sách Vận Chuyển</h2>
        <div class="w-16 h-1 bg-[#C9A84C] mb-8"></div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div class="bg-[#FAF8F3] border border-zinc-100 rounded-xl p-6 flex gap-4 hover:shadow-sm transition-all">
            <div class="w-12 h-12 bg-[#C9A84C]/10 rounded-xl flex items-center justify-center text-[#C9A84C] shrink-0">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <h3 class="font-bold text-zinc-900 text-[15px] mb-1.5">Miễn Phí Vận Chuyển</h3>
              <p class="text-zinc-600 text-[13px] leading-relaxed">Áp dụng cho mọi đơn hàng có giá trị từ <strong>500.000đ</strong> trở lên trên toàn quốc.</p>
            </div>
          </div>
          <div class="bg-[#FAF8F3] border border-zinc-100 rounded-xl p-6 flex gap-4 hover:shadow-sm transition-all">
            <div class="w-12 h-12 bg-[#C9A84C]/10 rounded-xl flex items-center justify-center text-[#C9A84C] shrink-0">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <h3 class="font-bold text-zinc-900 text-[15px] mb-1.5">Thời Gian Giao Hàng</h3>
              <p class="text-zinc-600 text-[13px] leading-relaxed">Từ <strong>1–5 ngày làm việc</strong> tùy thuộc vào từng khu vực và địa điểm nhận hàng.</p>
            </div>
          </div>
        </div>
        <div class="bg-[#FAF8F3] border border-[#C9A84C]/10 rounded-xl p-6 mt-8">
          <h3 class="font-bold text-zinc-900 text-[16px] mb-3 flex items-center gap-2">
            <svg class="w-5 h-5 text-[#C9A84C]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            Hỗ Trợ Đơn Hàng
          </h3>
          <p class="text-zinc-650 text-[14px] leading-relaxed mb-4">Nếu cần bất kỳ sự hỗ trợ nào liên quan đến tình trạng giao nhận đơn hàng, vui lòng liên hệ bộ phận chăm sóc khách hàng của Venix Watch để được giải đáp nhanh chóng.</p>
          <div class="flex flex-wrap gap-4 text-[13px] font-bold">
            <a href="tel:0929000063" class="inline-flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-lg hover:bg-[#C9A84C] transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
              Hotline: 0929 000 063
            </a>
            <a href="mailto:venixwatch@gmail.com" class="inline-flex items-center gap-2 border border-zinc-200 bg-white text-zinc-800 px-5 py-2.5 rounded-lg hover:bg-zinc-50 transition-colors">
              <svg class="w-4 h-4 text-zinc-450" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              Email: venixwatch@gmail.com
            </a>
          </div>
        </div>
      </div>`;
  }

  _getRefundHtml() {
    return `
      <div class="font-sans">
        <h2 class="text-3xl font-extrabold font-serif text-zinc-900 tracking-tight mb-2">Chính Sách Đổi Trả & Hoàn Tiền</h2>
        <div class="w-16 h-1 bg-[#C9A84C] mb-8"></div>
        <div class="p-5 bg-[#FAF8F3] border border-[#C9A84C]/10 rounded-xl mb-8 flex gap-4 items-center">
          <div class="w-10 h-10 rounded-full bg-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C] shrink-0 font-bold">7</div>
          <p class="text-[14px] text-zinc-750 font-semibold leading-relaxed m-0">Venix Watch hỗ trợ chính sách đổi trả sản phẩm trong vòng <strong>7 ngày</strong> kể từ ngày quý khách nhận được hàng.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
          <div class="bg-[#FAF8F3] border border-zinc-100 rounded-xl p-6">
            <h3 class="font-bold text-emerald-600 text-[15px] mb-4 flex items-center gap-2 border-b border-zinc-200 pb-3 uppercase tracking-wider font-serif">
              <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Điều Kiện Áp Dụng
            </h3>
            <ul class="space-y-3.5 text-zinc-650 text-[13px] leading-relaxed">
              <li class="flex items-start gap-2.5"><span class="text-emerald-550 mt-0.5 font-bold">✓</span><span>Sản phẩm còn nguyên vẹn, <strong>chưa qua sử dụng</strong>.</span></li>
              <li class="flex items-start gap-2.5"><span class="text-emerald-550 mt-0.5 font-bold">✓</span><span>Còn <strong>đầy đủ hộp, phụ kiện</strong> kèm theo và hóa đơn mua hàng.</span></li>
              <li class="flex items-start gap-2.5"><span class="text-emerald-550 mt-0.5 font-bold">✓</span><span>Có lỗi kỹ thuật từ nhà sản xuất hoặc giao sai sản phẩm đã đặt mua.</span></li>
            </ul>
          </div>
          <div class="bg-[#FAF8F3] border border-zinc-100 rounded-xl p-6">
            <h3 class="font-bold text-rose-600 text-[15px] mb-4 flex items-center gap-2 border-b border-zinc-200 pb-3 uppercase tracking-wider font-serif">
              <svg class="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Không Áp Dụng Đổi Trả
            </h3>
            <ul class="space-y-3.5 text-zinc-650 text-[13px] leading-relaxed">
              <li class="flex items-start gap-2.5"><span class="text-rose-550 mt-0.5 font-bold">✕</span><span>Sản phẩm bị hư hỏng, trầy xước do va đập hay sử dụng sai cách.</span></li>
              <li class="flex items-start gap-2.5"><span class="text-rose-550 mt-0.5 font-bold">✕</span><span>Sản phẩm đã qua chỉnh sửa, <strong>cắt mắt dây</strong> hoặc thay đổi kết cấu ban đầu.</span></li>
            </ul>
          </div>
        </div>
        <div class="border border-zinc-100 bg-[#FAF8F3] rounded-xl p-6 mt-8">
          <h3 class="font-bold text-zinc-900 text-[15px] mb-2 uppercase tracking-wider">Thời Gian Hoàn Tiền</h3>
          <p class="text-zinc-650 text-[14px] leading-relaxed">Khoản tiền hoàn trả hợp lệ (nếu có) sẽ được Venix Watch xử lý và gửi lại trong vòng từ <strong>2–3 ngày làm việc</strong> sau khi đã kiểm tra tình trạng sản phẩm hoàn về.</p>
        </div>
      </div>`;
  }

  _getWarrantyHtml() {
    return `
      <div class="font-sans">
        <h2 class="text-3xl font-extrabold font-serif text-zinc-900 tracking-tight mb-2">Chính Sách Bảo Hành</h2>
        <div class="w-16 h-1 bg-[#C9A84C] mb-8"></div>
        <div class="p-6 bg-zinc-950 text-white rounded-xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 class="text-xl font-serif text-[#C9A961] font-bold mb-1">BẢO HÀNH CHÍNH HÃNG 12 THÁNG</h3>
            <p class="text-zinc-400 text-[13px]">Venix Watch cam kết bảo hành 12 tháng đối với tất cả bộ máy đồng hồ.</p>
          </div>
          <div class="shrink-0 flex items-center justify-center border-t md:border-t-0 md:border-l border-zinc-800 pt-4 md:pt-0 md:pl-6">
            <span class="text-2xl font-serif font-extrabold text-[#C9A961]">1 YEAR</span>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
          <div class="bg-[#FAF8F3] border border-zinc-100 rounded-xl p-6">
            <h3 class="font-bold text-emerald-600 text-[15px] mb-4 flex items-center gap-2 border-b border-zinc-200 pb-3 uppercase tracking-wider font-serif">
              <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Phạm Vi Bảo Hành
            </h3>
            <ul class="space-y-3.5 text-zinc-650 text-[13px] leading-relaxed">
              <li class="flex items-start gap-2.5"><span class="text-emerald-550 mt-0.5 font-bold">✓</span><span>Các lỗi kỹ thuật phát sinh từ bộ máy đồng hồ do nhà sản xuất.</span></li>
              <li class="flex items-start gap-2.5"><span class="text-emerald-550 mt-0.5 font-bold">✓</span><span>Đồng hồ ngừng hoạt động hoặc chạy sai giờ bất thường do lỗi kỹ thuật.</span></li>
            </ul>
          </div>
          <div class="bg-[#FAF8F3] border border-zinc-100 rounded-xl p-6">
            <h3 class="font-bold text-rose-600 text-[15px] mb-4 flex items-center gap-2 border-b border-zinc-200 pb-3 uppercase tracking-wider font-serif">
              <svg class="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Không Thuộc Phạm Vi Bảo Hành
            </h3>
            <ul class="space-y-3.5 text-zinc-650 text-[13px] leading-relaxed">
              <li class="flex items-start gap-2.5"><span class="text-rose-550 mt-0.5 font-bold">✕</span><span>Các lỗi do tác động bên ngoài: vỡ kính, trầy xước vỏ, móp méo do va đập.</span></li>
              <li class="flex items-start gap-2.5"><span class="text-rose-550 mt-0.5 font-bold">✕</span><span>Đồng hồ vào nước do sử dụng không đúng tiêu chuẩn chống nước đã khuyến cáo.</span></li>
              <li class="flex items-start gap-2.5"><span class="text-rose-550 mt-0.5 font-bold">✕</span><span>Các hao mòn tự nhiên trong quá trình sử dụng: dây đeo, khóa, pin, v.v.</span></li>
            </ul>
          </div>
        </div>
        <div class="bg-[#FAF8F3] border border-[#C9A84C]/10 rounded-xl p-6 mt-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <p class="text-zinc-650 text-[13.5px] leading-relaxed m-0">Khách hàng vui lòng giữ lại <strong>phiếu bảo hành</strong> hoặc cung cấp <strong>thông tin đơn hàng</strong> mua tại Venix Watch để được hỗ trợ nhanh chóng nhất.</p>
          <a href="tel:0929000063" class="inline-flex items-center gap-2 bg-zinc-900 text-white font-bold text-[12px] px-5 py-3 rounded-lg hover:bg-[#C9A84C] transition-colors shrink-0">LIÊN HỆ BẢO HÀNH</a>
        </div>
      </div>`;
  }

  _getPrivacyHtml() {
    return `
      <div class="font-sans">
        <h2 class="text-3xl font-extrabold font-serif text-zinc-900 tracking-tight mb-2">Chính Sách Bảo Mật</h2>
        <div class="w-16 h-1 bg-[#C9A84C] mb-8"></div>
        <div class="space-y-6 text-zinc-600 leading-relaxed text-[14.5px]">
          <p>Venix Watch cam kết bảo mật tuyệt đối các thông tin cá nhân của khách hàng phù hợp với các quy định hiện hành của pháp luật Việt Nam.</p>
          <h3 class="text-lg font-bold text-zinc-900 mt-8 mb-4 uppercase tracking-wider font-serif">Mục Đích Thu Thập</h3>
          <p>Thông tin thu thập trên website của chúng tôi chỉ được sử dụng cho các mục đích cụ thể dưới đây:</p>
          <ul class="space-y-3 pl-5 list-disc text-[14px]">
            <li><strong>Xử lý đơn hàng:</strong> Quản lý thông tin thanh toán, vận chuyển và bàn giao sản phẩm đến tay khách hàng.</li>
            <li><strong>Hỗ trợ khách hàng:</strong> Giải quyết khiếu nại, hỗ trợ kỹ thuật, đổi trả và thực hiện chế độ bảo hành.</li>
            <li><strong>Cập nhật thông tin:</strong> Gửi thông báo về các ưu đãi đặc biệt và chương trình khuyến mại lớn của cửa hàng.</li>
          </ul>
          <h3 class="text-lg font-bold text-zinc-900 mt-8 mb-4 uppercase tracking-wider font-serif">Cam Kết Bảo Mật</h3>
          <p class="border-l-4 border-[#C9A84C] pl-4 italic text-zinc-700 bg-[#FAF8F3] py-4 pr-4 rounded-r-lg">Chúng tôi cam kết không chia sẻ, trao đổi hoặc bán thông tin cá nhân của khách hàng cho bất kỳ bên thứ ba nào dưới bất kỳ hình thức nào.</p>
        </div>
      </div>`;
  }

  _getTermsHtml() {
    return `
      <div class="font-sans">
        <h2 class="text-3xl font-extrabold font-serif text-zinc-900 tracking-tight mb-2">Điều Khoản Dịch Vụ</h2>
        <div class="w-16 h-1 bg-[#C9A84C] mb-8"></div>
        <div class="space-y-6 text-zinc-600 leading-relaxed text-[14.5px]">
          <p>Bằng việc truy cập và sử dụng dịch vụ trên hệ thống website của Venix Watch, quý khách hàng đồng ý tuân thủ các điều khoản và quy định sử dụng dịch vụ sau đây.</p>
          <h3 class="text-lg font-bold text-zinc-900 mt-8 mb-4 uppercase tracking-wider font-serif">Trách Nhiệm Của Khách Hàng</h3>
          <ul class="space-y-4 pl-5 list-decimal text-[14px]">
            <li>Cung cấp các thông tin liên hệ và thông tin mua hàng chính xác để phục vụ cho việc thanh toán, vận chuyển.</li>
            <li>Không sử dụng các thông tin, tài nguyên và dịch vụ của website vào các mục đích trái quy định của pháp luật Việt Nam.</li>
            <li>Tìm hiểu rõ và tự giác tuân thủ các quy định về chính sách mua hàng, đổi trả và bảo hành đã được công bố trên website.</li>
          </ul>
          <h3 class="text-lg font-bold text-zinc-900 mt-8 mb-4 uppercase tracking-wider font-serif">Quyền Hạn Của Cửa Hàng</h3>
          <p>Venix Watch có toàn quyền chủ động điều chỉnh, chỉnh sửa, nâng cấp nội dung website cũng như thay đổi các chính sách bất kỳ lúc nào khi cần thiết để nâng cao chất lượng dịch vụ phục vụ khách hàng.</p>
        </div>
      </div>`;
  }

  _getFaqHtml() {
    const FAQs = [
      { q: 'Sản phẩm tại Venix Watch có chính hãng không?', a: 'Chúng tôi cam kết 100% tất cả các sản phẩm đồng hồ và phụ kiện được phân phối tại Venix Watch đều là hàng chính hãng từ nhà sản xuất, bảo đảm nguồn gốc xuất xứ rõ ràng và chất lượng đỉnh cao.' },
      { q: 'Tôi có được kiểm tra sản phẩm trước khi thanh toán không?', a: 'Hoàn toàn được. Khách hàng được quyền kiểm tra ngoại quan sản phẩm (đúng mẫu mã, kích thước, màu sắc, tình trạng nguyên vẹn) trước khi ký nhận và tiến hành thanh toán tiền cho nhân viên giao hàng.' },
      { q: 'Thời gian bảo hành đối với đồng hồ tại cửa hàng là bao lâu?', a: 'Tất cả các sản phẩm đồng hồ mua tại Venix Watch đều được áp dụng chính sách bảo hành chính hãng trong vòng 12 tháng đối với các lỗi phát sinh do kỹ thuật của bộ máy bên trong.' },
      { q: 'Venix Watch có hỗ trợ chính sách đổi trả sản phẩm hay không?', a: 'Có. Chúng tôi hỗ trợ quý khách hàng đổi trả sản phẩm hoàn toàn miễn phí trong vòng 7 ngày kể từ ngày nhận hàng với điều kiện sản phẩm còn nguyên vẹn, chưa sử dụng và đầy đủ hộp cũng như hóa đơn.' },
      { q: 'Sau bao lâu thì tôi có thể nhận được hàng đã đặt?', a: 'Thời gian giao nhận hàng của quý khách thông thường dao động từ 1 đến 5 ngày làm việc tùy thuộc vào địa chỉ giao hàng của quý khách thuộc khu vực tỉnh thành nào.' }
    ];
    return `
      <div class="font-sans">
        <h2 class="text-3xl font-extrabold font-serif text-zinc-900 tracking-tight mb-2">FAQ — Câu Hỏi Thường Gặp</h2>
        <div class="w-16 h-1 bg-[#C9A84C] mb-8"></div>
        <p class="text-zinc-550 text-[14.5px] leading-relaxed mb-8">Dưới đây là một số câu hỏi phổ biến mà chúng tôi thường nhận được từ phía quý khách hàng. Nhấp vào mỗi câu hỏi để xem chi tiết câu trả lời.</p>
        <div class="space-y-4">
          ${FAQs.map((faq, i) => `
            <div class="faq-accordion-item border border-zinc-150 rounded-xl overflow-hidden bg-white transition-all duration-300">
              <button class="faq-accordion-header w-full flex items-center justify-between p-5 text-left font-bold text-[14px] text-zinc-800 hover:bg-zinc-50 transition-colors focus:outline-none">
                <span>${i + 1}. ${faq.q}</span>
                <span class="faq-accordion-icon text-[#C9A84C] transition-transform duration-300">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"></path></svg>
                </span>
              </button>
              <div class="faq-accordion-body max-h-0 overflow-hidden transition-all duration-300 ease-out bg-[#FAF8F3]/50">
                <div class="p-5 text-[13.5px] text-zinc-650 leading-relaxed border-t border-zinc-100">${faq.a}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>`;
  }
}

// Export so admin PolicyTab can load default content for the editor
export function getDefaultPolicyHtml(key) {
  return new StaticPolicyPage()._getDefaultHtml(key);
}

// ─── WYSIWYG helpers (shared by inline editor + admin modal) ─────────────────

function _buildFormatBar(editorEl) {
  const bar = document.createElement('div');
  bar.id = 'policy-format-bar';
  bar.style.cssText = 'position:sticky;top:72px;z-index:50;display:flex;align-items:center;gap:2px;flex-wrap:wrap;background:white;border:1px solid #e4e4e7;border-radius:10px;padding:6px 10px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,0.06);';

  const TOOLS = [
    { cmd: 'bold',      label: '<b style="font-size:12px">B</b>',  title: 'Đậm (Ctrl+B)' },
    { cmd: 'italic',    label: '<i style="font-size:12px">I</i>',  title: 'Nghiêng (Ctrl+I)' },
    { cmd: 'underline', label: '<u style="font-size:12px">U</u>',  title: 'Gạch chân' },
    { sep: true },
    { cmd: 'formatBlock', val: 'H2', label: 'H2', title: 'Tiêu đề lớn' },
    { cmd: 'formatBlock', val: 'H3', label: 'H3', title: 'Tiêu đề vừa' },
    { cmd: 'formatBlock', val: 'P',  label: '¶',  title: 'Đoạn văn' },
    { sep: true },
    { action: 'addLi',   label: '+ Thêm mục',  title: 'Thêm dòng mới vào danh sách' },
    { action: 'delLi',   label: '− Xóa mục',   title: 'Xóa dòng danh sách đang chọn' },
    { sep: true },
    { action: 'addCard', label: '+ Thêm thẻ',  title: 'Thêm khối thẻ nội dung mới cuối trang' },
    { action: 'delCard', label: '− Xóa thẻ',   title: 'Xóa khối đang con trỏ đứng trong đó' },
  ];

  const btnBase = 'padding:3px 8px;border:1px solid transparent;border-radius:5px;background:transparent;cursor:pointer;font-size:11px;font-weight:600;color:#3f3f46;transition:all .12s;white-space:nowrap;';
  const btnHover = (btn) => {
    btn.addEventListener('mouseover', () => { btn.style.background = '#f4f4f5'; btn.style.borderColor = '#d4d4d8'; });
    btn.addEventListener('mouseout',  () => { btn.style.background = 'transparent'; btn.style.borderColor = 'transparent'; });
  };

  TOOLS.forEach(t => {
    if (t.sep) {
      const sep = document.createElement('span');
      sep.style.cssText = 'width:1px;height:18px;background:#e4e4e7;margin:0 3px;flex-shrink:0;';
      bar.appendChild(sep);
      return;
    }
    const btn = document.createElement('button');
    btn.innerHTML = t.label;
    btn.title = t.title || '';
    btn.style.cssText = btnBase;
    btnHover(btn);

    if (t.cmd) {
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        editorEl.focus();
        document.execCommand(t.cmd, false, t.val || null);
      });
    } else if (t.action === 'addLi') {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const sel = window.getSelection();
        let node = sel?.anchorNode;
        let li = null;
        while (node && node !== editorEl) {
          if (node.nodeName === 'LI') { li = node; break; }
          node = node.parentNode;
        }
        if (li) {
          const newLi = document.createElement('li');
          newLi.innerHTML = li.innerHTML;
          newLi.querySelectorAll('.pe-del').forEach(b => b.remove());
          newLi.style.cssText = '';
          li.after(newLi);
          const range = document.createRange();
          range.selectNodeContents(newLi);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        } else {
          const list = editorEl.querySelector('ul, ol');
          if (list) {
            const newLi = document.createElement('li');
            newLi.textContent = 'Nội dung mới';
            list.appendChild(newLi);
          }
        }
        _injectBlockControls(editorEl);
      });
    } else if (t.action === 'delLi') {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const sel = window.getSelection();
        let node = sel?.anchorNode;
        while (node && node !== editorEl) {
          if (node.nodeName === 'LI') { node.remove(); break; }
          node = node.parentNode;
        }
        _injectBlockControls(editorEl);
      });
    } else if (t.action === 'addCard') {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const card = document.createElement('div');
        card.className = 'bg-[#FAF8F3] border border-zinc-100 rounded-xl p-6 mt-4';
        card.innerHTML = `<h3 class="font-bold text-zinc-900 text-[15px] mb-2">Tiêu đề thẻ mới</h3><p class="text-zinc-600 text-[13px] leading-relaxed">Nội dung mô tả ở đây.</p>`;

        // Insert after the direct child of editorEl that contains the cursor
        const sel = window.getSelection();
        let node = sel?.anchorNode;
        let insertAfter = null;
        while (node && node !== editorEl) {
          if (node.parentElement === editorEl) { insertAfter = node; break; }
          node = node.parentElement;
        }
        if (insertAfter) insertAfter.after(card);
        else editorEl.appendChild(card);

        _injectBlockControls(editorEl);

        // Select the title for immediate editing
        const titleEl = card.querySelector('h3');
        if (titleEl) {
          const r = document.createRange();
          r.selectNodeContents(titleEl);
          const s = window.getSelection();
          s?.removeAllRanges();
          s?.addRange(r);
        }
      });
    } else if (t.action === 'delCard') {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const sel = window.getSelection();
        let node = sel?.anchorNode;
        // Walk up to find direct child of editorEl
        while (node && node.parentElement !== editorEl) node = node.parentElement;
        if (node && node !== editorEl) {
          if (confirm('Xóa khối nội dung này?')) node.remove();
        }
        _injectBlockControls(editorEl);
      });
    }
    bar.appendChild(btn);
  });

  return bar;
}

// ─── Properties Panel ────────────────────────────────────────────────────────

const _PE_BG = [
  { label: 'Bỏ',      v: '',                      s: 'background:white;border:1px dashed #d4d4d8;' },
  { label: 'White',   v: '#ffffff',               s: 'background:#fff;border:1px solid #e4e4e7;' },
  { label: 'Kem',     v: '#FAF8F3',               s: 'background:#FAF8F3;' },
  { label: 'Xám nhạt',v: '#f4f4f5',              s: 'background:#f4f4f5;' },
  { label: 'Xám',     v: '#e4e4e7',               s: 'background:#e4e4e7;' },
  { label: 'Đen',     v: '#09090b',               s: 'background:#09090b;' },
  { label: 'Vàng',    v: '#C9A84C',               s: 'background:#C9A84C;' },
  { label: 'Vàng nhạt',v: 'rgba(201,168,76,0.1)', s: 'background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.25);' },
];
const _PE_FG = [
  { label: 'Đen',   v: '#18181b', s: 'background:#18181b;' },
  { label: 'Xám',   v: '#52525b', s: 'background:#52525b;' },
  { label: 'Trắng', v: '#ffffff', s: 'background:#fff;border:1px solid #e4e4e7;' },
  { label: 'Vàng',  v: '#C9A84C', s: 'background:#C9A84C;' },
];
const _PE_PAD  = [{ l:'0',value:'0px'},{ l:'XS',value:'8px'},{ l:'S',value:'16px'},{ l:'M',value:'24px'},{ l:'L',value:'32px'},{ l:'XL',value:'48px'}];
const _PE_RAD  = [{ l:'0',value:'0px'},{ l:'S',value:'8px'},{ l:'M',value:'12px'},{ l:'L',value:'16px'},{ l:'XL',value:'24px'},{ l:'●',value:'9999px'}];
const _PE_BDR  = [{ l:'Không',value:'none'},{ l:'Nhạt',value:'1px solid #f4f4f5'},{ l:'Vừa',value:'1px solid #e4e4e7'},{ l:'Rõ',value:'1px solid #a1a1aa'},{ l:'Brand',value:'1px solid #C9A84C'}];

function _showPropPanel(card, editorEl) {
  // Deselect previous
  editorEl.querySelectorAll('[data-pe-sel]').forEach(el => {
    el.removeAttribute('data-pe-sel'); el.style.outline = ''; el.style.outlineOffset = '';
  });
  card.setAttribute('data-pe-sel', '1');
  card.style.outline = '2px solid #C9A84C';
  card.style.outlineOffset = '2px';

  document.getElementById('pe-prop-panel')?.remove();

  const gc = card.style.gridColumn || '';
  const mkSwatch = (arr, attr) => arr.map((p, i) =>
    `<button title="${p.label}" data-${attr}="${i}" style="width:26px;height:26px;border-radius:7px;cursor:pointer;transition:transform .1s;${p.s}"></button>`
  ).join('');

  const mkPreset = (arr, attr) => arr.map((p, i) =>
    `<button data-${attr}="${i}" style="padding:4px 8px;border-radius:5px;border:1px solid #e4e4e7;background:white;color:#52525b;font-size:10px;font-weight:600;cursor:pointer;transition:all .12s;">${p.l}</button>`
  ).join('');

  const activeSpan = !gc || gc === 'auto' ? 'auto' : gc.includes('-1') ? 'full' : 'span2';
  const spanBtnStyle = (key) => key === activeSpan
    ? 'flex:1;padding:5px 0;border-radius:5px;border:1px solid #18181b;background:#18181b;color:white;font-size:10px;font-weight:600;cursor:pointer;'
    : 'flex:1;padding:5px 0;border-radius:5px;border:1px solid #e4e4e7;background:white;color:#52525b;font-size:10px;font-weight:600;cursor:pointer;';

  const panel = document.createElement('div');
  panel.id = 'pe-prop-panel';
  panel.contentEditable = 'false';
  panel.style.cssText = 'position:fixed;top:70px;right:16px;width:252px;background:white;border:1px solid #e4e4e7;border-radius:14px;box-shadow:0 12px 48px rgba(0,0,0,.16);z-index:10001;font-size:11px;font-family:inherit;overflow:hidden;user-select:none;';

  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#fafafa;border-bottom:1px solid #f4f4f5;">
      <span style="font-size:11px;font-weight:700;color:#3f3f46;display:flex;align-items:center;gap:6px;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        Thuộc tính thẻ
      </span>
      <button id="pe-prop-close" style="width:22px;height:22px;border:none;background:transparent;cursor:pointer;color:#a1a1aa;font-size:17px;border-radius:6px;display:flex;align-items:center;justify-content:center;">×</button>
    </div>

    <div style="padding:10px 14px;border-bottom:1px solid #f4f4f5;">
      <div style="font-size:9px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px;">Màu nền</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px;align-items:center;" id="pe-bg-row">
        ${mkSwatch(_PE_BG, 'bg')}
        <label title="Tùy chỉnh" style="width:26px;height:26px;border-radius:7px;cursor:pointer;border:1px solid #e4e4e7;display:flex;align-items:center;justify-content:center;font-size:11px;position:relative;overflow:hidden;">
          <input type="color" id="pe-bg-custom" style="position:absolute;inset:-4px;width:calc(100%+8px);height:calc(100%+8px);opacity:0;cursor:pointer;" />
          <span style="pointer-events:none;color:#71717a;">⊕</span>
        </label>
      </div>
    </div>

    <div style="padding:10px 14px;border-bottom:1px solid #f4f4f5;">
      <div style="font-size:9px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px;">Màu chữ</div>
      <div style="display:flex;gap:5px;align-items:center;">
        ${mkSwatch(_PE_FG, 'fg')}
        <label title="Tùy chỉnh" style="width:26px;height:26px;border-radius:7px;cursor:pointer;border:1px solid #e4e4e7;display:flex;align-items:center;justify-content:center;font-size:11px;position:relative;overflow:hidden;">
          <input type="color" id="pe-fg-custom" style="position:absolute;inset:-4px;width:calc(100%+8px);height:calc(100%+8px);opacity:0;cursor:pointer;" />
          <span style="pointer-events:none;color:#71717a;">⊕</span>
        </label>
      </div>
    </div>

    <div style="padding:10px 14px;border-bottom:1px solid #f4f4f5;">
      <div style="font-size:9px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px;">Padding</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;" id="pe-pad-row">${mkPreset(_PE_PAD,'pad')}</div>
    </div>

    <div style="padding:10px 14px;border-bottom:1px solid #f4f4f5;">
      <div style="font-size:9px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px;">Bo góc</div>
      <div style="display:flex;gap:4px;" id="pe-rad-row">${mkPreset(_PE_RAD,'rad')}</div>
    </div>

    <div style="padding:10px 14px;border-bottom:1px solid #f4f4f5;">
      <div style="font-size:9px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px;">Viền</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;" id="pe-bdr-row">${mkPreset(_PE_BDR,'bdr')}</div>
    </div>

    <div style="padding:10px 14px;">
      <div style="font-size:9px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px;">Kích thước trong nhóm</div>
      <div style="display:flex;gap:4px;">
        <button data-span="auto"  style="${spanBtnStyle('auto')}">Mặc định</button>
        <button data-span="span2" style="${spanBtnStyle('span2')}">× 2 cột</button>
        <button data-span="full"  style="${spanBtnStyle('full')}">Toàn bộ</button>
      </div>
    </div>`;

  document.body.appendChild(panel);

  // ── Bind events ─────────────────────────────────────────────────────────────
  panel.querySelector('#pe-prop-close').addEventListener('click', () => _hidePropPanel(editorEl));

  const activateBtn = (row, clicked) => {
    row.querySelectorAll('button').forEach(b => { b.style.background = 'white'; b.style.color = '#52525b'; b.style.borderColor = '#e4e4e7'; });
    clicked.style.background = '#18181b'; clicked.style.color = 'white'; clicked.style.borderColor = '#18181b';
  };

  panel.querySelectorAll('[data-bg]').forEach(btn => btn.addEventListener('click', () => {
    card.style.backgroundColor = _PE_BG[+btn.dataset.bg].v;
  }));
  panel.querySelector('#pe-bg-custom').addEventListener('input', e => { card.style.backgroundColor = e.target.value; });

  panel.querySelectorAll('[data-fg]').forEach(btn => btn.addEventListener('click', () => {
    card.style.color = _PE_FG[+btn.dataset.fg].v;
  }));
  panel.querySelector('#pe-fg-custom').addEventListener('input', e => { card.style.color = e.target.value; });

  panel.querySelectorAll('[data-pad]').forEach(btn => btn.addEventListener('click', () => {
    card.style.padding = _PE_PAD[+btn.dataset.pad].value;
    activateBtn(panel.querySelector('#pe-pad-row'), btn);
  }));

  panel.querySelectorAll('[data-rad]').forEach(btn => btn.addEventListener('click', () => {
    card.style.borderRadius = _PE_RAD[+btn.dataset.rad].value;
    activateBtn(panel.querySelector('#pe-rad-row'), btn);
  }));

  panel.querySelectorAll('[data-bdr]').forEach(btn => btn.addEventListener('click', () => {
    card.style.border = _PE_BDR[+btn.dataset.bdr].value;
    activateBtn(panel.querySelector('#pe-bdr-row'), btn);
  }));

  panel.querySelectorAll('[data-span]').forEach(btn => btn.addEventListener('click', () => {
    const v = btn.dataset.span;
    card.style.gridColumn = v === 'span2' ? 'span 2 / span 2' : v === 'full' ? '1 / -1' : '';
    panel.querySelectorAll('[data-span]').forEach(b => { b.style.background = 'white'; b.style.color = '#52525b'; b.style.borderColor = '#e4e4e7'; });
    btn.style.background = '#18181b'; btn.style.color = 'white'; btn.style.borderColor = '#18181b';
  }));

  // Close on outside click
  setTimeout(() => {
    const onOut = (e) => {
      if (!panel.contains(e.target) && !card.contains(e.target)) {
        _hidePropPanel(editorEl);
        document.removeEventListener('click', onOut);
      }
    };
    document.addEventListener('click', onOut);
  }, 120);
}

function _hidePropPanel(editorEl) {
  document.getElementById('pe-prop-panel')?.remove();
  if (editorEl) {
    editorEl.querySelectorAll('[data-pe-sel]').forEach(el => {
      el.removeAttribute('data-pe-sel'); el.style.outline = ''; el.style.outlineOffset = '';
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────

function _injectBlockControls(editorEl) {
  // ── Clean stale controls ───────────────────────────────────────────────────
  editorEl.querySelectorAll('.pe-ctrl, .pe-add').forEach(el => el.remove());
  editorEl.querySelectorAll('[data-pe]').forEach(el => {
    el.removeAttribute('data-pe');
    el.style.position = el.style.position === 'relative' && !el.className.includes('relative') ? '' : el.style.position;
    el.style.paddingRight = '';
  });

  // ── Helper: build move/delete control bar for a card ─────────────────────
  const mkCardCtrl = (card, container) => {
    if (card.getAttribute('data-pe')) return;
    card.setAttribute('data-pe', 'card');
    if (!card.className.includes('relative')) card.style.position = 'relative';

    const ctrl = document.createElement('div');
    ctrl.className = 'pe-ctrl';
    ctrl.contentEditable = 'false';
    ctrl.style.cssText = 'position:absolute;top:6px;right:6px;z-index:30;display:flex;gap:3px;opacity:0;transition:opacity .2s;cursor:default;user-select:none;';

    const _sibs = () => Array.from(container.children).filter(c => !c.classList.contains('pe-ctrl') && !c.classList.contains('pe-add'));

    const mkBtn = (html, title, onClick, danger = false) => {
      const btn = document.createElement('button');
      btn.innerHTML = html;
      btn.title = title;
      btn.contentEditable = 'false';
      btn.style.cssText = `width:24px;height:24px;border-radius:6px;border:1px solid ${danger ? '#fca5a5' : '#e4e4e7'};background:white;color:${danger ? '#ef4444' : '#71717a'};font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;line-height:1;transition:all .15s;font-weight:bold;`;
      btn.addEventListener('mouseover', () => { btn.style.background = danger ? '#fef2f2' : '#f4f4f5'; btn.style.borderColor = danger ? '#f87171' : '#d4d4d8'; });
      btn.addEventListener('mouseout',  () => { btn.style.background = 'white'; btn.style.borderColor = danger ? '#fca5a5' : '#e4e4e7'; });
      btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); onClick(); });
      return btn;
    };

    ctrl.appendChild(mkBtn('↑', 'Di chuyển lên', () => {
      const sibs = _sibs(); const i = sibs.indexOf(card);
      if (i > 0) { container.insertBefore(card, sibs[i - 1]); _injectBlockControls(editorEl); }
    }));
    ctrl.appendChild(mkBtn('↓', 'Di chuyển xuống', () => {
      const sibs = _sibs(); const i = sibs.indexOf(card);
      if (i < sibs.length - 1) { sibs[i + 1].after(card); _injectBlockControls(editorEl); }
    }));
    ctrl.appendChild(mkBtn('×', 'Xóa thẻ này', () => {
      if (confirm('Xóa thẻ này?')) { card.remove(); _injectBlockControls(editorEl); }
    }, true));

    card.appendChild(ctrl);
    card.addEventListener('mouseenter', () => { ctrl.style.opacity = '1'; });
    card.addEventListener('mouseleave', (e) => { if (!card.contains(e.relatedTarget)) ctrl.style.opacity = '0'; });
    card.addEventListener('click', (e) => {
      if (ctrl.contains(e.target)) return;
      _showPropPanel(card, editorEl);
    });
  };

  // ── Cards inside grid-cols containers ──────────────────────────────────────
  editorEl.querySelectorAll('[class*="grid-cols"]').forEach(grid => {
    Array.from(grid.children).forEach(child => {
      if (child.tagName === 'DIV') mkCardCtrl(child, grid);
    });

    // "+ Thêm thẻ vào nhóm" after this grid
    const addBtn = document.createElement('button');
    addBtn.className = 'pe-add';
    addBtn.innerHTML = '＋ Thêm thẻ vào nhóm này';
    addBtn.contentEditable = 'false';
    addBtn.style.cssText = 'display:block;width:100%;text-align:left;padding:5px 12px;margin:4px 0 10px;background:transparent;border:1px dashed #d4d4d8;border-radius:7px;color:#71717a;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;';
    addBtn.addEventListener('mouseover', () => { addBtn.style.borderColor = '#C9A84C'; addBtn.style.color = '#C9A84C'; addBtn.style.background = '#faf8f3'; });
    addBtn.addEventListener('mouseout',  () => { addBtn.style.borderColor = '#d4d4d8'; addBtn.style.color = '#71717a'; addBtn.style.background = 'transparent'; });
    addBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const cards = Array.from(grid.children).filter(c => !c.classList.contains('pe-ctrl') && !c.classList.contains('pe-add'));
      const last = cards[cards.length - 1];
      const newCard = document.createElement('div');
      if (last) {
        newCard.className = last.className.replace(/pe-\S+/g, '').trim();
        // Detect number-badge style card
        if (last.querySelector('[class*="rounded-full"]')) {
          const n = cards.length + 1;
          newCard.innerHTML = `<div class="w-8 h-8 rounded-full bg-[#C9A84C]/10 text-[#C9A84C] flex items-center justify-center mx-auto mb-3 font-bold text-sm">0${n}</div><h4 class="font-bold text-zinc-900 mb-1 text-[14px]">Giá trị mới</h4><p class="text-[12px] text-zinc-550 leading-snug">Mô tả ở đây.</p>`;
        } else {
          newCard.innerHTML = `<h3 class="font-bold text-zinc-900 text-[15px] mb-3">Tiêu đề mới</h3><p class="text-zinc-650 text-[14px] leading-relaxed">Nội dung mô tả ở đây.</p>`;
        }
      } else {
        newCard.className = 'bg-[#FAF8F3] border border-zinc-100 p-6 rounded-xl';
        newCard.innerHTML = `<h3 class="font-bold text-zinc-900 text-[15px] mb-2">Tiêu đề mới</h3><p class="text-[14px] leading-relaxed">Nội dung ở đây.</p>`;
      }
      grid.appendChild(newCard);
      _injectBlockControls(editorEl);
      // Select title
      const t = newCard.querySelector('h3, h4');
      if (t) { const r = document.createRange(); r.selectNodeContents(t); const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(r); }
    });
    grid.after(addBtn);
  });

  // ── Top-level rounded blocks (dark quote, standalone cards, etc.) ──────────
  const contentRoot = (editorEl.children.length === 1 && editorEl.firstElementChild?.tagName === 'DIV')
    ? editorEl.firstElementChild : editorEl;
  Array.from(contentRoot.children).forEach(child => {
    if (child.tagName !== 'DIV' || child.getAttribute('data-pe')) return;
    if (child.className.includes('grid-cols') || child.className.includes('space-y')) return;
    // Only blocks that look like cards (have rounded/border/colored background)
    const cls = child.className;
    if (cls.includes('rounded') || cls.includes('bg-zinc-950') || cls.includes('bg-[#FAF8F3]') || cls.includes('bg-white')) {
      mkCardCtrl(child, contentRoot);
    }
  });

  // ── List items: delete button ─────────────────────────────────────────────
  editorEl.querySelectorAll('li').forEach(li => {
    if (li.getAttribute('data-pe')) return;
    li.setAttribute('data-pe', 'li');
    li.style.position = 'relative';
    li.style.paddingRight = '26px';
    const btn = document.createElement('button');
    btn.className = 'pe-ctrl';
    btn.innerHTML = '×';
    btn.contentEditable = 'false';
    btn.title = 'Xóa mục này';
    btn.style.cssText = 'position:absolute;right:2px;top:50%;transform:translateY(-50%);width:18px;height:18px;border-radius:50%;border:1px solid #fca5a5;background:white;color:#ef4444;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s;padding:0;line-height:1;z-index:5;';
    btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); li.remove(); });
    li.addEventListener('mouseenter', () => { btn.style.opacity = '1'; });
    li.addEventListener('mouseleave', () => { btn.style.opacity = '0'; });
    li.appendChild(btn);
  });

  // ── Lists: add-item button ────────────────────────────────────────────────
  editorEl.querySelectorAll('ul, ol').forEach(list => {
    const addBtn = document.createElement('button');
    addBtn.className = 'pe-add';
    addBtn.innerHTML = '＋ Thêm mục vào danh sách';
    addBtn.contentEditable = 'false';
    addBtn.style.cssText = 'display:block;width:100%;text-align:left;padding:5px 12px;margin:3px 0 8px;background:transparent;border:1px dashed #d4d4d8;border-radius:7px;color:#71717a;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;';
    addBtn.addEventListener('mouseover', () => { addBtn.style.borderColor = '#C9A84C'; addBtn.style.color = '#C9A84C'; addBtn.style.background = '#faf8f3'; });
    addBtn.addEventListener('mouseout',  () => { addBtn.style.borderColor = '#d4d4d8'; addBtn.style.color = '#71717a'; addBtn.style.background = 'transparent'; });
    addBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const lastLi = list.querySelector('li:last-child');
      const newLi = document.createElement('li');
      if (lastLi) {
        const clone = lastLi.cloneNode(true);
        clone.querySelectorAll('.pe-ctrl, .pe-add').forEach(b => b.remove());
        clone.removeAttribute('data-pe');
        clone.style.cssText = '';
        clone.querySelectorAll('span, strong').forEach(el => { if (!el.querySelector('*')) el.textContent = 'Nội dung mới'; });
        if (!clone.querySelector('*')) clone.textContent = 'Nội dung mới';
        newLi.innerHTML = clone.innerHTML;
      } else {
        newLi.textContent = 'Nội dung mới';
      }
      list.appendChild(newLi);
      _injectBlockControls(editorEl);
    });
    list.after(addBtn);
  });
}

function _cleanEditControls(el) {
  el.querySelectorAll('.pe-ctrl, .pe-add').forEach(btn => btn.remove());
  el.querySelectorAll('[data-pe]').forEach(item => {
    item.removeAttribute('data-pe');
    item.style.position = '';
    item.style.paddingRight = '';
  });
  el.querySelectorAll('[data-pe-sel]').forEach(item => {
    item.removeAttribute('data-pe-sel');
    item.style.outline = '';
    item.style.outlineOffset = '';
  });
}

// ─── utils ────────────────────────────────────────────────────────────────────

function _showToast(msg, type = 'success') {
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;bottom:90px;right:24px;z-index:99999;padding:12px 20px;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.15);font-size:13px;font-weight:700;color:white;transition:opacity .3s;background:${type === 'success' ? '#18181b' : '#dc2626'};`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 2800);
}
