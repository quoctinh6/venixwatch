import { showToast } from '../shared/ui.js';
import { createFlashSale, updateFlashSale, getProducts } from '../../../services/adminService.js';
import { formatPrice } from '../shared/ui.js';

export function openFlashSaleForm(flashSale, onSaved) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
  overlay.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" data-lenis-prevent>
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-bold text-gray-900">${flashSale ? 'Cập nhật Flash Sale' : 'Thêm Flash Sale'}</h2>
        <button id="fsf-close" class="text-gray-400 hover:text-gray-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <form id="flash-form" class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Tìm kiếm sản phẩm</label>
          <input type="text" id="fsf-product-search" class="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]" placeholder="Nhập tên sản phẩm để lọc..."/>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Sản phẩm *</label>
          <select name="product_id" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]" id="fsf-product">
            <option value="">-- Chọn sản phẩm --</option>
          </select>
        </div>
        <div id="fsf-orig-price" class="text-xs text-gray-500 hidden">
          Giá gốc: <span id="fsf-orig-value" class="font-semibold text-gray-700"></span>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Giá Flash Sale (₫) *</label>
          <input name="sale_price" type="number" required min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]" value="${flashSale?.sale_price || ''}" placeholder="0"/>
        </div>
        <div id="fsf-discount-preview" class="text-xs text-green-600 font-medium hidden"></div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Bắt đầu *</label>
            <input name="starts_at" type="datetime-local" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]" value="${toDatetimeLocal(flashSale?.starts_at)}"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Kết thúc *</label>
            <input name="ends_at" type="datetime-local" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]" value="${toDatetimeLocal(flashSale?.ends_at)}"/>
          </div>
        </div>
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-700">
          <svg class="inline w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          Flash Sale sẽ tự động kích hoạt vào giờ bắt đầu và hết hiệu lực vào giờ kết thúc.
        </div>
        <div class="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" id="fsf-cancel" class="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">Hủy</button>
          <button type="submit" id="fsf-submit" class="px-5 py-2 rounded-lg bg-[#C9A84C] text-white hover:bg-[#b8963e] text-sm font-medium">Lưu</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('#fsf-close').addEventListener('click', close);
  overlay.querySelector('#fsf-cancel').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  let products = [];
  loadProductOptions(overlay, flashSale?.product_id).then(p => { 
    products = p; 
    // Trigger initial preview if product selected
    updatePreview();
  });

  const sel = overlay.querySelector('#fsf-product');
  const salePriceInput = overlay.querySelector('[name="sale_price"]');
  const origDiv = overlay.querySelector('#fsf-orig-price');
  const origVal = overlay.querySelector('#fsf-orig-value');
  const discPreview = overlay.querySelector('#fsf-discount-preview');

  const updatePreview = () => {
    const p = products.find(x => x.id == sel.value);
    if (p && p.price) {
      origDiv.classList.remove('hidden');
      origVal.textContent = formatPrice(p.price);
      const sale = Number(salePriceInput.value);
      if (sale > 0 && sale < p.price) {
        const pct = Math.round((1 - sale / p.price) * 100);
        discPreview.textContent = `Giảm ${pct}% — tiết kiệm ${formatPrice(p.price - sale)}`;
        discPreview.classList.remove('hidden');
      } else { discPreview.classList.add('hidden'); }
    } else { origDiv.classList.add('hidden'); discPreview.classList.add('hidden'); }
  };
  sel.addEventListener('change', updatePreview);
  salePriceInput.addEventListener('input', updatePreview);

  overlay.querySelector('#flash-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = overlay.querySelector('#fsf-submit');
    btn.textContent = 'Đang lưu...'; btn.disabled = true;
    try {
      const fd = new FormData(e.target);
      const body = Object.fromEntries(fd.entries());
      body.product_id = Number(body.product_id);
      body.sale_price = Number(body.sale_price);
      if (flashSale) await updateFlashSale(flashSale.id, body);
      else await createFlashSale(body);
      showToast(flashSale ? 'Cập nhật thành công!' : 'Thêm Flash Sale thành công!');
      close(); if (onSaved) onSaved();
    } catch (err) { showToast(err.message || 'Có lỗi xảy ra', 'error'); }
    finally { btn.textContent = 'Lưu'; btn.disabled = false; }
  });
}

async function loadProductOptions(overlay, selectedId) {
  try {
    const res = await getProducts({ per_page: 200 });
    const items = Array.isArray(res.data) ? res.data : (Array.isArray(res.items) ? res.items : (Array.isArray(res) ? res : []));
    const list = Array.isArray(items) ? items : [];
    const sel = overlay.querySelector('#fsf-product');
    const searchInput = overlay.querySelector('#fsf-product-search');
    
    const populateOptions = (filterText = '') => {
      const currentSelected = sel.value || selectedId;
      sel.innerHTML = '<option value="">-- Chọn sản phẩm --</option>';
      list.forEach(p => {
        const name = p.name || '';
        const sku = p.sku || '';
        const text = `${name} — ${formatPrice(p.price)}`;
        if (filterText && !name.toLowerCase().includes(filterText.toLowerCase()) && !sku.toLowerCase().includes(filterText.toLowerCase())) {
          if (p.id != currentSelected) {
            return;
          }
        }
        const opt = document.createElement('option');
        opt.value = p.id; opt.textContent = text;
        opt.dataset.price = p.price;
        if (p.id == currentSelected) opt.selected = true;
        sel.appendChild(opt);
      });
    };

    populateOptions();
    
    searchInput?.addEventListener('input', (e) => {
      populateOptions(e.target.value.trim());
      // Trigger preview update after filtering/changing
      const triggerChangeEvent = new Event('change');
      sel.dispatchEvent(triggerChangeEvent);
    });
    
    return list;
  } catch { return []; }
}

function toDatetimeLocal(isoStr) {
  if (!isoStr) return '';
  return isoStr.replace(' ', 'T').slice(0, 16);
}
