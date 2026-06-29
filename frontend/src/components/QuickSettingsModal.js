import { showToast } from '../pages/Admin/shared/ui.js';
import { API_BASE, STORAGE_KEYS } from '../services/config.js';

let modalEl = null;

function getAdminToken() {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || localStorage.getItem('dhat_token');
}

export function openQuickSettings(defaultTab = 'brand', extraParam = 0) {
  const token = getAdminToken();
  if (!token) {
    showToast('Bạn cần đăng nhập quản trị viên để chỉnh sửa.', 'error');
    return;
  }

  // Remove existing modal if any
  if (modalEl) {
    modalEl.remove();
  }

  let activeTab = defaultTab;
  let selectedSlideIndex = typeof extraParam === 'number' ? extraParam : 0;
  let settings = window.APP_SETTINGS || {
    brand_name: 'Venix Watch',
    logo_url: '',
    hero_banners: [],
    theme_colors: {}
  };

  const initialColors = JSON.parse(JSON.stringify(settings.theme_colors || {}));

  function restoreInitialColors() {
    Object.entries(initialColors).forEach(([key, val]) => {
      if (val) document.documentElement.style.setProperty(`--color-${key}`, val);
    });
    document.body.style.overflow = '';
    modalEl.remove();
  }

  // Create modal container
  modalEl = document.createElement('div');
  modalEl.className = 'fixed inset-0 z-[10000] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in';
  document.body.style.overflow = 'hidden';
  
  // Render structure
  renderModal();
  document.body.appendChild(modalEl);

  // Helper to get nested offsetTop relative to a container
  function getElementOffsetTop(element, container) {
    let offsetTop = 0;
    let el = element;
    while (el && el !== container) {
      offsetTop += el.offsetTop;
      el = el.offsetParent;
    }
    return offsetTop;
  }

  // Auto scroll and highlight sub-section if in sections tab
  if (activeTab === 'sections' && typeof extraParam === 'string') {
    const targetSec = modalEl.querySelector(`#quick-sec-${extraParam}`);
    if (targetSec) {
      const modalBody = modalEl.querySelector('#quick-modal-body');
      if (modalBody) {
        setTimeout(() => {
          const topPos = getElementOffsetTop(targetSec, modalBody);
          modalBody.scrollTop = topPos - 12;
          
          // Add highlight styling
          targetSec.classList.add('quick-sec-highlight');
        }, 100);
      }
    }
  }


  function renderModal() {
    modalEl.innerHTML = `
      <style>
        #quick-modal-body::-webkit-scrollbar {
          width: 6px;
        }
        #quick-modal-body::-webkit-scrollbar-track {
          background: #f9f9f9;
        }
        #quick-modal-body::-webkit-scrollbar-thumb {
          background: #d4cfc5;
          border-radius: 3px;
        }
        #quick-modal-body::-webkit-scrollbar-thumb:hover {
          background: #C9A84C;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none !important;
        }
        .scrollbar-none {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        .quick-sec-highlight {
          border-left: 4px solid #C9A84C !important;
          background-color: rgba(201, 168, 76, 0.05) !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }
      </style>
      <div class="bg-white border border-gray-200 w-full max-w-3xl md:max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans max-h-[92vh]" data-lenis-prevent>
        <!-- Header -->
        <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 shrink-0">
          <div class="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wide">Chỉnh Sửa Nhanh Giao Diện</h3>
          </div>
          <button id="close-quick-modal" class="text-gray-400 hover:text-gray-600 transition-colors border-0 bg-transparent cursor-pointer" style="color: #9ca3af !important; background: transparent !important; outline: none !important;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="px-5 flex items-end border-b border-gray-150 gap-5 text-xs font-bold text-gray-500 overflow-x-auto whitespace-nowrap scrollbar-none h-12 bg-gray-50/30 shrink-0">
          <button id="tab-brand-trigger" class="relative px-1 pb-2.5 transition-all shrink-0 whitespace-nowrap outline-none bg-transparent border-0 cursor-pointer" style="color: ${activeTab === 'brand' ? '#C9A84C' : '#9ca3af'} !important; background: transparent !important;">
            Thương hiệu & Logo
            ${activeTab === 'brand' ? '<span class="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A84C]"></span>' : ''}
          </button>
          <button id="tab-menu-trigger" class="relative px-1 pb-2.5 transition-all shrink-0 whitespace-nowrap outline-none bg-transparent border-0 cursor-pointer" style="color: ${activeTab === 'menu' ? '#C9A84C' : '#9ca3af'} !important; background: transparent !important;">
            Menu
            ${activeTab === 'menu' ? '<span class="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A84C]"></span>' : ''}
          </button>
          <button id="tab-banner-trigger" class="relative px-1 pb-2.5 transition-all shrink-0 whitespace-nowrap outline-none bg-transparent border-0 cursor-pointer" style="color: ${activeTab === 'banner' ? '#C9A84C' : '#9ca3af'} !important; background: transparent !important;">
            Banner
            ${activeTab === 'banner' ? '<span class="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A84C]"></span>' : ''}
          </button>
          <button id="tab-sections-trigger" class="relative px-1 pb-2.5 transition-all shrink-0 whitespace-nowrap outline-none bg-transparent border-0 cursor-pointer" style="color: ${activeTab === 'sections' ? '#C9A84C' : '#9ca3af'} !important; background: transparent !important;">
            Section Trang Chủ
            ${activeTab === 'sections' ? '<span class="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A84C]"></span>' : ''}
          </button>
          <button id="tab-colors-trigger" class="relative px-1 pb-2.5 transition-all shrink-0 whitespace-nowrap outline-none bg-transparent border-0 cursor-pointer" style="color: ${activeTab === 'colors' ? '#C9A84C' : '#9ca3af'} !important; background: transparent !important;">
            Màu Sắc
            ${activeTab === 'colors' ? '<span class="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A84C]"></span>' : ''}
          </button>
          <button id="tab-footer-trigger" class="relative px-1 pb-2.5 transition-all shrink-0 whitespace-nowrap outline-none bg-transparent border-0 cursor-pointer" style="color: ${activeTab === 'footer' ? '#C9A84C' : '#9ca3af'} !important; background: transparent !important;">
            Footer
            ${activeTab === 'footer' ? '<span class="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A84C]"></span>' : ''}
          </button>
          <button id="tab-policy-trigger" class="relative px-1 pb-2.5 transition-all shrink-0 whitespace-nowrap outline-none bg-transparent border-0 cursor-pointer" style="color: ${activeTab === 'policy' ? '#C9A84C' : '#9ca3af'} !important; background: transparent !important;">
            Chính Sách & Badges
            ${activeTab === 'policy' ? '<span class="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A84C]"></span>' : ''}
          </button>
        </div>

        <!-- Body Form -->
        <div id="quick-modal-body" class="p-6 flex-1 overflow-y-auto space-y-5 text-xs text-gray-700 relative">
          ${activeTab === 'brand' ? renderBrandForm()
            : activeTab === 'menu' ? renderMenuForm()
            : activeTab === 'banner' ? renderBannerForm()
            : activeTab === 'sections' ? renderSectionsForm()
            : activeTab === 'colors' ? renderColorsForm()
            : activeTab === 'policy' ? renderPolicyForm()
            : renderFooterForm()}
        </div>

        <!-- Footer Actions -->
        <div class="px-5 py-4 border-t border-gray-150 flex items-center justify-end gap-3 bg-gray-50 shrink-0">
          <button id="cancel-quick-modal" class="border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer" style="color: #374151 !important; border-color: #e4e4e7 !important; background-color: #ffffff !important; outline: none !important;">Hủy</button>
          <button id="save-quick-modal" class="bg-[#C9A84C] hover:bg-[#b8963e] text-white font-semibold px-5 py-2 rounded-lg shadow-md transition-colors flex items-center gap-1.5 cursor-pointer" style="color: #ffffff !important; background-color: #C9A84C !important; border-color: #C9A84C !important; outline: none !important;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Lưu thay đổi
          </button>
        </div>
      </div>
    `;

    bindEvents();
  }

  const defaultColors = {
    primary: '#1a1a1a',
    secondary: '#ffffff',
    'accent-gold': '#C9A84C',
    'accent-dark': '#2d2d2d',
    'text-muted': '#888888',
    'border-color': '#e8e8e8',
    'sale-red': '#c0392b',
    'primary-gold': '#C9A961',
    'primary-gold-dark': '#A88840',
    ink: '#0A0A0A',
    'ink-soft': '#1F1F1F',
    paper: '#FFFFFF',
    'paper-warm': '#FAF8F3',
    line: '#E8E4DC',
  };

  const colorFields = [
    { key: 'primary', label: 'Màu nền tối chính', desc: 'Màu nền của phần đầu trang (Header), chân trang (Footer) và các khung biểu ngữ tối màu.' },
    { key: 'primary-gold', label: 'Màu vàng nổi bật chính', desc: 'Dùng cho các nút bấm chính cần gây chú ý (như nút Mua ngay, Thêm vào giỏ) và các đường viền hiệu ứng.' },
    { key: 'accent-gold', label: 'Màu vàng trang trí phụ', desc: 'Dùng khi di chuột vào danh mục menu, các biểu tượng nhỏ hoặc kim giây đồng hồ.' },
    { key: 'primary-gold-dark', label: 'Màu vàng khi di chuột', desc: 'Màu sắc hiển thị của các nút bấm màu vàng chính khi bạn rê con trỏ chuột vào.' },
    { key: 'paper-warm', label: 'Màu nền ấm', desc: 'Màu nền hơi ngả vàng ấm áp, dùng cho phần đăng ký nhận tin hoặc khối giới thiệu thương hiệu.' },
    { key: 'ink', label: 'Màu chữ chính', desc: 'Màu sắc chủ đạo cho toàn bộ chữ viết, mô tả sản phẩm và tiêu đề chính trên trang.' },
    { key: 'sale-red', label: 'Màu thông báo giảm giá', desc: 'Màu đỏ rực rỡ dùng để hiển thị nhãn giảm giá (ví dụ: -20%) và giá khuyến mãi.' },
    { key: 'secondary', label: 'Màu nền sáng chính', desc: 'Màu nền chủ đạo của toàn bộ trang web (phần nền phía sau các sản phẩm và nội dung).' },
  ];

  function renderColorsForm() {
    const colors = settings.theme_colors || defaultColors;
    return `
      <div class="space-y-4 font-sans">
        <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Kéo bảng màu (Live Preview trực tiếp trên trang)</span>
          <button type="button" id="quick-reset-colors" class="text-[#C9A84C] hover:underline cursor-pointer font-bold bg-transparent border-0 outline-none">Khôi phục gốc</button>
        </div>
        <div class="grid grid-cols-1 gap-3">
          ${colorFields.map(field => `
            <div class="flex items-center gap-3 bg-white p-3 border border-gray-150 rounded-xl shadow-sm w-full hover:bg-gray-50/50 transition-colors">
              <input type="color" data-color-key="${field.key}" value="${colors[field.key] || defaultColors[field.key]}" 
                class="quick-color-input w-12 h-9 border border-gray-200 rounded-lg cursor-pointer bg-transparent focus:outline-none shrink-0" />
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold text-gray-800">${field.label}</span>
                  <span class="text-[9px] font-mono text-gray-450 uppercase font-bold tracking-wider">${colors[field.key] || defaultColors[field.key]}</span>
                </div>
                <p class="text-[10px] text-gray-500 mt-1 leading-tight">${field.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderLinksEditor(title, key, list) {
    return `
      <div class="border border-gray-150 rounded-xl p-4 bg-gray-50/30 space-y-4 shadow-sm">
        <div class="flex items-center justify-between border-b pb-2.5 border-gray-150">
          <h4 class="text-xs font-bold text-gray-900 uppercase tracking-wide">${title}</h4>
          <button type="button" id="quick-add-link-${key}" class="bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-[10px] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 border-0 outline-none">
            + Thêm liên kết
          </button>
        </div>
        <div class="space-y-3" id="quick-links-${key}-list">
          ${list.length === 0 
            ? `<div class="text-center py-6 text-gray-400 text-[10px]">Chưa có liên kết nào.</div>`
            : list.map((item, i) => `
              <div class="flex items-center gap-3 bg-white p-3 border border-gray-150 rounded-xl shadow-sm w-full" data-${key}-index="${i}">
                <div class="w-6 h-6 flex items-center justify-center bg-zinc-950 text-white rounded-full text-[10px] font-bold shrink-0">
                  ${i + 1}
                </div>
                <div class="w-44 shrink-0">
                  <input type="text" class="quick-link-label-${key} w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${item.label || ''}" placeholder="Nhãn liên kết" />
                </div>
                <div class="flex-1">
                  <input type="text" class="quick-link-href-${key} w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${item.href || ''}" placeholder="Đường dẫn (ví dụ: /nam)" />
                </div>
                <!-- Dummy spacer to align with Badge input in Menu tab -->
                <div class="w-24 shrink-0"></div>
                <div class="flex items-center gap-1.5 shrink-0">
                  <button type="button" class="quick-move-up-link-${key}-btn w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg transition-colors ${i === 0 ? 'opacity-30 cursor-not-allowed text-gray-300' : 'cursor-pointer hover:bg-gray-100 text-gray-500'}" ${i === 0 ? 'disabled' : ''} title="Di chuyển lên">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                  </button>
                  <button type="button" class="quick-move-down-link-${key}-btn w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg transition-colors ${i === list.length - 1 ? 'opacity-30 cursor-not-allowed text-gray-300' : 'cursor-pointer hover:bg-gray-100 text-gray-500'}" ${i === list.length - 1 ? 'disabled' : ''} title="Di chuyển xuống">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  <!-- Dummy spacer to align with Add Child (+ Con) button in Menu tab -->
                  <div class="w-[54px] shrink-0"></div>
                  <button type="button" class="quick-delete-link-${key}-btn w-8 h-8 flex items-center justify-center border border-gray-200 hover:border-red-200 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer shrink-0" title="Xóa">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                  </button>
                </div>
              </div>
            `).join('')}
        </div>
      </div>
    `;
  }

  const DEFAULT_TRUST_BADGES = [
    { icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`, title: 'Miễn Phí Vận Chuyển', subtitle: 'Đơn trên 500.000đ' },
    { icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`, title: 'Đổi Trả Dễ Dàng', subtitle: 'Trong vòng 30 ngày' },
    { icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`, title: 'Bảo Hành 2 Năm', subtitle: 'Chính hãng tuyệt đối' },
    { icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`, title: 'Chính Hãng 100%', subtitle: 'Cam kết uy tín' },
  ];

  function renderPolicyForm() {
    if (!settings.trust_badges || settings.trust_badges.length === 0) {
      settings.trust_badges = JSON.parse(JSON.stringify(DEFAULT_TRUST_BADGES));
    }
    const badges = settings.trust_badges;
    return `
      <div class="space-y-4 font-sans">
        <div class="flex items-center justify-between mb-1">
          <div>
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trust Badges — Cam Kết Chính Sách</p>
            <p class="text-[10px] text-gray-400 mt-0.5">Hiển thị trên trang chủ và footer. Icon dùng SVG inline.</p>
          </div>
          <button type="button" id="quick-policy-add-badge" class="bg-zinc-950 hover:bg-zinc-800 text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-colors border-0 outline-none cursor-pointer flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Thêm
          </button>
        </div>
        <div class="space-y-3" id="quick-policy-badges-list">
          ${badges.map((b, i) => `
            <div class="bg-white border border-gray-150 rounded-xl shadow-sm overflow-hidden" data-policy-badge-index="${i}">
              <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
                <span class="w-5 h-5 rounded-full bg-zinc-950 text-white text-[9px] font-bold flex items-center justify-center shrink-0">${i + 1}</span>
                <span class="flex-1 text-[10px] font-bold text-gray-600 truncate">${b.title || 'Badge'}</span>
                <div class="flex gap-1">
                  <button type="button" class="quick-policy-move-up w-6 h-6 flex items-center justify-center border border-gray-200 rounded transition-colors ${i === 0 ? 'opacity-30 cursor-not-allowed text-gray-300' : 'hover:bg-gray-100 text-gray-500 cursor-pointer'}" ${i === 0 ? 'disabled' : ''}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"/></svg>
                  </button>
                  <button type="button" class="quick-policy-move-down w-6 h-6 flex items-center justify-center border border-gray-200 rounded transition-colors ${i === badges.length - 1 ? 'opacity-30 cursor-not-allowed text-gray-300' : 'hover:bg-gray-100 text-gray-500 cursor-pointer'}" ${i === badges.length - 1 ? 'disabled' : ''}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  <button type="button" class="quick-policy-delete w-6 h-6 flex items-center justify-center border border-red-200 hover:bg-red-50 text-red-500 rounded transition-colors cursor-pointer">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                  </button>
                </div>
              </div>
              <div class="p-3 grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tiêu đề</label>
                  <input type="text" class="quick-policy-title w-full px-2 py-1.5 border border-gray-200 rounded-lg text-[11px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C]" value="${(b.title || '').replace(/"/g, '&quot;')}" />
                </div>
                <div>
                  <label class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Mô tả phụ</label>
                  <input type="text" class="quick-policy-subtitle w-full px-2 py-1.5 border border-gray-200 rounded-lg text-[11px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C]" value="${(b.subtitle || '').replace(/"/g, '&quot;')}" />
                </div>
                <div class="col-span-2">
                  <label class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Icon SVG <span class="font-normal normal-case text-gray-400">(paste &lt;svg ...&gt; inline)</span></label>
                  <div class="flex gap-2 items-center">
                    <textarea class="quick-policy-icon flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-[10px] font-mono text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] resize-none h-[48px]">${(b.icon || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
                    <div class="quick-policy-icon-preview w-9 h-9 flex items-center justify-center border border-zinc-200 rounded-lg bg-zinc-50 text-zinc-700 shrink-0">${b.icon || ''}</div>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        <p class="text-[10px] text-gray-400 bg-gray-50 border border-gray-150 rounded-lg px-3 py-2">
          Tìm icon tại <strong>heroicons.com</strong> hoặc <strong>lucide.dev</strong> → chọn "Copy SVG" → dán vào ô Icon SVG.
        </p>
      </div>
    `;
  }

  function renderFooterForm() {
    if (!settings.footer_settings) {
      settings.footer_settings = {};
    }
    const footer = settings.footer_settings;

    const shop_links = footer.shop_links || [
      { label: 'Đồng Hồ Nam', href: '/nam' },
      { label: 'Đồng Hồ Nữ', href: '/nu' },
      { label: 'Phụ Kiện', href: '/phu-kien' },
      { label: 'Sale', href: '/sale' },
      { label: 'Hàng Mới Về', href: '/nam?sort=new' },
      { label: 'Best Sellers', href: '/nam?sort=bestseller' },
    ];
    const service_links = footer.service_links || [
      { label: 'Chính Sách Vận Chuyển', href: '/van-chuyen' },
      { label: 'Đổi Trả & Hoàn Tiền', href: '/doi-tra' },
      { label: 'Bảo Hành', href: '/bao-hanh' },
      { label: 'Hỏi Đáp (FAQ)', href: '/faq' },
      { label: 'Liên Hệ', href: '/lien-he' },
    ];
    const about_links = footer.about_links || [
      { label: 'Về Chúng Tôi', href: '/gioi-thieu' },
      { label: 'Blog & Tin Tức', href: '/blog' },
      { label: 'Tuyển Dụng', href: '/tuyen-dung' },
      { label: 'Chính Sách Bảo Mật', href: '/bao-mat' },
      { label: 'Điều Khoản Dịch Vụ', href: '/dieu-khoan' },
    ];

    footer.shop_links = shop_links;
    footer.service_links = service_links;
    footer.about_links = about_links;

    return `
      <div class="space-y-6">
        <!-- Contact Info -->
        <div class="border border-gray-150 rounded-xl p-4 bg-gray-50/30 space-y-4 shadow-sm">
          <div class="text-xs font-bold text-gray-900 uppercase tracking-wide border-b pb-2.5 border-gray-150 mb-1">Thông tin liên hệ</div>
          <div class="space-y-3.5">
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Hotline</label>
              <input type="text" id="quick-footer-hotline" value="${footer.hotline || ''}" 
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" id="quick-footer-email" value="${footer.email || ''}" 
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Địa chỉ</label>
              <textarea id="quick-footer-address" rows="2" 
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all resize-none h-20">${footer.address || ''}</textarea>
            </div>
          </div>
        </div>

        <!-- Social Media -->
        <div class="border border-gray-150 rounded-xl p-4 bg-gray-50/30 space-y-4 shadow-sm">
          <div class="text-xs font-bold text-gray-900 uppercase tracking-wide border-b pb-2.5 border-gray-150 mb-1">Liên kết mạng xã hội</div>
          <div class="space-y-3.5">
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Facebook URL</label>
              <input type="url" id="quick-footer-facebook" value="${footer.social_facebook || ''}" 
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" placeholder="https://..." />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Instagram URL</label>
              <input type="url" id="quick-footer-instagram" value="${footer.social_instagram || ''}" 
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" placeholder="https://..." />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">TikTok URL</label>
              <input type="url" id="quick-footer-tiktok" value="${footer.social_tiktok || ''}" 
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" placeholder="https://..." />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">YouTube URL</label>
              <input type="url" id="quick-footer-youtube" value="${footer.social_youtube || ''}" 
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" placeholder="https://..." />
            </div>
          </div>
        </div>

        <!-- Shop Links Column -->
        ${renderLinksEditor('Cột 1: Shop Links', 'shop', shop_links)}

        <!-- Customer Service Links Column -->
        ${renderLinksEditor('Cột 2: Dịch Vụ KH Links', 'service', service_links)}

        <!-- About Us Links Column -->
        ${renderLinksEditor('Cột 3: Về Chúng Tôi Links', 'about', about_links)}
      </div>
    `;
  }

  function renderBrandForm() {
    return `
      <div class="border border-gray-150 rounded-xl p-4 bg-gray-50/30 space-y-4 shadow-sm">
        <div>
          <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tên thương hiệu</label>
          <input type="text" id="quick-brand-name" value="${settings.brand_name}" 
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" />
        </div>
        <div>
          <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Ảnh logo thương hiệu</label>
          <div class="flex items-center gap-4 bg-white p-3 border border-gray-150 rounded-xl shadow-sm">
            <div id="quick-logo-preview" class="w-16 h-16 border border-gray-150 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
              ${settings.logo_url 
                ? `<img src="${settings.logo_url}" class="max-h-full max-w-full object-contain" />` 
                : `<span class="text-[10px] text-gray-400">Default Logo</span>`
              }
            </div>
            <div class="flex-1 space-y-2">
              <input type="file" id="quick-logo-input" accept="image/*" class="hidden" />
              <div class="flex gap-2">
                <button id="quick-upload-logo" class="bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-[10px] px-3 py-1.5 rounded-lg transition-colors border-0 outline-none cursor-pointer">Tải ảnh lên</button>
                ${settings.logo_url ? `<button id="quick-delete-logo" class="border border-red-200 hover:bg-red-55 text-red-600 font-semibold text-[10px] px-3 py-1.5 rounded-lg transition-colors bg-white cursor-pointer">Xóa logo</button>` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderBannerForm() {
    const banners = settings.hero_banners || [];
    if (banners.length === 0) {
      return `
        <div class="border border-gray-150 rounded-xl p-4 bg-gray-50/30 space-y-4 shadow-sm">
          <div class="text-center py-6 text-gray-400">Không có dữ liệu banner để chỉnh sửa.</div>
          <div class="flex justify-center">
            <button id="quick-add-slide" class="bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-[10px] px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 border-0 cursor-pointer">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Thêm Slide Mới
            </button>
          </div>
        </div>
      `;
    }

    const slide = banners[selectedSlideIndex] || banners[0];

    return `
      <div class="space-y-6">
        <!-- Slide selector & Actions -->
        <div class="border border-gray-150 rounded-xl p-4 bg-gray-50/30 flex flex-col md:flex-row md:items-end gap-3.5 shadow-sm">
          <div class="flex-1">
            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Chọn Slide Banner cần sửa</label>
            <select id="quick-slide-select" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] font-bold text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all h-9">
              ${banners.map((_, i) => `
                <option value="${i}" ${i === selectedSlideIndex ? 'selected' : ''}>Slide Banner #${i + 1} (${banners[i].title || 'Chưa có tiêu đề'})</option>
              `).join('')}
            </select>
          </div>
          <div class="flex gap-1.5 shrink-0">
            <button id="quick-move-up-slide" class="border border-gray-200 hover:bg-gray-100 text-gray-550 h-9 w-9 rounded-lg transition-colors flex items-center justify-center cursor-pointer bg-white ${selectedSlideIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''}" title="Di chuyển lên" ${selectedSlideIndex === 0 ? 'disabled' : ''}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <button id="quick-move-down-slide" class="border border-gray-200 hover:bg-gray-100 text-gray-550 h-9 w-9 rounded-lg transition-colors flex items-center justify-center cursor-pointer bg-white ${selectedSlideIndex === banners.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}" title="Di chuyển xuống" ${selectedSlideIndex === banners.length - 1 ? 'disabled' : ''}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <button id="quick-add-slide" class="bg-zinc-950 hover:bg-zinc-800 text-white font-semibold h-9 px-3.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider cursor-pointer border-0 outline-none" title="Thêm slide mới">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Thêm
            </button>
            <button id="quick-delete-slide" class="border border-red-200 hover:bg-red-50 text-red-600 font-semibold h-9 px-3.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider cursor-pointer bg-white" title="Xóa slide hiện tại">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Xóa
            </button>
          </div>
        </div>

        <div class="border border-gray-150 rounded-xl p-4 bg-gray-50/30 grid grid-cols-1 md:grid-cols-2 gap-4 shadow-sm">
          <div>
            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Dòng phụ trên (Eyebrow)</label>
            <input type="text" id="quick-slide-eyebrow" value="${slide.eyebrow || ''}" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" />
          </div>
          <div>
            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tiêu đề lớn (Title)</label>
            <input type="text" id="quick-slide-title" value="${slide.title || ''}" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Mô tả phụ (Subtitle)</label>
            <textarea id="quick-slide-subtitle" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all h-20 resize-none">${slide.subtitle || ''}</textarea>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Chữ nút bấm (CTA)</label>
            <input type="text" id="quick-slide-cta" value="${slide.cta || ''}" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" />
          </div>
          <div>
            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Liên kết nút (CTA Link)</label>
            <input type="text" id="quick-slide-ctaHref" value="${slide.ctaHref || ''}" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Hình ảnh nền banner</label>
            <div class="flex items-center gap-4 bg-white p-3 border border-gray-150 rounded-xl shadow-sm">
              <div class="w-20 h-12 border border-gray-150 rounded-lg bg-zinc-950 overflow-hidden relative shrink-0">
                <img id="quick-slide-preview-img" src="${slide.img || ''}" class="w-full h-full object-cover opacity-70" />
              </div>
              <div class="flex-1 space-y-2">
                <input type="file" id="quick-slide-image-file" accept="image/*" class="hidden" />
                <button id="quick-upload-slide-img" class="bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-[10px] px-3 py-1.5 rounded-lg transition-colors border-0 cursor-pointer outline-none">Tải ảnh lên</button>
                <input type="text" id="quick-slide-img-url" value="${slide.img || ''}" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-450 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all mt-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderMenuForm() {
    if (!settings.navigation_menu) {
      settings.navigation_menu = [];
    }
    if (!settings.menu_brands) {
      settings.menu_brands = [
        { label: 'Carnival Premium', brand_key: 'carnival', icon_type: 'polygon' },
        { label: 'Casio Watch', brand_key: 'casio', icon_type: 'rect' },
        { label: 'Kemil New', brand_key: 'kemil', icon_type: 'star' }
      ];
    }
    if (!settings.menu_brands_nam) {
      settings.menu_brands_nam = settings.menu_brands ? JSON.parse(JSON.stringify(settings.menu_brands)) : [
        { label: 'Carnival Premium', brand_key: 'carnival', icon_type: 'polygon' },
        { label: 'Casio Watch', brand_key: 'casio', icon_type: 'rect' },
        { label: 'Kemil New', brand_key: 'kemil', icon_type: 'star' }
      ];
    }
    if (!settings.menu_brands_nu) {
      settings.menu_brands_nu = settings.menu_brands ? JSON.parse(JSON.stringify(settings.menu_brands)) : [
        { label: 'Carnival Premium', brand_key: 'carnival', icon_type: 'polygon' },
        { label: 'Casio Watch', brand_key: 'casio', icon_type: 'rect' },
        { label: 'Kemil New', brand_key: 'kemil', icon_type: 'star' }
      ];
    }
    return `
      <div class="space-y-6">
        <div class="border border-gray-150 rounded-xl p-4 bg-gray-50/30 space-y-4 shadow-sm">
          <div class="flex items-center justify-between border-b pb-2.5 border-gray-150">
            <h4 class="text-xs font-bold text-gray-900 uppercase tracking-wide">Cấu hình Menu chính</h4>
            <button type="button" id="quick-add-menu-item" class="bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-[10px] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border-0 outline-none cursor-pointer">
              + Thêm Menu
            </button>
          </div>
          <div class="space-y-3.5" id="quick-menu-items-list">
            ${settings.navigation_menu.length === 0 
              ? `<div class="text-center py-6 text-gray-400 text-[10px]">Chưa có menu nào.</div>` 
              : settings.navigation_menu.map((item, i) => `
                <div class="border border-gray-150 rounded-xl p-4 bg-gray-55/15 space-y-3.5 relative shadow-sm" data-item-index="${i}">
                  <div class="flex items-center gap-3 bg-white p-3 border border-gray-150 rounded-xl shadow-sm w-full">
                    <div class="w-6 h-6 flex items-center justify-center bg-zinc-950 text-white rounded-full text-[10px] font-bold shrink-0">
                      ${i + 1}
                    </div>
                    <div class="w-44 shrink-0">
                      <input type="text" class="quick-menu-label w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${item.label || ''}" placeholder="Tên menu" />
                    </div>
                    <div class="flex-1">
                      <input type="text" class="quick-menu-href w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${item.href || ''}" placeholder="Liên kết (ví dụ: /nam)" />
                    </div>
                    <div class="w-24 shrink-0">
                      <input type="text" class="quick-menu-badge w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${item.badge || ''}" placeholder="Badge" />
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                      <button type="button" class="quick-move-up-menu-btn w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors shrink-0 ${i === 0 ? 'opacity-30 cursor-not-allowed text-gray-300' : 'cursor-pointer'}" ${i === 0 ? 'disabled' : ''}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                      </button>
                      <button type="button" class="quick-move-down-menu-btn w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors shrink-0 ${i === settings.navigation_menu.length - 1 ? 'opacity-30 cursor-not-allowed text-gray-300' : 'cursor-pointer'}" ${i === settings.navigation_menu.length - 1 ? 'disabled' : ''}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                      <button type="button" class="quick-add-child-menu-btn h-8 w-[54px] shrink-0 flex items-center justify-center border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C]/5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer bg-white">
                        + Con
                      </button>
                      <button type="button" class="quick-delete-menu-btn w-8 h-8 flex items-center justify-center border border-gray-200 hover:border-red-200 hover:bg-red-50 text-red-500 rounded-lg transition-colors shrink-0 cursor-pointer">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                      </button>
                    </div>
                  </div>
                  <!-- Submenu -->
                  <div class="ml-3 pl-6 border-l-2 border-gray-150 space-y-3">
                    ${(item.children || []).map((child, j) => `
                      <div class="flex items-center gap-3 bg-white p-3 border border-gray-150 rounded-xl shadow-sm w-full" data-child-index="${j}">
                        <div class="w-44 shrink-0">
                          <input type="text" class="quick-child-label w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${child.label || ''}" placeholder="Tên con" />
                        </div>
                        <div class="flex-1">
                          <input type="text" class="quick-child-href w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${child.href || ''}" placeholder="Liên kết" />
                        </div>
                        <!-- Spacer to align with Badge input -->
                        <div class="w-24 shrink-0"></div>
                        <div class="flex items-center gap-1.5 shrink-0">
                          <button type="button" class="quick-move-up-child-btn w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors shrink-0 ${j === 0 ? 'opacity-30 cursor-not-allowed text-gray-300' : 'cursor-pointer'}" ${j === 0 ? 'disabled' : ''}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                          </button>
                          <button type="button" class="quick-move-down-child-btn w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors shrink-0 ${j === item.children.length - 1 ? 'opacity-30 cursor-not-allowed text-gray-300' : 'cursor-pointer'}" ${j === item.children.length - 1 ? 'disabled' : ''}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                          </button>
                          <!-- Spacer to align with Add Child (+ Con) button -->
                          <div class="w-[54px] shrink-0"></div>
                          <button type="button" class="quick-delete-child-btn w-8 h-8 flex items-center justify-center border border-gray-200 hover:border-red-200 hover:bg-red-50 text-red-500 rounded-lg transition-colors shrink-0 cursor-pointer">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                          </button>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
          </div>
        </div>

        <!-- Nam Brands -->
        <div class="border border-gray-150 rounded-xl p-4 bg-gray-50/30 space-y-4 shadow-sm">
          <div class="flex items-center justify-between border-b pb-2.5 border-gray-150">
            <h4 class="text-xs font-bold text-gray-900 uppercase tracking-wide">Thương hiệu Mega Menu Nam</h4>
            <button type="button" id="quick-add-menu-brand-nam" class="bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-[10px] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border-0 outline-none cursor-pointer">
              + Thêm
            </button>
          </div>
          <div class="space-y-3" id="quick-menu-brands-nam-list">
            ${settings.menu_brands_nam.length === 0 
              ? `<div class="text-center py-6 text-gray-400 text-[10px]">Chưa cấu hình thương hiệu nào cho Nam.</div>`
              : settings.menu_brands_nam.map((brand, i) => `
                <div class="flex items-center gap-3 bg-white p-3 border border-gray-150 rounded-xl shadow-sm w-full" data-brand-nam-index="${i}">
                  <div class="w-6 h-6 flex items-center justify-center bg-[#C9A84C] text-white rounded-full text-[10px] font-bold shrink-0">
                    ${i + 1}
                  </div>
                  <div class="w-44 shrink-0">
                    <input type="text" class="quick-brand-nam-label w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${brand.label || ''}" placeholder="Tên" />
                  </div>
                  <div class="flex-1">
                    <input type="text" class="quick-brand-nam-key w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${brand.brand_key || ''}" placeholder="Mã" />
                  </div>
                  <div class="w-24 shrink-0">
                    <select class="quick-brand-nam-icon w-full px-3 py-2 border border-gray-250 rounded-lg text-[11px] text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] h-9">
                      <option value="star" ${brand.icon_type === 'star' ? 'selected' : ''}>Star</option>
                      <option value="polygon" ${brand.icon_type === 'polygon' ? 'selected' : ''}>Badge</option>
                      <option value="rect" ${brand.icon_type === 'rect' ? 'selected' : ''}>Watch</option>
                    </select>
                  </div>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <button type="button" class="quick-move-up-brand-nam-btn w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors shrink-0 ${i === 0 ? 'opacity-30 cursor-not-allowed text-gray-300' : 'cursor-pointer'}" ${i === 0 ? 'disabled' : ''}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                    </button>
                    <button type="button" class="quick-move-down-brand-nam-btn w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors shrink-0 ${i === settings.menu_brands_nam.length - 1 ? 'opacity-30 cursor-not-allowed text-gray-300' : 'cursor-pointer'}" ${i === settings.menu_brands_nam.length - 1 ? 'disabled' : ''}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <!-- Spacer to align with Add Child (+ Con) button -->
                    <div class="w-[54px] shrink-0"></div>
                    <button type="button" class="quick-delete-brand-nam-btn w-8 h-8 flex items-center justify-center border border-gray-200 hover:border-red-200 hover:bg-red-50 text-red-500 rounded-lg transition-colors shrink-0 cursor-pointer">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                    </button>
                  </div>
                </div>
              `).join('')}
          </div>
        </div>

        <!-- Nu Brands -->
        <div class="border border-gray-150 rounded-xl p-4 bg-gray-50/30 space-y-4 shadow-sm">
          <div class="flex items-center justify-between border-b pb-2.5 border-gray-150">
            <h4 class="text-xs font-bold text-gray-900 uppercase tracking-wide">Thương hiệu Mega Menu Nữ</h4>
            <button type="button" id="quick-add-menu-brand-nu" class="bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-[10px] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border-0 outline-none cursor-pointer">
              + Thêm
            </button>
          </div>
          <div class="space-y-3" id="quick-menu-brands-nu-list">
            ${settings.menu_brands_nu.length === 0 
              ? `<div class="text-center py-6 text-gray-400 text-[10px]">Chưa cấu hình thương hiệu nào cho Nữ.</div>`
              : settings.menu_brands_nu.map((brand, i) => `
                <div class="flex items-center gap-3 bg-white p-3 border border-gray-150 rounded-xl shadow-sm w-full" data-brand-nu-index="${i}">
                  <div class="w-6 h-6 flex items-center justify-center bg-[#C9A84C] text-white rounded-full text-[10px] font-bold shrink-0">
                    ${i + 1}
                  </div>
                  <div class="w-44 shrink-0">
                    <input type="text" class="quick-brand-nu-label w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${brand.label || ''}" placeholder="Tên" />
                  </div>
                  <div class="flex-1">
                    <input type="text" class="quick-brand-nu-key w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${brand.brand_key || ''}" placeholder="Mã" />
                  </div>
                  <div class="w-24 shrink-0">
                    <select class="quick-brand-nu-icon w-full px-3 py-2 border border-gray-250 rounded-lg text-[11px] text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] h-9">
                      <option value="star" ${brand.icon_type === 'star' ? 'selected' : ''}>Star</option>
                      <option value="polygon" ${brand.icon_type === 'polygon' ? 'selected' : ''}>Badge</option>
                      <option value="rect" ${brand.icon_type === 'rect' ? 'selected' : ''}>Watch</option>
                    </select>
                  </div>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <button type="button" class="quick-move-up-brand-nu-btn w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors shrink-0 ${i === 0 ? 'opacity-30 cursor-not-allowed text-gray-300' : 'cursor-pointer'}" ${i === 0 ? 'disabled' : ''}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                    </button>
                    <button type="button" class="quick-move-down-brand-nu-btn w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors shrink-0 ${i === settings.menu_brands_nu.length - 1 ? 'opacity-30 cursor-not-allowed text-gray-300' : 'cursor-pointer'}" ${i === settings.menu_brands_nu.length - 1 ? 'disabled' : ''}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <!-- Spacer to align with Add Child (+ Con) button -->
                    <div class="w-[54px] shrink-0"></div>
                    <button type="button" class="quick-delete-brand-nu-btn w-8 h-8 flex items-center justify-center border border-gray-200 hover:border-red-200 hover:bg-red-50 text-red-500 rounded-lg transition-colors shrink-0 cursor-pointer">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                    </button>
                  </div>
                </div>
              `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function renderSectionsForm() {
    if (!settings.home_sections) settings.home_sections = {};
    if (!settings.home_sections.announcement_bar) settings.home_sections.announcement_bar = { messages: [] };
    if (!settings.home_sections.promo_banner) settings.home_sections.promo_banner = { title: '', code: '', buttons: [] };
    if (!settings.home_sections.category_banners) {
      settings.home_sections.category_banners = [
        { img: '', title: 'Đồng Hồ Nam', subtitle: 'Mạnh mẽ. Lịch lãm. Đẳng cấp.', href: '/nam' },
        { img: '', title: 'Đồng Hồ Nữ', subtitle: 'Thanh lịch. Tinh tế. Quyến rũ.', href: '/nu' },
        { img: '', title: 'Phụ Kiện', subtitle: 'Dây đeo. Hộp đựng. Phụ kiện cao cấp.', href: '/phu-kien' }
      ];
    }
    if (!settings.home_sections.brand_story) settings.home_sections.brand_story = { title: '', subtitle: '', description: '', button_label: '', button_href: '', image_url: '' };
    if (!settings.home_sections.newsletter) settings.home_sections.newsletter = { title: '', description: '', button_label: '' };

    const sec = settings.home_sections;
    const ab = sec.announcement_bar;
    const pb = sec.promo_banner;
    const cb = sec.category_banners;
    const bs = sec.brand_story;
    const nl = sec.newsletter;

    return `
      <div class="space-y-6 font-sans text-xs">
        <!-- 1. Announcement Bar -->
        <div id="quick-sec-announcement_bar" class="border border-gray-150 rounded-xl p-4 bg-gray-50/30 space-y-4 scroll-mt-2 transition-all duration-300 shadow-sm">
          <div class="flex items-center justify-between border-b pb-2.5 border-gray-150">
            <span class="text-xs font-bold text-gray-900 uppercase tracking-wide">1. Dòng chạy thông báo</span>
            <button type="button" id="quick-add-announcement-msg" class="bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-[10px] px-3 py-1.5 rounded-lg transition-colors border-0 outline-none cursor-pointer">
              + Thêm tin
            </button>
          </div>
          <div class="space-y-3" id="quick-announcement-msgs-list">
            ${ab.messages.map((msg, i) => `
              <div class="flex items-center gap-3 bg-white p-3 border border-gray-150 rounded-xl shadow-sm w-full" data-msg-index="${i}">
                <div class="w-6 h-6 flex items-center justify-center bg-zinc-950 text-white rounded-full text-[10px] font-bold shrink-0">
                  ${i + 1}
                </div>
                <div class="flex-1">
                  <input type="text" class="quick-announcement-input w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${msg}" />
                </div>
                <button type="button" class="quick-delete-announcement-msg-btn w-8 h-8 flex items-center justify-center border border-gray-200 hover:border-red-200 hover:bg-red-50 text-red-500 rounded-lg transition-colors shrink-0 cursor-pointer">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                </button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 2. Promo Banner Strip -->
        <div id="quick-sec-promo_banner" class="border border-gray-150 rounded-xl p-4 bg-gray-50/30 space-y-4 scroll-mt-2 transition-all duration-300 shadow-sm">
          <span class="block text-xs font-bold text-gray-900 uppercase tracking-wide border-b pb-2.5 border-gray-150">2. Banner Khuyến Mãi</span>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tiêu đề</label>
              <input type="text" id="quick-promo-title" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${pb.title || ''}" />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Mã Code</label>
              <input type="text" id="quick-promo-code" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${pb.code || ''}" />
            </div>
          </div>
        </div>

        <!-- 3. Category Banners (Sub-banners) -->
        <div id="quick-sec-category_banners" class="border border-gray-150 rounded-xl p-4 bg-gray-50/30 space-y-4 scroll-mt-2 transition-all duration-300 shadow-sm">
          <span class="block text-xs font-bold text-gray-900 uppercase tracking-wide border-b pb-2.5 border-gray-150">3. Danh Mục Nổi Bật / Banner Con</span>
          <div class="space-y-4" id="quick-category-banners-list">
            ${cb.map((cat, i) => {
              const defaultImg = i === 0 ? 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg' :
                                 i === 1 ? 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg' :
                                           'https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg';
              const displayImg = cat.img || defaultImg;
              return `
                <div class="bg-white p-4 border border-gray-150 rounded-xl space-y-4 shadow-sm" data-cat-index="${i}">
                  <div class="text-[10px] font-bold text-[#C9A84C] uppercase tracking-wider">Banner Con #${i + 1}</div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tiêu đề</label>
                      <input type="text" class="quick-cat-title w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${cat.title || ''}" placeholder="Nhập tiêu đề..." />
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Liên kết</label>
                      <input type="text" class="quick-cat-href w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${cat.href || ''}" placeholder="Nhập đường dẫn (ví dụ: /nam)..." />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Mô tả phụ</label>
                    <input type="text" class="quick-cat-subtitle w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${cat.subtitle || ''}" placeholder="Nhập mô tả ngắn..." />
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Hình ảnh banner</label>
                    <div class="flex items-center gap-4 bg-gray-55/15 p-3 border border-gray-150 rounded-xl shadow-inner">
                      <div class="w-16 h-10 border border-gray-150 rounded-lg bg-zinc-950 overflow-hidden relative shrink-0">
                        <img class="quick-cat-image-preview w-full h-full object-cover opacity-60" src="${displayImg}" />
                      </div>
                      <div class="flex-1 space-y-2">
                        <input type="file" class="quick-cat-file-input hidden" accept="image/*" />
                        <button type="button" class="quick-upload-cat-image-btn bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-[10px] px-3 py-1.5 rounded-lg transition-colors border-0 outline-none cursor-pointer">Tải ảnh</button>
                        <input type="text" class="quick-cat-img-url w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${cat.img || ''}" placeholder="Hoặc nhập URL ảnh..." />
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 4. Brand Story -->
        <div id="quick-sec-brand_story" class="border border-gray-150 rounded-xl p-4 bg-gray-50/30 space-y-4 scroll-mt-2 transition-all duration-300 shadow-sm">
          <span class="block text-xs font-bold text-gray-900 uppercase tracking-wide border-b pb-2.5 border-gray-150">4. Câu Chuyện Thương Hiệu</span>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tiêu đề lớn</label>
              <input type="text" id="quick-brandstory-title" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${bs.title || ''}" />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tiêu đề phụ</label>
              <input type="text" id="quick-brandstory-subtitle" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${bs.subtitle || ''}" />
            </div>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Mô tả (Description)</label>
            <textarea id="quick-brandstory-description" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all h-20 resize-none">${bs.description || ''}</textarea>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nút bấm</label>
              <input type="text" id="quick-brandstory-btn-label" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${bs.button_label || ''}" />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Liên kết nút</label>
              <input type="text" id="quick-brandstory-btn-href" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${bs.button_href || ''}" />
            </div>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Hình ảnh giới thiệu</label>
            <div class="flex items-center gap-4 bg-white p-3 border border-gray-150 rounded-xl shadow-sm">
              <div class="w-16 h-10 border border-gray-150 rounded-lg bg-zinc-950 overflow-hidden relative shrink-0">
                <img id="quick-brandstory-image-preview" class="w-full h-full object-cover opacity-60" src="${bs.image_url || ''}" />
              </div>
              <div class="flex-1 space-y-2">
                <input type="file" id="quick-brandstory-file-input" class="hidden" accept="image/*" />
                <button type="button" id="quick-upload-brandstory-img-btn" class="bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-[10px] px-3 py-1.5 rounded-lg transition-colors border-0 outline-none cursor-pointer">Tải ảnh</button>
                <input type="text" id="quick-brandstory-image-url" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${bs.image_url || ''}" placeholder="Hoặc nhập URL ảnh..." />
              </div>
            </div>
          </div>
        </div>

        <!-- 5. Newsletter -->
        <div id="quick-sec-newsletter" class="border border-gray-150 rounded-xl p-4 bg-gray-50/30 space-y-4 scroll-mt-2 transition-all duration-300 shadow-sm">
          <span class="block text-xs font-bold text-gray-900 uppercase tracking-wide border-b pb-2.5 border-gray-150">5. Đăng Ký Bản Tin (Newsletter)</span>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tiêu đề</label>
              <input type="text" id="quick-newsletter-title" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${nl.title || ''}" />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Mô tả</label>
              <input type="text" id="quick-newsletter-description" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${nl.description || ''}" />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nút</label>
              <input type="text" id="quick-newsletter-btn-label" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] focus:border-[#C9A84C] transition-all" value="${nl.button_label || ''}" />
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function bindEvents() {
    // Close / Cancel
    modalEl.querySelector('#close-quick-modal').addEventListener('click', () => restoreInitialColors());
    modalEl.querySelector('#cancel-quick-modal').addEventListener('click', () => restoreInitialColors());

    // Tabs triggers
    modalEl.querySelector('#tab-brand-trigger').addEventListener('click', () => {
      activeTab = 'brand';
      renderModal();
    });
    modalEl.querySelector('#tab-menu-trigger')?.addEventListener('click', () => {
      activeTab = 'menu';
      renderModal();
    });
    modalEl.querySelector('#tab-banner-trigger').addEventListener('click', () => {
      activeTab = 'banner';
      renderModal();
    });
    modalEl.querySelector('#tab-sections-trigger')?.addEventListener('click', () => {
      activeTab = 'sections';
      renderModal();
    });
    modalEl.querySelector('#tab-colors-trigger')?.addEventListener('click', () => {
      activeTab = 'colors';
      renderModal();
    });
    modalEl.querySelector('#tab-footer-trigger')?.addEventListener('click', () => {
      activeTab = 'footer';
      renderModal();
    });
    modalEl.querySelector('#tab-policy-trigger')?.addEventListener('click', () => {
      activeTab = 'policy';
      renderModal();
    });

    // -------------------------------------------------------------
    // BRAND TAB BINDINGS
    // -------------------------------------------------------------
    if (activeTab === 'brand') {
      const brandInput = modalEl.querySelector('#quick-brand-name');
      brandInput.addEventListener('input', (e) => {
        settings.brand_name = e.target.value.trim();
      });

      // Upload logo
      const logoInput = modalEl.querySelector('#quick-logo-input');
      const uploadBtn = modalEl.querySelector('#quick-upload-logo');
      const deleteBtn = modalEl.querySelector('#quick-delete-logo');

      uploadBtn.addEventListener('click', () => logoInput.click());

      logoInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('logo', file);

        uploadBtn.textContent = 'Đang tải...';
        uploadBtn.disabled = true;

        try {
          const res = await fetch(`${API_BASE}/api/admin/settings/upload-logo`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
          });
          const data = await res.json();
          if (res.ok && data.success) {
            settings.logo_url = data.data.url;
            window.APP_SETTINGS.logo_url = data.data.url;
            showToast('Tải lên ảnh logo thành công!', 'success');
            renderModal(); // Re-render inside view
          } else {
            showToast(data.error || 'Lỗi tải ảnh logo.', 'error');
          }
        } catch {
          showToast('Lỗi kết nối khi tải logo.', 'error');
        } finally {
          uploadBtn.textContent = 'Tải ảnh lên';
          uploadBtn.disabled = false;
        }
      });

      // Delete logo
      deleteBtn?.addEventListener('click', async () => {
        if (!confirm('Bạn có chắc muốn xóa ảnh logo thương hiệu?')) return;
        settings.logo_url = '';
        renderModal();
      });
    }

    // -------------------------------------------------------------
    // BANNER TAB BINDINGS
    // -------------------------------------------------------------
    if (activeTab === 'banner') {
      // Move slide up
      modalEl.querySelector('#quick-move-up-slide')?.addEventListener('click', () => {
        if (selectedSlideIndex === 0) return;
        const temp = settings.hero_banners[selectedSlideIndex];
        settings.hero_banners[selectedSlideIndex] = settings.hero_banners[selectedSlideIndex - 1];
        settings.hero_banners[selectedSlideIndex - 1] = temp;
        selectedSlideIndex--;
        showToast('Đã di chuyển slide lên.', 'success');
        renderModal();
      });

      // Move slide down
      modalEl.querySelector('#quick-move-down-slide')?.addEventListener('click', () => {
        if (selectedSlideIndex === settings.hero_banners.length - 1) return;
        const temp = settings.hero_banners[selectedSlideIndex];
        settings.hero_banners[selectedSlideIndex] = settings.hero_banners[selectedSlideIndex + 1];
        settings.hero_banners[selectedSlideIndex + 1] = temp;
        selectedSlideIndex++;
        showToast('Đã di chuyển slide xuống.', 'success');
        renderModal();
      });

      // Add slide
      modalEl.querySelector('#quick-add-slide')?.addEventListener('click', () => {
        settings.hero_banners.push({
          img: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg',
          eyebrow: 'Bộ Sưu Tập Mới',
          title: 'Đỉnh Cao Tinh Xảo',
          subtitle: 'Khám phá ngay các dòng sản phẩm chất lượng nhất.',
          cta: 'Khám Phá',
          ctaHref: '/nam'
        });
        selectedSlideIndex = settings.hero_banners.length - 1;
        showToast('Đã thêm một slide mới ở cuối.', 'success');
        renderModal();
      });

      // Delete slide
      modalEl.querySelector('#quick-delete-slide')?.addEventListener('click', () => {
        if (settings.hero_banners.length <= 1) {
          showToast('Bạn phải giữ lại ít nhất 1 slide banner.', 'warning');
          return;
        }
        if (!confirm(`Bạn có chắc muốn xóa Slide #${selectedSlideIndex + 1}?`)) return;
        settings.hero_banners.splice(selectedSlideIndex, 1);
        selectedSlideIndex = Math.max(0, selectedSlideIndex - 1);
        showToast('Đã xóa slide banner.', 'info');
        renderModal();
      });


      const select = modalEl.querySelector('#quick-slide-select');
      if (select) {
        select.addEventListener('change', (e) => {
          selectedSlideIndex = parseInt(e.target.value, 10);
          renderModal();
        });
      }

      const slide = settings.hero_banners[selectedSlideIndex];

      if (slide) {
        modalEl.querySelector('#quick-slide-eyebrow').addEventListener('input', (e) => {
          slide.eyebrow = e.target.value.trim();
        });
        modalEl.querySelector('#quick-slide-title').addEventListener('input', (e) => {
          slide.title = e.target.value.trim();
        });
        modalEl.querySelector('#quick-slide-subtitle').addEventListener('input', (e) => {
          slide.subtitle = e.target.value.trim();
        });
        modalEl.querySelector('#quick-slide-cta').addEventListener('input', (e) => {
          slide.cta = e.target.value.trim();
        });
        modalEl.querySelector('#quick-slide-ctaHref').addEventListener('input', (e) => {
          slide.ctaHref = e.target.value.trim();
        });
        modalEl.querySelector('#quick-slide-img-url').addEventListener('input', (e) => {
          slide.img = e.target.value.trim();
          modalEl.querySelector('#quick-slide-preview-img').src = e.target.value.trim();
        });

        // Slide image upload
        const slideImgInput = modalEl.querySelector('#quick-slide-image-file');
        const uploadSlideImgBtn = modalEl.querySelector('#quick-upload-slide-img');

        uploadSlideImgBtn.addEventListener('click', () => slideImgInput.click());

        slideImgInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const formData = new FormData();
          formData.append('banner', file);

          uploadSlideImgBtn.textContent = 'Đang tải...';
          uploadSlideImgBtn.disabled = true;

          try {
            const res = await fetch(`${API_BASE}/api/admin/settings/upload-banner`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: formData
            });
            const data = await res.json();
            if (res.ok && data.success) {
              slide.img = data.data.url;
              modalEl.querySelector('#quick-slide-img-url').value = data.data.url;
              modalEl.querySelector('#quick-slide-preview-img').src = data.data.url;
              showToast(`Tải lên ảnh slide #${selectedSlideIndex + 1} thành công!`, 'success');
            } else {
              showToast(data.error || 'Lỗi tải ảnh slide.', 'error');
            }
          } catch {
            showToast('Lỗi kết nối khi tải ảnh slide.', 'error');
          } finally {
            uploadSlideImgBtn.textContent = 'Tải ảnh lên';
            uploadSlideImgBtn.disabled = false;
          }
        });
      }
    }

    // -------------------------------------------------------------
    // QUICK MENU TAB BINDINGS
    // -------------------------------------------------------------
    if (activeTab === 'menu') {
      const menuList = modalEl.querySelector('#quick-menu-items-list');
      
      menuList?.querySelectorAll('[data-item-index]').forEach(itemRow => {
        const itemIdx = parseInt(itemRow.dataset.itemIndex, 10);
        const item = settings.navigation_menu[itemIdx];

        itemRow.querySelector('.quick-menu-label')?.addEventListener('input', (e) => {
          item.label = e.target.value.trim();
        });
        itemRow.querySelector('.quick-menu-href')?.addEventListener('input', (e) => {
          item.href = e.target.value.trim();
        });
        itemRow.querySelector('.quick-menu-badge')?.addEventListener('input', (e) => {
          const val = e.target.value.trim();
          if (val) item.badge = val; else delete item.badge;
        });

        // Add child menu
        itemRow.querySelector('.quick-add-child-menu-btn')?.addEventListener('click', () => {
          if (!item.children) item.children = [];
          item.children.push({ label: 'Menu Con Mới', href: '#' });
          showToast('Đã thêm một menu con.', 'success');
          renderModal();
        });

        // Delete main menu
        itemRow.querySelector('.quick-delete-menu-btn')?.addEventListener('click', () => {
          if (confirm('Xóa menu này sẽ xóa cả menu con?')) {
            settings.navigation_menu.splice(itemIdx, 1);
            showToast('Đã xóa menu chính.', 'info');
            renderModal();
          }
        });

        // Move main menu up
        itemRow.querySelector('.quick-move-up-menu-btn')?.addEventListener('click', () => {
          if (itemIdx === 0) return;
          const temp = settings.navigation_menu[itemIdx];
          settings.navigation_menu[itemIdx] = settings.navigation_menu[itemIdx - 1];
          settings.navigation_menu[itemIdx - 1] = temp;
          renderModal();
        });

        // Move main menu down
        itemRow.querySelector('.quick-move-down-menu-btn')?.addEventListener('click', () => {
          if (itemIdx === settings.navigation_menu.length - 1) return;
          const temp = settings.navigation_menu[itemIdx];
          settings.navigation_menu[itemIdx] = settings.navigation_menu[itemIdx + 1];
          settings.navigation_menu[itemIdx + 1] = temp;
          renderModal();
        });

        // Child menu bindings
        itemRow.querySelectorAll('[data-child-index]').forEach(childRow => {
          const childIdx = parseInt(childRow.dataset.childIndex, 10);
          const child = item.children[childIdx];

          childRow.querySelector('.quick-child-label')?.addEventListener('input', (e) => {
            child.label = e.target.value.trim();
          });
          childRow.querySelector('.quick-child-href')?.addEventListener('input', (e) => {
            child.href = e.target.value.trim();
          });

          // Move child up
          childRow.querySelector('.quick-move-up-child-btn')?.addEventListener('click', () => {
            if (childIdx === 0) return;
            const temp = item.children[childIdx];
            item.children[childIdx] = item.children[childIdx - 1];
            item.children[childIdx - 1] = temp;
            renderModal();
          });

          // Move child down
          childRow.querySelector('.quick-move-down-child-btn')?.addEventListener('click', () => {
            if (childIdx === item.children.length - 1) return;
            const temp = item.children[childIdx];
            item.children[childIdx] = item.children[childIdx + 1];
            item.children[childIdx + 1] = temp;
            renderModal();
          });

          // Delete child
          childRow.querySelector('.quick-delete-child-btn')?.addEventListener('click', () => {
            item.children.splice(childIdx, 1);
            showToast('Đã xóa menu con.', 'info');
            renderModal();
          });
        });
      });

      // Add main menu item
      modalEl.querySelector('#quick-add-menu-item')?.addEventListener('click', () => {
        settings.navigation_menu.push({ label: 'Menu Mới', href: '#', children: [] });
        showToast('Đã thêm một menu chính.', 'success');
        renderModal();
      });

      // Bind brand menu events for Nam
      const quickBrandsNamList = modalEl.querySelector('#quick-menu-brands-nam-list');
      quickBrandsNamList?.querySelectorAll('[data-brand-nam-index]').forEach(brandRow => {
        const brandIdx = parseInt(brandRow.dataset.brandNamIndex, 10);
        const brand = settings.menu_brands_nam[brandIdx];

        brandRow.querySelector('.quick-brand-nam-label')?.addEventListener('input', (e) => {
          brand.label = e.target.value.trim();
        });
        brandRow.querySelector('.quick-brand-nam-key')?.addEventListener('input', (e) => {
          brand.brand_key = e.target.value.trim();
        });
        brandRow.querySelector('.quick-brand-nam-icon')?.addEventListener('change', (e) => {
          brand.icon_type = e.target.value;
        });

        brandRow.querySelector('.quick-move-up-brand-nam-btn')?.addEventListener('click', () => {
          if (brandIdx === 0) return;
          const temp = settings.menu_brands_nam[brandIdx];
          settings.menu_brands_nam[brandIdx] = settings.menu_brands_nam[brandIdx - 1];
          settings.menu_brands_nam[brandIdx - 1] = temp;
          renderModal();
        });

        brandRow.querySelector('.quick-move-down-brand-nam-btn')?.addEventListener('click', () => {
          if (brandIdx === settings.menu_brands_nam.length - 1) return;
          const temp = settings.menu_brands_nam[brandIdx];
          settings.menu_brands_nam[brandIdx] = settings.menu_brands_nam[brandIdx + 1];
          settings.menu_brands_nam[brandIdx + 1] = temp;
          renderModal();
        });

        brandRow.querySelector('.quick-delete-brand-nam-btn')?.addEventListener('click', () => {
          if (confirm(`Xóa thương hiệu "${brand.label}" khỏi menu Nam?`)) {
            settings.menu_brands_nam.splice(brandIdx, 1);
            showToast('Đã xóa thương hiệu.', 'info');
            renderModal();
          }
        });
      });

      modalEl.querySelector('#quick-add-menu-brand-nam')?.addEventListener('click', () => {
        if (!settings.menu_brands_nam) settings.menu_brands_nam = [];
        settings.menu_brands_nam.push({ label: 'Thương Hiệu Mới', brand_key: 'new-brand', icon_type: 'star' });
        showToast('Đã thêm thương hiệu mới cho Nam.', 'success');
        renderModal();
      });

      // Bind brand menu events for Nữ
      const quickBrandsNuList = modalEl.querySelector('#quick-menu-brands-nu-list');
      quickBrandsNuList?.querySelectorAll('[data-brand-nu-index]').forEach(brandRow => {
        const brandIdx = parseInt(brandRow.dataset.brandNuIndex, 10);
        const brand = settings.menu_brands_nu[brandIdx];

        brandRow.querySelector('.quick-brand-nu-label')?.addEventListener('input', (e) => {
          brand.label = e.target.value.trim();
        });
        brandRow.querySelector('.quick-brand-nu-key')?.addEventListener('input', (e) => {
          brand.brand_key = e.target.value.trim();
        });
        brandRow.querySelector('.quick-brand-nu-icon')?.addEventListener('change', (e) => {
          brand.icon_type = e.target.value;
        });

        brandRow.querySelector('.quick-move-up-brand-nu-btn')?.addEventListener('click', () => {
          if (brandIdx === 0) return;
          const temp = settings.menu_brands_nu[brandIdx];
          settings.menu_brands_nu[brandIdx] = settings.menu_brands_nu[brandIdx - 1];
          settings.menu_brands_nu[brandIdx - 1] = temp;
          renderModal();
        });

        brandRow.querySelector('.quick-move-down-brand-nu-btn')?.addEventListener('click', () => {
          if (brandIdx === settings.menu_brands_nu.length - 1) return;
          const temp = settings.menu_brands_nu[brandIdx];
          settings.menu_brands_nu[brandIdx] = settings.menu_brands_nu[brandIdx + 1];
          settings.menu_brands_nu[brandIdx + 1] = temp;
          renderModal();
        });

        brandRow.querySelector('.quick-delete-brand-nu-btn')?.addEventListener('click', () => {
          if (confirm(`Xóa thương hiệu "${brand.label}" khỏi menu Nữ?`)) {
            settings.menu_brands_nu.splice(brandIdx, 1);
            showToast('Đã xóa thương hiệu.', 'info');
            renderModal();
          }
        });
      });

      modalEl.querySelector('#quick-add-menu-brand-nu')?.addEventListener('click', () => {
        if (!settings.menu_brands_nu) settings.menu_brands_nu = [];
        settings.menu_brands_nu.push({ label: 'Thương Hiệu Mới', brand_key: 'new-brand', icon_type: 'star' });
        showToast('Đã thêm thương hiệu mới cho Nữ.', 'success');
        renderModal();
      });
    }

    // -------------------------------------------------------------
    // QUICK SECTIONS TAB BINDINGS
    // -------------------------------------------------------------
    if (activeTab === 'sections') {
      const sec = settings.home_sections;

      // 1. Announcement Bar
      const abMsgsList = modalEl.querySelector('#quick-announcement-msgs-list');
      abMsgsList?.querySelectorAll('[data-msg-index]').forEach(msgRow => {
        const idx = parseInt(msgRow.dataset.msgIndex, 10);
        msgRow.querySelector('.quick-announcement-input').addEventListener('input', (e) => {
          sec.announcement_bar.messages[idx] = e.target.value.trim();
        });
        msgRow.querySelector('.quick-delete-announcement-msg-btn').addEventListener('click', () => {
          sec.announcement_bar.messages.splice(idx, 1);
          showToast('Đã xóa dòng thông báo.', 'info');
          renderModal();
        });
      });

      modalEl.querySelector('#quick-add-announcement-msg')?.addEventListener('click', () => {
        sec.announcement_bar.messages.push('Thông báo mới');
        showToast('Đã thêm thông báo.', 'success');
        renderModal();
      });

      // 2. Promo Banner
      modalEl.querySelector('#quick-promo-title')?.addEventListener('input', (e) => {
        sec.promo_banner.title = e.target.value.trim();
      });
      modalEl.querySelector('#quick-promo-code')?.addEventListener('input', (e) => {
        sec.promo_banner.code = e.target.value.trim();
      });

      // 3. Category Banners
      const cbList = modalEl.querySelector('#quick-category-banners-list');
      cbList?.querySelectorAll('[data-cat-index]').forEach(catRow => {
        const index = parseInt(catRow.dataset.catIndex, 10);
        
        catRow.querySelector('.quick-cat-title').addEventListener('input', (e) => {
          sec.category_banners[index].title = e.target.value.trim();
        });
        catRow.querySelector('.quick-cat-subtitle').addEventListener('input', (e) => {
          sec.category_banners[index].subtitle = e.target.value.trim();
        });
        catRow.querySelector('.quick-cat-href').addEventListener('input', (e) => {
          sec.category_banners[index].href = e.target.value.trim();
        });
        catRow.querySelector('.quick-cat-img-url').addEventListener('input', (e) => {
          const url = e.target.value.trim();
          sec.category_banners[index].img = url;
          catRow.querySelector('.quick-cat-image-preview').src = url || (index === 0 ? 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg' : index === 1 ? 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg' : 'https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg');
        });

        // Image upload
        const fileInput = catRow.querySelector('.quick-cat-file-input');
        const uploadBtn = catRow.querySelector('.quick-upload-cat-image-btn');
        uploadBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const formData = new FormData();
          formData.append('banner', file);

          uploadBtn.textContent = 'Đang tải...';
          uploadBtn.disabled = true;

          try {
            const res = await fetch(`${API_BASE}/api/admin/settings/upload-banner`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: formData
            });
            const data = await res.json();
            if (res.ok && data.success) {
              const url = data.data.url;
              sec.category_banners[index].img = url;
              catRow.querySelector('.quick-cat-img-url').value = url;
              catRow.querySelector('.quick-cat-image-preview').src = url;
              showToast(`Tải lên ảnh banner con #${index + 1} thành công!`, 'success');
            } else {
              showToast(data.error || 'Lỗi tải ảnh.', 'error');
            }
          } catch {
            showToast('Lỗi kết nối khi tải ảnh.', 'error');
          } finally {
            uploadBtn.textContent = 'Tải ảnh';
            uploadBtn.disabled = false;
          }
        });
      });

      // 4. Brand Story
      modalEl.querySelector('#quick-brandstory-title')?.addEventListener('input', (e) => {
        sec.brand_story.title = e.target.value.trim();
      });
      modalEl.querySelector('#quick-brandstory-subtitle')?.addEventListener('input', (e) => {
        sec.brand_story.subtitle = e.target.value.trim();
      });
      modalEl.querySelector('#quick-brandstory-description')?.addEventListener('input', (e) => {
        sec.brand_story.description = e.target.value.trim();
      });
      modalEl.querySelector('#quick-brandstory-btn-label')?.addEventListener('input', (e) => {
        sec.brand_story.button_label = e.target.value.trim();
      });
      modalEl.querySelector('#quick-brandstory-btn-href')?.addEventListener('input', (e) => {
        sec.brand_story.button_href = e.target.value.trim();
      });
      modalEl.querySelector('#quick-brandstory-image-url')?.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        sec.brand_story.image_url = url;
        const imgPrev = modalEl.querySelector('#quick-brandstory-image-preview');
        if (imgPrev) imgPrev.src = url;
      });

      const bsFileInput = modalEl.querySelector('#quick-brandstory-file-input');
      const bsUploadBtn = modalEl.querySelector('#quick-upload-brandstory-img-btn');
      bsUploadBtn?.addEventListener('click', () => bsFileInput.click());

      bsFileInput?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('banner', file);

        bsUploadBtn.textContent = 'Đang tải...';
        bsUploadBtn.disabled = true;

        try {
          const res = await fetch(`${API_BASE}/api/admin/settings/upload-banner`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
          });
          const data = await res.json();
          if (res.ok && data.success) {
            const url = data.data.url;
            sec.brand_story.image_url = url;
            modalEl.querySelector('#quick-brandstory-image-url').value = url;
            modalEl.querySelector('#quick-brandstory-image-preview').src = url;
            showToast('Tải ảnh giới thiệu thương hiệu thành công!', 'success');
          } else {
            showToast(data.error || 'Lỗi tải ảnh.', 'error');
          }
        } catch {
          showToast('Lỗi kết nối khi tải ảnh.', 'error');
        } finally {
          bsUploadBtn.textContent = 'Tải ảnh';
          bsUploadBtn.disabled = false;
        }
      });

      // 5. Newsletter
      modalEl.querySelector('#quick-newsletter-title')?.addEventListener('input', (e) => {
        sec.newsletter.title = e.target.value.trim();
      });
      modalEl.querySelector('#quick-newsletter-description')?.addEventListener('input', (e) => {
        sec.newsletter.description = e.target.value.trim();
      });
      modalEl.querySelector('#quick-newsletter-btn-label')?.addEventListener('input', (e) => {
        sec.newsletter.button_label = e.target.value.trim();
      });
    }

    if (activeTab === 'colors') {
      const pickers = modalEl.querySelectorAll('.quick-color-input');
      pickers.forEach(picker => {
        picker.addEventListener('input', (e) => {
          const key = e.target.dataset.colorKey;
          const val = e.target.value;
          
          if (!settings.theme_colors) settings.theme_colors = {};
          settings.theme_colors[key] = val;
          
          // Update Hex label next to color picker
          picker.nextElementSibling.querySelector('span:last-child').textContent = val.toUpperCase();
          
          // Update real page CSS root variable immediately
          document.documentElement.style.setProperty(`--color-${key}`, val);
        });
      });

      // Quick Reset colors
      modalEl.querySelector('#quick-reset-colors')?.addEventListener('click', () => {
        if (!confirm('Khôi phục toàn bộ bảng màu gốc của trang web?')) return;
        settings.theme_colors = { ...defaultColors };
        
        // Apply default colors immediately to root page
        Object.entries(defaultColors).forEach(([key, val]) => {
          document.documentElement.style.setProperty(`--color-${key}`, val);
        });
        
        renderModal();
      });
    }

    if (activeTab === 'footer') {
      if (!settings.footer_settings) {
        settings.footer_settings = {};
      }
      const bindFooterField = (id, key) => {
        modalEl.querySelector(`#${id}`)?.addEventListener('input', (e) => {
          settings.footer_settings[key] = e.target.value.trim();
        });
      };
      bindFooterField('quick-footer-hotline', 'hotline');
      bindFooterField('quick-footer-email', 'email');
      bindFooterField('quick-footer-address', 'address');
      bindFooterField('quick-footer-facebook', 'social_facebook');
      bindFooterField('quick-footer-instagram', 'social_instagram');
      bindFooterField('quick-footer-tiktok', 'social_tiktok');
      bindFooterField('quick-footer-youtube', 'social_youtube');

      const bindLinksEvents = (key) => {
        const list = settings.footer_settings[key + '_links'] || [];
        const wrapEl = modalEl.querySelector(`#quick-links-${key}-list`);
        
        wrapEl?.querySelectorAll(`[data-${key}-index]`).forEach(row => {
          const idx = parseInt(row.getAttribute(`data-${key}-index`), 10);
          const item = list[idx];
          if (!item) return;

          row.querySelector(`.quick-link-label-${key}`)?.addEventListener('input', (e) => {
            item.label = e.target.value.trim();
          });
          row.querySelector(`.quick-link-href-${key}`)?.addEventListener('input', (e) => {
            item.href = e.target.value.trim();
          });

          row.querySelector(`.quick-move-up-link-${key}-btn`)?.addEventListener('click', () => {
            if (idx === 0) return;
            const temp = list[idx];
            list[idx] = list[idx - 1];
            list[idx - 1] = temp;
            renderModal();
          });

          row.querySelector(`.quick-move-down-link-${key}-btn`)?.addEventListener('click', () => {
            if (idx === list.length - 1) return;
            const temp = list[idx];
            list[idx] = list[idx + 1];
            list[idx + 1] = temp;
            renderModal();
          });

          row.querySelector(`.quick-delete-link-${key}-btn`)?.addEventListener('click', () => {
            if (confirm(`Bạn có chắc muốn xóa liên kết "${item.label || ''}"?`)) {
              list.splice(idx, 1);
              showToast('Đã xóa liên kết.', 'info');
              renderModal();
            }
          });
        });

        modalEl.querySelector(`#quick-add-link-${key}`)?.addEventListener('click', () => {
          list.push({ label: 'Liên kết mới', href: '#' });
          showToast('Đã thêm một liên kết.', 'success');
          renderModal();
        });
      };

      bindLinksEvents('shop');
      bindLinksEvents('service');
      bindLinksEvents('about');
    }


    // -------------------------------------------------------------
    // POLICY TAB BINDINGS
    // -------------------------------------------------------------
    if (activeTab === 'policy') {
      if (!settings.trust_badges || settings.trust_badges.length === 0) {
        settings.trust_badges = JSON.parse(JSON.stringify(DEFAULT_TRUST_BADGES));
      }

      modalEl.querySelector('#quick-policy-add-badge')?.addEventListener('click', () => {
        settings.trust_badges.push({
          icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
          title: 'Chính Sách Mới',
          subtitle: 'Mô tả ngắn',
        });
        showToast('Đã thêm badge mới.', 'success');
        renderModal();
      });

      modalEl.querySelectorAll('[data-policy-badge-index]').forEach(row => {
        const idx = parseInt(row.dataset.policyBadgeIndex, 10);
        const badge = settings.trust_badges[idx];

        row.querySelector('.quick-policy-title')?.addEventListener('input', (e) => {
          badge.title = e.target.value;
        });
        row.querySelector('.quick-policy-subtitle')?.addEventListener('input', (e) => {
          badge.subtitle = e.target.value;
        });
        row.querySelector('.quick-policy-icon')?.addEventListener('input', (e) => {
          const raw = e.target.value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
          badge.icon = raw;
          const preview = row.querySelector('.quick-policy-icon-preview');
          if (preview) preview.innerHTML = raw;
        });
        row.querySelector('.quick-policy-move-up')?.addEventListener('click', () => {
          if (idx === 0) return;
          [settings.trust_badges[idx], settings.trust_badges[idx - 1]] = [settings.trust_badges[idx - 1], settings.trust_badges[idx]];
          renderModal();
        });
        row.querySelector('.quick-policy-move-down')?.addEventListener('click', () => {
          if (idx === settings.trust_badges.length - 1) return;
          [settings.trust_badges[idx], settings.trust_badges[idx + 1]] = [settings.trust_badges[idx + 1], settings.trust_badges[idx]];
          renderModal();
        });
        row.querySelector('.quick-policy-delete')?.addEventListener('click', () => {
          if (!confirm(`Xóa badge "${badge.title}"?`)) return;
          settings.trust_badges.splice(idx, 1);
          showToast('Đã xóa badge.', 'info');
          renderModal();
        });
      });
    }

    // -------------------------------------------------------------
    // SAVE ALL BINDINGS
    // -------------------------------------------------------------
    modalEl.querySelector('#save-quick-modal').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.innerHTML = `<div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Đang lưu...`;

      try {
        const res = await fetch(`${API_BASE}/api/admin/settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(settings)
        });
        const json = await res.json();
        if (res.ok && json.success) {
          showToast('Đã lưu cấu hình thay đổi thành công!', 'success');
          window.APP_SETTINGS = settings;
          document.body.style.overflow = '';
          modalEl.remove();

          
          // Force reload page to apply brand names and colors globally
          setTimeout(() => {
            window.location.reload();
          }, 400);
        } else {
          showToast(json.error || 'Có lỗi khi lưu thay đổi.', 'error');
          btn.disabled = false;
          btn.innerHTML = `Lưu thay đổi`;
        }
      } catch {
        showToast('Lỗi kết nối máy chủ API.', 'error');
        btn.disabled = false;
        btn.innerHTML = `Lưu thay đổi`;
      }
    });
  }
}

