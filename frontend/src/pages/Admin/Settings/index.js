import { showToast } from '../shared/ui.js';
import { API_BASE, STORAGE_KEYS } from '../../../services/config.js';

function getAdminToken() {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || localStorage.getItem('dhat_token');
}

export function renderSettings(container) {
  let activeTab = 'brand'; // 'brand' | 'banner' | 'colors' | 'history'
  let settings = {
    brand_name: 'Venix Watch',
    logo_url: '',
    hero_banners: [],
    theme_colors: {}
  };
  let historyLogs = [];
  let currentPage = 1;

  // Local copy of color configurations for real-time preview
  let localColors = {};

  const token = getAdminToken();

  async function loadData() {
    container.innerHTML = `
      <div class="flex items-center justify-center py-12">
        <div class="w-8 h-8 border-4 border-[#C9A84C] border-t-transparent rounded-full animate-spin"></div>
        <span class="ml-3 text-gray-500 text-sm font-medium">Đang tải cấu hình...</span>
      </div>
    `;

    try {
      // 1. Fetch current settings with cache buster
      const res = await fetch(`${API_BASE}/api/settings?t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          settings = json.data;
          localColors = { ...settings.theme_colors };
        }
      }

      // 2. Fetch audit history logs with cache buster
      const historyRes = await fetch(`${API_BASE}/api/admin/settings/history?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (historyRes.ok) {
        const json = await historyRes.json();
        if (json.success) {
          historyLogs = json.data;
        }
      }

      renderUI();
    } catch (err) {
      container.innerHTML = `
        <div class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm max-w-lg mx-auto mt-8">
          <h4 class="font-bold mb-1">Lỗi tải dữ liệu</h4>
          <p class="mb-4">Không thể kết nối đến máy chủ API.</p>
          <button id="retry-load-btn" class="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors">THỬ LẠI</button>
        </div>
      `;
      container.querySelector('#retry-load-btn')?.addEventListener('click', loadData);
    }
  }

  function renderUI() {
    container.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Cài Đặt Hệ Thống</h1>
            <p class="text-sm text-gray-500 mt-1">Cấu hình tên thương hiệu, hình ảnh logo, banners và tông màu của trang web.</p>
          </div>
          <button id="save-all-settings" class="bg-[#C9A84C] hover:bg-[#b8963e] text-white font-semibold text-sm px-6 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition duration-200 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Lưu Tất Cả
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="bg-white border border-gray-200 p-1.5 rounded-xl flex gap-1 shadow-sm flex-wrap">
          <button data-tab="brand" class="flex-1 min-w-[120px] py-2 px-3 text-center text-xs font-semibold rounded-lg transition-all ${activeTab === 'brand' ? 'bg-[#C9A84C]/15 text-[#C9A84C]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}">
            Thương Hiệu & Logo
          </button>
          <button data-tab="menu" class="flex-1 min-w-[120px] py-2 px-3 text-center text-xs font-semibold rounded-lg transition-all ${activeTab === 'menu' ? 'bg-[#C9A84C]/15 text-[#C9A84C]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}">
            Cấu Hình Menu
          </button>
          <button data-tab="banner" class="flex-1 min-w-[120px] py-2 px-3 text-center text-xs font-semibold rounded-lg transition-all ${activeTab === 'banner' ? 'bg-[#C9A84C]/15 text-[#C9A84C]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}">
            Banner Trang Chủ
          </button>
          <button data-tab="sections" class="flex-1 min-w-[120px] py-2 px-3 text-center text-xs font-semibold rounded-lg transition-all ${activeTab === 'sections' ? 'bg-[#C9A84C]/15 text-[#C9A84C]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}">
            Section Trang Chủ
          </button>
          <button data-tab="colors" class="flex-1 min-w-[120px] py-2 px-3 text-center text-xs font-semibold rounded-lg transition-all ${activeTab === 'colors' ? 'bg-[#C9A84C]/15 text-[#C9A84C]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}">
            Màu Sắc Giao Diện (Kèm Live Preview)
          </button>
          <button data-tab="history" class="flex-1 min-w-[120px] py-2 px-3 text-center text-xs font-semibold rounded-lg transition-all ${activeTab === 'history' ? 'bg-[#C9A84C]/15 text-[#C9A84C]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}">
            Lịch Sử Thay Đổi
          </button>
        </div>

        <!-- Tab Contents -->
        <div id="tab-content" class="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 min-h-[400px]">
          ${renderTabContent()}
        </div>
      </div>
    `;

    bindTabEvents();
    bindActionEvents();
    updateMockupColors();
  }

  function renderTabContent() {
    switch (activeTab) {
      case 'brand':
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

      case 'menu':
        if (!settings.navigation_menu) {
          settings.navigation_menu = [];
        }
        return `
          <div class="space-y-6">
            <div class="flex items-center justify-between border-b pb-3">
              <div>
                <h3 class="text-base font-bold text-gray-900">Cấu Hình Menu Điều Hướng</h3>
                <p class="text-xs text-gray-500 mt-0.5">Tùy chỉnh các liên kết xuất hiện trên thanh menu chính của trang web.</p>
              </div>
              <button id="add-menu-item" class="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Thêm Menu Chính
              </button>
            </div>

            <div class="space-y-6" id="menu-items-list">
              ${settings.navigation_menu.length === 0 
                ? `<div class="text-center py-12 text-gray-400 text-sm">Chưa có menu nào. Hãy bấm "Thêm Menu Chính".</div>` 
                : settings.navigation_menu.map((item, i) => `
                  <div class="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-4 relative" data-item-index="${i}">
                    <!-- Main Menu Item Inputs & Actions -->
                    <div class="flex flex-wrap items-center gap-4 bg-white p-3 border border-gray-200 rounded-xl shadow-sm">
                      <div class="w-6 h-6 flex items-center justify-center bg-zinc-950 text-white rounded-full text-[10px] font-bold">
                        ${i + 1}
                      </div>
                      <div class="flex-1 min-w-[150px]">
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Tên hiển thị</label>
                        <input type="text" class="menu-label w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" value="${item.label || ''}" />
                      </div>
                      <div class="flex-1 min-w-[200px]">
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Liên kết (URL/Href)</label>
                        <input type="text" class="menu-href w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" value="${item.href || ''}" />
                      </div>
                      <div class="w-24">
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Nhãn (Badge)</label>
                        <input type="text" class="menu-badge w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" value="${item.badge || ''}" placeholder="e.g. HOT, NEW" />
                      </div>
                      <div class="flex items-center gap-1 mt-3 sm:mt-0">
                        <button class="move-up-menu-btn p-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors ${i === 0 ? 'opacity-30 cursor-not-allowed' : ''}" ${i === 0 ? 'disabled' : ''} title="Di chuyển lên">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
                        </button>
                        <button class="move-down-menu-btn p-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors ${i === settings.navigation_menu.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}" ${i === settings.navigation_menu.length - 1 ? 'disabled' : ''} title="Di chuyển xuống">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        <button class="add-child-menu-btn px-2.5 py-1.5 border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C]/5 text-xs font-semibold rounded-lg transition-colors" title="Thêm menu con">
                          + Menu Con
                        </button>
                        <button class="delete-menu-btn p-1.5 border border-red-100 hover:bg-red-50 text-red-600 rounded-lg transition-colors" title="Xóa menu này">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </div>

                    <!-- Child Menu Items (Submenu) -->
                    <div class="pl-8 border-l-2 border-gray-200/60 ml-3 space-y-2.5">
                      ${(item.children || []).length === 0 
                        ? `<p class="text-[11px] text-gray-400 italic">Chưa có menu con nào.</p>`
                        : item.children.map((child, j) => `
                          <div class="flex items-center gap-3 bg-white p-2 border border-gray-100 rounded-lg shadow-sm" data-child-index="${j}">
                            <div class="flex-1">
                              <input type="text" class="child-label w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" value="${child.label || ''}" placeholder="Tên menu con" />
                            </div>
                            <div class="flex-[1.5]">
                              <input type="text" class="child-href w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" value="${child.href || ''}" placeholder="Đường dẫn liên kết" />
                            </div>
                            <div class="flex items-center gap-1">
                              <button class="move-up-child-btn p-1 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded transition-colors ${j === 0 ? 'opacity-30 cursor-not-allowed' : ''}" ${j === 0 ? 'disabled' : ''} title="Di chuyển lên">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
                              </button>
                              <button class="move-down-child-btn p-1 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded transition-colors ${j === item.children.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}" ${j === item.children.length - 1 ? 'disabled' : ''} title="Di chuyển xuống">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                              </button>
                              <button class="delete-child-btn p-1 border border-red-50 hover:bg-red-50 text-red-500 rounded transition-colors" title="Xóa menu con">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                              </button>
                            </div>
                          </div>
                        `).join('')
                      }
                    </div>
                  </div>
                `).join('')
              }
            </div>
          </div>
        `;

      case 'banner':
        return `
          <div class="space-y-6">
            <div class="flex items-center justify-between border-b pb-3">
              <h3 class="text-base font-bold text-gray-900">Quản Lý Banner Trang Chủ</h3>
              <button id="add-banner-slide" class="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Thêm Slide
              </button>
            </div>
            
            <div class="space-y-4" id="banner-slides-list">
              ${settings.hero_banners.length === 0 
                ? `<div class="text-center py-12 text-gray-400 text-sm">Chưa có banner nào. Hãy bấm "Thêm Slide".</div>` 
                : settings.hero_banners.map((slide, i) => `
                  <div class="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-4 relative group" data-slide-index="${i}">
                    <div class="absolute top-4 right-4 flex gap-1.5">
                      <button class="move-up-slide-btn p-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors ${i === 0 ? 'opacity-30 cursor-not-allowed' : ''}" title="Di chuyển lên" ${i === 0 ? 'disabled' : ''}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
                      </button>
                      <button class="move-down-slide-btn p-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors ${i === settings.hero_banners.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}" title="Di chuyển xuống" ${i === settings.hero_banners.length - 1 ? 'disabled' : ''}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                      <button class="delete-slide-btn p-1.5 border border-red-100 bg-white hover:bg-red-50 text-red-600 rounded-lg transition-colors" title="Xóa slide">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      </button>
                    </div>

                    <div class="text-xs font-bold text-[#C9A84C] uppercase tracking-wider">Slide #${i + 1}</div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <!-- Title & Text Info -->
                      <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="md:col-span-2">
                          <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Dòng phụ (Eyebrow)</label>
                          <input type="text" class="slide-eyebrow w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none" value="${slide.eyebrow || ''}" />
                        </div>
                        <div class="md:col-span-2">
                          <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tiêu đề lớn (Title)</label>
                          <input type="text" class="slide-title w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none" value="${slide.title || ''}" />
                        </div>
                        <div class="md:col-span-2">
                          <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mô tả phụ (Subtitle)</label>
                          <textarea class="slide-subtitle w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none h-16 resize-none">${slide.subtitle || ''}</textarea>
                        </div>
                        <div>
                          <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Chữ nút bấm (CTA)</label>
                          <input type="text" class="slide-cta w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none" value="${slide.cta || ''}" />
                        </div>
                        <div>
                          <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Liên kết nút bấm (CTA Href)</label>
                          <input type="text" class="slide-ctaHref w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none" value="${slide.ctaHref || ''}" />
                        </div>
                      </div>

                      <!-- Image Selector -->
                      <div class="space-y-2">
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ảnh nền (Background Image)</label>
                        <div class="w-full h-32 border border-gray-200 rounded-xl bg-zinc-950 relative overflow-hidden flex items-center justify-center">
                          <img class="slide-image-preview w-full h-full object-cover opacity-60" src="${slide.img || ''}" />
                          <button class="upload-slide-image-btn absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white text-[10px] font-bold uppercase tracking-wider">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            Chọn ảnh
                          </button>
                        </div>
                        <input type="text" class="slide-img-url w-full px-3 py-1 border border-gray-300 rounded-lg text-[10px] text-gray-500 focus:outline-none" value="${slide.img || ''}" placeholder="Nhập URL hoặc tải ảnh lên" />
                        <input type="file" accept="image/*" class="slide-file-input hidden" />
                      </div>
                    </div>
                  </div>
                `).join('')
              }
            </div>
          </div>
        `;

      case 'sections': {
        const sec = settings.home_sections || {};
        const ab = sec.announcement_bar || { messages: [] };
        const pb = sec.promo_banner || { title: '', code: '', buttons: [] };
        const cb = sec.category_banners || [
          { img: '', title: 'Đồng Hồ Nam', subtitle: 'Mạnh mẽ. Lịch lãm. Đẳng cấp.', href: '/nam' },
          { img: '', title: 'Đồng Hồ Nữ', subtitle: 'Thanh lịch. Tinh tế. Quyến rũ.', href: '/nu' },
          { img: '', title: 'Phụ Kiện', subtitle: 'Dây đeo. Hộp đựng. Phụ kiện cao cấp.', href: '/phu-kien' }
        ];
        const bs = sec.brand_story || { title: '', subtitle: '', description: '', button_label: '', button_href: '', image_url: '' };
        const nl = sec.newsletter || { title: '', description: '', button_label: '' };

        return `
          <div class="space-y-8">
            <!-- 1. Announcement Bar Section -->
            <div class="border border-gray-200 rounded-xl p-5 bg-gray-50/50 space-y-4">
              <div class="flex items-center justify-between border-b pb-3 border-gray-200">
                <div>
                  <h3 class="text-sm font-bold text-gray-900">1. Dòng Chạy Thông Báo (Announcement Bar)</h3>
                  <p class="text-xs text-gray-400 mt-0.5">Các thông báo ngắn chạy ngang ở đỉnh trang web.</p>
                </div>
                <button id="add-announcement-msg" class="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                  + Thêm dòng tin
                </button>
              </div>
              <div class="space-y-2.5" id="announcement-msgs-list">
                ${ab.messages.length === 0 
                  ? `<p class="text-xs text-gray-400 italic">Không có tin nhắn thông báo nào.</p>`
                  : ab.messages.map((msg, i) => `
                    <div class="flex items-center gap-2" data-msg-index="${i}">
                      <input type="text" class="announcement-input w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" value="${msg}" />
                      <button class="delete-announcement-msg-btn p-1.5 border border-red-100 hover:bg-red-50 text-red-600 rounded-lg transition-colors" title="Xóa dòng này">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                      </button>
                    </div>
                  `).join('')
                }
              </div>
            </div>

            <!-- 2. Promo Banner Section -->
            <div class="border border-gray-200 rounded-xl p-5 bg-gray-50/50 space-y-4">
              <h3 class="text-sm font-bold text-gray-900 border-b pb-3 border-gray-200">2. Banner Khuyến Mãi (Promo Banner Strip)</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tiêu đề khuyến mãi (Title)</label>
                  <input type="text" id="promo-title" class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" value="${pb.title || ''}" />
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mã giảm giá (Promo Code)</label>
                  <input type="text" id="promo-code" class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" value="${pb.code || ''}" />
                </div>
              </div>
              <div class="space-y-3">
                <label class="block text-[10px] font-bold text-gray-400 uppercase">Nút bấm liên kết (Tối đa 2 nút)</label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="promo-buttons-container">
                  ${[0, 1].map(btnIdx => {
                    const btn = pb.buttons && pb.buttons[btnIdx] ? pb.buttons[btnIdx] : { label: '', href: '' };
                    return `
                      <div class="bg-white p-3 border border-gray-200 rounded-lg space-y-2" data-btn-index="${btnIdx}">
                        <div class="text-[9px] font-bold text-gray-400">NÚT #${btnIdx + 1}</div>
                        <div>
                          <input type="text" class="promo-btn-label w-full px-2.5 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" value="${btn.label || ''}" placeholder="Chữ hiển thị của nút" />
                        </div>
                        <div>
                          <input type="text" class="promo-btn-href w-full px-2.5 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" value="${btn.href || ''}" placeholder="Đường dẫn liên kết (ví dụ: /nam)" />
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>

            <!-- 3. Category Banners Section -->
            <div class="border border-gray-200 rounded-xl p-5 bg-gray-50/50 space-y-4">
              <h3 class="text-sm font-bold text-gray-900 border-b pb-3 border-gray-200">3. Danh Mục Nổi Bật / Banner Con (Category Banners)</h3>
              <p class="text-xs text-gray-400 mt-0.5">Cấu hình 3 biểu ngữ danh mục nổi bật (Nam, Nữ, Phụ kiện) hiển thị trên trang chủ.</p>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6" id="category-banners-list">
                ${cb.map((cat, i) => {
                  const defaultImg = i === 0 ? 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg' :
                                     i === 1 ? 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg' :
                                               'https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg';
                  const displayImg = cat.img || defaultImg;
                  return `
                    <div class="bg-white p-4 border border-gray-200 rounded-xl space-y-3 relative group/cat" data-cat-index="${i}">
                      <div class="text-xs font-bold text-[#C9A84C] uppercase tracking-wider">Banner con #${i + 1}</div>
                      
                      <!-- Title & Subtitle Inputs -->
                      <div>
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tiêu đề (Title)</label>
                        <input type="text" class="cat-title w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" value="${cat.title || ''}" />
                      </div>
                      
                      <div>
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mô tả phụ (Subtitle)</label>
                        <textarea class="cat-subtitle w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A84C] h-12 resize-none">${cat.subtitle || ''}</textarea>
                      </div>
                      
                      <div>
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Đường dẫn liên kết (Link Href)</label>
                        <input type="text" class="cat-href w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" value="${cat.href || ''}" />
                      </div>

                      <!-- Image Selector -->
                      <div class="space-y-1.5">
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Hình ảnh (Image)</label>
                        <div class="w-full h-28 border border-gray-200 rounded-lg bg-zinc-950 relative overflow-hidden flex items-center justify-center">
                          <img class="cat-image-preview w-full h-full object-cover opacity-60" src="${displayImg}" />
                          <button class="upload-cat-image-btn absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white text-[9px] font-bold uppercase tracking-wider">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            Tải ảnh lên
                          </button>
                        </div>
                        <input type="text" class="cat-img-url w-full px-2.5 py-1 border border-gray-300 rounded-lg text-[9px] text-gray-500 focus:outline-none" value="${cat.img || ''}" placeholder="Đường dẫn ảnh hoặc tự động cập nhật khi tải lên" />
                        <input type="file" accept="image/*" class="cat-file-input hidden" />
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- 4. Brand Story Section -->
            <div class="border border-gray-200 rounded-xl p-5 bg-gray-50/50 space-y-4">
              <h3 class="text-sm font-bold text-gray-900 border-b pb-3 border-gray-200">4. Câu Chuyện Thương Hiệu (Brand Story)</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Left Details form -->
                <div class="md:col-span-2 space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tiêu đề lớn</label>
                      <input type="text" id="brandstory-title" class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" value="${bs.title || ''}" />
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tiêu đề phụ / Năm sáng lập (Eyebrow/Subtitle)</label>
                      <input type="text" id="brandstory-subtitle" class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" value="${bs.subtitle || ''}" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Đoạn văn mô tả (Description)</label>
                    <textarea id="brandstory-description" class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A84C] h-20 resize-none">${bs.description || ''}</textarea>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Chữ nút bấm</label>
                      <input type="text" id="brandstory-btn-label" class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" value="${bs.button_label || ''}" />
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Liên kết nút bấm</label>
                      <input type="text" id="brandstory-btn-href" class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" value="${bs.button_href || ''}" />
                    </div>
                  </div>
                </div>

                <!-- Right Brand Story Image Upload -->
                <div class="space-y-2">
                  <label class="block text-[10px] font-bold text-gray-400 uppercase">Hình ảnh giới thiệu</label>
                  <div class="w-full h-40 border border-gray-200 rounded-xl bg-zinc-950 relative overflow-hidden flex items-center justify-center">
                    <img id="brandstory-image-preview" class="w-full h-full object-cover opacity-70" src="${bs.image_url || ''}" />
                    <button id="upload-brandstory-img-btn" class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white text-[10px] font-bold uppercase tracking-wider">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Chọn ảnh
                    </button>
                  </div>
                  <input type="text" id="brandstory-image-url" class="w-full px-3 py-1 border border-gray-300 rounded-lg text-[10px] text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" value="${bs.image_url || ''}" placeholder="Nhập URL hình ảnh hoặc tải ảnh lên" />
                  <input type="file" id="brandstory-file-input" accept="image/*" class="hidden" />
                </div>
              </div>
            </div>

            <!-- 5. Newsletter Section -->
            <div class="border border-gray-200 rounded-xl p-5 bg-gray-50/50 space-y-4">
              <h3 class="text-sm font-bold text-gray-900 border-b pb-3 border-gray-200">5. Đăng Ký Bản Tin (Newsletter)</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="md:col-span-1">
                  <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tiêu đề dòng đăng ký</label>
                  <input type="text" id="newsletter-title" class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" value="${nl.title || ''}" />
                </div>
                <div class="md:col-span-1">
                  <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Đoạn mô tả ngắn</label>
                  <input type="text" id="newsletter-description" class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" value="${nl.description || ''}" />
                </div>
                <div class="md:col-span-1">
                  <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Chữ hiển thị trên nút đăng ký</label>
                  <input type="text" id="newsletter-btn-label" class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" value="${nl.button_label || ''}" />
                </div>
              </div>
            </div>
          </div>
        `;
      }

      case 'colors': {
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

        return `
          <div class="space-y-6">
            <div class="flex items-center justify-between border-b pb-3">
              <div>
                <h3 class="text-base font-bold text-gray-900">Bảng Màu Sắc Giao Diện</h3>
                <p class="text-xs text-gray-500 mt-0.5">Thay đổi màu sắc trang web tức thời. Nhìn sang mockup bên phải để xem trước trước khi bấm lưu.</p>
              </div>
              <button id="reset-colors-default" class="border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.5 2v6h6M21.5 22v-6h-6"/><path d="M22 11.5A10 10 0 0 0 9.5 2.8L2.5 8m0 4.5A10 10 0 0 0 14.5 21.2l7-5.2"/></svg>
                Khôi phục mặc định
              </button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <!-- Left Color Pickers -->
              <div class="lg:col-span-7 space-y-4 max-h-[500px] overflow-y-auto pr-2" id="color-pickers-container">
                ${colorFields.map(field => `
                  <div class="flex items-center gap-4 bg-gray-50 border rounded-xl p-3 hover:bg-gray-100/50 transition-colors">
                    <input type="color" data-color-key="${field.key}" value="${localColors[field.key] || defaultColors[field.key]}" 
                      class="color-picker-input w-12 h-10 border-0 rounded-lg cursor-pointer bg-transparent focus:outline-none" />
                    <div class="flex-1">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-gray-800">${field.label}</span>
                        <span class="text-[10px] font-mono text-gray-400 uppercase select-all">${localColors[field.key] || defaultColors[field.key]}</span>
                      </div>
                      <p class="text-[11px] text-gray-500 mt-0.5 leading-relaxed">${field.desc}</p>
                    </div>
                  </div>
                `).join('')}
              </div>

              <!-- Right Real-Time Mockup Preview -->
              <div class="lg:col-span-5">
                <h4 class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Xem trước giao diện thực tế (Live Preview Mockup)</h4>
                
                <div id="mockup-preview" class="border border-gray-200 rounded-xl overflow-hidden shadow-md flex flex-col bg-white text-xs select-none">
                  
                  <!-- Mockup Header -->
                  <div class="mockup-header px-3 py-2 bg-[var(--color-primary-mockup)] border-b flex items-center justify-between text-[8px] font-bold text-white transition-all">
                    <div class="flex items-center gap-1">
                      <span class="text-[var(--color-primary-gold-mockup)] text-[9px] font-serif uppercase tracking-wider">LOGO</span>
                    </div>
                    <div class="flex gap-2 opacity-80">
                      <span>NAM</span>
                      <span>NỮ</span>
                      <span>SALE</span>
                    </div>
                    <div class="w-3.5 h-3.5 rounded-full bg-[var(--color-primary-gold-mockup)]/20 flex items-center justify-center text-[var(--color-primary-gold-mockup)]">🛒</div>
                  </div>

                  <!-- Mockup Banner Slider -->
                  <div class="mockup-banner relative h-36 bg-zinc-950 flex items-center justify-center p-3 text-center text-white overflow-hidden">
                    <!-- Gradient fallback -->
                    <div class="absolute inset-0 bg-gradient-to-r from-zinc-900 to-zinc-800 opacity-80"></div>
                    <div class="relative space-y-1.5 z-10">
                      <div class="text-[6px] tracking-wider text-white/70 uppercase">Bộ sưu tập mới</div>
                      <div class="text-[11px] font-extrabold uppercase leading-none tracking-tight">Thời Gian Là Nghệ Thuật</div>
                      <div class="text-[5px] text-white/70 max-w-[150px] mx-auto truncate">Khám phá các mẫu đồng hồ cao cấp.</div>
                      <div class="mockup-cta inline-block bg-[var(--color-primary-gold-mockup)] text-zinc-950 text-[5px] font-bold uppercase py-1 px-3 mt-1 cursor-pointer transition-colors hover:bg-[var(--color-primary-gold-dark-mockup)] shadow-md">
                        Xem Ngay
                      </div>
                    </div>
                  </div>

                  <!-- Mockup Product Card Grid -->
                  <div class="mockup-body p-3 bg-[var(--color-secondary-mockup)] space-y-2 flex-1 transition-all">
                    <div class="text-[8px] font-bold text-[var(--color-ink-mockup)] border-b pb-1">Sản Phẩm Tiêu Biểu</div>
                    <div class="grid grid-cols-2 gap-2">
                      <!-- Product 1 -->
                      <div class="border rounded p-1 bg-white flex flex-col justify-between">
                        <div class="h-10 bg-gray-100 rounded flex items-center justify-center text-[8px] text-gray-300">⌚</div>
                        <div class="text-[6px] font-bold text-[var(--color-ink-mockup)] mt-1 truncate">Seiko Presage</div>
                        <div class="flex items-center justify-between mt-0.5">
                          <span class="text-[6px] text-[var(--color-primary-gold-mockup)] font-bold">5.490.000đ</span>
                          <span class="bg-[var(--color-sale-red-mockup)] text-white text-[4px] font-bold px-1 rounded-sm">-20%</span>
                        </div>
                      </div>
                      <!-- Product 2 -->
                      <div class="border rounded p-1 bg-white flex flex-col justify-between">
                        <div class="h-10 bg-gray-100 rounded flex items-center justify-center text-[8px] text-gray-300">⌚</div>
                        <div class="text-[6px] font-bold text-[var(--color-ink-mockup)] mt-1 truncate">Orient Bambino</div>
                        <div class="flex items-center justify-between mt-0.5">
                          <span class="text-[6px] text-[var(--color-primary-gold-mockup)] font-bold">4.190.000đ</span>
                          <span class="bg-[var(--color-primary-gold-mockup)] text-zinc-950 text-[4px] font-bold px-1 rounded-sm">HOT</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Mockup Newsletter Strip -->
                  <div class="mockup-newsletter p-2 bg-[var(--color-paper-warm-mockup)] border-t border-b flex items-center justify-between transition-all">
                    <div class="text-[5px] text-zinc-600 font-medium">Nhận bản tin khuyến mãi từ chúng tôi:</div>
                    <div class="bg-[var(--color-primary-gold-mockup)] text-zinc-950 text-[5px] font-bold py-0.5 px-2 cursor-pointer shadow-sm rounded-sm">Đăng Ký</div>
                  </div>

                  <!-- Mockup Footer -->
                  <div class="mockup-footer p-2 bg-[var(--color-primary-mockup)] text-[5px] text-white/50 text-center transition-all">
                    © 2026 Brand. All rights reserved.
                  </div>

                </div>
              </div>
            </div>
          </div>
        `;
      }

      case 'history': {
        const itemsPerPage = 15;
        const totalPages = Math.ceil(historyLogs.length / itemsPerPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedLogs = historyLogs.slice(startIndex, endIndex);

        let paginationControls = '';
        if (totalPages > 1) {
          paginationControls = `
            <div class="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div class="text-xs text-gray-500">
                Hiển thị dòng <span class="font-semibold text-gray-700">${startIndex + 1}</span> đến <span class="font-semibold text-gray-700">${Math.min(endIndex, historyLogs.length)}</span> trong tổng số <span class="font-semibold text-gray-700">${historyLogs.length}</span> lịch sử
              </div>
              <div class="flex items-center gap-1.5">
                <button type="button" id="prev-page-btn" class="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center gap-1 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed" ${currentPage === 1 ? 'disabled' : ''}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                  Trang trước
                </button>
                
                <div class="flex items-center gap-1 flex-wrap">
                  ${Array.from({ length: totalPages }).map((_, pIdx) => {
                    const p = pIdx + 1;
                    const isActive = p === currentPage;
                    return `<button type="button" class="page-num-btn w-8 h-8 rounded-lg text-xs font-bold transition-all ${isActive ? 'bg-[#C9A84C] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}" data-page="${p}">${p}</button>`;
                  }).join('')}
                </div>

                <button type="button" id="next-page-btn" class="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center gap-1 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed" ${currentPage === totalPages ? 'disabled' : ''}>
                  Trang sau
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          `;
        }

        return `
          <div class="space-y-4">
            <h3 class="text-base font-bold text-gray-900 border-b pb-3">Lịch Sử Thao Tác Hệ Thống</h3>
            ${paginationControls}
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                    <th class="py-2.5 px-3 w-16">STT</th>
                    <th class="py-2.5 px-3 w-48">Hành động</th>
                    <th class="py-2.5 px-3">Chi tiết thay đổi</th>
                    <th class="py-2.5 px-3 w-40">Người thực hiện</th>
                    <th class="py-2.5 px-3 w-40">Thời gian</th>
                    <th class="py-2.5 px-3 w-32 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  ${paginatedLogs.length === 0 
                    ? `<tr><td colspan="6" class="text-center py-6 text-gray-400">Chưa ghi nhận sự kiện lịch sử thay đổi nào.</td></tr>` 
                    : paginatedLogs.map((log, index) => `
                      <tr class="border-b border-gray-100 hover:bg-gray-50">
                        <td class="py-3 px-3 text-gray-400 font-medium">${historyLogs.length - (startIndex + index)}</td>
                        <td class="py-3 px-3 font-semibold text-zinc-800">${log.action}</td>
                        <td class="py-3 px-3 text-gray-600 font-medium">${log.details}</td>
                        <td class="py-3 px-3 text-gray-500">${log.changed_by}</td>
                        <td class="py-3 px-3 text-gray-400">${new Date(log.created_at).toLocaleString('vi-VN')}</td>
                        <td class="py-3 px-3 text-right">
                          ${log.settings_snapshot 
                            ? `<button type="button" class="rollback-btn text-[#C9A84C] hover:text-[#A88840] font-bold hover:underline transition-colors focus:outline-none" data-id="${log.id}">Hoàn tác về đây</button>`
                            : `<span class="text-gray-300">-</span>`
                          }
                        </td>
                      </tr>
                    `).join('')
                  }
                </tbody>
              </table>
            </div>
          </div>
        `;
      }
    }
  }

  function bindTabEvents() {
    container.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        currentPage = 1;
        renderUI();
      });
    });
  }

  function updateMockupColors() {
    const mockup = container.querySelector('#mockup-preview');
    if (!mockup) return;

    // Apply color values directly to Mockup visual nodes
    mockup.style.setProperty('--color-primary-mockup', localColors.primary || '#1a1a1a');
    mockup.style.setProperty('--color-secondary-mockup', localColors.secondary || '#ffffff');
    mockup.style.setProperty('--color-accent-gold-mockup', localColors['accent-gold'] || '#C9A84C');
    mockup.style.setProperty('--color-primary-gold-mockup', localColors['primary-gold'] || '#C9A961');
    mockup.style.setProperty('--color-primary-gold-dark-mockup', localColors['primary-gold-dark'] || '#A88840');
    mockup.style.setProperty('--color-ink-mockup', localColors.ink || '#0A0A0A');
    mockup.style.setProperty('--color-paper-warm-mockup', localColors['paper-warm'] || '#FAF8F3');
    mockup.style.setProperty('--color-sale-red-mockup', localColors['sale-red'] || '#c0392b');
  }

  function bindActionEvents() {
    // -------------------------------------------------------------
    // LOGO & BRAND DETAILS
    // -------------------------------------------------------------
    if (activeTab === 'brand') {
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
            loadData(); // Reload all info
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
            loadData();
          } else {
            showToast(json.error || 'Lỗi khi xóa logo.', 'error');
          }
        } catch {
          showToast('Lỗi kết nối khi xóa logo.', 'error');
        }
      });
    }

    // -------------------------------------------------------------
    // SLIDER BANNER MANAGEMENT
    // -------------------------------------------------------------
    if (activeTab === 'banner') {
      const slidesList = container.querySelector('#banner-slides-list');

      // Bind slide field inputs
      slidesList?.querySelectorAll('[data-slide-index]').forEach(row => {
        const index = parseInt(row.dataset.slideIndex, 10);
        
        row.querySelector('.slide-eyebrow').addEventListener('input', (e) => {
          settings.hero_banners[index].eyebrow = e.target.value.trim();
        });
        row.querySelector('.slide-title').addEventListener('input', (e) => {
          settings.hero_banners[index].title = e.target.value.trim();
        });
        row.querySelector('.slide-subtitle').addEventListener('input', (e) => {
          settings.hero_banners[index].subtitle = e.target.value.trim();
        });
        row.querySelector('.slide-cta').addEventListener('input', (e) => {
          settings.hero_banners[index].cta = e.target.value.trim();
        });
        row.querySelector('.slide-ctaHref').addEventListener('input', (e) => {
          settings.hero_banners[index].ctaHref = e.target.value.trim();
        });
        row.querySelector('.slide-img-url').addEventListener('input', (e) => {
          settings.hero_banners[index].img = e.target.value.trim();
          row.querySelector('.slide-image-preview').src = e.target.value.trim();
        });

        // Upload banner image
        const fileInput = row.querySelector('.slide-file-input');
        const uploadBtn = row.querySelector('.upload-slide-image-btn');
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
              settings.hero_banners[index].img = url;
              row.querySelector('.slide-img-url').value = url;
              row.querySelector('.slide-image-preview').src = url;
              showToast(`Tải lên ảnh slide #${index + 1} thành công!`, 'success');
            } else {
              showToast(data.error || 'Lỗi tải ảnh slide.', 'error');
            }
          } catch {
            showToast('Lỗi kết nối khi tải ảnh.', 'error');
          } finally {
            uploadBtn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Chọn ảnh
            `;
            uploadBtn.disabled = false;
          }
        });

        // Move slide up
        row.querySelector('.move-up-slide-btn').addEventListener('click', () => {
          if (index === 0) return;
          const temp = settings.hero_banners[index];
          settings.hero_banners[index] = settings.hero_banners[index - 1];
          settings.hero_banners[index - 1] = temp;
          showToast(`Đã chuyển Slide #${index + 1} lên vị trí #${index}`, 'success');
          renderUI();
        });

        // Move slide down
        row.querySelector('.move-down-slide-btn').addEventListener('click', () => {
          if (index === settings.hero_banners.length - 1) return;
          const temp = settings.hero_banners[index];
          settings.hero_banners[index] = settings.hero_banners[index + 1];
          settings.hero_banners[index + 1] = temp;
          showToast(`Đã chuyển Slide #${index + 1} xuống vị trí #${index + 2}`, 'success');
          renderUI();
        });

        // Delete slide
        row.querySelector('.delete-slide-btn').addEventListener('click', () => {
          settings.hero_banners.splice(index, 1);
          showToast('Đã xóa slide khỏi danh sách.', 'info');
          renderUI();
        });
      });

      // Add Slide
      container.querySelector('#add-banner-slide')?.addEventListener('click', () => {
        settings.hero_banners.push({
          img: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg',
          eyebrow: 'Bộ Sưu Tập Mới',
          title: 'Đỉnh Cao Phong Cách',
          subtitle: 'Khám phá ngay các dòng sản phẩm chất lượng nhất.',
          cta: 'Khám Phá',
          ctaHref: '/nam'
        });
        showToast('Đã thêm một slide banner trống ở cuối.', 'success');
        renderUI();
      });
    }

    // -------------------------------------------------------------
    // MENU CONFIGURATION
    // -------------------------------------------------------------
    if (activeTab === 'menu') {
      const menuList = container.querySelector('#menu-items-list');
      
      menuList?.querySelectorAll('[data-item-index]').forEach(itemRow => {
        const itemIdx = parseInt(itemRow.dataset.itemIndex, 10);
        const item = settings.navigation_menu[itemIdx];

        // Bind main inputs
        itemRow.querySelector('.menu-label')?.addEventListener('input', (e) => {
          item.label = e.target.value.trim();
        });
        itemRow.querySelector('.menu-href')?.addEventListener('input', (e) => {
          item.href = e.target.value.trim();
        });
        itemRow.querySelector('.menu-badge')?.addEventListener('input', (e) => {
          const val = e.target.value.trim();
          if (val) {
            item.badge = val;
          } else {
            delete item.badge;
          }
        });

        // Add child menu button
        itemRow.querySelector('.add-child-menu-btn')?.addEventListener('click', () => {
          if (!item.children) item.children = [];
          item.children.push({ label: 'Menu Con Mới', href: '#' });
          showToast('Đã thêm một dòng menu con mới.', 'success');
          renderUI();
        });

        // Delete main menu item
        itemRow.querySelector('.delete-menu-btn')?.addEventListener('click', () => {
          if (confirm('Xóa menu này sẽ xóa cả các menu con bên trong. Bạn có chắc không?')) {
            settings.navigation_menu.splice(itemIdx, 1);
            showToast('Đã xóa menu chính.', 'info');
            renderUI();
          }
        });

        // Move main menu item up
        itemRow.querySelector('.move-up-menu-btn')?.addEventListener('click', () => {
          if (itemIdx === 0) return;
          const temp = settings.navigation_menu[itemIdx];
          settings.navigation_menu[itemIdx] = settings.navigation_menu[itemIdx - 1];
          settings.navigation_menu[itemIdx - 1] = temp;
          renderUI();
        });

        // Move main menu item down
        itemRow.querySelector('.move-down-menu-btn')?.addEventListener('click', () => {
          if (itemIdx === settings.navigation_menu.length - 1) return;
          const temp = settings.navigation_menu[itemIdx];
          settings.navigation_menu[itemIdx] = settings.navigation_menu[itemIdx + 1];
          settings.navigation_menu[itemIdx + 1] = temp;
          renderUI();
        });

        // Child menu items
        itemRow.querySelectorAll('[data-child-index]').forEach(childRow => {
          const childIdx = parseInt(childRow.dataset.childIndex, 10);
          const child = item.children[childIdx];

          childRow.querySelector('.child-label')?.addEventListener('input', (e) => {
            child.label = e.target.value.trim();
          });
          childRow.querySelector('.child-href')?.addEventListener('input', (e) => {
            child.href = e.target.value.trim();
          });

          // Move child item up
          childRow.querySelector('.move-up-child-btn')?.addEventListener('click', () => {
            if (childIdx === 0) return;
            const temp = item.children[childIdx];
            item.children[childIdx] = item.children[childIdx - 1];
            item.children[childIdx - 1] = temp;
            renderUI();
          });

          // Move child item down
          childRow.querySelector('.move-down-child-btn')?.addEventListener('click', () => {
            if (childIdx === item.children.length - 1) return;
            const temp = item.children[childIdx];
            item.children[childIdx] = item.children[childIdx + 1];
            item.children[childIdx + 1] = temp;
            renderUI();
          });

          // Delete child item
          childRow.querySelector('.delete-child-btn')?.addEventListener('click', () => {
            item.children.splice(childIdx, 1);
            showToast('Đã xóa menu con.', 'info');
            renderUI();
          });
        });
      });

      // Add main menu item
      container.querySelector('#add-menu-item')?.addEventListener('click', () => {
        settings.navigation_menu.push({ label: 'Menu Mới', href: '#', children: [] });
        showToast('Đã thêm một menu chính mới.', 'success');
        renderUI();
      });
    }

    // -------------------------------------------------------------
    // HOME SECTIONS CONFIGURATION
    // -------------------------------------------------------------
    if (activeTab === 'sections') {
      if (!settings.home_sections) settings.home_sections = {};
      if (!settings.home_sections.announcement_bar) settings.home_sections.announcement_bar = { messages: [] };
      if (!settings.home_sections.promo_banner) settings.home_sections.promo_banner = { title: '', code: '', buttons: [] };
      if (!settings.home_sections.brand_story) settings.home_sections.brand_story = { title: '', subtitle: '', description: '', button_label: '', button_href: '', image_url: '' };
      if (!settings.home_sections.newsletter) settings.home_sections.newsletter = { title: '', description: '', button_label: '' };
      if (!settings.home_sections.category_banners) {
        settings.home_sections.category_banners = [
          { img: '', title: 'Đồng Hồ Nam', subtitle: 'Mạnh mẽ. Lịch lãm. Đẳng cấp.', href: '/nam' },
          { img: '', title: 'Đồng Hồ Nữ', subtitle: 'Thanh lịch. Tinh tế. Quyến rũ.', href: '/nu' },
          { img: '', title: 'Phụ Kiện', subtitle: 'Dây đeo. Hộp đựng. Phụ kiện cao cấp.', href: '/phu-kien' }
        ];
      }

      const sec = settings.home_sections;

      // 3. Category Banners
      const cbList = container.querySelector('#category-banners-list');
      cbList?.querySelectorAll('[data-cat-index]').forEach(catRow => {
        const index = parseInt(catRow.dataset.catIndex, 10);
        
        catRow.querySelector('.cat-title').addEventListener('input', (e) => {
          settings.home_sections.category_banners[index].title = e.target.value.trim();
        });
        catRow.querySelector('.cat-subtitle').addEventListener('input', (e) => {
          settings.home_sections.category_banners[index].subtitle = e.target.value.trim();
        });
        catRow.querySelector('.cat-href').addEventListener('input', (e) => {
          settings.home_sections.category_banners[index].href = e.target.value.trim();
        });
        catRow.querySelector('.cat-img-url').addEventListener('input', (e) => {
          const url = e.target.value.trim();
          settings.home_sections.category_banners[index].img = url;
          catRow.querySelector('.cat-image-preview').src = url || (index === 0 ? 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg' : index === 1 ? 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg' : 'https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg');
        });

        // Image upload
        const fileInput = catRow.querySelector('.cat-file-input');
        const uploadBtn = catRow.querySelector('.upload-cat-image-btn');
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
              settings.home_sections.category_banners[index].img = url;
              catRow.querySelector('.cat-img-url').value = url;
              catRow.querySelector('.cat-image-preview').src = url;
              showToast(`Tải lên ảnh banner con #${index + 1} thành công!`, 'success');
            } else {
              showToast(data.error || 'Lỗi tải ảnh banner con.', 'error');
            }
          } catch {
            showToast('Lỗi kết nối khi tải ảnh.', 'error');
          } finally {
            uploadBtn.innerHTML = `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Tải ảnh lên
            `;
            uploadBtn.disabled = false;
          }
        });
      });

      // 1. Announcement Bar messages
      const abMsgsList = container.querySelector('#announcement-msgs-list');
      abMsgsList?.querySelectorAll('[data-msg-index]').forEach(msgRow => {
        const idx = parseInt(msgRow.dataset.msgIndex, 10);
        msgRow.querySelector('.announcement-input').addEventListener('input', (e) => {
          sec.announcement_bar.messages[idx] = e.target.value.trim();
        });
        msgRow.querySelector('.delete-announcement-msg-btn').addEventListener('click', () => {
          sec.announcement_bar.messages.splice(idx, 1);
          showToast('Đã xóa dòng thông báo.', 'info');
          renderUI();
        });
      });

      container.querySelector('#add-announcement-msg')?.addEventListener('click', () => {
        sec.announcement_bar.messages.push('Thông báo mới');
        showToast('Đã thêm dòng thông báo trống.', 'success');
        renderUI();
      });

      // 2. Promo Banner
      container.querySelector('#promo-title')?.addEventListener('input', (e) => {
        sec.promo_banner.title = e.target.value.trim();
      });
      container.querySelector('#promo-code')?.addEventListener('input', (e) => {
        sec.promo_banner.code = e.target.value.trim();
      });

      // Buttons
      const buttonsContainer = container.querySelector('#promo-buttons-container');
      buttonsContainer?.querySelectorAll('[data-btn-index]').forEach(btnCard => {
        const idx = parseInt(btnCard.dataset.btnIndex, 10);
        if (!sec.promo_banner.buttons) sec.promo_banner.buttons = [];
        if (!sec.promo_banner.buttons[idx]) sec.promo_banner.buttons[idx] = { label: '', href: '' };

        btnCard.querySelector('.promo-btn-label').addEventListener('input', (e) => {
          sec.promo_banner.buttons[idx].label = e.target.value.trim();
        });
        btnCard.querySelector('.promo-btn-href').addEventListener('input', (e) => {
          sec.promo_banner.buttons[idx].href = e.target.value.trim();
        });
      });

      // 3. Brand Story
      container.querySelector('#brandstory-title')?.addEventListener('input', (e) => {
        sec.brand_story.title = e.target.value.trim();
      });
      container.querySelector('#brandstory-subtitle')?.addEventListener('input', (e) => {
        sec.brand_story.subtitle = e.target.value.trim();
      });
      container.querySelector('#brandstory-description')?.addEventListener('input', (e) => {
        sec.brand_story.description = e.target.value.trim();
      });
      container.querySelector('#brandstory-btn-label')?.addEventListener('input', (e) => {
        sec.brand_story.button_label = e.target.value.trim();
      });
      container.querySelector('#brandstory-btn-href')?.addEventListener('input', (e) => {
        sec.brand_story.button_href = e.target.value.trim();
      });
      container.querySelector('#brandstory-image-url')?.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        sec.brand_story.image_url = url;
        const imgPrev = container.querySelector('#brandstory-image-preview');
        if (imgPrev) imgPrev.src = url;
      });

      // Brand Story Image Upload
      const bsFileInput = container.querySelector('#brandstory-file-input');
      const bsUploadBtn = container.querySelector('#upload-brandstory-img-btn');
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
            container.querySelector('#brandstory-image-url').value = url;
            container.querySelector('#brandstory-image-preview').src = url;
            showToast('Tải lên ảnh giới thiệu thương hiệu thành công!', 'success');
          } else {
            showToast(data.error || 'Lỗi tải ảnh.', 'error');
          }
        } catch {
          showToast('Lỗi kết nối khi tải ảnh.', 'error');
        } finally {
          bsUploadBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Chọn ảnh
          `;
          bsUploadBtn.disabled = false;
        }
      });

      // 4. Newsletter
      container.querySelector('#newsletter-title')?.addEventListener('input', (e) => {
        sec.newsletter.title = e.target.value.trim();
      });
      container.querySelector('#newsletter-description')?.addEventListener('input', (e) => {
        sec.newsletter.description = e.target.value.trim();
      });
      container.querySelector('#newsletter-btn-label')?.addEventListener('input', (e) => {
        sec.newsletter.button_label = e.target.value.trim();
      });
    }

    // -------------------------------------------------------------
    // THEME COLOR SCHEMES
    // -------------------------------------------------------------
    if (activeTab === 'colors') {
      const pickers = container.querySelectorAll('.color-picker-input');
      pickers.forEach(picker => {
        picker.addEventListener('input', (e) => {
          const key = e.target.dataset.colorKey;
          const val = e.target.value;
          
          // Update Hex label next to it
          picker.nextElementSibling.querySelector('span:last-child').textContent = val.toUpperCase();
          
          // Update local copy and sync live mockup styling
          localColors[key] = val;
          settings.theme_colors[key] = val;
          updateMockupColors();
        });
      });

      // Reset Colors to default values
      container.querySelector('#reset-colors-default')?.addEventListener('click', () => {
        if (!confirm('Khôi phục toàn bộ bảng màu gốc của Venix Watch (Đen & Vàng Gold)?')) return;
        
        localColors = {
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
        settings.theme_colors = { ...localColors };
        showToast('Đã khôi phục bảng màu mặc định. Nhớ nhấn "Lưu Tất Cả" để áp dụng thực tế!', 'info');
        renderUI();
      });
    }

    // -------------------------------------------------------------
    // SAVE ALL SETTINGS SUBMIT ACTION
    // -------------------------------------------------------------
    container.querySelector('#save-all-settings')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.innerHTML = `<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Đang lưu...`;

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
          showToast('Lưu toàn bộ thay đổi cấu hình thành công!', 'success');
          // Reload settings into runtime environment
          window.APP_SETTINGS = settings;
          
          // Re-inject colors on page
          const styleEl = document.getElementById('dynamic-theme-vars');
          if (styleEl) {
            let styleText = ':root {\n';
            Object.entries(settings.theme_colors).forEach(([key, val]) => {
              if (val) styleText += `  --color-${key}: ${val};\n`;
            });
            styleText += '}';
            styleEl.textContent = styleText;
          }
          
          loadData(); // Refresh history table
        } else {
          showToast(json.error || 'Có lỗi xảy ra khi lưu cấu hình.', 'error');
          btn.disabled = false;
          btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Lưu Tất Cả`;
        }
      } catch {
        showToast('Lỗi kết nối máy chủ API.', 'error');
        btn.disabled = false;
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Lưu Tất Cả`;
      }
    });

    // -------------------------------------------------------------
    // ROLLBACK SETTINGS HISTORY ACTION
    // -------------------------------------------------------------
    container.querySelectorAll('.rollback-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const historyId = btn.dataset.id;
        if (!confirm('Bạn có chắc chắn muốn khôi phục cấu hình về phiên bản này?')) return;
        
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = 'Đang khôi phục...';
        
        try {
          const res = await fetch(`${API_BASE}/api/admin/settings/rollback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ history_id: parseInt(historyId, 10) })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            showToast('Hoàn tác cấu hình thành công!', 'success');
            
            // Force reload page to apply everything cleanly
            setTimeout(() => {
              window.location.reload();
            }, 600);
          } else {
            showToast(data.error || 'Lỗi khi khôi phục.', 'error');
            btn.disabled = false;
            btn.innerHTML = originalText;
          }
        } catch {
          showToast('Lỗi kết nối khi hoàn tác.', 'error');
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      });
    });

    // -------------------------------------------------------------
    // PAGINATION ACTIONS
    // -------------------------------------------------------------
    if (activeTab === 'history') {
      container.querySelector('#prev-page-btn')?.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          renderUI();
        }
      });
      container.querySelector('#next-page-btn')?.addEventListener('click', () => {
        const itemsPerPage = 15;
        const totalPages = Math.ceil(historyLogs.length / itemsPerPage) || 1;
        if (currentPage < totalPages) {
          currentPage++;
          renderUI();
        }
      });
      container.querySelectorAll('.page-num-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          currentPage = parseInt(btn.dataset.page, 10);
          renderUI();
        });
      });
    }
  }

  // Trigger loading
  loadData();
}
