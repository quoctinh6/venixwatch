import { showToast } from '../shared/ui.js';

export function renderSectionsTab(settings) {
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

export function bindSectionsTab(container, settings, token, API_BASE, ctx) {
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
      ctx.renderUI();
    });
  });

  container.querySelector('#add-announcement-msg')?.addEventListener('click', () => {
    sec.announcement_bar.messages.push('Thông báo mới');
    showToast('Đã thêm dòng thông báo trống.', 'success');
    ctx.renderUI();
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

  // 4. Brand Story
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

  // 5. Newsletter
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
