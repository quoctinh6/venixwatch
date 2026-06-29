import { showToast } from '../shared/ui.js';
import { createProduct, updateProduct, getCategories, getBrands, getProducts, getVariants, getProduct } from '../../../services/adminService.js';
import { openImagePicker } from './ImagePicker.js';

const MOVEMENTS = ['automatic', 'quartz', 'mechanical', 'solar'];

const BADGE_LABEL = { NEW: 'bg-blue-100 text-blue-700', BESTSELLER: 'bg-yellow-100 text-yellow-700', SALE: 'bg-red-100 text-red-700' };

function normalizeSpecs(specs) {
  const normalized = {};
  if (!specs) return normalized;

  if (Array.isArray(specs)) {
    // Array format: [{"label": "Xuất xứ", "value": "Thụy Sỹ"}, ...]
    specs.forEach(item => {
      if (item && typeof item === 'object' && item.label && item.value !== undefined) {
        normalized[item.label] = item.value;
      }
    });
  } else if (typeof specs === 'object') {
    // Key-value object format: {"Xuất xứ": "Thụy Sỹ"}
    Object.entries(specs).forEach(([k, v]) => {
      if (v !== null && v !== undefined) {
        normalized[k] = String(v);
      }
    });
  }
  return normalized;
}

function parseSpecsFromDescription(html) {
  if (!html) return { description: '', specs: [] };

  const doc = document.createElement('div');
  doc.innerHTML = html;

  const specs = [];

  // 1. Try WooCommerce format: Table rows with th (label) and td (value)
  const rows = doc.querySelectorAll('tr');
  rows.forEach(row => {
    const th = row.querySelector('th');
    const td = row.querySelector('td');
    if (th && td) {
      const label = th.textContent.trim().replace(/:$/, '');
      const value = td.textContent.trim();
      if (label && value) {
        specs.push({ label, value });
      }
    }
  });

  // 2. Fallback to td with strong element format
  if (specs.length === 0) {
    const tds = doc.querySelectorAll('td');
    tds.forEach(td => {
      const strong = td.querySelector('strong');
      if (strong) {
        const label = strong.textContent.trim().replace(/:$/, '');
        let valText = td.innerHTML.replace(strong.outerHTML, '').replace(/<br\s*\/?>/gi, '\n');
        const temp = document.createElement('div');
        temp.innerHTML = valText;
        const value = temp.textContent.trim().replace(/\s+/g, ' ');
        
        if (label && value) {
          specs.push({ label, value });
        }
      }
    });
  }

  // 3. Remove all specification tables from description HTML
  const tables = doc.querySelectorAll('table');
  tables.forEach(table => table.remove());

  // 4. Remove headings or paragraphs introducing the specifications
  const headers = doc.querySelectorAll('h1, h2, h3, h4, p, strong, span');
  headers.forEach(el => {
    const text = el.textContent.toLowerCase().trim();
    if (
      text === 'thông số kỹ thuật' || text === 'thông số kĩ thuật' ||
      text === 'hông số kỹ thuật' || text === 'hông số kĩ thuật' ||
      text.includes('thông số kỹ thuật') || text.includes('thông số kĩ thuật')
    ) {
      const parentP = el.closest('p') || el.closest('h1') || el.closest('h2') || el.closest('h3') || el.closest('h4');
      if (parentP) {
        parentP.remove();
      } else {
        el.remove();
      }
    }
  });

  return {
    description: doc.innerHTML.trim(),
    specs
  };
}

