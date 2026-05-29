import { getWarranties, deleteWarranty } from '../../../services/adminService.js';
import { createConfirmDialog, showToast, createPagination, formatDate } from '../shared/ui.js';
import { openWarrantyForm } from './WarrantyForm.js';

const PAGE_SIZE = 20;
let state = { page: 1, search: '', total: 0, data: [], sortDir: {} };

const STATUS_STYLES = {
  active:  'bg-green-100 text-green-700',
  claimed: 'bg-yellow-100 text-yellow-700',
  expired: 'bg-red-100 text-red-600',
};

const STATUS_LABELS = {
  active:  'Còn hiệu lực',
  claimed: 'Đã bảo hành',
  expired: 'Hết hạn',
};

export function renderWarrantyTable(container) {
  container.innerHTML = `
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-gray-100">
        <div class="relative w-full sm:w-72">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input id="warranty-search" class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]" placeholder="Tìm theo serial, khách hàng..." value="${state.search}">
        </div>
        <button id="warranty-add-btn" class="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-white rounded-lg text-sm font-medium hover:bg-[#b8963e] flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Thêm bảo hành
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Serial</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 sort-th" data-col="product">
                <span class="flex items-center gap-1">Sản phẩm <span class="sort-icon text-gray-300">⇅</span></span>
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 sort-th" data-col="customer">
                <span class="flex items-center gap-1">Khách hàng <span class="sort-icon text-gray-300">⇅</span></span>
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Điện thoại</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 sort-th" data-col="expires">
                <span class="flex items-center gap-1">Hết hạn <span class="sort-icon text-gray-300">⇅</span></span>
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Hành động</th>
            </tr>
          </thead>
          <tbody id="warranty-tbody" class="divide-y divide-gray-50">
            <tr><td colspan="7" class="py-8 text-center text-gray-400 text-sm">Đang tải...</td></tr>
          </tbody>
        </table>
      </div>
      <div class="px-4 py-3 border-t border-gray-100" id="warranty-pagination"></div>
    </div>
  `;

  let searchTimer;
  container.querySelector('#warranty-search').addEventListener('input', (event) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = event.target.value.trim();
      state.page = 1;
      loadWarranties(container);
    }, 300);
  });

  container.querySelector('#warranty-add-btn').addEventListener('click', () => {
    openWarrantyForm(null, () => loadWarranties(container));
  });

  container.querySelectorAll('.sort-th').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      const current = state.sortDir[col];
      state.sortDir = {};
      if (!current)            state.sortDir[col] = 'asc';
      else if (current === 'asc') state.sortDir[col] = 'desc';
      updateSortIcons(container);
      renderRows(container);
    });
  });

  loadWarranties(container);
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

function getSorted(data) {
  const [col, dir] = Object.entries(state.sortDir).find(([, v]) => v) || [];
  if (!col) return data;
  const factor = dir === 'asc' ? 1 : -1;
  return [...data].sort((a, b) => {
    let va, vb;
    if (col === 'product')  { va = (a.product_name || '').toLowerCase(); vb = (b.product_name || '').toLowerCase(); return va.localeCompare(vb) * factor; }
    if (col === 'customer') { va = (a.customer_name || '').toLowerCase(); vb = (b.customer_name || '').toLowerCase(); return va.localeCompare(vb) * factor; }
    if (col === 'expires')  { va = new Date(a.warranty_expires_at || 0).getTime(); vb = new Date(b.warranty_expires_at || 0).getTime(); return (va - vb) * factor; }
    return 0;
  });
}

async function loadWarranties(container) {
  const tbody = container.querySelector('#warranty-tbody');
  tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-gray-400 text-sm">Đang tải...</td></tr>`;

  try {
    const res = await getWarranties({ page: state.page, limit: PAGE_SIZE, search: state.search });
    const items = Array.isArray(res.data) ? res.data : [];
    state.total = Number(res.meta?.total ?? items.length);
    state.data = items;
    renderRows(container);
    renderPageNav(container);
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-red-400 text-sm">${error.message || 'Lỗi tải dữ liệu'}</td></tr>`;
  }
}

function renderRows(container) {
  const tbody = container.querySelector('#warranty-tbody');
  const rows = getSorted(state.data);

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-10 text-center text-gray-400 text-sm">Chưa có phiếu bảo hành nào</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  rows.forEach((warranty) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50 transition-colors';
    tr.innerHTML = `
      <td class="px-4 py-3 font-mono text-xs text-gray-700 font-medium">${warranty.serial_number || '-'}</td>
      <td class="px-4 py-3 text-gray-700 max-w-[180px] truncate">${warranty.product_name || '-'}</td>
      <td class="px-4 py-3 text-gray-700">${warranty.customer_name || '-'}</td>
      <td class="px-4 py-3 text-gray-600 text-xs">${warranty.customer_phone || '-'}</td>
      <td class="px-4 py-3 text-xs ${isExpiringSoon(warranty.warranty_expires_at) ? 'text-orange-600 font-semibold' : 'text-gray-600'}">${formatDate(warranty.warranty_expires_at)}</td>
      <td class="px-4 py-3">
        <span class="px-2 py-0.5 text-xs rounded-full font-medium ${STATUS_STYLES[warranty.status] || 'bg-gray-100 text-gray-600'}">${STATUS_LABELS[warranty.status] || warranty.status}</span>
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

    tr.querySelector('.edit-btn').addEventListener('click', () => openWarrantyForm(warranty, () => loadWarranties(container)));
    tr.querySelector('.del-btn').addEventListener('click', () => {
      createConfirmDialog(`Xóa bảo hành serial "${warranty.serial_number}"?`, async () => {
        try {
          await deleteWarranty(warranty.id);
          showToast('Đã xóa');
          loadWarranties(container);
        } catch (error) {
          showToast(error.message, 'error');
        }
      });
    });

    tbody.appendChild(tr);
  });
}

function isExpiringSoon(date) {
  if (!date) return false;
  const diff = new Date(date) - new Date();
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
}

function renderPageNav(container) {
  const wrap = container.querySelector('#warranty-pagination');
  wrap.innerHTML = '';
  const totalPages = Math.ceil(state.total / PAGE_SIZE);
  if (totalPages <= 1) return;
  wrap.appendChild(createPagination(state.page, totalPages, (page) => {
    state.page = page;
    loadWarranties(container);
  }));
}
