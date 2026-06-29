import { showToast } from '../shared/ui.js';
import { createWarranty, updateWarranty, getProducts } from '../../../services/adminService.js';

export function openWarrantyForm(warranty, onSaved) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
  overlay.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" data-lenis-prevent>
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
        <h2 class="text-lg font-bold text-gray-900">${warranty ? 'Cập nhật bảo hành' : 'Thêm bảo hành'}</h2>
        <button id="wf-close" class="text-gray-400 hover:text-gray-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <form id="warranty-form" class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Số serial *</label>
          <input name="serial_number" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]" value="${warranty?.serial_number || ''}" placeholder="SN-2024-XXXX"/>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Tìm kiếm sản phẩm</label>
          <input type="text" id="wf-product-search" class="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]" placeholder="Nhập tên sản phẩm để lọc..."/>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Sản phẩm</label>
          <select name="product_id" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]" id="wf-product">
            <option value="">-- Chọn sản phẩm --</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Order Item ID</label>
          <input name="order_item_id" type="number" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]" value="${warranty?.order_item_id || ''}"/>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Tên khách hàng</label>
            <input name="customer_name" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]" value="${warranty?.customer_name || ''}"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
            <input name="customer_phone" type="tel" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]" value="${warranty?.customer_phone || ''}"/>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Hết hạn bảo hành *</label>
          <input name="warranty_expires_at" type="date" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]" value="${warranty?.warranty_expires_at?.split('T')[0] || ''}"/>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái</label>
          <select name="status" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]">
            <option value="active" ${warranty?.status === 'active' ? 'selected' : ''}>Còn hiệu lực</option>
            <option value="claimed" ${warranty?.status === 'claimed' ? 'selected' : ''}>Đã bảo hành</option>
            <option value="expired" ${warranty?.status === 'expired' ? 'selected' : ''}>Hết hạn</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Ghi chú</label>
          <textarea name="notes" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C] resize-y min-h-[60px]">${warranty?.notes || ''}</textarea>
        </div>
        <div class="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" id="wf-cancel" class="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">Hủy</button>
          <button type="submit" id="wf-submit" class="px-5 py-2 rounded-lg bg-[#C9A84C] text-white hover:bg-[#b8963e] text-sm font-medium">Lưu</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);
  loadProducts(overlay, warranty?.product_id);

  const close = () => overlay.remove();
  overlay.querySelector('#wf-close').addEventListener('click', close);
  overlay.querySelector('#wf-cancel').addEventListener('click', close);

  overlay.querySelector('#warranty-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = overlay.querySelector('#wf-submit');
    btn.textContent = 'Đang lưu...'; btn.disabled = true;
    try {
      const fd = new FormData(e.target);
      const body = Object.fromEntries(fd.entries());
      if (body.order_item_id) body.order_item_id = Number(body.order_item_id);
      if (body.product_id) body.product_id = Number(body.product_id);
      if (warranty) await updateWarranty(warranty.id, body);
      else await createWarranty(body);
      showToast(warranty ? 'Cập nhật thành công!' : 'Thêm bảo hành thành công!');
      close();
      if (onSaved) onSaved();
    } catch (err) {
      showToast(err.message || 'Có lỗi xảy ra', 'error');
    } finally {
      btn.textContent = 'Lưu'; btn.disabled = false;
    }
  });
}

async function loadProducts(overlay, selectedId) {
  try {
    const res = await getProducts({ per_page: 200 });
    const items = Array.isArray(res.data) ? res.data : (Array.isArray(res.items) ? res.items : (Array.isArray(res) ? res : []));
    const sel = overlay.querySelector('#wf-product');
    const searchInput = overlay.querySelector('#wf-product-search');
    
    const populateOptions = (filterText = '') => {
      const currentSelected = sel.value || selectedId;
      sel.innerHTML = '<option value="">-- Chọn sản phẩm --</option>';
      items.forEach(p => {
        const name = p.name || '';
        const sku = p.sku || '';
        const text = `${name} (${sku || '—'})`;
        if (filterText && !text.toLowerCase().includes(filterText.toLowerCase())) {
          if (p.id != currentSelected) {
            return;
          }
        }
        const opt = document.createElement('option');
        opt.value = p.id; opt.textContent = text;
        if (p.id == currentSelected) opt.selected = true;
        sel.appendChild(opt);
      });
    };

    populateOptions();
    
    searchInput?.addEventListener('input', (e) => {
      populateOptions(e.target.value.trim());
    });
  } catch {}
}