export function openProductForm(product, onSaved) {
  let initialDescription = product?.description || '';
  let parsedSpecsObj = {};
  
  const brandLower = String(product?.brand || '').toLowerCase();
  const isPremiumLayout = brandLower === 'carnival' || brandLower === 'casio' || brandLower === 'kemil';
  const descLower = initialDescription.toLowerCase();
  if (product && isPremiumLayout && (descLower.includes('thông số kỹ thuật') || descLower.includes('thông số kĩ thuật') || descLower.includes('hông số kỹ thuật') || descLower.includes('hông số kĩ thuật'))) {
    const parsed = parseSpecsFromDescription(initialDescription);
    initialDescription = parsed.description;
    parsedSpecsObj = normalizeSpecs(parsed.specs);
  }

  let specs = { ...parsedSpecsObj, ...normalizeSpecs(product?.specs) };



  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';

  const badgeHtml = product?.badge
    ? `<span class="px-2 py-0.5 text-xs rounded-full font-semibold ${BADGE_LABEL[product.badge] || 'bg-gray-100 text-gray-700'}">${product.badge}</span>`
    : `<span class="text-xs text-gray-400 italic">Chưa có badge</span>`;

  overlay.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto" data-lenis-prevent>
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <h2 class="text-lg font-bold text-gray-900">${product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}</h2>
        <button id="pf-close" class="text-gray-400 hover:text-gray-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <form id="product-form" class="p-6 space-y-6">
        <!-- SECTION 1: THÔNG TIN CƠ BẢN & HÌNH ẢNH (CỐ ĐỊNH) -->
        <div class="space-y-4">
          <h3 class="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Thông tin cơ bản</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="form-label">Tên sản phẩm *</label>
              <input name="name" required class="form-input" value="${product?.name || ''}" placeholder="Omega Seamaster..."/>
            </div>

            <div>
              <label class="form-label">Slug</label>
              <div class="flex gap-2">
                <input name="slug" id="pf-slug" class="form-input flex-1" value="${product?.slug || ''}" placeholder="omega-seamaster"/>
                <button type="button" id="pf-gen-slug" title="Tạo slug từ tên"
                  class="px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50 whitespace-nowrap flex items-center gap-1">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                  Tự động
                </button>
              </div>
            </div>

            <div>
              <label class="form-label">SKU *</label>
              <input name="sku" required class="form-input" value="${product?.sku || ''}" placeholder="OM-SM-001"/>
            </div>

            <div>
              <label class="form-label">Danh mục *</label>
              <select name="category_id" class="form-input" id="pf-category"><option value="">-- Chọn --</option></select>
            </div>

            <div>
              <label class="form-label">Thương hiệu *</label>
              <select name="brand" required class="form-input" id="pf-brand">
                <option value="">-- Chọn --</option>
              </select>
            </div>

            <div>
              <label class="form-label">Giá gốc (₫) *</label>
              <input name="price" type="number" required class="form-input" value="${product?.price || ''}" placeholder="0"/>
            </div>

            <div>
              <label class="form-label">Giá sale (₫)</label>
              <input name="sale_price" type="number" class="form-input" value="${product?.sale_price || ''}" placeholder="0"/>
            </div>

            <div>
              <label class="form-label">Số lượng tồn</label>
              <input name="stock" type="number" class="form-input" value="${product?.stock ?? 0}"/>
            </div>

            <div class="col-span-2 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span class="text-xs font-medium text-gray-600">Badge hiện tại:</span>
              ${badgeHtml}
              <span class="text-xs text-gray-400 ml-auto">Badge tự động tính dựa trên dữ liệu đặt hàng & ngày thêm</span>
            </div>
          </div>

          <div>
            <label class="form-label font-semibold text-gray-900">Hình ảnh (tối đa 5)</label>
            <div id="pf-images" class="space-y-2 mt-1"></div>
            <button type="button" id="pf-add-img" class="mt-2 text-sm text-[#C9A84C] hover:underline flex items-center gap-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Thêm hình ảnh
            </button>
          </div>
        </div>

        <!-- MOVABLE CONTAINER (DESCRIPTION & SPECS) -->
        <div id="movable-sections" class="space-y-6">
          
          <!-- SECTION A: MÔ TẢ SẢN PHẨM -->
          <div id="section-description" class="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-200/60">
            <div class="flex items-center justify-between border-b border-gray-200 pb-2">
              <h3 class="text-sm font-bold text-gray-900 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                Mô tả sản phẩm
              </h3>
              <button type="button" class="swap-sections-btn px-2.5 py-1 text-xs font-semibold text-[#C9A84C] border border-[#C9A84C]/30 rounded hover:bg-[#C9A84C]/5 transition-colors flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="8 3 12 7 16 3"/><line x1="12" y1="7" x2="12" y2="15"/><polyline points="16 21 12 17 8 21"/><line x1="12" y1="17" x2="12" y2="9"/></svg>
                ⇅ Đổi vị trí
              </button>
            </div>
             <div>
              <textarea name="description" rows="10" class="form-input resize-y min-h-[150px]">${initialDescription}</textarea>
            </div>
          </div>

          <!-- SECTION B: THÔNG TIN & THÔNG SỐ KỸ THUẬT -->
          <div id="section-specs" class="space-y-4 bg-gray-50/50 p-4 rounded-xl border border-gray-200/60">
            <div class="flex items-center justify-between border-b border-gray-200 pb-2">
              <h3 class="text-sm font-bold text-gray-900 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
                Thông tin & Thông số kỹ thuật
              </h3>
              <button type="button" class="swap-sections-btn px-2.5 py-1 text-xs font-semibold text-[#C9A84C] border border-[#C9A84C]/30 rounded hover:bg-[#C9A84C]/5 transition-colors flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="8 3 12 7 16 3"/><line x1="12" y1="7" x2="12" y2="15"/><polyline points="16 21 12 17 8 21"/><line x1="12" y1="17" x2="12" y2="9"/></svg>
                ⇅ Đổi vị trí
              </button>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">Chất liệu vỏ</label>
                <input name="case_material" class="form-input" value="${product?.case_material || specs['Chất liệu vỏ'] || specs['case_material'] || ''}" placeholder="Thép không gỉ 316L, Nhựa Resin..."/>
              </div>

              <div>
                <label class="form-label">Kích thước vỏ (mm)</label>
                <input name="case_size" class="form-input" value="${product?.case_size || specs['Đường kính mặt'] || specs['Kích thước vỏ'] || specs['Chiều cao vỏ (bao gồm chấu)'] || ''}" placeholder="40mm, 45.4mm..."/>
              </div>

              <div>
                <label class="form-label">Loại máy</label>
                <select name="movement_type" class="form-input">
                  ${MOVEMENTS.map(m => `<option value="${m}" ${(product?.movement_type === m || (specs['Loại máy'] || '').toLowerCase() === m) ? 'selected' : ''}>${m}</option>`).join('')}
                </select>
              </div>

              <div>
                <label class="form-label">Kháng nước (ATM)</label>
                <input name="water_resistance" class="form-input" value="${product?.water_resistance || specs['Kháng nước'] || specs['Chống nước'] || specs['Kháng nước (ATM)'] || ''}" placeholder="5ATM, 20ATM..."/>
              </div>

              <div>
                <label class="form-label">Xuất xứ</label>
                <input name="spec_origin" class="form-input" value="${specs['Xuất xứ'] || ''}" placeholder="Thụy Sỹ, Nhật Bản..."/>
              </div>

              <div>
                <label class="form-label">Giới tính</label>
                <select name="spec_gender" class="form-input">
                  <option value="" ${!specs['Giới tính'] ? 'selected' : ''}>-- Mặc định --</option>
                  <option value="Nam" ${specs['Giới tính'] === 'Nam' ? 'selected' : ''}>Nam</option>
                  <option value="Nữ" ${specs['Giới tính'] === 'Nữ' ? 'selected' : ''}>Nữ</option>
                  <option value="Unisex" ${specs['Giới tính'] === 'Unisex' ? 'selected' : ''}>Unisex</option>
                </select>
              </div>

              <div>
                <label class="form-label">Độ dày vỏ</label>
                <input name="spec_thickness" class="form-input" value="${specs['Độ dày vỏ'] || specs['Độ dày'] || ''}" placeholder="8.2mm, 11.8mm..."/>
              </div>

              <div>
                <label class="form-label">Mặt kính</label>
                <input name="spec_glass" class="form-input" value="${specs['Mặt kính'] || ''}" placeholder="Sapphire chống xước, Kính khoáng..."/>
              </div>

              <div>
                <label class="form-label">Chất liệu dây (Dây đeo)</label>
                <input name="spec_strap" class="form-input" value="${specs['Chất liệu dây'] || specs['Dây đeo'] || ''}" placeholder="Da bê Ý cao cấp, Dây nhựa..."/>
              </div>

              <div>
                <label class="form-label">Màu mặt số</label>
                <input name="spec_dial_color" class="form-input" value="${specs['Màu mặt số'] || ''}" placeholder="Trắng ngọc trai, Đen..."/>
              </div>

              <div>
                <label class="form-label">Độ chính xác</label>
                <input name="spec_accuracy" class="form-input" value="${specs['Độ chính xác'] || ''}" placeholder="±10s/tháng..."/>
              </div>

              <div>
                <label class="form-label">Thông tin pin / Trữ năng lượng</label>
                <input name="spec_power_reserve" class="form-input" value="${specs['Trữ năng lượng'] || specs['Thông tin pin / Trữ năng lượng'] || specs['Thông tin pin'] || ''}" placeholder="72 giờ, 3 năm..."/>
              </div>

              <div>
                <label class="form-label">Trọng lượng</label>
                <input name="spec_weight" class="form-input" value="${specs['Trọng lượng'] || ''}" placeholder="38g, 51g..."/>
              </div>

              <div>
                <label class="form-label">Bảo hành</label>
                <input name="spec_warranty" class="form-input" value="${specs['Bảo hành'] || ''}" placeholder="2 năm chính hãng..."/>
              </div>

              <div class="col-span-2">
                <label class="form-label">Phụ kiện đi kèm</label>
                <input name="spec_accessories" class="form-input" value="${specs['Phụ kiện đi kèm'] || ''}" placeholder="Hộp đựng, sách hướng dẫn..."/>
              </div>
            </div>

            <!-- DYNAMIC CUSTOM SPECS -->
            <div class="border-t border-gray-200 pt-4 mt-2">
              <label class="form-label font-semibold text-gray-900">Thông số tùy chỉnh khác (ví dụ: Cấu trúc, Thông tin pin, Chiều cao vỏ...)</label>
              <div id="pf-custom-specs" class="space-y-2 mt-2"></div>
              <button type="button" id="pf-add-custom-spec" class="mt-2 text-sm text-[#C9A84C] hover:underline flex items-center gap-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Thêm thông số tùy chỉnh
              </button>
            </div>
          </div>
        </div>

        <!-- SECTION: CẤU HÌNH BIẾN THỂ -->
        <div class="space-y-4 border-t border-gray-100 pt-4">
          <h3 class="text-sm font-bold text-gray-900 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M9 2h6l1 5H8L9 2z"/><path d="M8 17l1 5h6l1-5"/><line x1="12" y1="9" x2="12" y2="12"/><line x1="12" y1="12" x2="14" y2="12"/></svg>
            Cấu hình biến thể (Variants)
          </h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="form-label">Sản phẩm gốc (Sản phẩm cha)</label>
              <div class="relative">
                <input type="hidden" name="parent_id" id="pf-parent-id" value="${product?.parent_id || ''}">
                <div class="flex gap-2">
                  <input type="text" id="pf-parent-search" class="form-input flex-1" placeholder="Tìm kiếm sản phẩm cha bằng tên hoặc SKU..." autocomplete="off">
                  <button type="button" id="pf-parent-clear" class="px-3 py-2 border border-red-200 text-red-500 rounded-lg text-xs hover:bg-red-50 hidden">
                    Xóa liên kết
                  </button>
                </div>
                <div id="pf-parent-results" class="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto hidden z-20">
                </div>
              </div>
              <p class="text-xs text-gray-400 mt-1">Để trống nếu đây là sản phẩm chính (không có sản phẩm cha).</p>
            </div>

            <div class="col-span-2">
              <label class="form-label">Màu sắc mặt đồng hồ (Biến thể màu sắc)</label>
              <input name="dial_color" class="form-input" value="${product?.dial_color || ''}" placeholder="Đen, Trắng, Xanh dương..."/>
            </div>
            <input type="hidden" name="strap_type" value="${product?.strap_type || ''}"/>

            <div class="col-span-2 border-t border-gray-100 pt-3" id="pf-related-variants-section">
              <label class="form-label font-semibold text-gray-900">Các biến thể khác của sản phẩm này</label>
              <div id="pf-related-variants-list" class="space-y-2 mt-2">
                <div class="text-xs text-gray-400 italic">Đang tải các biến thể khác...</div>
              </div>
            </div>
          </div>
        </div>

        <!-- SECTION 4: META SEO & VISIBILITY (CỐ ĐỊNH) -->
        <div class="space-y-4 border-t border-gray-100 pt-4">
          <h3 class="text-sm font-bold text-gray-900">Cấu hình SEO & Hiển thị</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="form-label">Meta Title</label>
              <input name="meta_title" class="form-input" value="${product?.meta_title || ''}"/>
            </div>
            <div>
              <label class="form-label">Meta Description</label>
              <input name="meta_description" class="form-input" value="${product?.meta_description || ''}"/>
            </div>
          </div>

          <div class="flex items-center gap-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_active" class="w-4 h-4 accent-[#C9A84C]" ${product?.is_active !== false ? 'checked' : ''}>
              <span class="text-sm text-gray-700">Kích hoạt</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_featured" class="w-4 h-4 accent-[#C9A84C]" ${product?.is_featured ? 'checked' : ''}>
              <span class="text-sm text-gray-700">Nổi bật</span>
            </label>
          </div>
        </div>

        <!-- SUBMIT / CANCEL -->
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" id="pf-cancel" class="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">Hủy</button>
          <button type="submit" id="pf-submit" class="px-5 py-2 rounded-lg bg-[#C9A84C] text-white hover:bg-[#b8963e] text-sm font-medium">Lưu</button>
        </div>
      </form>
    </div>
  `;

  injectFormStyles();
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  if (window.lenis) window.lenis.stop();

  const close = () => {
    overlay.remove();
    document.body.style.overflow = '';
    if (window.lenis) window.lenis.start();
  };

  loadCategories(overlay, product?.category_id);
  loadBrands(overlay, product?.brand);
  setupImages(overlay, product?.images || []);
  setupCustomSpecs(overlay, specs);
  setupParentAutocomplete(overlay, product);
  setupRelatedVariants(overlay, product, onSaved, close);

  // Handle initial layout ordering
  const layoutDescFirst = specs._layout_desc_first !== false;
  const secDesc = overlay.querySelector('#section-description');
  const secSpecs = overlay.querySelector('#section-specs');
  const movableParent = secDesc.parentNode;
  if (!layoutDescFirst) {
    movableParent.insertBefore(secSpecs, secDesc);
  }

  // Handle Section Swapping
  overlay.querySelectorAll('.swap-sections-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = overlay.querySelector('#section-description');
      const s = overlay.querySelector('#section-specs');
      const p = d.parentNode;
      const descIsFirst = d.nextSibling === s;
      if (descIsFirst) {
        p.insertBefore(s, d);
      } else {
        p.insertBefore(d, s);
      }
    });
  });

  overlay.querySelector('#pf-close').addEventListener('click', close);
  overlay.querySelector('#pf-cancel').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const nameInput = overlay.querySelector('[name="name"]');
  const slugInput = overlay.querySelector('#pf-slug');

  // Auto-slug while typing (new products only)
  nameInput.addEventListener('input', () => {
    if (!product) slugInput.value = slugify(nameInput.value);
  });

  // Manual slug generate button
  overlay.querySelector('#pf-gen-slug').addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (name) slugInput.value = slugify(name);
  });

  overlay.querySelector('#product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = overlay.querySelector('#pf-submit');
    btn.textContent = 'Đang lưu...'; btn.disabled = true;
    try {
      const fd = new FormData(e.target);
      const body = Object.fromEntries(fd.entries());
      body.is_active = fd.has('is_active');
      body.is_featured = fd.has('is_featured');
      const imgInputs = overlay.querySelectorAll('.pf-img-input');
      body.images = [...imgInputs].map(i => i.value.trim()).filter(Boolean);
      body.price = Number(body.price);
      body.stock = Number(body.stock);
      if (body.sale_price) body.sale_price = Number(body.sale_price);
      else delete body.sale_price;

      body.parent_id = body.parent_id ? Number(body.parent_id) : null;
      body.dial_color = body.dial_color ? body.dial_color.trim() : null;
      body.strap_type = body.strap_type ? body.strap_type.trim() : null;

      // Build specs JSON object
      const specsObj = {};

      // 1. Predefined specs
      const specMapping = {
        'Xuất xứ': fd.get('spec_origin'),
        'Giới tính': fd.get('spec_gender'),
        'Độ dày': fd.get('spec_thickness'),
        'Mặt kính': fd.get('spec_glass'),
        'Chất liệu dây': fd.get('spec_strap'),
        'Màu mặt số': fd.get('spec_dial_color'),
        'Độ chính xác': fd.get('spec_accuracy'),
        'Trữ năng lượng': fd.get('spec_power_reserve'),
        'Trọng lượng': fd.get('spec_weight'),
        'Bảo hành': fd.get('spec_warranty'),
        'Phụ kiện đi kèm': fd.get('spec_accessories'),
      };

      Object.entries(specMapping).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val.trim() !== '') {
          specsObj[key] = val.trim();
        }
      });

      // 2. Custom specs
      const customRows = overlay.querySelectorAll('.pf-custom-spec-row');
      customRows.forEach(row => {
        const key = row.querySelector('.pf-spec-key').value.trim();
        const val = row.querySelector('.pf-spec-val').value.trim();
        if (key && val) {
          specsObj[key] = val;
        }
      });

      // 3. Layout configuration (Description first vs. Specs first)
      const d = overlay.querySelector('#section-description');
      const s = overlay.querySelector('#section-specs');
      const descIsFirst = d.nextSibling === s;
      specsObj._layout_desc_first = descIsFirst;

      body.specs = specsObj;

      // Clean up temp spec fields to avoid polluting top-level model fields
      delete body.spec_origin;
      delete body.spec_gender;
      delete body.spec_thickness;
      delete body.spec_glass;
      delete body.spec_strap;
      delete body.spec_dial_color;
      delete body.spec_accuracy;
      delete body.spec_power_reserve;
      delete body.spec_weight;
      delete body.spec_warranty;
      delete body.spec_accessories;

      if (product) { await updateProduct(product.id, body); showToast('Cập nhật thành công!'); }
      else { await createProduct(body); showToast('Thêm sản phẩm thành công!'); }
      close();
      if (onSaved) onSaved();
    } catch (err) {
      showToast(err.message || 'Có lỗi xảy ra', 'error');
    } finally {
      btn.textContent = 'Lưu'; btn.disabled = false;
    }
  });
}

async function loadCategories(overlay, selectedId) {
  try {
    const res = await getCategories();
    const cats = res.data || res;
    const sel = overlay.querySelector('#pf-category');
    (Array.isArray(cats) ? cats : []).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.parent_id ? `  ↳ ${c.name}` : c.name;
      if (c.id == selectedId) opt.selected = true;
      sel.appendChild(opt);
    });
  } catch {}
}

async function loadBrands(overlay, selectedBrand) {
  try {
    const res = await getBrands();
    const brands = res.data || res;
    const sel = overlay.querySelector('#pf-brand');
    // Clear existing to avoid duplicate options
    sel.innerHTML = '<option value="">-- Chọn --</option>';
    (Array.isArray(brands) ? brands : []).forEach(b => {
      if (Number(b.is_active ?? 1) === 0 && b.source_name !== selectedBrand) return;
      const opt = document.createElement('option');
      opt.value = b.source_name;
      opt.textContent = b.name;
      if (b.source_name === selectedBrand) opt.selected = true;
      sel.appendChild(opt);
    });
  } catch {}
}

function setupImages(overlay, existing) {
  const wrap = overlay.querySelector('#pf-images');
  const addBtn = overlay.querySelector('#pf-add-img');

  const addRow = (val = '') => {
    if (wrap.children.length >= 5) return;
    const row = document.createElement('div');
    row.className = 'flex gap-2 items-center';

    row.innerHTML = `
      <div class="pf-thumb w-10 h-10 rounded border border-dashed border-gray-300 flex-shrink-0 bg-gray-50 overflow-hidden flex items-center justify-center">
        ${val ? `<img src="${val}" class="w-full h-full object-cover" onerror="this.style.display='none'">` : ''}
      </div>
      <input class="form-input pf-img-input flex-1 text-xs" placeholder="Dán URL ảnh hoặc chọn từ thư viện..." value="${val}"/>
      <button type="button" class="pick-btn px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50 whitespace-nowrap">
        Chọn ảnh
      </button>
      <button type="button" class="del-img-btn text-red-400 hover:text-red-600 px-1 flex-shrink-0">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    const imgInput = row.querySelector('.pf-img-input');
    const thumb = row.querySelector('.pf-thumb');

    const setPreview = (url) => {
      if (url) {
        thumb.innerHTML = `<img src="${url}" class="w-full h-full object-cover" onerror="this.style.display='none'">`;
      } else {
        thumb.innerHTML = '';
      }
    };

    imgInput.addEventListener('input', () => setPreview(imgInput.value.trim()));

    row.querySelector('.pick-btn').addEventListener('click', () => {
      openImagePicker((url) => {
        imgInput.value = url;
        setPreview(url);
      });
    });

    row.querySelector('.del-img-btn').addEventListener('click', () => row.remove());
    wrap.appendChild(row);
  };

  existing.forEach(url => addRow(url));
  if (!existing.length) addRow();
  addBtn.addEventListener('click', () => addRow());
}

