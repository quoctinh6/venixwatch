import { getProducts, deleteProduct, toggleProduct } from '../../../services/adminService.js';
import { computeBadges } from '../../../services/adminService.js';
import { createConfirmDialog, showToast, createPagination, formatPrice } from '../shared/ui.js';
import { openProductForm } from './ProductForm.js';

const PAGE_SIZE = 10;

// sort field → [asc key, desc key]
const SORT_COLS = {
  sku:      ['sku_asc',    'sku_desc'],
  name:     ['name_asc',   'name_desc'],
  category: ['cat_asc',    'cat_desc'],
  price:    ['price_asc',  'price_desc'],
  stock:    ['stock_asc',  'stock_desc'],
};

let state = { page: 1, search: '', sort: '', sortDir: {}, total: 0, data: [] };

export function renderProductTable(container) {
  container.innerHTML = `
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-gray-100">
        <div class="relative w-full sm:w-72">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input id="prod-search" class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]"
            placeholder="Tìm theo tên, SKU..." value="${state.search}">
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <button id="prod-badge-btn" title="Tính toán lại badge dựa trên dữ liệu thực"
            class="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            Cập nhật badge
          </button>
          <button id="prod-add-btn"
            class="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-white rounded-lg text-sm font-medium hover:bg-[#b8963e] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Thêm sản phẩm
          </button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-14">Ảnh</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 sort-th" data-col="sku">
                <span class="flex items-center gap-1">SKU <span class="sort-icon text-gray-300">⇅</span></span>
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 sort-th" data-col="name">
                <span class="flex items-center gap-1">Tên <span class="sort-icon text-gray-300">⇅</span></span>
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 sort-th" data-col="category">
                <span class="flex items-center gap-1">Danh mục <span class="sort-icon text-gray-300">⇅</span></span>
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 sort-th" data-col="price">
                <span class="flex items-center gap-1">Giá <span class="sort-icon text-gray-300">⇅</span></span>
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 sort-th" data-col="stock">
                <span class="flex items-center gap-1">Tồn <span class="sort-icon text-gray-300">⇅</span></span>
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Badge</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Hành động</th>
            </tr>
          </thead>
          <tbody id="prod-tbody" class="divide-y divide-gray-50">
            <tr><td colspan="9" class="py-8 text-center text-gray-400 text-sm">Đang tải...</td></tr>
          </tbody>
        </table>
      </div>
      <div class="px-4 py-3 border-t border-gray-100" id="prod-pagination"></div>
    </div>
  `;

  // Search
  let searchTimer;
  container.querySelector('#prod-search').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = e.target.value.trim();
      state.page = 1;
      loadProducts(container);
    }, 300);
  });

  // Add product
  container.querySelector('#prod-add-btn').addEventListener('click', () => {
    openProductForm(null, () => loadProducts(container));
  });

  // Compute badges
  container.querySelector('#prod-badge-btn').addEventListener('click', async () => {
    const btn = container.querySelector('#prod-badge-btn');
    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Đang tính...`;
    try {
      await computeBadges();
      showToast('Badge đã được cập nhật tự động!');
      loadProducts(container);
    } catch (err) {
      showToast(err.message || 'Lỗi cập nhật badge', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Cập nhật badge`;
    }
  });

  // Sortable column headers
  container.querySelectorAll('.sort-th').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      const [asc, desc] = SORT_COLS[col];
      const current = state.sortDir[col]; // undefined → asc → desc → undefined

      // Reset other columns
      state.sortDir = {};

      if (!current) {
        state.sort = asc;
        state.sortDir[col] = 'asc';
      } else if (current === 'asc') {
        state.sort = desc;
        state.sortDir[col] = 'desc';
      } else {
        state.sort = '';
        state.sortDir[col] = undefined;
      }

      state.page = 1;
      updateSortIcons(container);
      loadProducts(container);
    });
  });

  loadProducts(container);
}

function updateSortIcons(container) {
  container.querySelectorAll('.sort-th').forEach(th => {
    const col = th.dataset.col;
    const dir = state.sortDir[col];
    const icon = th.querySelector('.sort-icon');
    if (!icon) return;
    if (dir === 'asc')  { icon.textContent = '↑'; icon.classList.replace('text-gray-300', 'text-[#C9A84C]'); }
    else if (dir === 'desc') { icon.textContent = '↓'; icon.classList.replace('text-gray-300', 'text-[#C9A84C]'); }
    else { icon.textContent = '⇅'; icon.className = 'sort-icon text-gray-300'; }
  });
}

