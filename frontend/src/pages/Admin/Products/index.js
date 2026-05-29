import { renderProductTable } from './ProductTable.js';

export function renderProducts(container) {
  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Sản Phẩm</h2>
          <p class="text-sm text-gray-500 mt-0.5">Quản lý danh sách sản phẩm đồng hồ</p>
        </div>
      </div>
      <div id="product-table-wrap"></div>
    </div>
  `;
  renderProductTable(container.querySelector('#product-table-wrap'));
}
