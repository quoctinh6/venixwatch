import { getRoles, createRole, deleteRole } from '../../../services/adminService.js';
import { openPermissionMatrix } from './PermissionMatrix.js';
import { createPagination } from '../shared/ui.js';

const ROLE_COLORS = {
  super_admin: 'bg-yellow-100 text-yellow-800',
  admin: 'bg-gray-900 text-white',
  editor: 'bg-blue-100 text-blue-700',
  viewer: 'bg-gray-100 text-gray-600',
};

const PAGE_SIZE = 10;
let state = { page: 1, data: [] };

const SKELETON_ROWS = Array(4).fill(0).map(() => `
  <tr>
    <td class="px-4 py-4"><div class="skeleton-shimmer h-6 w-20 rounded-full"></div></td>
    <td class="px-4 py-4"><div class="skeleton-shimmer h-4 w-28"></div></td>
    <td class="px-4 py-4">
      <div class="flex items-center gap-1">
        <div class="skeleton-shimmer h-4 w-6"></div>
        <div class="skeleton-shimmer h-3 w-10"></div>
      </div>
    </td>
    <td class="px-4 py-4"><div class="skeleton-shimmer h-4 w-8"></div></td>
    <td class="px-4 py-4 text-right"><div class="skeleton-shimmer h-8 w-24 ml-auto rounded-lg"></div></td>
  </tr>
`).join('');

export function renderRoleTable(container) {
  container.innerHTML = `
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="p-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 class="text-base font-semibold text-gray-900">Danh sách vai trò</h3>
          <p class="text-sm text-gray-500">Quản lý vai trò và phân quyền hệ thống</p>
        </div>
        <button id="add-role-btn" class="px-4 py-2 bg-[#C9A84C] hover:bg-[#b8963e] text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Thêm vai trò
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vai trò</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tên hiển thị</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Số quyền</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Người dùng</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Hành động</th>
            </tr>
          </thead>
          <tbody id="role-tbody" class="divide-y divide-gray-50">
            ${SKELETON_ROWS}
          </tbody>
        </table>
      </div>
      <div class="px-4 py-3 border-t border-gray-100" id="role-pagination"></div>
    </div>
  `;
  
  container.querySelector('#add-role-btn').addEventListener('click', () => {
    openAddRoleModal(() => loadRoles(container));
  });

  loadRoles(container);
}

async function loadRoles(container) {
  const tbody = container.querySelector('#role-tbody');
  tbody.innerHTML = SKELETON_ROWS;
  try {
    const res = await getRoles();
    state.data = Array.isArray(res.data) ? res.data : getDefaultRoles();
    renderRows(container);
    renderPageNav(container);
  } catch {
    state.data = getDefaultRoles();
    renderRows(container);
    renderPageNav(container);
  }
}

function renderRows(container) {
  const tbody = container.querySelector('#role-tbody');
  if (!state.data.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-gray-400">Không có vai trò nào</td></tr>`;
    return;
  }

  const rows = state.data.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);
  tbody.innerHTML = '';

  rows.forEach((role) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50 transition-colors';
    const permCount = role.permissions?.length ?? role.permissions_count ?? 0;
    const userCount = role.users_count ?? 0;

    tr.innerHTML = `
      <td class="px-4 py-3">
        <span class="px-2.5 py-1 rounded-full text-xs font-bold ${ROLE_COLORS[role.name] || 'bg-gray-100 text-gray-600'}">${role.name}</span>
      </td>
      <td class="px-4 py-3 font-medium text-gray-900">${role.display_name || role.name}</td>
      <td class="px-4 py-3">
        <span class="text-gray-600">${permCount}</span>
        <span class="text-gray-400 text-xs ml-1">quyền</span>
      </td>
      <td class="px-4 py-3 text-gray-600">${userCount}</td>
      <td class="px-4 py-3 text-right flex items-center justify-end gap-2">
        <button class="edit-perms-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#C9A84C] border border-[#C9A84C] rounded-lg hover:bg-[#C9A84C] hover:text-white transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Phân quyền
        </button>
        ${['super_admin', 'admin', 'editor', 'viewer'].includes(role.name) ? '' : `
          <button class="delete-role-btn flex items-center justify-center p-1.5 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors" title="Xóa vai trò">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        `}
      </td>
    `;

    tr.querySelector('.edit-perms-btn').addEventListener('click', () => {
      openPermissionMatrix(role, () => loadRoles(container));
    });

    const delBtn = tr.querySelector('.delete-role-btn');
    if (delBtn) {
      delBtn.addEventListener('click', async () => {
        if (!confirm(`Bạn có chắc chắn muốn xóa vai trò "${role.display_name || role.name}"?`)) return;
        try {
          await deleteRole(role.id);
          loadRoles(container);
        } catch (err) {
          alert(err.message || 'Lỗi khi xóa vai trò');
        }
      });
    }

    tbody.appendChild(tr);
  });
}

function renderPageNav(container) {
  const wrap = container.querySelector('#role-pagination');
  wrap.innerHTML = '';
  const totalPages = Math.ceil(state.data.length / PAGE_SIZE);
  if (totalPages <= 1) return;
  wrap.appendChild(createPagination(state.page, totalPages, (page) => {
    state.page = page;
    renderRows(container);
    renderPageNav(container);
  }));
}

function openAddRoleModal(reloadCallback) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto';
  modal.innerHTML = `
    <div class="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h3 class="text-sm font-bold text-gray-900">Thêm vai trò mới</h3>
        <button id="close-role-modal-btn" class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>
      </div>
      <form id="add-role-form" class="p-6 space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Mã vai trò (Name)</label>
          <input type="text" id="role-name" required pattern="[a-z0-9_]+"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-[#C9A84C]"
            placeholder="Ví dụ: manager, support" />
          <p class="text-[10px] text-gray-400 mt-1">Chỉ sử dụng chữ thường, số và dấu gạch dưới.</p>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Tên hiển thị (Display Name)</label>
          <input type="text" id="role-display-name" required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-[#C9A84C]"
            placeholder="Ví dụ: Quản lý, Hỗ trợ kỹ thuật" />
        </div>
        <div class="pt-2 flex justify-end gap-2">
          <button type="button" id="cancel-role-btn" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors">Hủy</button>
          <button type="submit" class="px-4 py-2 bg-[#C9A84C] hover:bg-[#b8963e] text-white rounded-lg text-xs font-semibold transition-colors">Lưu lại</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector('#close-role-modal-btn').addEventListener('click', close);
  modal.querySelector('#cancel-role-btn').addEventListener('click', close);
  
  modal.querySelector('#add-role-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = modal.querySelector('#role-name').value.trim();
    const display_name = modal.querySelector('#role-display-name').value.trim();

    try {
      await createRole({ name, display_name });
      close();
      reloadCallback();
    } catch (err) {
      alert(err.message || 'Lỗi thêm vai trò');
    }
  });
}

function getDefaultRoles() {
  return [
    { id: 1, name: 'super_admin', display_name: 'Super Admin', permissions_count: 30, users_count: 1 },
    { id: 2, name: 'admin', display_name: 'Admin', permissions_count: 20, users_count: 3 },
    { id: 3, name: 'editor', display_name: 'Editor', permissions_count: 10, users_count: 5 },
    { id: 4, name: 'viewer', display_name: 'Viewer', permissions_count: 5, users_count: 8 },
  ];
}
