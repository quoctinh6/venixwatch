import { getRoles } from '../../../services/adminService.js';
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

export function renderRoleTable(container) {
  container.innerHTML = `
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="p-4 border-b border-gray-100">
        <p class="text-sm text-gray-500">Quan ly vai tro va phan quyen he thong</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vai tro</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ten hien thi</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">So quyen</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nguoi dung</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Hanh dong</th>
            </tr>
          </thead>
          <tbody id="role-tbody" class="divide-y divide-gray-50">
            <tr><td colspan="5" class="py-8 text-center text-gray-400">Dang tai...</td></tr>
          </tbody>
        </table>
      </div>
      <div class="px-4 py-3 border-t border-gray-100" id="role-pagination"></div>
    </div>
  `;
  loadRoles(container);
}

async function loadRoles(container) {
  const tbody = container.querySelector('#role-tbody');
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
    tbody.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-gray-400">Khong co vai tro nao</td></tr>`;
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
        <span class="text-gray-400 text-xs ml-1">quyen</span>
      </td>
      <td class="px-4 py-3 text-gray-600">${userCount}</td>
      <td class="px-4 py-3 text-right">
        <button class="edit-perms-btn flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#C9A84C] border border-[#C9A84C] rounded-lg hover:bg-[#C9A84C] hover:text-white transition-colors ml-auto">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Phan quyen
        </button>
      </td>
    `;

    tr.querySelector('.edit-perms-btn').addEventListener('click', () => {
      openPermissionMatrix(role, () => loadRoles(container));
    });

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

function getDefaultRoles() {
  return [
    { id: 1, name: 'super_admin', display_name: 'Super Admin', permissions_count: 30, users_count: 1 },
    { id: 2, name: 'admin', display_name: 'Admin', permissions_count: 20, users_count: 3 },
    { id: 3, name: 'editor', display_name: 'Editor', permissions_count: 10, users_count: 5 },
    { id: 4, name: 'viewer', display_name: 'Viewer', permissions_count: 5, users_count: 8 },
  ];
}
