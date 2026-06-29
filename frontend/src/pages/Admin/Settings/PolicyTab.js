import { showToast } from '../shared/ui.js';
import { getDefaultPolicyHtml } from '../../StaticPolicy/index.js';

const DEFAULT_BADGES = [
  {
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
    title: 'Miễn Phí Vận Chuyển',
    subtitle: 'Đơn trên 500.000đ',
  },
  {
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
    title: 'Đổi Trả Dễ Dàng',
    subtitle: 'Trong vòng 30 ngày',
  },
  {
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    title: 'Bảo Hành 2 Năm',
    subtitle: 'Chính hãng tuyệt đối',
  },
  {
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    title: 'Chính Hãng 100%',
    subtitle: 'Cam kết uy tín',
  },
];

const POLICY_PAGES = [
  { key: 'gioi-thieu',  label: 'Về Chúng Tôi' },
  { key: 'van-chuyen',  label: 'Chính Sách Vận Chuyển' },
  { key: 'doi-tra',     label: 'Đổi Trả & Hoàn Tiền' },
  { key: 'bao-hanh',    label: 'Chính Sách Bảo Hành' },
  { key: 'bao-mat',     label: 'Chính Sách Bảo Mật' },
  { key: 'dieu-khoan',  label: 'Điều Khoản Dịch Vụ' },
  { key: 'faq',         label: 'FAQ — Câu Hỏi Thường Gặp' },
];

