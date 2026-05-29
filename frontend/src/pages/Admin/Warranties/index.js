import { renderWarrantyTable } from './WarrantyTable.js';

export function renderWarranties(container) {
  container.innerHTML = `
    <div class="space-y-4">
      <div>
        <h2 class="text-xl font-bold text-gray-900">Bảo Hành</h2>
        <p class="text-sm text-gray-500 mt-0.5">Quản lý phiếu bảo hành sản phẩm</p>
      </div>
      <div id="warranty-table-wrap"></div>
    </div>
  `;
  renderWarrantyTable(container.querySelector('#warranty-table-wrap'));
}
