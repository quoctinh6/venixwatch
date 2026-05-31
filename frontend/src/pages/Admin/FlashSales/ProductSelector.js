import { getProducts, getCategories } from '../../../services/adminService.js';
import { showToast } from '../shared/ui.js';
import { formatInputWithSelection } from './CurrencyInput.js';
import { state } from './FlashSalesState.js';

export async function initProductSelector(container) {
  const catFilter = container.querySelector('#fs-cat-filter');
  const prodSearch = container.querySelector('#fs-prod-search');
  const selectAll = container.querySelector('#fs-select-all-visible');
  const applyBulkBtn = container.querySelector('#fs-apply-bulk-price');
  const bulkValInput = container.querySelector('#fs-bulk-val');
  const bulkTypeSelect = container.querySelector('#fs-bulk-type');

  if (bulkValInput && bulkTypeSelect) {
    bulkValInput.addEventListener('input', (e) => {
      const isPercentage = bulkTypeSelect.value === 'percent';
      formatInputWithSelection(e.target, isPercentage);
    });

    bulkTypeSelect.addEventListener('change', (e) => {
      bulkValInput.value = '';
    });
  }

  try {
    const [prodRes, catRes] = await Promise.all([
      getProducts({ limit: 1000 }),
      getCategories()
    ]);

    state.allProducts = prodRes.data || [];
    state.categories = catRes.data || [];

    // Populate category dropdown
    state.categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      catFilter.appendChild(opt);
    });

    state.filteredProducts = [...state.allProducts];
    renderProductList(container);

    // Event Listeners for Filters
    const handleFilters = () => {
      const search = prodSearch.value.trim().toLowerCase();
      const catId = catFilter.value;

      state.filteredProducts = state.allProducts.filter(p => {
        const matchesSearch = !search || 
          p.name.toLowerCase().includes(search) || 
          (p.sku && p.sku.toLowerCase().includes(search));
        
        const matchesCat = !catId || String(p.category_id) === String(catId);

        return matchesSearch && matchesCat;
      });

      selectAll.checked = false;
      renderProductList(container);
    };

    prodSearch.addEventListener('input', handleFilters);
    catFilter.addEventListener('change', handleFilters);

    // Select All Visible Handler
    selectAll.addEventListener('change', (e) => {
      const checked = e.target.checked;
      state.filteredProducts.forEach(p => {
        const basePrice = parseFloat(p.base_price || p.price);
        if (checked) {
          if (!state.selectedProducts.has(p.id)) {
            state.selectedProducts.set(p.id, basePrice);
          }
        } else {
          state.selectedProducts.delete(p.id);
        }
      });
      container.querySelector('#fs-selected-count').textContent = state.selectedProducts.size;
      renderProductList(container);
    });

    // Apply Bulk Pricing Handler
    applyBulkBtn.addEventListener('click', () => {
      if (state.selectedProducts.size === 0) {
        showToast('Vui lòng chọn các sản phẩm trong bảng trước!', 'warning');
        return;
      }

      const bulkType = container.querySelector('#fs-bulk-type').value;
      const bulkVal = parseFloat(container.querySelector('#fs-bulk-val').value.replace(/\D/g, '')) || 0;

      if (bulkVal <= 0) {
        showToast('Vui lòng nhập giá trị cấu hình hợp lệ (> 0)!', 'warning');
        return;
      }

      let updatedCount = 0;
      state.selectedProducts.forEach((price, pid) => {
        const product = state.allProducts.find(p => p.id === pid);
        if (!product) return;

        const origPrice = parseFloat(product.base_price || product.price);
        let newPrice = origPrice;

        if (bulkType === 'fixed') {
          newPrice = bulkVal;
        } else if (bulkType === 'percent') {
          newPrice = origPrice * (1 - bulkVal / 100);
        } else if (bulkType === 'discount') {
          newPrice = Math.max(0, origPrice - bulkVal);
        }

        state.selectedProducts.set(pid, Math.round(newPrice));
        updatedCount++;
      });

      showToast(`Đã áp dụng giá mới cho ${updatedCount} sản phẩm!`);
      renderProductList(container);
    });

  } catch (err) {
    container.querySelector('#fs-prod-tbody').innerHTML = `
      <tr>
        <td colspan="5" class="px-4 py-12 text-center text-red-500 font-medium">Lỗi tải danh sách sản phẩm: ${err.message}</td>
      </tr>
    `;
  }
}

export function renderProductList(container) {
  const tbody = container.querySelector('#fs-prod-tbody');
  if (!state.filteredProducts.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-4 py-12 text-center text-gray-400 font-medium">Không tìm thấy sản phẩm nào phù hợp</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = '';
  state.filteredProducts.forEach(product => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0';

    const isChecked = state.selectedProducts.has(product.id);
    const salePrice = isChecked ? state.selectedProducts.get(product.id) : parseFloat(product.base_price || product.price);
    const formattedSalePrice = Number(salePrice).toLocaleString('vi-VN') + 'đ';
    const image = product.images?.[0] || product.thumbnail || '';

    tr.innerHTML = `
      <td class="px-4 py-3 text-center">
        <input type="checkbox" class="fs-prod-chk rounded border-gray-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer" data-id="${product.id}" ${isChecked ? 'checked' : ''}>
      </td>
      <td class="px-4 py-3">
        ${image
          ? `<img src="${image}" alt="" class="w-10 h-10 object-cover rounded-lg border border-gray-100 bg-gray-50" onerror="this.src='https://placehold.co/40'">`
          : `<div class="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200/50 flex items-center justify-center text-[10px] text-gray-300 font-bold">No img</div>`}
      </td>
      <td class="px-4 py-3">
        <div class="font-bold text-gray-900 leading-tight">${product.name}</div>
        <div class="text-xs text-gray-400 font-mono mt-0.5">SKU: ${product.sku || '-'}</div>
      </td>
      <td class="px-4 py-3 font-semibold text-gray-500 text-xs">
        ${Number(product.base_price || product.price).toLocaleString('vi-VN')}đ
      </td>
      <td class="px-4 py-3">
        <input type="text" class="fs-price-input w-28 px-2 py-1 border border-gray-200 rounded-lg text-xs font-bold text-red-600 focus:outline-none focus:border-red-500 transition disabled:bg-gray-50 disabled:text-gray-400" 
          data-id="${product.id}" 
          value="${formattedSalePrice}" 
          ${isChecked ? '' : 'disabled'}>
      </td>
    `;

    // Checkbox Event
    tr.querySelector('.fs-prod-chk').addEventListener('change', (e) => {
      const checked = e.target.checked;
      const input = tr.querySelector('.fs-price-input');
      
      if (checked) {
        const rawVal = parseFloat(input.value.replace(/\D/g, '')) || 0;
        state.selectedProducts.set(product.id, rawVal);
        input.disabled = false;
      } else {
        state.selectedProducts.delete(product.id);
        input.disabled = true;
      }
      container.querySelector('#fs-selected-count').textContent = state.selectedProducts.size;
    });

    // Price Input Event
    tr.querySelector('.fs-price-input').addEventListener('input', (e) => {
      formatInputWithSelection(e.target, false);
      const val = parseFloat(e.target.value.replace(/\D/g, '')) || 0;
      if (state.selectedProducts.has(product.id)) {
        state.selectedProducts.set(product.id, val);
      }
    });

    tbody.appendChild(tr);
  });
}
