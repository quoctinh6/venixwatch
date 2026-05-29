import { showToast } from '../pages/Admin/shared/ui.js';
import { API_BASE, STORAGE_KEYS } from '../services/config.js';

let modalEl = null;

function getAdminToken() {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || localStorage.getItem('dhat_token');
}

export function openQuickSettings(defaultTab = 'brand', slideIndex = 0) {
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
  let selectedSlideIndex = slideIndex;
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


  function renderModal() {
    modalEl.innerHTML = `
      <div class="bg-white border border-gray-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans max-h-[90vh]">
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
        <div class="px-5 pt-3 flex border-b border-gray-100 gap-4 text-xs font-bold text-gray-400">
          <button id="tab-brand-trigger" class="pb-2 border-b-2 transition-all ${activeTab === 'brand' ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-transparent hover:text-gray-700'}">
            Thương hiệu & Logo
          </button>
          <button id="tab-banner-trigger" class="pb-2 border-b-2 transition-all ${activeTab === 'banner' ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-transparent hover:text-gray-700'}">
            Banner Trang Chủ
          </button>
          <button id="tab-colors-trigger" class="pb-2 border-b-2 transition-all ${activeTab === 'colors' ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-transparent hover:text-gray-700'}">
            Màu Sắc Giao Diện
          </button>
        </div>

        <!-- Body Form -->
        <div class="p-6 flex-1 overflow-y-auto space-y-5 text-xs text-gray-700">
          ${activeTab === 'brand' ? renderBrandForm() : (activeTab === 'banner' ? renderBannerForm() : renderColorsForm())}
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
            <div id="quick-logo-preview" class="w-16 h-16 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden">
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

  function bindEvents() {
    // Close / Cancel
    modalEl.querySelector('#close-quick-modal').addEventListener('click', () => restoreInitialColors());
    modalEl.querySelector('#cancel-quick-modal').addEventListener('click', () => restoreInitialColors());

    // Tabs triggers
    modalEl.querySelector('#tab-brand-trigger').addEventListener('click', () => {
      activeTab = 'brand';
      renderModal();
    });
    modalEl.querySelector('#tab-banner-trigger').addEventListener('click', () => {
      activeTab = 'banner';
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