function setupCustomSpecs(overlay, specs = {}) {
  const wrap = overlay.querySelector('#pf-custom-specs');
  const addBtn = overlay.querySelector('#pf-add-custom-spec');

  const knownKeys = [
    'Xuất xứ',
    'Giới tính',
    'Độ dày',
    'Mặt kính',
    'Chất liệu dây',
    'Màu mặt số',
    'Độ chính xác',
    'Trữ năng lượng',
    'Trọng lượng',
    'Bảo hành',
    'Phụ kiện đi kèm',
    '_layout_desc_first'
  ];

  const addRow = (key = '', val = '') => {
    const row = document.createElement('div');
    row.className = 'flex gap-2 items-center pf-custom-spec-row';

    row.innerHTML = `
      <input class="form-input pf-spec-key flex-1 text-xs" placeholder="Tên thông số (VD: Cấu trúc)" value="${key}"/>
      <input class="form-input pf-spec-val flex-1 text-xs" placeholder="Giá trị (VD: Chống sốc)" value="${val}"/>
      <button type="button" class="del-spec-btn text-red-400 hover:text-red-600 px-1 flex-shrink-0">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    row.querySelector('.del-spec-btn').addEventListener('click', () => row.remove());
    wrap.appendChild(row);
  };

  // Populate existing custom specs
  Object.entries(specs).forEach(([k, v]) => {
    if (!knownKeys.includes(k) && v !== null && v !== '') {
      addRow(k, v);
    }
  });

  addBtn.addEventListener('click', () => addRow());
}

function slugify(text) {
  const map = {
    'àáạảãâầấậẩẫăằắặẳẵ': 'a', 'èéẹẻẽêềếệểễ': 'e', 'ìíịỉĩ': 'i',
    'òóọỏõôồốộổỗơờớợởỡ': 'o', 'ùúụủũưừứựửữ': 'u', 'ỳýỵỷỹ': 'y', 'đ': 'd',
  };
  let s = text.toLowerCase().trim();
  for (const [chars, rep] of Object.entries(map)) {
    for (const ch of [...chars]) s = s.replaceAll(ch, rep);
  }
  return s.replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-').replace(/^-+|-+$/g, '');
}

function injectFormStyles() {
  if (document.getElementById('pf-styles')) return;
  const s = document.createElement('style');
  s.id = 'pf-styles';
  s.textContent = `.form-label{display:block;font-size:.8125rem;font-weight:500;color:#374151;margin-bottom:.375rem}.form-input{width:100%;padding:.5rem .75rem;border:1px solid #d1d5db;border-radius:.5rem;font-size:.875rem;outline:none;transition:border-color .15s;background:#fff}.form-input:focus{border-color:#C9A84C;box-shadow:0 0 0 3px rgba(201,168,76,.15)}`;
  document.head.appendChild(s);
}

async function setupParentAutocomplete(overlay, product) {
  const parentIdInput = overlay.querySelector('#pf-parent-id');
  const searchInput = overlay.querySelector('#pf-parent-search');
  const clearBtn = overlay.querySelector('#pf-parent-clear');
  const resultsDiv = overlay.querySelector('#pf-parent-results');

  // If there's an existing parent_id, fetch its details to display in the input
  if (product && product.parent_id) {
    const parentId = product.parent_id;
    try {
      const token = localStorage.getItem('token') || '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`/api/admin/products/${parentId}`, { headers }).then(r => r.json());
      if (res.success && res.data) {
        const parentProd = res.data;
        searchInput.value = `[${parentProd.sku}] ${parentProd.name}`;
        clearBtn.classList.remove('hidden');
      }
    } catch (err) {
      console.error('Failed to load parent product:', err);
    }
  }

  let debounceTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    const query = searchInput.value.trim();
    if (!query) {
      resultsDiv.innerHTML = '';
      resultsDiv.classList.add('hidden');
      return;
    }

    debounceTimeout = setTimeout(async () => {
      try {
        const res = await getProducts({ search: query, limit: 10 });
        const items = res.data || [];
        resultsDiv.innerHTML = '';
        
        // Filter out current product to prevent self-referencing
        const filteredItems = items.filter(item => !product || item.id !== product.id);

        if (filteredItems.length === 0) {
          resultsDiv.innerHTML = '<div class="p-3 text-xs text-gray-500 italic">Không tìm thấy sản phẩm phù hợp</div>';
        } else {
          filteredItems.forEach(item => {
            const div = document.createElement('div');
            div.className = 'p-3 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0 flex items-center justify-between';
            div.innerHTML = `
              <span class="font-medium text-gray-900">${item.name}</span>
              <span class="text-gray-400 font-mono">${item.sku || ''}</span>
            `;
            div.addEventListener('click', () => {
              parentIdInput.value = item.id;
              searchInput.value = `[${item.sku}] ${item.name}`;
              resultsDiv.classList.add('hidden');
              clearBtn.classList.remove('hidden');
            });
            resultsDiv.appendChild(div);
          });
        }
        resultsDiv.classList.remove('hidden');
      } catch (err) {
        console.error('Error fetching parent products autocomplete:', err);
      }
    }, 300);
  });

  // Close results div when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !resultsDiv.contains(e.target)) {
      resultsDiv.classList.add('hidden');
    }
  });

  clearBtn.addEventListener('click', () => {
    parentIdInput.value = '';
    searchInput.value = '';
    clearBtn.classList.add('hidden');
    resultsDiv.innerHTML = '';
    resultsDiv.classList.add('hidden');
  });
}

