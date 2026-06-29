import { getFlashSales, deleteFlashSale } from '../../../services/adminService.js';
import { createConfirmDialog, showToast, formatPrice, formatDate, createPagination } from '../shared/ui.js';
import { openFlashSaleForm } from './FlashSaleForm.js';
import { openBulkDiscountModal } from '../Products/BulkDiscountModal.js';

const PAGE_SIZE = 10;
let state = { page: 1, sortDir: {}, data: [] };

export function renderFlashSales(container) {
  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Flash Sale</h2>
          <p class="text-sm text-gray-500 mt-0.5">Quản lý chương trình giảm giá có thời hạn</p>
        </div>
        <button id="fs-add-btn" class="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-white rounded-lg text-sm font-medium hover:bg-[#b8963e]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Thêm Flash Sale
        </button>
      </div>
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sản phẩm</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Giá gốc</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 sort-th" data-col="sale_price">
                  <span class="flex items-center gap-1">Giá sale <span class="sort-icon text-gray-300">⇅</span></span>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 sort-th" data-col="discount">
                  <span class="flex items-center gap-1">Giảm <span class="sort-icon text-gray-300">⇅</span></span>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 sort-th" data-col="starts_at">
                  <span class="flex items-center gap-1">Bắt đầu <span class="sort-icon text-gray-300">⇅</span></span>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 sort-th" data-col="ends_at">
                  <span class="flex items-center gap-1">Kết thúc <span class="sort-icon text-gray-300">⇅</span></span>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody id="fs-tbody" class="divide-y divide-gray-50">
              <tr><td colspan="8" class="py-8 text-center text-gray-400 text-sm">Đang tải...</td></tr>
            </tbody>
          </table>
        </div>
        <div class="px-4 py-3 border-t border-gray-100" id="fs-pagination"></div>
      </div>
    </div>
  `;

  container.querySelector('#fs-add-btn').addEventListener('click', () => {
    openBulkDiscountModal(() => loadFlashSales(container), { isFlashSaleMode: true });
  });

  container.querySelectorAll('.sort-th').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      const current = state.sortDir[col];
      state.sortDir = {};
      if (!current)            state.sortDir[col] = 'asc';
      else if (current === 'asc') state.sortDir[col] = 'desc';
      state.page = 1;
      updateSortIcons(container);
      renderRows(container);
      renderPageNav(container);
    });
  });

  loadFlashSales(container);
}

function updateSortIcons(container) {
  container.querySelectorAll('.sort-th').forEach(th => {
    const dir = state.sortDir[th.dataset.col];
    const icon = th.querySelector('.sort-icon');
    if (!icon) return;
    if (dir === 'asc')       { icon.textContent = '↑'; icon.className = 'sort-icon text-[#C9A84C]'; }
    else if (dir === 'desc') { icon.textContent = '↓'; icon.className = 'sort-icon text-[#C9A84C]'; }
    else                     { icon.textContent = '⇅'; icon.className = 'sort-icon text-gray-300'; }
  });
}

function getDiscount(sale) {
  const orig = sale.product?.price || sale.original_price || 0;
  const sp   = sale.sale_price || 0;
  return orig > 0 ? Math.round((1 - sp / orig) * 100) : 0;
}

function getSorted(data) {
  const [col, dir] = Object.entries(state.sortDir).find(([, v]) => v) || [];
  if (!col) return data;
  const factor = dir === 'asc' ? 1 : -1;
  return [...data].sort((a, b) => {
    let va, vb;
    if (col === 'sale_price') { va = Number(a.sale_price ?? 0); vb = Number(b.sale_price ?? 0); }
    if (col === 'discount')   { va = getDiscount(a); vb = getDiscount(b); }
    if (col === 'starts_at')  { va = new Date(a.starts_at || 0).getTime(); vb = new Date(b.starts_at || 0).getTime(); }
    if (col === 'ends_at')    { va = new Date(a.ends_at || 0).getTime(); vb = new Date(b.ends_at || 0).getTime(); }
    return (va - vb) * factor;
  });
}

async function loadFlashSales(container) {
  const tbody = container.querySelector('#fs-tbody');
  try {
    const res = await getFlashSales();
    state.data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    renderRows(container);
    renderPageNav(container);
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="8" class="py-8 text-center text-red-400 text-sm">${error.message || 'Lỗi tải dữ liệu'}</td></tr>`;
  }
}