async function loadProducts(container) {
  const tbody = container.querySelector('#prod-tbody');
  tbody.innerHTML = `<tr><td colspan="9" class="py-8 text-center text-gray-400 text-sm">Đang tải...</td></tr>`;

  try {
    const res = await getProducts({
      page: state.page,
      limit: PAGE_SIZE,
      search: state.search,
      sort: state.sort,
    });

    const items = Array.isArray(res.data) ? res.data : [];
    state.total = Number(res.meta?.total ?? items.length);
    state.data = items;

    renderRows(container);
    renderPageNav(container);
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="9" class="py-8 text-center text-red-400 text-sm">${error.message || 'Lỗi tải dữ liệu'}</td></tr>`;
  }
}

function renderRows(container) {
  const tbody = container.querySelector('#prod-tbody');
  if (!state.data.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="py-10 text-center text-gray-400 text-sm">Chưa có sản phẩm nào</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  state.data.forEach((product) => {
    const lowStock = Number(product.stock ?? 0) < 5;
    const image = product.images?.[0] || product.thumbnail || '';
    const tr = document.createElement('tr');
    tr.className = `hover:bg-gray-50 transition-colors ${lowStock ? 'bg-yellow-50' : ''}`;
    tr.innerHTML = `
      <td class="px-4 py-3">
        ${image
          ? `<img src="${image}" alt="" class="w-10 h-10 object-cover rounded-lg bg-gray-100" onerror="this.style.display='none'">`
          : `<div class="w-10 h-10 rounded-lg bg-gray-100"></div>`}
      </td>
      <td class="px-4 py-3 text-gray-500 font-mono text-xs">${product.sku || '-'}</td>
      <td class="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">${product.name || '-'}</td>
      <td class="px-4 py-3 text-gray-600 text-xs">${product.category_name || '-'}</td>
      <td class="px-4 py-3 text-gray-800 font-medium whitespace-nowrap">${formatPrice(product.sale_price || product.price)}</td>
      <td class="px-4 py-3 ${lowStock ? 'text-red-600 font-bold' : 'text-gray-600'}">${product.stock ?? 0}</td>
      <td class="px-4 py-3">${product.badge
          ? `<span class="px-2 py-0.5 text-xs rounded-full font-semibold ${badgeClass(product.badge)}">${product.badge}</span>`
          : '<span class="text-gray-300 text-xs">—</span>'}</td>
      <td class="px-4 py-3">
        <button class="toggle-status relative w-10 h-6 rounded-full transition-colors ${Number(product.is_active) ? 'bg-green-500' : 'bg-gray-300'}" data-id="${product.id}">
          <span class="absolute top-0.5 ${Number(product.is_active) ? 'left-[18px]' : 'left-0.5'} w-5 h-5 bg-white rounded-full shadow transition-all"></span>
        </button>
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

    tr.querySelector('.edit-btn').addEventListener('click', () => {
      openProductForm(product, () => loadProducts(container));
    });

    tr.querySelector('.del-btn').addEventListener('click', () => {
      createConfirmDialog(`Xóa sản phẩm "${product.name}"?`, async () => {
        try {
          await deleteProduct(product.id);
          showToast('Đã xóa');
          loadProducts(container);
        } catch (error) {
          showToast(error.message, 'error');
        }
      });
    });

    tr.querySelector('.toggle-status').addEventListener('click', async () => {
      try {
        await toggleProduct(product.id);
        loadProducts(container);
      } catch (error) {
        showToast(error.message, 'error');
      }
    });

    tbody.appendChild(tr);
  });
}

function renderPageNav(container) {
  const wrap = container.querySelector('#prod-pagination');
  wrap.innerHTML = '';
  const totalPages = Math.ceil(state.total / PAGE_SIZE);
  if (totalPages <= 1) return;
  wrap.appendChild(createPagination(state.page, totalPages, (page) => {
    state.page = page;
    loadProducts(container);
  }));
}

function badgeClass(badge) {
  const map = { NEW: 'bg-blue-100 text-blue-700', BESTSELLER: 'bg-yellow-100 text-yellow-700', SALE: 'bg-red-100 text-red-700' };
  return map[badge] || 'bg-gray-100 text-gray-700';
}
