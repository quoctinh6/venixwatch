import { showToast } from '../shared/ui.js';
import { getCategories, getBrands, getProducts, bulkDiscount } from '../../../services/adminService.js';

export function openBulkDiscountModal(onSaved, options = {}) {
  const isFlashSaleMode = !!options.isFlashSaleMode;
  const title = isFlashSaleMode ? 'Thiết lập Flash Sale hàng loạt' : 'Thiết lập giảm giá hàng loạt';
  const durationLabel = isFlashSaleMode ? '3. Thời hạn áp dụng *' : '3. Thời hạn áp dụng (Tùy chọn)';
  const durationHelp = isFlashSaleMode ? 'Vui lòng chọn thời gian bắt đầu và kết thúc cho Flash Sale.' : 'Để trống nếu muốn giảm giá vĩnh viễn (không giới hạn thời gian).';
  const startsRequired = isFlashSaleMode ? 'required' : '';
  const endsRequired = isFlashSaleMode ? 'required' : '';

  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';

  overlay.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto" data-lenis-prevent>
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <h2 class="text-lg font-bold text-gray-900">${title}</h2>
        <button id="bdm-close" class="text-gray-400 hover:text-gray-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <form id="bulk-discount-form" class="p-6 space-y-5">
        <!-- 1. Chọn Đối tượng Áp dụng -->
        <div class="space-y-2">
          <label class="form-label font-bold text-gray-900">1. Đối tượng áp dụng</label>
          <div class="flex gap-2 p-1 bg-gray-100 rounded-lg text-xs font-semibold">
            <button type="button" id="tab-brand" class="flex-1 py-1.5 rounded-md text-center bg-white text-gray-900 shadow-sm border border-gray-200">Theo Thương hiệu</button>
            <button type="button" id="tab-category" class="flex-1 py-1.5 rounded-md text-center text-gray-500 hover:text-gray-900">Theo Danh mục</button>
            <button type="button" id="tab-sku" class="flex-1 py-1.5 rounded-md text-center text-gray-500 hover:text-gray-900">Theo Mã sản phẩm (SKU)</button>
          </div>
          
          <input type="hidden" name="scope" id="bdm-scope" value="brand">

          <!-- Dropdown thương hiệu -->
          <div id="wrapper-brand" class="mt-2">
            <label class="form-label">Chọn thương hiệu</label>
            <select id="bdm-brand" class="form-input">
              <option value="">-- Đang tải thương hiệu --</option>
            </select>
          </div>

          <!-- Dropdown danh mục -->
          <div id="wrapper-category" class="mt-2 hidden">
            <label class="form-label">Chọn danh mục</label>
            <select id="bdm-category" class="form-input">
              <option value="">-- Đang tải danh mục --</option>
            </select>
          </div>

          <!-- Nhập SKU có gợi ý tự động -->
          <div id="wrapper-sku" class="mt-2 hidden space-y-2">
            <label class="form-label">Tìm kiếm & thêm mã sản phẩm (SKU)</label>
            <div class="relative">
              <input type="text" id="bdm-sku-search" class="form-input" placeholder="Nhập mã sản phẩm hoặc SKU..." autocomplete="off">
              <div id="bdm-sku-results" class="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto hidden z-20">
              </div>
            </div>
            <div id="bdm-selected-skus" class="flex flex-wrap gap-1.5 pt-1">
            </div>
          </div>
        </div>

        <!-- 2. Cấu hình giảm giá -->
        <div class="space-y-3 border-t border-gray-100 pt-4">
          <label class="form-label font-bold text-gray-900">2. Mức giảm giá</label>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="form-label">Kiểu giảm giá</label>
              <select name="discount_type" class="form-input bg-white">
                <option value="percentage">Giảm theo Phần trăm (%)</option>
                <option value="amount">Giảm theo Số tiền (VND)</option>
              </select>
            </div>
            <div>
              <label class="form-label">Giá trị giảm</label>
              <input type="number" name="discount_value" required min="1" class="form-input" placeholder="Ví dụ: 10% hoặc 500000đ"/>
            </div>
          </div>
        </div>

        <!-- 3. Cấu hình thời hạn -->
        <div class="space-y-3 border-t border-gray-100 pt-4">
          <label class="form-label font-bold text-gray-900">${durationLabel}</label>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="form-label">Thời gian bắt đầu</label>
              <input type="datetime-local" name="starts_at" ${startsRequired} class="form-input"/>
            </div>
            <div>
              <label class="form-label">Thời gian kết thúc</label>
              <input type="datetime-local" name="ends_at" ${endsRequired} class="form-input"/>
            </div>
          </div>
          <p class="text-xs text-gray-400">${durationHelp}</p>
        </div>

        <!-- SUBMIT / CANCEL -->
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" id="bdm-cancel" class="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">Hủy</button>
          <button type="button" id="bdm-clear" class="px-5 py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium">Xóa giảm giá</button>
          <button type="submit" id="bdm-submit" class="px-5 py-2 rounded-lg bg-[#C9A84C] text-white hover:bg-[#b8963e] text-sm font-medium">Áp dụng</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  if (window.lenis) window.lenis.stop();

  // Elements
  const form = overlay.querySelector('#bulk-discount-form');
  const scopeInput = overlay.querySelector('#bdm-scope');
  
  const tabBrand = overlay.querySelector('#tab-brand');
  const tabCategory = overlay.querySelector('#tab-category');
  const tabSku = overlay.querySelector('#tab-sku');

  const wrapBrand = overlay.querySelector('#wrapper-brand');
  const wrapCategory = overlay.querySelector('#wrapper-category');
  const wrapSku = overlay.querySelector('#wrapper-sku');

  const selectBrand = overlay.querySelector('#bdm-brand');
  const selectCategory = overlay.querySelector('#bdm-category');
  
  const skuSearchInput = overlay.querySelector('#bdm-sku-search');
  const skuResultsDiv = overlay.querySelector('#bdm-sku-results');
  const selectedSkusDiv = overlay.querySelector('#bdm-selected-skus');

  // Selected SKUs array
  let selectedSKUs = [];

  // Tab switching logic
  const activateTab = (activeTab, activeWrap, scopeValue) => {
    [tabBrand, tabCategory, tabSku].forEach(btn => {
      btn.className = 'flex-1 py-1.5 rounded-md text-center text-gray-500 hover:text-gray-900';
    });
    activeTab.className = 'flex-1 py-1.5 rounded-md text-center bg-white text-gray-900 shadow-sm border border-gray-200';
    
    [wrapBrand, wrapCategory, wrapSku].forEach(w => w.classList.add('hidden'));
    activeWrap.classList.remove('hidden');
    scopeInput.value = scopeValue;
  };

  tabBrand.addEventListener('click', () => activateTab(tabBrand, wrapBrand, 'brand'));
  tabCategory.addEventListener('click', () => activateTab(tabCategory, wrapCategory, 'category'));
  tabSku.addEventListener('click', () => activateTab(tabSku, wrapSku, 'sku'));

  // Load brands list
  async function loadBrandsList() {
    try {
      const res = await getBrands();
      const brands = res.data || res;
      selectBrand.innerHTML = '<option value="">-- Chọn thương hiệu --</option>';
      (Array.isArray(brands) ? brands : []).forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.source_name;
        opt.textContent = b.name;
        selectBrand.appendChild(opt);
      });
    } catch (e) {
      selectBrand.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
    }
  }

  // Load categories list
  async function loadCategoriesList() {
    try {
      const res = await getCategories();
      const cats = res.data || res;
      selectCategory.innerHTML = '<option value="">-- Chọn danh mục --</option>';
      (Array.isArray(cats) ? cats : []).forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.parent_id ? `  ↳ ${c.name}` : c.name;
        selectCategory.appendChild(opt);
      });
    } catch (e) {
      selectCategory.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
    }
  }

  loadBrandsList();
  loadCategoriesList();

  // SKU Autocomplete Search logic
  let searchTimeout;
  skuSearchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const query = skuSearchInput.value.trim();
    if (!query) {
      skuResultsDiv.innerHTML = '';
      skuResultsDiv.classList.add('hidden');
      return;
    }

    searchTimeout = setTimeout(async () => {
      try {
        const res = await getProducts({ search: query, limit: 10 });
        const items = res.data || [];
        skuResultsDiv.innerHTML = '';

        const filtered = items.filter(item => item.sku && !selectedSKUs.includes(item.sku));

        if (filtered.length === 0) {
          skuResultsDiv.innerHTML = '<div class="p-3 text-xs text-gray-500 italic">Không tìm thấy sản phẩm hoặc sản phẩm đã chọn</div>';
        } else {
          filtered.forEach(item => {
            const div = document.createElement('div');
            div.className = 'p-3 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0 flex items-center justify-between';
            div.innerHTML = `
              <span class="font-medium text-gray-900">${item.name}</span>
              <span class="text-gray-400 font-mono text-[10px]">${item.sku}</span>
            `;
            div.addEventListener('click', () => {
              addSkuTag(item.sku);
              skuSearchInput.value = '';
              skuResultsDiv.classList.add('hidden');
            });
            skuResultsDiv.appendChild(div);
          });
        }
        skuResultsDiv.classList.remove('hidden');
      } catch (e) {
        console.error('SKU search failed:', e);
      }
    }, 300);
  });

  // Close suggestions on outside click
  document.addEventListener('click', (e) => {
    if (!skuSearchInput.contains(e.target) && !skuResultsDiv.contains(e.target)) {
      skuResultsDiv.classList.add('hidden');
    }
  });

  function addSkuTag(sku) {
    if (selectedSKUs.includes(sku)) return;
    selectedSKUs.push(sku);
    renderSkuTags();
  }

  function removeSkuTag(sku) {
    selectedSKUs = selectedSKUs.filter(s => s !== sku);
    renderSkuTags();
  }

  function renderSkuTags() {
    selectedSkusDiv.innerHTML = '';
    selectedSKUs.forEach(sku => {
      const tag = document.createElement('span');
      tag.className = 'inline-flex items-center gap-1 px-2 py-1 rounded bg-[#C9A84C]/10 text-[#B8963E] border border-[#C9A84C]/25 text-[10px] font-semibold';
      tag.innerHTML = `
        <span>${sku}</span>
        <button type="button" class="hover:text-red-500 font-bold ml-0.5">×</button>
      `;
      tag.querySelector('button').addEventListener('click', () => removeSkuTag(sku));
      selectedSkusDiv.appendChild(tag);
    });
  }

  // Modal actions (Close/Cancel)
  const close = () => {
    overlay.remove();
    document.body.style.overflow = '';
    if (window.lenis) window.lenis.start();
  };

  overlay.querySelector('#bdm-close').addEventListener('click', close);
  overlay.querySelector('#bdm-cancel').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Submit bulk discount API
  const handleDiscountAction = async (actionType) => {
    const scope = scopeInput.value;
    let targetValues = [];

    if (scope === 'brand') {
      const val = selectBrand.value;
      if (!val) {
        showToast('Vui lòng chọn một thương hiệu.', 'error');
        return;
      }
      targetValues = [val];
    } else if (scope === 'category') {
      const val = selectCategory.value;
      if (!val) {
        showToast('Vui lòng chọn một danh mục.', 'error');
        return;
      }
      targetValues = [val];
    } else if (scope === 'sku') {
      if (selectedSKUs.length === 0) {
        showToast('Vui lòng chọn ít nhất một mã sản phẩm (SKU).', 'error');
        return;
      }
      targetValues = selectedSKUs;
    }

    const fd = new FormData(form);
    const discountType = fd.get('discount_type');
    const discountValue = Number(fd.get('discount_value'));

    if (actionType === 'apply') {
      if (!discountValue || discountValue <= 0) {
        showToast('Mức giảm giá phải lớn hơn 0.', 'error');
        return;
      }
      if (discountType === 'percentage' && discountValue > 100) {
        showToast('Giảm giá theo phần trăm không thể vượt quá 100%.', 'error');
        return;
      }
    }

    // Format local datetime to MySQL compatible format (YYYY-MM-DD HH:MM:SS)
    const formatDateTime = (localIsoStr) => {
      if (!localIsoStr) return null;
      const d = new Date(localIsoStr);
      if (isNaN(d.getTime())) return null;
      return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0') + ' ' +
        String(d.getHours()).padStart(2, '0') + ':' +
        String(d.getMinutes()).padStart(2, '0') + ':' +
        String(d.getSeconds()).padStart(2, '0');
    };

    const startsAt = formatDateTime(fd.get('starts_at'));
    const endsAt = formatDateTime(fd.get('ends_at'));

    if (actionType === 'apply' && isFlashSaleMode && (!startsAt || !endsAt)) {
      showToast('Vui lòng chọn thời gian bắt đầu và kết thúc cho Flash Sale.', 'error');
      return;
    }

    if (actionType === 'apply' && startsAt && endsAt && new Date(startsAt) >= new Date(endsAt)) {
      showToast('Thời gian kết thúc phải lớn hơn thời gian bắt đầu.', 'error');
      return;
    }

    const btnSubmit = overlay.querySelector('#bdm-submit');
    const btnClear = overlay.querySelector('#bdm-clear');
    
    btnSubmit.disabled = true;
    btnClear.disabled = true;

    try {
      const reqData = {
        scope,
        target_values: targetValues,
        action: actionType,
        discount_type: discountType,
        discount_value: discountValue,
        starts_at: startsAt,
        ends_at: endsAt
      };

      const res = await bulkDiscount(reqData);
      if (res.success) {
        showToast(actionType === 'apply' ? 'Áp dụng giảm giá thành công!' : 'Đã xóa giảm giá thành công!');
        close();
        if (onSaved) onSaved();
      } else {
        showToast(res.error || 'Thao tác thất bại.', 'error');
      }
    } catch (e) {
      showToast(e.message || 'Lỗi hệ thống.', 'error');
    } finally {
      btnSubmit.disabled = false;
      btnClear.disabled = false;
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleDiscountAction('apply');
  });

  overlay.querySelector('#bdm-clear').addEventListener('click', () => {
    handleDiscountAction('clear');
  });
}
