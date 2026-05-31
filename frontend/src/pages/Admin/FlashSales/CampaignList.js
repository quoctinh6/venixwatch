import { getFlashSales, deleteFlashSale, bulkDeleteFlashSales, bulkToggleFlashSales } from '../../../services/adminService.js';
import { showToast, createPagination } from '../shared/ui.js';
import { formatInputWithSelection } from './CurrencyInput.js';
import { state } from './FlashSalesState.js';

export async function loadFlashSalesList(container) {
  const tbody = container.querySelector('#flash-tbody');
  const paginationContainer = container.querySelector('#flash-pagination');
  const totalBadge = container.querySelector('#fs-campaigns-total-badge');

  try {
    const res = await getFlashSales();
    state.listData = res.data || [];
    
    // Bind search and filter events once if they haven't been bound yet
    const searchInput = container.querySelector('#fs-list-search');
    const statusSelect = container.querySelector('#fs-list-status');

    if (searchInput && !searchInput.dataset.bound) {
      searchInput.dataset.bound = "true";
      searchInput.addEventListener('input', (e) => {
        state.fsSearchQuery = e.target.value.trim().toLowerCase();
        state.fsPage = 1;
        renderFilteredList();
      });
    }

    if (statusSelect && !statusSelect.dataset.bound) {
      statusSelect.dataset.bound = "true";
      statusSelect.addEventListener('change', (e) => {
        state.fsStatusFilter = e.target.value;
        state.fsPage = 1;
        renderFilteredList();
      });
    }

    // Select all campaigns checkbox
    const selectAllCampaignsChk = container.querySelector('#fs-select-all-campaigns');
    if (selectAllCampaignsChk && !selectAllCampaignsChk.dataset.bound) {
      selectAllCampaignsChk.dataset.bound = "true";
      selectAllCampaignsChk.addEventListener('change', (e) => {
        const checked = e.target.checked;
        const currentFiltered = getFilteredCampaigns();
        
        currentFiltered.forEach(item => {
          if (checked) {
            state.selectedFlashSales.add(item.id);
          } else {
            state.selectedFlashSales.delete(item.id);
          }
        });
        updateBulkActionsPanel();
        
        const limit = 10;
        const startIdx = (state.fsPage - 1) * limit;
        const paginatedItems = currentFiltered.slice(startIdx, startIdx + limit);
        renderTableRows(paginatedItems);
      });
    }

    // Bulk buttons event handlers
    const enableBtn = container.querySelector('#fs-bulk-enable-btn');
    const disableBtn = container.querySelector('#fs-bulk-disable-btn');
    const deleteBtn = container.querySelector('#fs-bulk-delete-btn');

    if (enableBtn && !enableBtn.dataset.bound) {
      enableBtn.dataset.bound = "true";
      enableBtn.addEventListener('click', async () => {
        const ids = Array.from(state.selectedFlashSales);
        if (ids.length === 0) return;
        enableBtn.disabled = true;
        try {
          await bulkToggleFlashSales(ids, 1);
          showToast(`Đã bật ${ids.length} chiến dịch Flash Sale thành công!`);
          state.selectedFlashSales.clear();
          loadFlashSalesList(container);
        } catch (err) {
          showToast(err.message || 'Lỗi bật chiến dịch', 'error');
        } finally {
          enableBtn.disabled = false;
        }
      });
    }

    if (disableBtn && !disableBtn.dataset.bound) {
      disableBtn.dataset.bound = "true";
      disableBtn.addEventListener('click', async () => {
        const ids = Array.from(state.selectedFlashSales);
        if (ids.length === 0) return;
        disableBtn.disabled = true;
        try {
          await bulkToggleFlashSales(ids, 0);
          showToast(`Đã tắt ${ids.length} chiến dịch Flash Sale thành công!`);
          state.selectedFlashSales.clear();
          loadFlashSalesList(container);
        } catch (err) {
          showToast(err.message || 'Lỗi tắt chiến dịch', 'error');
        } finally {
          disableBtn.disabled = false;
        }
      });
    }

    if (deleteBtn && !deleteBtn.dataset.bound) {
      deleteBtn.dataset.bound = "true";
      deleteBtn.addEventListener('click', async () => {
        const ids = Array.from(state.selectedFlashSales);
        if (ids.length === 0) return;
        if (!confirm(`Bạn có chắc chắn muốn xóa ${ids.length} chiến dịch đã chọn?`)) return;
        deleteBtn.disabled = true;
        try {
          await bulkDeleteFlashSales(ids);
          showToast(`Đã xóa ${ids.length} chiến dịch Flash Sale thành công!`);
          state.selectedFlashSales.clear();
          loadFlashSalesList(container);
        } catch (err) {
          showToast(err.message || 'Lỗi xóa chiến dịch', 'error');
        } finally {
          deleteBtn.disabled = false;
        }
      });
    }

    // Helper functions
    function getFilteredCampaigns() {
      const now = new Date();
      return state.listData.filter(item => {
        // Status filter
        const start = new Date(item.start_time);
        const end = new Date(item.end_time);
        const isAct = item.is_active != 0;

        let status = "inactive";
        if (!isAct) status = "inactive";
        else if (now < start) status = "scheduled";
        else if (now > end) status = "ended";
        else status = "running";

        if (state.fsStatusFilter !== "all" && status !== state.fsStatusFilter) return false;

        // Search filter
        if (state.fsSearchQuery) {
          const search = state.fsSearchQuery.toLowerCase();
          const prodName = (item.product_name || "").toLowerCase();
          const prodSku = (item.product_sku || "").toLowerCase();
          const prodId = String(item.product_id);
          if (!prodName.includes(search) && !prodSku.includes(search) && !prodId.includes(search)) {
            return false;
          }
        }
        return true;
      });
    }

    // In Venix Watch, we use a slightly styled confirmation dialog helper
    function createConfirmDialog(text, onConfirm) {
      if (confirm(text)) {
        onConfirm();
      }
    }

    function updateBulkActionsPanel() {
      const panel = container.querySelector('#fs-bulk-actions-panel');
      const countEl = container.querySelector('#fs-bulk-select-count');
      if (panel && countEl) {
        if (state.selectedFlashSales.size > 0) {
          countEl.textContent = state.selectedFlashSales.size;
          panel.classList.remove('hidden');
        } else {
          panel.classList.add('hidden');
        }
      }
    }

    function renderFilteredList() {
      const filtered = getFilteredCampaigns();
      if (totalBadge) totalBadge.textContent = filtered.length;

      const totalItems = filtered.length;
      const limit = 10;
      const totalPages = Math.max(1, Math.ceil(totalItems / limit));

      if (state.fsPage > totalPages) state.fsPage = totalPages;

      const startIdx = (state.fsPage - 1) * limit;
      const paginatedItems = filtered.slice(startIdx, startIdx + limit);

      // Check if all filtered items across all pages are selected
      if (selectAllCampaignsChk) {
        selectAllCampaignsChk.checked = filtered.length > 0 && filtered.every(item => state.selectedFlashSales.has(item.id));
      }

      renderTableRows(paginatedItems);

      // Render Pagination
      if (paginationContainer) {
        paginationContainer.innerHTML = '';
        if (totalItems > 0) {
          // Info text: e.g. "Hiển thị 1-10 trên 15 chiến dịch"
          const infoText = document.createElement('div');
          infoText.className = 'text-xs text-gray-500 font-medium';
          infoText.textContent = `Hiển thị ${startIdx + 1}-${Math.min(startIdx + limit, totalItems)} trên ${totalItems} chiến dịch`;
          paginationContainer.appendChild(infoText);

          // Pagination buttons
          const pg = createPagination(state.fsPage, totalPages, (page) => {
            state.fsPage = page;
            renderFilteredList();
          });
          paginationContainer.appendChild(pg);
        } else {
          paginationContainer.innerHTML = `<div class="text-xs text-gray-400 font-medium w-full text-center">Không có chiến dịch nào</div>`;
        }
      }

      updateBulkActionsPanel();
    }

    function renderTableRows(items) {
      if (!items.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-400 text-sm">Không tìm thấy chiến dịch nào</td></tr>`;
        return;
      }

      tbody.innerHTML = '';
      const now = new Date();

      items.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'text-gray-700 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50';

        const start = new Date(item.start_time);
        const end = new Date(item.end_time);

        let statusBadge = '';
        if (!item.is_active || item.is_active == 0) {
          statusBadge = '<span class="px-2.5 py-1 text-[10px] rounded-full bg-gray-100 text-gray-500 font-bold uppercase tracking-wider">Tắt</span>';
        } else if (now < start) {
          statusBadge = '<span class="px-2.5 py-1 text-[10px] rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-bold uppercase tracking-wider">Đã lên lịch</span>';
        } else if (now > end) {
          statusBadge = '<span class="px-2.5 py-1 text-[10px] rounded-full bg-red-50 text-red-700 border border-red-100 font-bold uppercase tracking-wider">Đã kết thúc</span>';
        } else {
          statusBadge = '<span class="px-2.5 py-1 text-[10px] rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold uppercase tracking-wider animate-pulse">Đang chạy</span>';
        }

        const isChecked = state.selectedFlashSales.has(item.id);

        tr.innerHTML = `
          <td class="px-4 py-4 text-center">
            <input type="checkbox" class="fs-campaign-chk rounded border-gray-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer" data-id="${item.id}" ${isChecked ? 'checked' : ''}>
          </td>
          <td class="px-6 py-4">
            <div class="font-bold text-gray-900 truncate max-w-[200px]" title="${item.product_name || ''}">${item.product_name || 'Sản phẩm đã xóa'}</div>
            <div class="text-xs text-gray-400 font-mono mt-0.5">ID: #${item.product_id} ${item.product_sku ? `| SKU: ${item.product_sku}` : ''}</div>
          </td>
          <td class="px-6 py-4 font-bold text-red-600">${Number(item.sale_price).toLocaleString('vi-VN')}đ</td>
          <td class="px-6 py-4 text-xs space-y-0.5">
            <div class="text-gray-600 font-medium">Bắt đầu: ${start.toLocaleString('vi-VN')}</div>
            <div class="text-gray-400">Kết thúc: ${end.toLocaleString('vi-VN')}</div>
          </td>
          <td class="px-6 py-4">${statusBadge}</td>
          <td class="px-6 py-4 text-right">
            <button class="del-fs-btn p-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs font-semibold" data-id="${item.id}">Xóa</button>
          </td>
        `;

        // Checkbox listener
        tr.querySelector('.fs-campaign-chk').addEventListener('change', (e) => {
          if (e.target.checked) {
            state.selectedFlashSales.add(item.id);
          } else {
            state.selectedFlashSales.delete(item.id);
          }
          updateBulkActionsPanel();
          if (selectAllCampaignsChk) {
            const currentFiltered = getFilteredCampaigns();
            selectAllCampaignsChk.checked = currentFiltered.length > 0 && currentFiltered.every(i => state.selectedFlashSales.has(i.id));
          }
        });

        // Delete button listener
        tr.querySelector('.del-fs-btn').addEventListener('click', () => {
          createConfirmDialog('Xác nhận xóa lịch flash sale này?', async () => {
            try {
              await deleteFlashSale(item.id);
              showToast('Đã xóa lịch flash sale');
              state.selectedFlashSales.delete(item.id);
              loadFlashSalesList(container);
            } catch (err) {
              showToast(err.message, 'error');
            }
          });
        });

        tbody.appendChild(tr);
      });
    }

    renderFilteredList();

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-red-500 text-sm">${err.message || 'Lỗi tải dữ liệu'}</td></tr>`;
  }
}
