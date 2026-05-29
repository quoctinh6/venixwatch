import { getCategories, deleteCategory, getSubcategories, deleteSubcategory } from '../../../services/adminService.js';
import { createConfirmDialog, showToast, createPagination } from '../shared/ui.js';
import { openCategoryForm } from './CategoryForm.js';

const PAGE_SIZE = 12;

let state = { page: 1, sortDir: {}, data: [] };

export function renderCategories(container) {
  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Danh Mục</h2>
          <p class="text-sm text-gray-500 mt-0.5">Quản lý cây danh mục sản phẩm</p>
        </div>
        <button id="cat-add-btn" class="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-white rounded-lg text-sm font-medium hover:bg-[#b8963e]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Thêm danh mục
        </button>
      </div>
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 sort-th" data-col="name">
                  <span class="flex items-center gap-1">Tên <span class="sort-icon text-gray-300">⇅</span></span>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Slug</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Danh mục cha</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 sort-th" data-col="count">
                  <span class="flex items-center gap-1">Sản phẩm <span class="sort-icon text-gray-300">⇅</span></span>
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody id="cat-tbody" class="divide-y divide-gray-50">
              <tr><td colspan="6" class="py-8 text-center text-gray-400 text-sm">Đang tải...</td></tr>
            </tbody>
          </table>
        </div>
        <div class="px-4 py-3 border-t border-gray-100" id="cat-pagination"></div>
      </div>
    </div>
  `;

  container.querySelector('#cat-add-btn').addEventListener('click', () => {
    openCategoryForm(null, () => loadCategories(container));
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

  loadCategories(container);
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
  
  // Tách biệt danh mục cha và danh mục con
  const cats = data.filter(item => !item.is_subcategory);
  const subs = data.filter(item => item.is_subcategory);
  
  if (!col) {
    // Nếu không sắp xếp, xếp theo cấu trúc cây tự nhiên
    const merged = [];
    cats.forEach(cat => {
      merged.push(cat);
      const children = subs.filter(sub => Number(sub.category_id) === Number(cat.id));
      children.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      children.forEach(child => merged.push(child));
    });
    // Add các danh mục con mồ côi (nếu có)
    subs.forEach(sub => {
      if (!cats.some(cat => Number(cat.id) === Number(sub.category_id))) {
        merged.push(sub);
      }
    });
    return merged;
  }
  
  const factor = dir === 'asc' ? 1 : -1;
  const sortFn = (a, b) => {
    let va, vb;
    if (col === 'name')  { va = (a.name || '').toLowerCase(); vb = (b.name || '').toLowerCase(); return va.localeCompare(vb) * factor; }
    if (col === 'count') { va = Number(a.products_count ?? 0); vb = Number(b.products_count ?? 0); return (va - vb) * factor; }
    return 0;
  };

  // Sắp xếp các danh mục cha
  const sortedCats = [...cats].sort(sortFn);
  const merged = [];
  
  sortedCats.forEach(cat => {
    merged.push(cat);
    // Sắp xếp các danh mục con thuộc danh mục cha này
    const children = subs.filter(sub => Number(sub.category_id) === Number(cat.id));
    const sortedChildren = [...children].sort(sortFn);
    sortedChildren.forEach(child => merged.push(child));
  });

  // Xử lý các danh mục con mồ côi
  const orphans = subs.filter(sub => !cats.some(cat => Number(cat.id) === Number(sub.category_id)));
  const sortedOrphans = [...orphans].sort(sortFn);
  sortedOrphans.forEach(sub => merged.push(sub));

  return merged;
}

async function loadCategories(container) {
  const tbody = container.querySelector('#cat-tbody');
  if (!tbody) return;
  try {
    const [catsRes, subsRes] = await Promise.all([
      getCategories(),
      getSubcategories()
    ]);
    const cats = Array.isArray(catsRes.data) ? catsRes.data : (Array.isArray(catsRes) ? catsRes : []);
    const subs = Array.isArray(subsRes.data) ? subsRes.data : (Array.isArray(subsRes) ? subsRes : []);

    cats.forEach(c => { c.is_subcategory = false; });
    subs.forEach(s => { s.is_subcategory = true; });

    // Ghép cây danh mục
    const merged = [];
    cats.forEach(cat => {
      merged.push(cat);
      const children = subs.filter(sub => Number(sub.category_id) === Number(cat.id));
      children.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      children.forEach(child => {
        merged.push(child);
      });
    });

    subs.forEach(sub => {
      if (!cats.some(cat => Number(cat.id) === Number(sub.category_id))) {
        merged.push(sub);
      }
    });

    state.data = merged;
    renderRows(container);
    renderPageNav(container);
  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-red-400 text-sm">Lỗi tải danh mục</td></tr>`;
  }
}

function renderRows(container) {
  const tbody = container.querySelector('#cat-tbody');
  const sorted = getSorted(state.data);
  const catMap = {};
  state.data.forEach(item => { if (!item.is_subcategory) catMap[item.id] = item; });

  if (!sorted.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-10 text-center text-gray-400 text-sm">Chưa có danh mục nào</td></tr>`;
    return;
  }

  const start = (state.page - 1) * PAGE_SIZE;
  const rows = sorted.slice(start, start + PAGE_SIZE);
  tbody.innerHTML = '';

  rows.forEach((cat) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50 transition-colors';
    
    const isSub = cat.is_subcategory;
    const indent = isSub ? 'pl-8' : '';
    const prefix = isSub ? `<span class="text-gray-300 mr-2 font-normal">↳</span>` : '';

    tr.innerHTML = `
      <td class="px-4 py-3 font-medium text-gray-900 ${indent}">${prefix}${cat.name}</td>
      <td class="px-4 py-3 text-gray-500 font-mono text-xs">${cat.slug || '-'}</td>
      <td class="px-4 py-3 text-gray-600 text-xs">${isSub && catMap[cat.category_id] ? catMap[cat.category_id].name : '-'}</td>
      <td class="px-4 py-3 text-gray-600">${cat.products_count ?? 0}</td>
      <td class="px-4 py-3">
        <span class="px-2 py-0.5 text-xs rounded-full font-medium ${cat.is_active !== false && Number(cat.is_active) !== 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">
          ${cat.is_active !== false && Number(cat.is_active) !== 0 ? 'Hoạt động' : 'Ẩn'}
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

    tr.querySelector('.edit-btn').addEventListener('click', () => openCategoryForm(cat, () => loadCategories(container)));
    tr.querySelector('.del-btn').addEventListener('click', () => {
      createConfirmDialog(`Xóa danh mục "${cat.name}"?`, async () => {
        try {
          if (isSub) {
            await deleteSubcategory(cat.id);
          } else {
            await deleteCategory(cat.id);
          }
          showToast('Đã xóa danh mục thành công');
          loadCategories(container);
        } catch (error) {
          showToast(error.message, 'error');
        }
      });
    });

    tbody.appendChild(tr);
  });
}

function renderPageNav(container) {
  const wrap = container.querySelector('#cat-pagination');
  wrap.innerHTML = '';
  const totalPages = Math.ceil(state.data.length / PAGE_SIZE);
  if (totalPages <= 1) return;
  wrap.appendChild(createPagination(state.page, totalPages, (page) => {
    state.page = page;
    renderRows(container);
    renderPageNav(container);
  }));
}
