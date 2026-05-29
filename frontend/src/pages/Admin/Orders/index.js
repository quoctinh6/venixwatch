import { renderOrderTable } from './OrderTable.js';

export function renderOrders(container) {
  container.innerHTML = `
    <div class="space-y-4">
      <div>
        <h2 class="text-xl font-bold text-gray-900">Đơn Hàng</h2>
        <p class="text-sm text-gray-500 mt-0.5">Quản lý và xử lý đơn hàng</p>
      </div>
      <div id="order-table-wrap"></div>
    </div>
  `;
  renderOrderTable(container.querySelector('#order-table-wrap'));
}