function renderRows(container) {
  const tbody = container.querySelector('#fs-tbody');
  const sorted = getSorted(state.data);

  if (!sorted.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="py-10 text-center text-gray-400 text-sm">Chưa có Flash Sale nào</td></tr>`;
    return;
  }

  const now = new Date();
  const start = (state.page - 1) * PAGE_SIZE;
  const rows = sorted.slice(start, start + PAGE_SIZE);
  tbody.innerHTML = '';

  rows.forEach((sale) => {
    const startsAt = new Date(sale.starts_at);
    const endsAt = new Date(sale.ends_at);
    const status = now < startsAt ? 'upcoming' : now > endsAt ? 'expired' : 'active';
    const statusConfig = {
      active:   { cls: 'bg-green-100 text-green-700',  label: 'Đang diễn ra' },
      upcoming: { cls: 'bg-blue-100 text-blue-700',    label: 'Sắp diễn ra' },
      expired:  { cls: 'bg-gray-100 text-gray-500',    label: 'Đã kết thúc' },
    }[status];

    const originalPrice = sale.product?.price || sale.original_price || 0;
    const salePrice = sale.sale_price || 0;
    const discount = getDiscount(sale);

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50 transition-colors';
    tr.innerHTML = `
      <td class="px-4 py-3">
        <div class="flex items-center gap-3">
          <img src="${sale.product?.images?.[0] || ''}" alt="" class="w-10 h-10 object-cover rounded-lg bg-gray-100" onerror="this.style.display='none'">
          <div>
            <div class="font-medium text-gray-900 text-xs max-w-[160px] truncate">${sale.product?.name || '-'}</div>
            <div class="text-xs text-gray-400">${sale.product?.sku || ''}</div>
          </div>
        </div>
      </td>
      <td class="px-4 py-3 text-gray-500 text-xs line-through">${formatPrice(originalPrice)}</td>
      <td class="px-4 py-3 font-semibold text-red-600">${formatPrice(salePrice)}</td>
      <td class="px-4 py-3">
        ${discount > 0 ? `<span class="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-bold">-${discount}%</span>` : '-'}
      </td>
      <td class="px-4 py-3 text-xs text-gray-600">${formatDate(sale.starts_at)}</td>
      <td class="px-4 py-3 text-xs text-gray-600">${formatDate(sale.ends_at)}</td>
      <td class="px-4 py-3">
        <span class="px-2 py-0.5 text-xs rounded-full font-medium ${statusConfig.cls}">${statusConfig.label}</span>
      </td>
      <td class="px-4 py-3 text-right">
        <div class="flex items-center justify-end gap-1">
          <button class="edit-btn p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Chỉnh sửa">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="del-btn p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Xóa">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </td>
    `;

    tr.querySelector('.edit-btn').addEventListener('click', () => openFlashSaleForm(sale, () => loadFlashSales(container)));
    tr.querySelector('.del-btn').addEventListener('click', () => {
      createConfirmDialog(`Xóa Flash Sale sản phẩm "${sale.product?.name || sale.id}"?`, async () => {
        try {
          await deleteFlashSale(sale.id);
          showToast('Đã xóa');
          loadFlashSales(container);
        } catch (error) {
          showToast(error.message, 'error');
        }
      });
    });

    tbody.appendChild(tr);
  });
}

function renderPageNav(container) {
  const wrap = container.querySelector('#fs-pagination');
  wrap.innerHTML = '';
  const totalPages = Math.ceil(state.data.length / PAGE_SIZE);
  if (totalPages <= 1) return;
  wrap.appendChild(createPagination(state.page, totalPages, (page) => {
    state.page = page;
    renderRows(container);
    renderPageNav(container);
  }));
}
