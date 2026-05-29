import { renderUserTable } from './UserTable.js';

export function renderUsers(container) {
  container.innerHTML = `
    <div class="space-y-4">
      <div>
        <h2 class="text-xl font-bold text-gray-900">Người Dùng</h2>
        <p class="text-sm text-gray-500 mt-0.5">Quản lý tài khoản người dùng hệ thống</p>
      </div>
      <div id="user-table-wrap"></div>
    </div>
  `;
  renderUserTable(container.querySelector('#user-table-wrap'));
}
