import { renderRoleTable } from './RoleTable.js';

export function renderRoles(container) {
  container.innerHTML = `
    <div class="space-y-4">
      <div>
        <h2 class="text-xl font-bold text-gray-900">Phân Quyền & Vai Trò</h2>
        <p class="text-sm text-gray-500 mt-0.5">Quản lý vai trò và quyền hạn trong hệ thống</p>
      </div>
      <div id="role-table-wrap"></div>
    </div>
  `;
  renderRoleTable(container.querySelector('#role-table-wrap'));
}