export function renderPolicyTab(settings) {
  const badges = settings.trust_badges || DEFAULT_BADGES;

  return `
    <div class="space-y-6">
      <div class="flex items-center justify-between border-b pb-4">
        <div>
          <h3 class="text-base font-bold text-gray-900">Trust Badges — Cam Kết Chính Sách</h3>
          <p class="text-xs text-gray-500 mt-1">Các mục hiển thị trên trang chủ và footer dưới dạng thanh cam kết dịch vụ.</p>
        </div>
        <button id="policy-add-badge" class="bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Thêm Badge
        </button>
      </div>

      <!-- Live Preview -->
      <div class="bg-[#0a0a0a] rounded-xl px-6 py-4">
        <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 text-center">LIVE PREVIEW — Dark Footer</p>
        <div id="policy-preview-dark" class="flex flex-wrap justify-center gap-6">
          ${badges.map(b => `
            <div class="flex items-center gap-2 text-zinc-300">
              <span class="text-[#C9A961] shrink-0">${b.icon}</span>
              <span class="text-[11px] font-bold uppercase tracking-wider text-[#C9A961]">${b.title}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="border border-zinc-200 rounded-xl px-6 py-4 bg-white">
        <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 text-center">LIVE PREVIEW — Light Page</p>
        <div id="policy-preview-light" class="grid grid-cols-2 md:grid-cols-4 divide-x divide-zinc-200">
          ${badges.map(b => `
            <div class="flex items-start gap-3 px-4 py-3">
              <span class="text-zinc-950 shrink-0">${b.icon}</span>
              <div>
                <p class="text-sm font-bold text-zinc-950">${b.title}</p>
                <p class="text-xs text-zinc-500 mt-0.5">${b.subtitle}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Badge Editor List -->
      <div class="space-y-4" id="policy-badges-list">
        ${badges.map((badge, i) => renderBadgeRow(badge, i, badges.length)).join('')}
      </div>

      <p class="text-[11px] text-zinc-400 bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3">
        <strong>Lưu ý về icon:</strong> Dán nội dung SVG inline (bắt đầu bằng <code class="bg-white px-1 rounded border text-[10px]">&lt;svg ...&gt;</code>) vào ô Icon.
        Không dùng ảnh PNG/JPG. Có thể lấy SVG từ <strong>heroicons.com</strong> hoặc <strong>lucide.dev</strong>.
      </p>

      <!-- POLICY CONTENT SECTION -->
      <div class="border-t border-gray-200 pt-6 mt-2">
        <div class="mb-4">
          <h3 class="text-base font-bold text-gray-900">Nội Dung Các Trang Chính Sách</h3>
          <p class="text-xs text-gray-500 mt-1">Chỉnh sửa HTML cho từng trang chính sách. Nhấn "Chỉnh sửa" để mở editor và lưu ngay.</p>
        </div>
        <div class="space-y-2" id="policy-content-sections">
          ${POLICY_PAGES.map(p => renderPolicyContentRow(p, settings)).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderPolicyContentRow(page, settings) {
  const hasCustom = !!(settings.policy_content?.[page.key]);
  return `
    <div class="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 bg-white hover:border-[#C9A84C]/40 transition-colors" data-policy-page="${page.key}">
      <div class="flex items-center gap-3">
        <span class="text-xs font-bold text-gray-700">${page.label}</span>
        ${hasCustom
          ? `<span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Đã tuỳ chỉnh</span>`
          : `<span class="text-[10px] text-zinc-400 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-full">Mặc định</span>`
        }
      </div>
      <div class="flex items-center gap-2">
        ${hasCustom ? `
          <button class="policy-content-reset-btn text-[10px] font-bold text-zinc-400 hover:text-rose-600 border border-zinc-200 hover:border-rose-300 px-3 py-1.5 rounded-lg transition-colors">
            Xóa tuỳ chỉnh
          </button>` : ''}
        <button class="policy-content-edit-btn text-[11px] font-bold text-[#C9A84C] border border-[#C9A84C]/30 hover:bg-[#C9A84C]/5 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Chỉnh sửa
        </button>
      </div>
    </div>`;
}

function renderBadgeRow(badge, i, total) {
  return `
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden" data-badge-index="${i}">
      <div class="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <span class="w-6 h-6 rounded-full bg-zinc-950 text-white text-[10px] font-bold flex items-center justify-center shrink-0">${i + 1}</span>
        <span class="text-xs font-bold text-gray-700 flex-1">Badge #${i + 1}</span>
        <div class="flex items-center gap-1">
          <button class="policy-move-up-btn w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg transition-colors ${i === 0 ? 'opacity-30 cursor-not-allowed text-gray-300' : 'hover:bg-gray-100 text-gray-500 cursor-pointer'}" ${i === 0 ? 'disabled' : ''} title="Lên">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
          <button class="policy-move-down-btn w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg transition-colors ${i === total - 1 ? 'opacity-30 cursor-not-allowed text-gray-300' : 'hover:bg-gray-100 text-gray-500 cursor-pointer'}" ${i === total - 1 ? 'disabled' : ''} title="Xuống">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <button class="policy-delete-btn w-7 h-7 flex items-center justify-center border border-red-200 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer" title="Xóa">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
          </button>
        </div>
      </div>
      <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tiêu đề</label>
          <input type="text" class="policy-badge-title w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/25 focus:border-[#C9A84C]" value="${_esc(badge.title)}" placeholder="Tên chính sách..." />
        </div>
        <div>
          <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Mô tả phụ</label>
          <input type="text" class="policy-badge-subtitle w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/25 focus:border-[#C9A84C]" value="${_esc(badge.subtitle)}" placeholder="Mô tả ngắn..." />
        </div>
        <div>
          <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Icon (SVG)
            <span class="ml-1 font-normal text-gray-400 normal-case">— thay đổi để cập nhật preview</span>
          </label>
          <div class="flex gap-2 items-start">
            <textarea class="policy-badge-icon flex-1 px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-600 font-mono focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/25 focus:border-[#C9A84C] resize-none h-[60px]" placeholder="<svg ...>...</svg>">${_esc(badge.icon)}</textarea>
            <div class="policy-icon-preview w-10 h-10 flex items-center justify-center border border-zinc-200 rounded-lg bg-zinc-50 text-zinc-700 shrink-0">${badge.icon}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function _esc(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function bindPolicyTab(container, settings, token, API_BASE, ctx) {
  if (!settings.trust_badges) {
    settings.trust_badges = JSON.parse(JSON.stringify(DEFAULT_BADGES));
  }

  function updatePreviews() {
    const darkEl = container.querySelector('#policy-preview-dark');
    const lightEl = container.querySelector('#policy-preview-light');
    if (!darkEl || !lightEl) return;

    darkEl.innerHTML = settings.trust_badges.map(b => `
      <div class="flex items-center gap-2 text-zinc-300">
        <span class="text-[#C9A961] shrink-0">${b.icon}</span>
        <span class="text-[11px] font-bold uppercase tracking-wider text-[#C9A961]">${b.title}</span>
      </div>
    `).join('');

    lightEl.innerHTML = settings.trust_badges.map(b => `
      <div class="flex items-start gap-3 px-4 py-3">
        <span class="text-zinc-950 shrink-0">${b.icon}</span>
        <div>
          <p class="text-sm font-bold text-zinc-950">${b.title}</p>
          <p class="text-xs text-zinc-500 mt-0.5">${b.subtitle}</p>
        </div>
      </div>
    `).join('');
  }

  // Add badge button
  container.querySelector('#policy-add-badge')?.addEventListener('click', () => {
    settings.trust_badges.push({
      icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
      title: 'Chính Sách Mới',
      subtitle: 'Mô tả ngắn',
    });
    showToast('Đã thêm badge mới.', 'success');
    ctx.renderUI();
  });

  // Bind each badge row
  container.querySelectorAll('[data-badge-index]').forEach(row => {
    const idx = parseInt(row.dataset.badgeIndex, 10);
    const badge = settings.trust_badges[idx];

    const titleEl = row.querySelector('.policy-badge-title');
    const subtitleEl = row.querySelector('.policy-badge-subtitle');
    const iconEl = row.querySelector('.policy-badge-icon');
    const previewEl = row.querySelector('.policy-icon-preview');

    titleEl?.addEventListener('input', (e) => {
      badge.title = e.target.value;
      updatePreviews();
    });
    subtitleEl?.addEventListener('input', (e) => {
      badge.subtitle = e.target.value;
      updatePreviews();
    });
    iconEl?.addEventListener('input', (e) => {
      const raw = e.target.value.trim();
      badge.icon = raw;
      if (previewEl) previewEl.innerHTML = raw;
      updatePreviews();
    });

    row.querySelector('.policy-move-up-btn')?.addEventListener('click', () => {
      if (idx === 0) return;
      [settings.trust_badges[idx], settings.trust_badges[idx - 1]] = [settings.trust_badges[idx - 1], settings.trust_badges[idx]];
      ctx.renderUI();
    });
    row.querySelector('.policy-move-down-btn')?.addEventListener('click', () => {
      if (idx === settings.trust_badges.length - 1) return;
      [settings.trust_badges[idx], settings.trust_badges[idx + 1]] = [settings.trust_badges[idx + 1], settings.trust_badges[idx]];
      ctx.renderUI();
    });
    row.querySelector('.policy-delete-btn')?.addEventListener('click', () => {
      if (!confirm(`Xóa badge "${badge.title}"?`)) return;
      settings.trust_badges.splice(idx, 1);
      showToast('Đã xóa badge.', 'info');
      ctx.renderUI();
    });
  });

  // Bind policy content section rows
  container.querySelectorAll('[data-policy-page]').forEach(row => {
    const key = row.dataset.policyPage;
    const page = POLICY_PAGES.find(p => p.key === key);
    if (!page) return;

    row.querySelector('.policy-content-edit-btn')?.addEventListener('click', () => {
      openPolicyContentModal(key, page.label, settings, token, API_BASE, ctx);
    });

    row.querySelector('.policy-content-reset-btn')?.addEventListener('click', () => {
      if (!confirm(`Xóa nội dung tuỳ chỉnh của "${page.label}"? Trang sẽ hiển thị nội dung mặc định.`)) return;
      if (!settings.policy_content) settings.policy_content = {};
      delete settings.policy_content[key];
      showToast(`Đã xóa tuỳ chỉnh cho "${page.label}".`, 'success');
      ctx.renderUI();
    });
  });
}

function openPolicyContentModal(key, label, settings, token, API_BASE, ctx) {
  const currentHtml = settings.policy_content?.[key] || getDefaultPolicyHtml(key);

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);';
  overlay.innerHTML = `
    <div data-lenis-prevent style="background:white;border-radius:16px;box-shadow:0 24px 80px rgba(0,0,0,0.2);width:100%;max-width:900px;max-height:90vh;display:flex;flex-direction:column;font-family:inherit;overflow:hidden;animation:pcModalIn .22s ease forwards;">
      <style>
        @keyframes pcModalIn { from{opacity:0;transform:scale(.96) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        #pc-wysiwyg { caret-color:#C9A84C; }
        #pc-wysiwyg li { position:relative; padding-right:26px; }
        #pc-wysiwyg [data-pe] { position:relative; }
        #pc-wysiwyg .pe-add { display:block;width:100%;text-align:left;padding:5px 12px;margin:3px 0 8px;background:transparent;border:1px dashed #d4d4d8;border-radius:7px;color:#71717a;font-size:11px;font-weight:600;cursor:pointer; }
        #pc-wysiwyg .pe-add:hover { border-color:#C9A84C;color:#C9A84C;background:#faf8f3; }
      </style>
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #f4f4f5;background:#fafafa;flex-shrink:0;">
        <div style="display:flex;align-items:center;gap:8px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <span style="font-size:13px;font-weight:700;color:#18181b;">Chỉnh sửa nội dung: <span style="color:#C9A84C;">${label}</span></span>
        </div>
        <button id="pc-modal-close" style="width:30px;height:30px;border-radius:8px;border:none;background:transparent;cursor:pointer;color:#a1a1aa;font-size:18px;display:flex;align-items:center;justify-content:center;">×</button>
      </div>

      <!-- Format Toolbar -->
      <div id="pc-toolbar-wrap" style="display:flex;align-items:center;gap:2px;flex-wrap:wrap;padding:6px 12px;border-bottom:1px solid #f4f4f5;background:#fafafa;flex-shrink:0;"></div>

      <!-- WYSIWYG editor -->
      <div style="flex:1;overflow-y:auto;min-height:0;">
        <div id="pc-wysiwyg" contenteditable="true" spellcheck="false" style="min-height:100%;padding:32px 36px;font-size:14px;line-height:1.7;font-family:inherit;outline:none;" data-lenis-prevent>${currentHtml || '<p style="color:#a1a1aa;font-style:italic;">Bắt đầu nhập nội dung hoặc dán HTML vào đây...</p>'}</div>
      </div>

      <!-- Footer -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-top:1px solid #f4f4f5;background:#fafafa;flex-shrink:0;">
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:10px;color:#a1a1aa;">Để trống = dùng nội dung mặc định.</span>
          <button id="pc-reset-btn" style="font-size:10px;font-weight:600;color:#a1a1aa;border:1px solid #e4e4e7;border-radius:6px;padding:3px 8px;background:white;cursor:pointer;">Xóa nội dung tuỳ chỉnh</button>
        </div>
        <div style="display:flex;gap:8px;">
          <button id="pc-modal-cancel" style="border:1px solid #e4e4e7;color:#52525b;font-weight:600;font-size:13px;padding:7px 18px;border-radius:8px;background:white;cursor:pointer;">Hủy</button>
          <button id="pc-modal-save" style="background:#C9A84C;color:white;font-weight:700;font-size:13px;padding:8px 20px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;gap:6px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const editorEl = overlay.querySelector('#pc-wysiwyg');
  const toolbarWrap = overlay.querySelector('#pc-toolbar-wrap');

  // Build and attach format toolbar
  const toolbar = _pcBuildFormatBar(editorEl);
  toolbarWrap.appendChild(toolbar);

  // Strip formatting on paste — prevents Word/Docs inline styles bleeding in
  editorEl.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  });

  // Inject block controls
  _pcInjectBlockControls(editorEl);

  editorEl.focus();

  const close = () => { document.body.style.overflow = ''; overlay.remove(); _pcHidePropPanel(null); };
  overlay.querySelector('#pc-modal-close')?.addEventListener('click', close);
  overlay.querySelector('#pc-modal-cancel')?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  overlay.querySelector('#pc-reset-btn')?.addEventListener('click', () => {
    if (!confirm('Xóa nội dung tuỳ chỉnh? Trang sẽ hiển thị nội dung mặc định sau khi lưu.')) return;
    editorEl.innerHTML = '';
  });

  overlay.querySelector('#pc-modal-save')?.addEventListener('click', async () => {
    const saveBtn = overlay.querySelector('#pc-modal-save');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<div style="width:13px;height:13px;border:2px solid rgba(255,255,255,.4);border-top-color:white;border-radius:50%;animation:spin .6s linear infinite;"></div> Đang lưu...';

    if (!settings.policy_content) settings.policy_content = {};

    // Clean edit controls before reading HTML
    const cleanEl = editorEl.cloneNode(true);
    _pcCleanEditControls(cleanEl);
    const html = cleanEl.innerHTML.trim();

    if (html && html !== '<p style="color:#a1a1aa;font-style:italic;">Bắt đầu nhập nội dung hoặc dán HTML vào đây...</p>') {
      settings.policy_content[key] = html;
    } else {
      delete settings.policy_content[key];
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      if (res.ok && json.success) {
        window.APP_SETTINGS = { ...window.APP_SETTINGS, policy_content: settings.policy_content };
        showToast(`Đã lưu nội dung "${label}" thành công!`, 'success');
        close();
        ctx.renderUI();
      } else {
        showToast(json.error || 'Lỗi khi lưu nội dung.', 'error');
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Lưu thay đổi';
      }
    } catch {
      showToast('Lỗi kết nối máy chủ.', 'error');
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'Lưu thay đổi';
    }
  });
}

// ─── WYSIWYG helpers for admin modal ─────────────────────────────────────────

function _pcBuildFormatBar(editorEl) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:contents;';

  const TOOLS = [
    { cmd: 'bold',      label: '<b style="font-size:12px">B</b>',  title: 'Đậm (Ctrl+B)' },
    { cmd: 'italic',    label: '<i style="font-size:12px">I</i>',  title: 'Nghiêng (Ctrl+I)' },
    { cmd: 'underline', label: '<u style="font-size:12px">U</u>',  title: 'Gạch chân' },
    { sep: true },
    { cmd: 'formatBlock', val: 'H2', label: 'H2', title: 'Tiêu đề lớn' },
    { cmd: 'formatBlock', val: 'H3', label: 'H3', title: 'Tiêu đề vừa' },
    { cmd: 'formatBlock', val: 'P',  label: '¶',  title: 'Đoạn văn' },
    { sep: true },
    { cmd: 'insertUnorderedList', label: '• List', title: 'Danh sách không số' },
    { cmd: 'insertOrderedList',   label: '1. List', title: 'Danh sách có số' },
    { sep: true },
    { action: 'addLi',   label: '＋ Thêm mục',  title: 'Thêm dòng vào danh sách' },
    { action: 'delLi',   label: '− Xóa mục',    title: 'Xóa dòng đang chọn' },
    { sep: true },
    { action: 'addCard', label: '＋ Thêm thẻ',  title: 'Thêm khối thẻ mới cuối trang' },
    { action: 'delCard', label: '− Xóa thẻ',    title: 'Xóa khối đang chọn' },
  ];

  const btnStyle = 'padding:3px 8px;border:1px solid transparent;border-radius:5px;background:transparent;cursor:pointer;font-size:11px;font-weight:600;color:#3f3f46;transition:all .12s;white-space:nowrap;';

  TOOLS.forEach(t => {
    if (t.sep) {
      const s = document.createElement('span');
      s.style.cssText = 'width:1px;height:18px;background:#e4e4e7;margin:0 3px;flex-shrink:0;';
      wrap.appendChild(s);
      return;
    }
    const btn = document.createElement('button');
    btn.innerHTML = t.label;
    btn.title = t.title || '';
    btn.style.cssText = btnStyle;
    btn.addEventListener('mouseover', () => { btn.style.background = '#f4f4f5'; btn.style.borderColor = '#d4d4d8'; });
    btn.addEventListener('mouseout',  () => { btn.style.background = 'transparent'; btn.style.borderColor = 'transparent'; });

    if (t.cmd) {
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        editorEl.focus();
        document.execCommand(t.cmd, false, t.val || null);
        _pcInjectBlockControls(editorEl);
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
          const newLi = li.cloneNode(true);
          newLi.querySelectorAll('.pe-ctrl,.pe-add').forEach(b => b.remove());
          newLi.removeAttribute('data-pe');
          newLi.style.cssText = '';
          newLi.querySelectorAll('span,strong').forEach(el => { if (!el.querySelector('*')) el.textContent = 'Nội dung mới'; });
          if (!newLi.querySelector('*')) newLi.textContent = 'Nội dung mới';
          li.after(newLi);
        } else {
          const list = editorEl.querySelector('ul,ol');
          if (list) { const n = document.createElement('li'); n.textContent = 'Nội dung mới'; list.appendChild(n); }
        }
        _pcInjectBlockControls(editorEl);
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
        _pcInjectBlockControls(editorEl);
      });
    } else if (t.action === 'addCard') {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const card = document.createElement('div');
        card.className = 'bg-[#FAF8F3] border border-zinc-100 rounded-xl p-6 mt-4';
        card.innerHTML = '<h3 class="font-bold text-zinc-900 text-[15px] mb-2">Tiêu đề thẻ mới</h3><p class="text-zinc-600 text-[13px] leading-relaxed">Nội dung mô tả ở đây.</p>';

        // Insert after the direct child of editorEl containing the cursor
        const sel = window.getSelection();
        let node = sel?.anchorNode;
        let insertAfter = null;
        while (node && node !== editorEl) {
          if (node.parentElement === editorEl) { insertAfter = node; break; }
          node = node.parentElement;
        }
        if (insertAfter) insertAfter.after(card);
        else editorEl.appendChild(card);

        _pcInjectBlockControls(editorEl);

        // Select title for immediate editing
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
        while (node && node.parentElement !== editorEl) node = node.parentElement;
        if (node && node !== editorEl) {
          if (confirm('Xóa khối nội dung này?')) { node.remove(); _pcInjectBlockControls(editorEl); }
        }
      });
    }
    wrap.appendChild(btn);
  });

  return wrap;
}

// ─── Properties Panel (admin) ─────────────────────────────────────────────────

const _PC_BG = [
  { label:'Bỏ',       v:'',                       s:'background:white;border:1px dashed #d4d4d8;'},
  { label:'White',    v:'#ffffff',                s:'background:#fff;border:1px solid #e4e4e7;'},
  { label:'Kem',      v:'#FAF8F3',                s:'background:#FAF8F3;'},
  { label:'Xám nhạt', v:'#f4f4f5',                s:'background:#f4f4f5;'},
  { label:'Xám',      v:'#e4e4e7',                s:'background:#e4e4e7;'},
  { label:'Đen',      v:'#09090b',                s:'background:#09090b;'},
  { label:'Vàng',     v:'#C9A84C',                s:'background:#C9A84C;'},
  { label:'Vàng nhạt',v:'rgba(201,168,76,0.1)',   s:'background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.25);'},
];
const _PC_FG = [
  { label:'Đen',  v:'#18181b', s:'background:#18181b;'},
  { label:'Xám',  v:'#52525b', s:'background:#52525b;'},
  { label:'Trắng',v:'#ffffff', s:'background:#fff;border:1px solid #e4e4e7;'},
  { label:'Vàng', v:'#C9A84C', s:'background:#C9A84C;'},
];
const _PC_PAD = [{l:'0',value:'0px'},{l:'XS',value:'8px'},{l:'S',value:'16px'},{l:'M',value:'24px'},{l:'L',value:'32px'},{l:'XL',value:'48px'}];
const _PC_RAD = [{l:'0',value:'0px'},{l:'S',value:'8px'},{l:'M',value:'12px'},{l:'L',value:'16px'},{l:'XL',value:'24px'},{l:'●',value:'9999px'}];
const _PC_BDR = [{l:'Không',value:'none'},{l:'Nhạt',value:'1px solid #f4f4f5'},{l:'Vừa',value:'1px solid #e4e4e7'},{l:'Rõ',value:'1px solid #a1a1aa'},{l:'Brand',value:'1px solid #C9A84C'}];

function _pcShowPropPanel(card, editorEl) {
  editorEl.querySelectorAll('[data-pe-sel]').forEach(el => {
    el.removeAttribute('data-pe-sel'); el.style.outline = ''; el.style.outlineOffset = '';
  });
  card.setAttribute('data-pe-sel', '1');
  card.style.outline = '2px solid #C9A84C';
  card.style.outlineOffset = '2px';

  document.getElementById('pe-prop-panel')?.remove();

  const gc = card.style.gridColumn || '';
  const mkSwatch = (arr, attr) => arr.map((p, i) =>
    `<button title="${p.label}" data-${attr}="${i}" style="width:26px;height:26px;border-radius:7px;cursor:pointer;${p.s}"></button>`
  ).join('');
  const mkPreset = (arr, attr) => arr.map((p, i) =>
    `<button data-${attr}="${i}" style="padding:4px 8px;border-radius:5px;border:1px solid #e4e4e7;background:white;color:#52525b;font-size:10px;font-weight:600;cursor:pointer;">${p.l}</button>`
  ).join('');
  const activeSpan = !gc || gc === 'auto' ? 'auto' : gc.includes('-1') ? 'full' : 'span2';
  const spanStyle = (k) => k === activeSpan
    ? 'flex:1;padding:5px 0;border-radius:5px;border:1px solid #18181b;background:#18181b;color:white;font-size:10px;font-weight:600;cursor:pointer;'
    : 'flex:1;padding:5px 0;border-radius:5px;border:1px solid #e4e4e7;background:white;color:#52525b;font-size:10px;font-weight:600;cursor:pointer;';

  const panel = document.createElement('div');
  panel.id = 'pe-prop-panel';
  panel.contentEditable = 'false';
  panel.style.cssText = 'position:fixed;top:70px;right:16px;width:252px;background:white;border:1px solid #e4e4e7;border-radius:14px;box-shadow:0 12px 48px rgba(0,0,0,.16);z-index:10002;font-size:11px;font-family:inherit;overflow:hidden;user-select:none;';

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
        ${mkSwatch(_PC_BG,'bg')}
        <label style="width:26px;height:26px;border-radius:7px;cursor:pointer;border:1px solid #e4e4e7;display:flex;align-items:center;justify-content:center;font-size:11px;position:relative;overflow:hidden;">
          <input type="color" id="pe-bg-custom" style="position:absolute;inset:-4px;width:calc(100%+8px);height:calc(100%+8px);opacity:0;cursor:pointer;"/>
          <span style="pointer-events:none;color:#71717a;">⊕</span>
        </label>
      </div>
    </div>
    <div style="padding:10px 14px;border-bottom:1px solid #f4f4f5;">
      <div style="font-size:9px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px;">Màu chữ</div>
      <div style="display:flex;gap:5px;align-items:center;">
        ${mkSwatch(_PC_FG,'fg')}
        <label style="width:26px;height:26px;border-radius:7px;cursor:pointer;border:1px solid #e4e4e7;display:flex;align-items:center;justify-content:center;font-size:11px;position:relative;overflow:hidden;">
          <input type="color" id="pe-fg-custom" style="position:absolute;inset:-4px;width:calc(100%+8px);height:calc(100%+8px);opacity:0;cursor:pointer;"/>
          <span style="pointer-events:none;color:#71717a;">⊕</span>
        </label>
      </div>
    </div>
    <div style="padding:10px 14px;border-bottom:1px solid #f4f4f5;">
      <div style="font-size:9px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px;">Padding</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;" id="pe-pad-row">${mkPreset(_PC_PAD,'pad')}</div>
    </div>
    <div style="padding:10px 14px;border-bottom:1px solid #f4f4f5;">
      <div style="font-size:9px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px;">Bo góc</div>
      <div style="display:flex;gap:4px;" id="pe-rad-row">${mkPreset(_PC_RAD,'rad')}</div>
    </div>
    <div style="padding:10px 14px;border-bottom:1px solid #f4f4f5;">
      <div style="font-size:9px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px;">Viền</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;" id="pe-bdr-row">${mkPreset(_PC_BDR,'bdr')}</div>
    </div>
    <div style="padding:10px 14px;">
      <div style="font-size:9px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px;">Kích thước trong nhóm</div>
      <div style="display:flex;gap:4px;">
        <button data-span="auto"  style="${spanStyle('auto')}">Mặc định</button>
        <button data-span="span2" style="${spanStyle('span2')}">× 2 cột</button>
        <button data-span="full"  style="${spanStyle('full')}">Toàn bộ</button>
      </div>
    </div>`;

  document.body.appendChild(panel);

  const activateBtn = (row, clicked) => {
    row.querySelectorAll('button').forEach(b => { b.style.background='white'; b.style.color='#52525b'; b.style.borderColor='#e4e4e7'; });
    clicked.style.background='#18181b'; clicked.style.color='white'; clicked.style.borderColor='#18181b';
  };

  panel.querySelector('#pe-prop-close').addEventListener('click', () => _pcHidePropPanel(editorEl));
  panel.querySelectorAll('[data-bg]').forEach(b => b.addEventListener('click', () => { card.style.backgroundColor = _PC_BG[+b.dataset.bg].v; }));
  panel.querySelector('#pe-bg-custom').addEventListener('input', e => { card.style.backgroundColor = e.target.value; });
  panel.querySelectorAll('[data-fg]').forEach(b => b.addEventListener('click', () => { card.style.color = _PC_FG[+b.dataset.fg].v; }));
  panel.querySelector('#pe-fg-custom').addEventListener('input', e => { card.style.color = e.target.value; });
  panel.querySelectorAll('[data-pad]').forEach(b => b.addEventListener('click', () => { card.style.padding = _PC_PAD[+b.dataset.pad].value; activateBtn(panel.querySelector('#pe-pad-row'), b); }));
  panel.querySelectorAll('[data-rad]').forEach(b => b.addEventListener('click', () => { card.style.borderRadius = _PC_RAD[+b.dataset.rad].value; activateBtn(panel.querySelector('#pe-rad-row'), b); }));
  panel.querySelectorAll('[data-bdr]').forEach(b => b.addEventListener('click', () => { card.style.border = _PC_BDR[+b.dataset.bdr].value; activateBtn(panel.querySelector('#pe-bdr-row'), b); }));
  panel.querySelectorAll('[data-span]').forEach(b => b.addEventListener('click', () => {
    const v = b.dataset.span;
    card.style.gridColumn = v === 'span2' ? 'span 2 / span 2' : v === 'full' ? '1 / -1' : '';
    panel.querySelectorAll('[data-span]').forEach(x => { x.style.background='white'; x.style.color='#52525b'; x.style.borderColor='#e4e4e7'; });
    b.style.background='#18181b'; b.style.color='white'; b.style.borderColor='#18181b';
  }));

  setTimeout(() => {
    const onOut = (e) => {
      if (!panel.contains(e.target) && !card.contains(e.target)) {
        _pcHidePropPanel(editorEl);
        document.removeEventListener('click', onOut);
      }
    };
    document.addEventListener('click', onOut);
  }, 120);
}

function _pcHidePropPanel(editorEl) {
  document.getElementById('pe-prop-panel')?.remove();
  if (editorEl) {
    editorEl.querySelectorAll('[data-pe-sel]').forEach(el => {
      el.removeAttribute('data-pe-sel'); el.style.outline = ''; el.style.outlineOffset = '';
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────

function _pcInjectBlockControls(editorEl) {
  // ── Clean stale controls ───────────────────────────────────────────────────
  editorEl.querySelectorAll('.pe-ctrl, .pe-add').forEach(el => el.remove());
  editorEl.querySelectorAll('[data-pe]').forEach(el => {
    el.removeAttribute('data-pe');
    if (!el.className.includes('relative')) el.style.position = '';
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
      if (i > 0) { container.insertBefore(card, sibs[i - 1]); _pcInjectBlockControls(editorEl); }
    }));
    ctrl.appendChild(mkBtn('↓', 'Di chuyển xuống', () => {
      const sibs = _sibs(); const i = sibs.indexOf(card);
      if (i < sibs.length - 1) { sibs[i + 1].after(card); _pcInjectBlockControls(editorEl); }
    }));
    ctrl.appendChild(mkBtn('×', 'Xóa thẻ này', () => {
      if (confirm('Xóa thẻ này?')) { card.remove(); _pcInjectBlockControls(editorEl); }
    }, true));

    card.appendChild(ctrl);
    card.addEventListener('mouseenter', () => { ctrl.style.opacity = '1'; });
    card.addEventListener('mouseleave', (e) => { if (!card.contains(e.relatedTarget)) ctrl.style.opacity = '0'; });
    card.addEventListener('click', (e) => {
      if (ctrl.contains(e.target)) return;
      _pcShowPropPanel(card, editorEl);
    });
  };

  // ── Cards inside grid-cols containers ──────────────────────────────────────
  editorEl.querySelectorAll('[class*="grid-cols"]').forEach(grid => {
    Array.from(grid.children).forEach(child => {
      if (child.tagName === 'DIV') mkCardCtrl(child, grid);
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'pe-add';
    addBtn.innerHTML = '＋ Thêm thẻ vào nhóm này';
    addBtn.contentEditable = 'false';
    addBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const cards = Array.from(grid.children).filter(c => !c.classList.contains('pe-ctrl') && !c.classList.contains('pe-add'));
      const last = cards[cards.length - 1];
      const newCard = document.createElement('div');
      if (last) {
        newCard.className = last.className.replace(/pe-\S+/g, '').trim();
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
      _pcInjectBlockControls(editorEl);
      const t = newCard.querySelector('h3, h4');
      if (t) { const r = document.createRange(); r.selectNodeContents(t); const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(r); }
    });
    grid.after(addBtn);
  });

  // ── Top-level rounded/styled blocks ───────────────────────────────────────
  const contentRoot = (editorEl.children.length === 1 && editorEl.firstElementChild?.tagName === 'DIV')
    ? editorEl.firstElementChild : editorEl;
  Array.from(contentRoot.children).forEach(child => {
    if (child.tagName !== 'DIV' || child.getAttribute('data-pe')) return;
    if (child.className.includes('grid-cols') || child.className.includes('space-y')) return;
    const cls = child.className;
    if (cls.includes('rounded') || cls.includes('bg-zinc-950') || cls.includes('bg-[#FAF8F3]') || cls.includes('bg-white')) {
      mkCardCtrl(child, contentRoot);
    }
  });

  // ── List items ─────────────────────────────────────────────────────────────
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
    addBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const lastLi = list.querySelector('li:last-child');
      const newLi = document.createElement('li');
      if (lastLi) {
        const clone = lastLi.cloneNode(true);
        clone.querySelectorAll('.pe-ctrl,.pe-add').forEach(b => b.remove());
        clone.removeAttribute('data-pe');
        clone.style.cssText = '';
        clone.querySelectorAll('span,strong').forEach(el => { if (!el.querySelector('*')) el.textContent = 'Nội dung mới'; });
        if (!clone.querySelector('*')) clone.textContent = 'Nội dung mới';
        newLi.innerHTML = clone.innerHTML;
      } else {
        newLi.textContent = 'Nội dung mới';
      }
      list.appendChild(newLi);
      _pcInjectBlockControls(editorEl);
    });
    list.after(addBtn);
  });
}

function _pcCleanEditControls(el) {
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
