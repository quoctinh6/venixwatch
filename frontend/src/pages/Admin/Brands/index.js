import { deleteBrand, getBrands } from '../../../services/adminService.js';
import { createConfirmDialog, createPagination, showToast } from '../shared/ui.js';
import { openBrandForm } from './BrandForm.js';

const PAGE_SIZE = 12;

let state = { data: [], page: 1, sortDir: {} };

export function renderBrands(container) {
  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Thương Hiệu</h2>
          <p class="text-sm text-gray-500 mt-0.5">Quản lý logo thương hiệu và nguồn top brand dùng ở menu ngoài storefront</p>
        </div>
        <button id="brand-add-btn" class="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-white rounded-lg text-sm font-medium hover:bg-[#b8963e]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Thêm thương hiệu
        </button>
      </div>
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Logo</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 sort-th" data-col="name">
                  <span class="flex items-center gap-1">Tên hiển thị <span class="sort-icon text-gray-300">⇅</span></span>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Khớp brand</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Slug</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 sort-th" data-col="count">
                  <span class="flex items-center gap-1">Sản phẩm <span class="sort-icon text-gray-300">⇅</span></span>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody id="brand-tbody" class="divide-y divide-gray-50">
              <tr><td colspan="7" class="py-8 text-center text-gray-400 text-sm">Đang tải...</td></tr>
            </tbody>
          </table>
        </div>
        <div class="px-4 py-3 border-t border-gray-100" id="brand-pagination"></div>
      </div>
    </div>
  `;

  container.querySelector('#brand-add-btn').addEventListener('click', () => {
    openBrandForm(null, () => loadBrands(container));
  });

  container.querySelectorAll('.sort-th').forEach((th) => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      const current = state.sortDir[col];
      state.sortDir = {};
      if (!current) state.sortDir[col] = 'asc';
      else if (current === 'asc') state.sortDir[col] = 'desc';
      state.page = 1;
      updateSortIcons(container);
      renderRows(container);
      renderPageNav(container);
    });
  });

  loadBrands(container);
}

async function loadBrands(container) {
  const tbody = container.querySelector('#brand-tbody');
  if (!tbody) return;
  try {
    const res = await getBrands();
    state.data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    renderRows(container);
    renderPageNav(container);
  } catch {
    tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-red-400 text-sm">Lỗi tải thương hiệu</td></tr>`;
  }
}

function updateSortIcons(container) {
  container.querySelectorAll('.sort-th').forEach((th) => {
    const dir = state.sortDir[th.dataset.col];
    const icon = th.querySelector('.sort-icon');
    if (!icon) return;
    if (dir === 'asc') {
      icon.textContent = '↑';
      icon.className = 'sort-icon text-[#C9A84C]';
    } else if (dir === 'desc') {
      icon.textContent = '↓';
      icon.className = 'sort-icon text-[#C9A84C]';
    } else {
      icon.textContent = '⇅';
      icon.className = 'sort-icon text-gray-300';
    }
  });
}

function getSortedRows() {
  const [col, dir] = Object.entries(state.sortDir).find(([, value]) => value) || [];
  const factor = dir === 'asc' ? 1 : -1;
  const list = [...state.data];
  if (!col) {
    return list.sort((a, b) => Number(b.products_count || 0) - Number(a.products_count || 0));
  }
  return list.sort((a, b) => {
    if (col === 'name') return String(a.name || '').localeCompare(String(b.name || '')) * factor;
    if (col === 'count') return (Number(a.products_count || 0) - Number(b.products_count || 0)) * factor;
    return 0;
  });
}

function renderRows(container) {
  const tbody = container.querySelector('#brand-tbody');
  const sorted = getSortedRows();

  if (!sorted.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-10 text-center text-gray-400 text-sm">Chưa có thương hiệu nào</td></tr>`;
    return;
  }

  const start = (state.page - 1) * PAGE_SIZE;
  const rows = sorted.slice(start, start + PAGE_SIZE);
  tbody.innerHTML = '';

  rows.forEach((brand) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50 transition-colors';
    tr.innerHTML = `
      <td class="px-4 py-3">
        <div class="w-12 h-12 rounded-xl border border-gray-200 bg-white overflow-hidden flex items-center justify-center">
          ${brand.logo_url
            ? `<img src="${brand.logo_url}" class="w-full h-full object-contain p-2" onerror="this.parentElement.innerHTML='<span class=&quot;text-[10px] text-gray-300&quot;>No logo</span>'">`
            : '<span class="text-[10px] text-gray-300">No logo</span>'}
        </div>
      </td>
      <td class="px-4 py-3 font-medium text-gray-900">${brand.name || '-'}</td>
      <td class="px-4 py-3 text-gray-600 text-xs font-mono">${brand.source_name || '-'}</td>
      <td class="px-4 py-3 text-gray-500 text-xs font-mono">${brand.slug || '-'}</td>
      <td class="px-4 py-3 text-gray-700">${Number(brand.products_count || 0)}</td>
      <td class="px-4 py-3">
        <span class="px-2 py-0.5 text-xs rounded-full font-medium ${Number(brand.is_active ?? 1) !== 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">
          ${Number(brand.is_active ?? 1) !== 0 ? 'Hiển thị' : 'Ẩn'}
        </span>
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

    tr.querySelector('.edit-btn').addEventListener('click', () => openBrandForm(brand, () => loadBrands(container)));
    tr.querySelector('.del-btn').addEventListener('click', () => {
      createConfirmDialog(`Xóa thương hiệu "${brand.name}"?`, async () => {
        try {
          await deleteBrand(brand.id);
          showToast('Đã xóa thương hiệu');
          loadBrands(container);
        } catch (err) {
          showToast(err.message || 'Không thể xóa thương hiệu', 'error');
        }
      });
    });

    tbody.appendChild(tr);
  });
}

function renderPageNav(container) {
  const wrap = container.querySelector('#brand-pagination');
  wrap.innerHTML = '';
  const totalPages = Math.ceil(state.data.length / PAGE_SIZE);
  if (totalPages <= 1) return;
  wrap.appendChild(createPagination(state.page, totalPages, (page) => {
    state.page = page;
    renderRows(container);
    renderPageNav(container);
  }));
}
