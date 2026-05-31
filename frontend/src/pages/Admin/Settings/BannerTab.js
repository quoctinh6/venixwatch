import { showToast } from '../shared/ui.js';

export function renderBannerTab(settings) {
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
}

export function bindBannerTab(container, settings, token, API_BASE, ctx) {
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
      ctx.renderUI();
    });

    // Move slide down
    row.querySelector('.move-down-slide-btn').addEventListener('click', () => {
      if (index === settings.hero_banners.length - 1) return;
      const temp = settings.hero_banners[index];
      settings.hero_banners[index] = settings.hero_banners[index + 1];
      settings.hero_banners[index + 1] = temp;
      showToast(`Đã chuyển Slide #${index + 1} xuống vị trí #${index + 2}`, 'success');
      ctx.renderUI();
    });

    // Delete slide
    row.querySelector('.delete-slide-btn').addEventListener('click', () => {
      settings.hero_banners.splice(index, 1);
      showToast('Đã xóa slide khỏi danh sách.', 'info');
      ctx.renderUI();
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
    ctx.renderUI();
  });
}