async function setupRelatedVariants(overlay, product, onSaved, closeForm) {
  const container = overlay.querySelector('#pf-related-variants-list');
  if (!container) return;

  if (!product) {
    container.innerHTML = '<div class="text-xs text-gray-400 italic">Sản phẩm mới chưa lưu, chưa có biến thể liên quan.</div>';
    return;
  }

  try {
    const res = await getVariants(product.id);
    const variants = res.data || [];

    if (variants.length === 0) {
      container.innerHTML = '<div class="text-xs text-gray-400 italic">Không có biến thể khác.</div>';
      return;
    }

    container.innerHTML = '';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50';
    
    let html = `
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-gray-100 border-b border-gray-200 text-gray-600 font-semibold">
            <th class="p-2 w-10">Ảnh</th>
            <th class="p-2">SKU</th>
            <th class="p-2">Tên biến thể</th>
            <th class="p-2">Màu mặt số</th>
            <th class="p-2">Giá</th>
            <th class="p-2">Kho</th>
            <th class="p-2 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
    `;

    const formatPriceLocal = (num) => {
      if (num === null || num === undefined) return '-';
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
    };

    variants.forEach(v => {
      const img = v.images?.[0] || '';
      const attrText = v.dial_color || '-';
      
      const priceText = v.sale_price 
        ? `<div class="text-red-600 font-semibold">${formatPriceLocal(v.sale_price)}</div><div class="line-through text-gray-400 text-[10px]">${formatPriceLocal(v.price)}</div>`
        : `<div class="font-medium text-gray-700">${formatPriceLocal(v.price)}</div>`;

      const lowStock = Number(v.stock ?? 0) < 5;
      const stockBadge = `<span class="px-1.5 py-0.5 rounded font-medium ${lowStock ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}">${v.stock ?? 0}</span>`;

      html += `
        <tr class="hover:bg-gray-50/50 transition-colors">
          <td class="p-2">
            ${img 
              ? `<img src="${img}" class="w-8 h-8 object-cover rounded border border-gray-100 bg-gray-50" onerror="this.style.display='none'">`
              : `<div class="w-8 h-8 rounded bg-gray-100 border border-gray-200"></div>`
            }
          </td>
          <td class="p-2 text-gray-500 font-mono text-[10px]">${v.sku || '-'}</td>
          <td class="p-2">
            <div class="font-medium text-gray-900 line-clamp-1" title="${v.name}">${v.name}</div>
          </td>
          <td class="p-2 text-gray-500 text-[10px]">${attrText}</td>
          <td class="p-2 whitespace-nowrap">${priceText}</td>
          <td class="p-2">${stockBadge}</td>
          <td class="p-2 text-right font-mono">
            <button type="button" data-id="${v.id}" class="edit-variant-btn inline-flex items-center gap-1 px-2 py-1 rounded bg-[#C9A84C]/10 text-[#B8963E] hover:bg-[#C9A84C]/20 transition-colors font-medium">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Sửa
            </button>
          </td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    wrapper.innerHTML = html;
    container.appendChild(wrapper);

    container.querySelectorAll('.edit-variant-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const variantId = Number(btn.dataset.id);
        btn.textContent = '...';
        btn.disabled = true;
        try {
          const detailRes = await getProduct(variantId);
          if (detailRes.success && detailRes.data) {
            closeForm();
            openProductForm(detailRes.data, onSaved);
          } else {
            showToast('Không thể tải thông tin chi tiết biến thể này.', 'error');
            btn.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Sửa`;
            btn.disabled = false;
          }
        } catch (e) {
          showToast('Lỗi khi tải chi tiết biến thể: ' + (e.message || ''), 'error');
          btn.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Sửa`;
          btn.disabled = false;
        }
      });
    });

  } catch (err) {
    container.innerHTML = `<div class="text-xs text-red-500 italic">Lỗi khi tải danh sách biến thể: ${err.message}</div>`;
  }
}
