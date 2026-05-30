import { showToast } from '../shared/ui.js';

export function renderColorsTab(settings, localColors) {
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
                <span class="text-[var(--color-accent-gold-mockup)] text-[9px] font-serif uppercase tracking-wider">LOGO</span>
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

export function bindColorsTab(container, settings, localColors, ctx) {
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
      ctx.updateMockupColors();
    });
  });

  // Reset Colors to default values
  container.querySelector('#reset-colors-default')?.addEventListener('click', () => {
    if (!confirm('Khôi phục toàn bộ bảng màu gốc của Venix Watch (Đen & Vàng Gold)?')) return;
    
    const defaults = {
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

    Object.assign(localColors, defaults);
    settings.theme_colors = { ...localColors };
    showToast('Đã khôi phục bảng màu mặc định. Nhớ nhấn "Lưu Tất Cả" để áp dụng thực tế!', 'info');
    ctx.renderUI();
  });
}
