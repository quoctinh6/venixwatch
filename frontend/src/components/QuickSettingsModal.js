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
      <div class="bg-white border border-gray-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans max-h-[90vh]" data-lenis-prevent>
        <!-- Header -->
        <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div class="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wide">Chỉnh Sửa Nhanh Giao Diện</h3>
          </div>
          <button id="close-quick-modal" class="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="px-5 pt-3 flex items-end border-b border-gray-100 gap-3.5 text-xs font-bold text-gray-400 overflow-x-auto whitespace-nowrap scrollbar-none">
          <button id="tab-brand-trigger" class="relative pb-2.5 transition-all shrink-0 whitespace-nowrap outline-none bg-transparent border-0 cursor-pointer ${activeTab === 'brand' ? 'text-[#C9A84C]' : 'text-gray-400 hover:text-gray-700'}">
            Thương hiệu & Logo
            ${activeTab === 'brand' ? '<span class="absolute bottom-[3px] left-0 right-0 h-[2px] bg-[#C9A84C]"></span>' : ''}
          </button>
          <button id="tab-menu-trigger" class="relative pb-2.5 transition-all shrink-0 whitespace-nowrap outline-none bg-transparent border-0 cursor-pointer ${activeTab === 'menu' ? 'text-[#C9A84C]' : 'text-gray-400 hover:text-gray-700'}">
            Menu
            ${activeTab === 'menu' ? '<span class="absolute bottom-[3px] left-0 right-0 h-[2px] bg-[#C9A84C]"></span>' : ''}
          </button>
          <button id="tab-banner-trigger" class="relative pb-2.5 transition-all shrink-0 whitespace-nowrap outline-none bg-transparent border-0 cursor-pointer ${activeTab === 'banner' ? 'text-[#C9A84C]' : 'text-gray-400 hover:text-gray-700'}">
            Banner
            ${activeTab === 'banner' ? '<span class="absolute bottom-[3px] left-0 right-0 h-[2px] bg-[#C9A84C]"></span>' : ''}
          </button>
          <button id="tab-sections-trigger" class="relative pb-2.5 transition-all shrink-0 whitespace-nowrap outline-none bg-transparent border-0 cursor-pointer ${activeTab === 'sections' ? 'text-[#C9A84C]' : 'text-gray-400 hover:text-gray-700'}">
            Section Trang Chủ
            ${activeTab === 'sections' ? '<span class="absolute bottom-[3px] left-0 right-0 h-[2px] bg-[#C9A84C]"></span>' : ''}
          </button>
          <button id="tab-colors-trigger" class="relative pb-2.5 transition-all shrink-0 whitespace-nowrap outline-none bg-transparent border-0 cursor-pointer ${activeTab === 'colors' ? 'text-[#C9A84C]' : 'text-gray-400 hover:text-gray-700'}">
            Màu Sắc
            ${activeTab === 'colors' ? '<span class="absolute bottom-[3px] left-0 right-0 h-[2px] bg-[#C9A84C]"></span>' : ''}
          </button>
        </div>

        <!-- Body Form -->
        <div id="quick-modal-body" class="p-6 flex-1 overflow-y-auto space-y-5 text-xs text-gray-700 relative">
          ${activeTab === 'brand' ? renderBrandForm() 
            : activeTab === 'menu' ? renderMenuForm() 
            : activeTab === 'banner' ? renderBannerForm() 
            : activeTab === 'sections' ? renderSectionsForm() 
            : renderColorsForm()}
        </div>

        <!-- Footer Actions -->
        <div class="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
          <button id="cancel-quick-modal" class="border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold px-4 py-2 rounded-lg transition-colors">Hủy</button>
          <button id="save-quick-modal" class="bg-[#C9A84C] hover:bg-[#b8963e] text-white font-semibold px-5 py-2 rounded-lg shadow-md transition-colors flex items-center gap-1.5">
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
          <button type="button" id="quick-reset-colors" class="text-[#C9A84C] hover:underline cursor-pointer font-bold">Khôi phục gốc</button>
        </div>
        <div class="grid grid-cols-1 gap-2.5">

          ${colorFields.map(field => `
            <div class="flex items-center gap-3.5 bg-gray-50 border border-gray-100 rounded-xl p-2.5 hover:bg-gray-100/50 transition-colors">
              <input type="color" data-color-key="${field.key}" value="${colors[field.key] || defaultColors[field.key]}" 
                class="quick-color-input w-11 h-9 border-0 rounded-lg cursor-pointer bg-transparent focus:outline-none" />
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold text-gray-800">${field.label}</span>
                  <span class="text-[9px] font-mono text-gray-400 uppercase font-bold tracking-wider">${colors[field.key] || defaultColors[field.key]}</span>
                </div>
                <p class="text-[10px] text-gray-500 mt-0.5 leading-tight">${field.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderBrandForm() {
    return `
      <div class="space-y-4">
        <div>
          <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tên thương hiệu</label>
          <input type="text" id="quick-brand-name" value="${settings.brand_name}" 
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C]" />
        </div>
        <div>
          <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Ảnh logo thương hiệu</label>
          <div class="flex items-center gap-4">
            <div id="quick-logo-preview" class="w-16 h-16 border border-gray-200 rounded-xl ${settings.logo_url ? 'bg-zinc-950 p-2' : 'bg-gray-50'} flex items-center justify-center overflow-hidden">
              ${settings.logo_url 
                ? `<img src="${settings.logo_url}" class="max-h-full max-w-full object-contain" />` 
                : `<span class="text-[10px] text-gray-400">Default Logo</span>`
              }
            </div>
            <div class="flex-1 space-y-2">
              <input type="file" id="quick-logo-input" accept="image/*" class="hidden" />
              <div class="flex gap-2">
                <button id="quick-upload-logo" class="bg-zinc-950 hover:bg-zinc-800 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors">Tải ảnh lên</button>
                ${settings.logo_url ? `<button id="quick-delete-logo" class="border border-red-200 hover:bg-red-50 text-red-600 font-semibold px-3 py-1.5 rounded-lg transition-colors">Xóa logo</button>` : ''}
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
        <div class="space-y-4">
          <div class="text-center py-6 text-gray-400">Không có dữ liệu banner để chỉnh sửa.</div>
          <div class="flex justify-center">
            <button id="quick-add-slide" class="bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Thêm Slide Mới
            </button>
          </div>
        </div>
      `;
    }

    const slide = banners[selectedSlideIndex] || banners[0];

    return `
      <div class="space-y-4">
        <!-- Slide selector & Actions -->
        <div class="flex items-end gap-3">
          <div class="flex-1">
            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Chọn Slide Banner cần sửa</label>
            <select id="quick-slide-select" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C] font-semibold text-gray-700 bg-white">
              ${banners.map((_, i) => `
                <option value="${i}" ${i === selectedSlideIndex ? 'selected' : ''}>Slide Banner #${i + 1} (${banners[i].title || 'Chưa có tiêu đề'})</option>
              `).join('')}
            </select>
          </div>
          <div class="flex gap-1.5">
            <button id="quick-move-up-slide" class="border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold h-10 w-9 rounded-lg transition-colors flex items-center justify-center cursor-pointer ${selectedSlideIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''}" title="Di chuyển lên" ${selectedSlideIndex === 0 ? 'disabled' : ''}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <button id="quick-move-down-slide" class="border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold h-10 w-9 rounded-lg transition-colors flex items-center justify-center cursor-pointer ${selectedSlideIndex === banners.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}" title="Di chuyển xuống" ${selectedSlideIndex === banners.length - 1 ? 'disabled' : ''}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <button id="quick-add-slide" class="bg-zinc-950 hover:bg-zinc-800 text-white font-semibold h-10 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 text-[11px] uppercase tracking-wider cursor-pointer" title="Thêm slide mới">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Thêm
            </button>
            <button id="quick-delete-slide" class="border border-red-200 hover:bg-red-50 text-red-600 font-semibold h-10 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 text-[11px] uppercase tracking-wider cursor-pointer" title="Xóa slide hiện tại">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Xóa
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 border-t">
          <div>
            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Dòng phụ trên (Eyebrow)</label>
            <input type="text" id="quick-slide-eyebrow" value="${slide.eyebrow || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none" />
          </div>
          <div>
            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tiêu đề lớn (Title)</label>
            <input type="text" id="quick-slide-title" value="${slide.title || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mô tả phụ (Subtitle)</label>
            <textarea id="quick-slide-subtitle" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none h-16 resize-none">${slide.subtitle || ''}</textarea>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Chữ nút bấm (CTA)</label>
            <input type="text" id="quick-slide-cta" value="${slide.cta || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none" />
          </div>
          <div>
            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Liên kết nút (CTA Link)</label>
            <input type="text" id="quick-slide-ctaHref" value="${slide.ctaHref || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Hình ảnh nền banner</label>
            <div class="flex items-center gap-3">
              <div class="w-20 h-12 border rounded-lg bg-zinc-950 overflow-hidden relative">
                <img id="quick-slide-preview-img" src="${slide.img || ''}" class="w-full h-full object-cover opacity-70" />
              </div>
              <div class="flex-1 space-y-1.5">
                <input type="file" id="quick-slide-image-file" accept="image/*" class="hidden" />
                <button id="quick-upload-slide-img" class="bg-zinc-950 hover:bg-zinc-800 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors">Tải ảnh lên</button>
                <input type="text" id="quick-slide-img-url" value="${slide.img || ''}" class="w-full px-2 py-1 border border-gray-200 rounded text-[10px] text-gray-500 focus:outline-none mt-1" />
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
      <div class="space-y-4">
        <div class="flex items-center justify-between border-b pb-2.5">
          <h4 class="text-xs font-bold text-gray-900 uppercase">Cấu hình Menu chính</h4>
          <button type="button" id="quick-add-menu-item" class="bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-[10px] px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1">
            + Thêm Menu
          </button>
        </div>
        <div class="space-y-4" id="quick-menu-items-list">
          ${settings.navigation_menu.length === 0 
            ? `<div class="text-center py-6 text-gray-400">Chưa có menu nào.</div>` 
            : settings.navigation_menu.map((item, i) => `
              <div class="border border-gray-100 rounded-xl p-3 bg-gray-50/50 space-y-3 relative" data-item-index="${i}">
                <div class="flex flex-wrap items-center gap-2.5 bg-white p-2.5 border border-gray-100 rounded-lg shadow-sm">
                  <div class="w-5 h-5 flex items-center justify-center bg-zinc-950 text-white rounded-full text-[9px] font-bold">
                    ${i + 1}
                  </div>
                  <div class="flex-1 min-w-[100px]">
                    <input type="text" class="quick-menu-label w-full px-2 py-1 border border-gray-300 rounded text-[11px] focus:outline-none" value="${item.label || ''}" placeholder="Tên menu" />
                  </div>
                  <div class="flex-[1.5] min-w-[120px]">
                    <input type="text" class="quick-menu-href w-full px-2 py-1 border border-gray-300 rounded text-[11px] focus:outline-none" value="${item.href || ''}" placeholder="Liên kết" />
                  </div>
                  <div class="w-16">
                    <input type="text" class="quick-menu-badge w-full px-2 py-1 border border-gray-300 rounded text-[11px] focus:outline-none" value="${item.badge || ''}" placeholder="Badge" />
                  </div>
                  <div class="flex items-center gap-1">
                    <button type="button" class="quick-move-up-menu-btn p-1 border border-gray-200 hover:bg-gray-50 rounded ${i === 0 ? 'opacity-30 cursor-not-allowed' : ''}" ${i === 0 ? 'disabled' : ''}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
                    </button>
                    <button type="button" class="quick-move-down-menu-btn p-1 border border-gray-200 hover:bg-gray-50 rounded ${i === settings.navigation_menu.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}" ${i === settings.navigation_menu.length - 1 ? 'disabled' : ''}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <button type="button" class="quick-add-child-menu-btn px-2 py-1 border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C]/5 text-[10px] font-semibold rounded">
                      + Con
                    </button>
                    <button type="button" class="quick-delete-menu-btn p-1 border border-red-50 hover:bg-red-50 text-red-500 rounded">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                    </button>
                  </div>
                </div>
                <!-- Submenu -->
                <div class="pl-6 border-l border-gray-200/80 ml-2.5 space-y-1.5">
                  ${(item.children || []).map((child, j) => `
                    <div class="flex items-center gap-2 bg-white p-1.5 border border-gray-100 rounded shadow-sm" data-child-index="${j}">
                      <div class="flex-1">
                        <input type="text" class="quick-child-label w-full px-1.5 py-0.5 border border-gray-200 rounded text-[10px] focus:outline-none" value="${child.label || ''}" placeholder="Tên con" />
                      </div>
                      <div class="flex-[1.5]">
                        <input type="text" class="quick-child-href w-full px-1.5 py-0.5 border border-gray-200 rounded text-[10px] focus:outline-none" value="${child.href || ''}" placeholder="Liên kết" />
                      </div>
                      <div class="flex items-center gap-1">
                        <button type="button" class="quick-move-up-child-btn p-0.5 border border-gray-200 rounded ${j === 0 ? 'opacity-30' : ''}" ${j === 0 ? 'disabled' : ''}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
                        </button>
                        <button type="button" class="quick-move-down-child-btn p-0.5 border border-gray-200 rounded ${j === item.children.length - 1 ? 'opacity-30' : ''}" ${j === item.children.length - 1 ? 'disabled' : ''}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        <button type="button" class="quick-delete-child-btn p-0.5 border border-red-50 text-red-500 rounded">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                        </button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
        </div>

        <hr class="border-gray-200 my-4" />

        <!-- Nam Brands -->
        <div class="border border-gray-150 rounded-xl p-3 bg-gray-50/30 space-y-3">
          <div class="flex items-center justify-between border-b pb-2">
            <h4 class="text-[11px] font-bold text-gray-900 uppercase">Thương hiệu Mega Menu Nam</h4>
            <button type="button" id="quick-add-menu-brand-nam" class="bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-[9px] px-2 py-1 rounded transition-colors flex items-center gap-1">
              + Thêm
            </button>
          </div>
          <div class="space-y-2.5" id="quick-menu-brands-nam-list">
            ${settings.menu_brands_nam.length === 0 
              ? `<div class="text-center py-4 text-gray-400 text-[10px]">Chưa cấu hình thương hiệu nào cho Nam.</div>`
              : settings.menu_brands_nam.map((brand, i) => `
                <div class="flex flex-wrap items-center gap-2 bg-white p-2 border border-gray-100 rounded shadow-sm" data-brand-nam-index="${i}">
                  <div class="w-4 h-4 flex items-center justify-center bg-[#C9A84C] text-white rounded-full text-[8px] font-bold">
                    ${i + 1}
                  </div>
                  <div class="flex-1 min-w-[90px]">
                    <input type="text" class="quick-brand-nam-label w-full px-1.5 py-0.5 border border-gray-200 rounded text-[10px] focus:outline-none" value="${brand.label || ''}" placeholder="Tên" />
                  </div>
                  <div class="flex-1 min-w-[70px]">
                    <input type="text" class="quick-brand-nam-key w-full px-1.5 py-0.5 border border-gray-200 rounded text-[10px] focus:outline-none" value="${brand.brand_key || ''}" placeholder="Mã" />
                  </div>
                  <div class="w-20">
                    <select class="quick-brand-nam-icon w-full px-1 py-0.5 border border-gray-200 rounded text-[10px] bg-white focus:outline-none">
                      <option value="star" ${brand.icon_type === 'star' ? 'selected' : ''}>Star</option>
                      <option value="polygon" ${brand.icon_type === 'polygon' ? 'selected' : ''}>Badge</option>
                      <option value="rect" ${brand.icon_type === 'rect' ? 'selected' : ''}>Watch</option>
                    </select>
                  </div>
                  <div class="flex items-center gap-0.5">
                    <button type="button" class="quick-move-up-brand-nam-btn p-0.5 border border-gray-200 rounded ${i === 0 ? 'opacity-30' : ''}" ${i === 0 ? 'disabled' : ''}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                    </button>
                    <button type="button" class="quick-move-down-brand-nam-btn p-0.5 border border-gray-200 rounded ${i === settings.menu_brands_nam.length - 1 ? 'opacity-30' : ''}" ${i === settings.menu_brands_nam.length - 1 ? 'disabled' : ''}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <button type="button" class="quick-delete-brand-nam-btn p-0.5 border border-red-50 text-red-500 rounded">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                    </button>
                  </div>
                </div>
              `).join('')}
          </div>
        </div>

        <!-- Nu Brands -->
        <div class="border border-gray-150 rounded-xl p-3 bg-gray-50/30 space-y-3">
          <div class="flex items-center justify-between border-b pb-2">
            <h4 class="text-[11px] font-bold text-gray-900 uppercase">Thương hiệu Mega Menu Nữ</h4>
            <button type="button" id="quick-add-menu-brand-nu" class="bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-[9px] px-2 py-1 rounded transition-colors flex items-center gap-1">
              + Thêm
            </button>
          </div>
          <div class="space-y-2.5" id="quick-menu-brands-nu-list">
            ${settings.menu_brands_nu.length === 0 
              ? `<div class="text-center py-4 text-gray-400 text-[10px]">Chưa cấu hình thương hiệu nào cho Nữ.</div>`
              : settings.menu_brands_nu.map((brand, i) => `
                <div class="flex flex-wrap items-center gap-2 bg-white p-2 border border-gray-100 rounded shadow-sm" data-brand-nu-index="${i}">
                  <div class="w-4 h-4 flex items-center justify-center bg-[#C9A84C] text-white rounded-full text-[8px] font-bold">
                    ${i + 1}
                  </div>
                  <div class="flex-1 min-w-[90px]">
                    <input type="text" class="quick-brand-nu-label w-full px-1.5 py-0.5 border border-gray-200 rounded text-[10px] focus:outline-none" value="${brand.label || ''}" placeholder="Tên" />
                  </div>
                  <div class="flex-1 min-w-[70px]">
                    <input type="text" class="quick-brand-nu-key w-full px-1.5 py-0.5 border border-gray-200 rounded text-[10px] focus:outline-none" value="${brand.brand_key || ''}" placeholder="Mã" />
                  </div>
                  <div class="w-20">
                    <select class="quick-brand-nu-icon w-full px-1 py-0.5 border border-gray-200 rounded text-[10px] bg-white focus:outline-none">
                      <option value="star" ${brand.icon_type === 'star' ? 'selected' : ''}>Star</option>
                      <option value="polygon" ${brand.icon_type === 'polygon' ? 'selected' : ''}>Badge</option>
                      <option value="rect" ${brand.icon_type === 'rect' ? 'selected' : ''}>Watch</option>
                    </select>
                  </div>
                  <div class="flex items-center gap-0.5">
                    <button type="button" class="quick-move-up-brand-nu-btn p-0.5 border border-gray-200 rounded ${i === 0 ? 'opacity-30' : ''}" ${i === 0 ? 'disabled' : ''}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                    </button>
                    <button type="button" class="quick-move-down-brand-nu-btn p-0.5 border border-gray-200 rounded ${i === settings.menu_brands_nu.length - 1 ? 'opacity-30' : ''}" ${i === settings.menu_brands_nu.length - 1 ? 'disabled' : ''}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <button type="button" class="quick-delete-brand-nu-btn p-0.5 border border-red-50 text-red-500 rounded">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
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
        <div id="quick-sec-announcement_bar" class="border border-gray-100 rounded-xl p-3 bg-gray-50/50 space-y-3 scroll-mt-2 transition-all duration-300">
          <div class="flex items-center justify-between border-b pb-2 border-gray-200">
            <span class="font-bold text-gray-800">1. Dòng chạy thông báo</span>
            <button type="button" id="quick-add-announcement-msg" class="bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-[9px] px-2 py-1 rounded transition-colors">
              + Thêm tin
            </button>
          </div>
          <div class="space-y-2" id="quick-announcement-msgs-list">
            ${ab.messages.map((msg, i) => `
              <div class="flex items-center gap-1.5" data-msg-index="${i}">
                <input type="text" class="quick-announcement-input w-full px-2.5 py-1 border border-gray-300 rounded text-[11px] focus:outline-none" value="${msg}" />
                <button type="button" class="quick-delete-announcement-msg-btn p-1 border border-red-50 text-red-500 rounded">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                </button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 2. Promo Banner Strip -->
        <div id="quick-sec-promo_banner" class="border border-gray-100 rounded-xl p-3 bg-gray-50/50 space-y-3 scroll-mt-2 transition-all duration-300">
          <span class="block font-bold text-gray-800 border-b pb-2 border-gray-200">2. Banner Khuyến Mãi</span>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Tiêu đề</label>
              <input type="text" id="quick-promo-title" class="w-full px-2.5 py-1 border border-gray-300 rounded text-[11px] focus:outline-none" value="${pb.title || ''}" />
            </div>
            <div>
              <label class="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Mã Code</label>
              <input type="text" id="quick-promo-code" class="w-full px-2.5 py-1 border border-gray-300 rounded text-[11px] focus:outline-none" value="${pb.code || ''}" />
            </div>
          </div>
        </div>

        <!-- 3. Category Banners (Sub-banners) -->
        <div id="quick-sec-category_banners" class="border border-gray-100 rounded-xl p-3 bg-gray-50/50 space-y-3 scroll-mt-2 transition-all duration-300">
          <span class="block font-bold text-gray-800 border-b pb-2 border-gray-200">3. Danh Mục Nổi Bật / Banner Con</span>
          <div class="space-y-3" id="quick-category-banners-list">
            ${cb.map((cat, i) => {
              const defaultImg = i === 0 ? 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg' :
                                 i === 1 ? 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg' :
                                           'https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg';
              const displayImg = cat.img || defaultImg;
              return `
                <div class="bg-white p-3 border border-gray-100 rounded-lg space-y-2" data-cat-index="${i}">
                  <div class="text-[10px] font-bold text-[#C9A84C] uppercase">Banner #${i + 1}</div>
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <input type="text" class="quick-cat-title w-full px-2 py-1 border border-gray-300 rounded text-[10px] focus:outline-none" value="${cat.title || ''}" placeholder="Tiêu đề" />
                    </div>
                    <div>
                      <input type="text" class="quick-cat-href w-full px-2 py-1 border border-gray-300 rounded text-[10px] focus:outline-none" value="${cat.href || ''}" placeholder="Liên kết" />
                    </div>
                  </div>
                  <div>
                    <input type="text" class="quick-cat-subtitle w-full px-2 py-1 border border-gray-300 rounded text-[10px] focus:outline-none" value="${cat.subtitle || ''}" placeholder="Mô tả phụ" />
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="w-14 h-9 border rounded bg-zinc-950 overflow-hidden relative shrink-0">
                      <img class="quick-cat-image-preview w-full h-full object-cover opacity-60" src="${displayImg}" />
                    </div>
                    <div class="flex-1 space-y-1">
                      <input type="file" class="quick-cat-file-input hidden" accept="image/*" />
                      <button type="button" class="quick-upload-cat-image-btn bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-[9px] px-2.5 py-1 rounded transition-colors">Tải ảnh</button>
                      <input type="text" class="quick-cat-img-url w-full px-2 py-0.5 border border-gray-200 rounded text-[9px] text-gray-500 focus:outline-none" value="${cat.img || ''}" placeholder="URL ảnh" />
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 4. Brand Story -->
        <div id="quick-sec-brand_story" class="border border-gray-100 rounded-xl p-3 bg-gray-50/50 space-y-3 scroll-mt-2 transition-all duration-300">
          <span class="block font-bold text-gray-800 border-b pb-2 border-gray-200">4. Câu Chuyện Thương Hiệu</span>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Tiêu đề lớn</label>
              <input type="text" id="quick-brandstory-title" class="w-full px-2.5 py-1 border border-gray-300 rounded text-[11px] focus:outline-none" value="${bs.title || ''}" />
            </div>
            <div>
              <label class="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Tiêu đề phụ</label>
              <input type="text" id="quick-brandstory-subtitle" class="w-full px-2.5 py-1 border border-gray-300 rounded text-[11px] focus:outline-none" value="${bs.subtitle || ''}" />
            </div>
          </div>
          <div>
            <label class="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Mô tả (Description)</label>
            <textarea id="quick-brandstory-description" class="w-full px-2.5 py-1 border border-gray-300 rounded text-[10px] focus:outline-none h-14 resize-none">${bs.description || ''}</textarea>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Nút bấm</label>
              <input type="text" id="quick-brandstory-btn-label" class="w-full px-2.5 py-1 border border-gray-300 rounded text-[11px] focus:outline-none" value="${bs.button_label || ''}" />
            </div>
            <div>
              <label class="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Liên kết nút</label>
              <input type="text" id="quick-brandstory-btn-href" class="w-full px-2.5 py-1 border border-gray-300 rounded text-[11px] focus:outline-none" value="${bs.button_href || ''}" />
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-14 h-9 border rounded bg-zinc-950 overflow-hidden relative shrink-0">
              <img id="quick-brandstory-image-preview" class="w-full h-full object-cover opacity-60" src="${bs.image_url || ''}" />
            </div>
            <div class="flex-1 space-y-1">
              <input type="file" id="quick-brandstory-file-input" class="hidden" accept="image/*" />
              <button type="button" id="quick-upload-brandstory-img-btn" class="bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-[9px] px-2.5 py-1 rounded transition-colors">Tải ảnh</button>
              <input type="text" id="quick-brandstory-image-url" class="w-full px-2 py-0.5 border border-gray-200 rounded text-[9px] text-gray-500 focus:outline-none" value="${bs.image_url || ''}" placeholder="URL ảnh" />
            </div>
          </div>
        </div>

        <!-- 5. Newsletter -->
        <div id="quick-sec-newsletter" class="border border-gray-100 rounded-xl p-3 bg-gray-50/50 space-y-3 scroll-mt-2 transition-all duration-300">
          <span class="block font-bold text-gray-800 border-b pb-2 border-gray-200">5. Đăng Ký Bản Tin (Newsletter)</span>
          <div class="grid grid-cols-3 gap-2">
            <div class="col-span-1">
              <label class="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Tiêu đề</label>
              <input type="text" id="quick-newsletter-title" class="w-full px-2 py-1 border border-gray-300 rounded text-[10px] focus:outline-none" value="${nl.title || ''}" />
            </div>
            <div class="col-span-1">
              <label class="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Mô tả</label>
              <input type="text" id="quick-newsletter-description" class="w-full px-2 py-1 border border-gray-300 rounded text-[10px] focus:outline-none" value="${nl.description || ''}" />
            </div>
            <div class="col-span-1">
              <label class="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Nút</label>
              <input type="text" id="quick-newsletter-btn-label" class="w-full px-2 py-1 border border-gray-300 rounded text-[10px] focus:outline-none" value="${nl.button_label || ''}" />
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

