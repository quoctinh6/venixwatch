import { createFlashSale } from '../../../services/adminService.js';
import { showToast } from '../shared/ui.js';
import { initProductSelector, renderProductList } from './ProductSelector.js';
import { loadFlashSalesList } from './CampaignList.js';
import { resetFlashSalesState, state } from './FlashSalesState.js';

export function renderFlashSales(container) {
  resetFlashSalesState();
  
  container.innerHTML = `
    <div class="space-y-6 font-sans">
      <!-- Title & Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Quản Lý Chiến Dịch Flash Sale</h2>
          <p class="text-sm text-gray-500 mt-0.5 font-medium">Lên lịch giảm giá chớp nhoáng hàng loạt theo thời gian chạy</p>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <!-- FORM & BULK PRICING (4 cols) -->
        <div class="xl:col-span-4 bg-white rounded-xl shadow-sm p-6 border border-gray-100 space-y-5 h-fit">
          <h3 class="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-3">1. Thiết Lập Chiến Dịch</h3>
          
          <form id="create-flash-form" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Ngày & Giờ Bắt Đầu</label>
              <input type="datetime-local" id="fs-start" required class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C9A84C] transition">
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Thời Lượng Chiến Dịch</label>
              <select id="fs-duration-days" class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C9A84C] transition">
                <option value="1">1 ngày</option>
                <option value="2">2 ngày</option>
                <option value="3">3 ngày</option>
                <option value="5">5 ngày</option>
                <option value="7">7 ngày</option>
                <option value="10">10 ngày</option>
                <option value="15">15 ngày</option>
                <option value="30">30 ngày</option>
              </select>
            </div>

            <div class="border-t border-gray-100 pt-4 space-y-3">
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wide">Cấu hình giá nhanh cho SP đã chọn</label>
              <div class="grid grid-cols-2 gap-2">
                <select id="fs-bulk-type" class="px-2.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#C9A84C] transition">
                  <option value="fixed">Đồng giá (đ)</option>
                  <option value="percent">Giảm phần trăm (%)</option>
                  <option value="discount">Giảm số tiền (đ)</option>
                </select>
                <input type="text" id="fs-bulk-val" class="px-2.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#C9A84C] transition" placeholder="Nhập giá trị...">
              </div>
              <button type="button" id="fs-apply-bulk-price" class="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500 hover:text-zinc-950 text-amber-600 border border-amber-500/20 text-xs font-bold rounded-xl transition-all">
                Áp dụng giá nhanh
              </button>
            </div>

            <div class="border-t border-gray-100 pt-4">
              <div class="flex justify-between items-center text-sm font-semibold text-gray-700">
                <span>Số sản phẩm đã chọn:</span>
                <span id="fs-selected-count" class="text-amber-500 font-bold">0</span>
              </div>
            </div>

            <button type="submit" id="fs-submit-btn" class="w-full py-3.5 bg-gray-950 hover:bg-amber-500 hover:text-zinc-950 text-white rounded-xl text-xs font-black uppercase tracking-wider transition duration-300">
              Kích Hoạt Flash Sale Hàng Loạt
            </button>
          </form>
        </div>

        <!-- PRODUCT SELECTION TABLE (8 cols) -->
        <div class="xl:col-span-8 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[550px] overflow-hidden">
          <div class="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
            <h3 class="text-sm font-bold text-gray-800 uppercase tracking-wider">2. Chọn Sản Phẩm</h3>
            <div class="flex items-center gap-2 w-full sm:w-auto">
              <select id="fs-cat-filter" class="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#C9A84C] bg-white">
                <option value="">Tất cả danh mục</option>
              </select>
              <input type="text" id="fs-prod-search" class="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#C9A84C] w-full sm:w-48 bg-white" placeholder="Tìm tên, SKU...">
            </div>
          </div>

          <div class="flex-1 overflow-y-auto">
            <table class="w-full text-sm text-left">
              <thead class="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase sticky top-0 z-10">
                <tr>
                  <th class="px-4 py-3 w-12 text-center">
                    <input type="checkbox" id="fs-select-all-visible" class="rounded border-gray-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer">
                  </th>
                  <th class="px-4 py-3 w-16">Ảnh</th>
                  <th class="px-4 py-3">Sản phẩm / SKU</th>
                  <th class="px-4 py-3 w-28">Giá gốc</th>
                  <th class="px-4 py-3 w-36">Giá Flash Sale</th>
                </tr>
              </thead>
              <tbody id="fs-prod-tbody" class="divide-y divide-gray-50">
                <tr>
                  <td colspan="5" class="px-4 py-12 text-center text-gray-400 font-medium">Đang tải danh sách sản phẩm...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- EXISTING CAMPAIGNS -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <!-- Filter and Search Header -->
        <div class="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <h3 class="text-sm font-bold text-gray-800 uppercase tracking-wider">Chiến dịch Flash Sale hiện tại</h3>
            <span id="fs-campaigns-total-badge" class="px-2.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full font-bold">0</span>
          </div>
          <div class="flex flex-wrap items-center gap-2.5">
            <input type="text" id="fs-list-search" class="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#C9A84C] bg-white w-full sm:w-48" placeholder="Tìm sản phẩm, SKU...">
            <select id="fs-list-status" class="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#C9A84C] bg-white">
              <option value="all">Tất cả trạng thái</option>
              <option value="running">Đang chạy</option>
              <option value="scheduled">Đã lên lịch</option>
              <option value="ended">Đã kết thúc</option>
              <option value="inactive">Đã tắt</option>
            </select>
          </div>
        </div>

        <!-- Bulk Actions Panel (Hidden by default, displayed via JS when state.selectedFlashSales.size > 0) -->
        <div id="fs-bulk-actions-panel" class="hidden px-6 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between transition-all duration-300">
          <div class="text-xs font-bold text-amber-800">
            Đã chọn <span id="fs-bulk-select-count" class="text-sm font-black">0</span> chiến dịch
          </div>
          <div class="flex items-center gap-2">
            <button id="fs-bulk-enable-btn" class="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition">
              Bật đã chọn
            </button>
            <button id="fs-bulk-disable-btn" class="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-xs font-bold rounded-lg transition">
              Tắt đã chọn
            </button>
            <button id="fs-bulk-delete-btn" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition">
              Xóa đã chọn
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
                <th class="px-4 py-4 w-12 text-center">
                  <input type="checkbox" id="fs-select-all-campaigns" class="rounded border-gray-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer">
                </th>
                <th class="px-6 py-4">Sản Phẩm</th>
                <th class="px-6 py-4">Giá Flash Sale</th>
                <th class="px-6 py-4">Thời Gian Hoạt Động</th>
                <th class="px-6 py-4">Trạng Thái</th>
                <th class="px-6 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody id="flash-tbody" class="divide-y divide-gray-50">
              <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-400 text-sm">Đang tải...</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Pagination -->
        <div id="flash-pagination" class="p-4 border-t border-gray-100 flex items-center justify-between"></div>
      </div>
    </div>
  `;

  // Intercept keydown on the setup form to block Enter key submit, and run quick pricing calculation instead if targeted inside bulk input
  const setupForm = container.querySelector('#create-flash-form');
  setupForm.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (e.target.id === 'fs-bulk-val') {
        e.preventDefault();
        container.querySelector('#fs-apply-bulk-price').click();
      } else {
        e.preventDefault();
      }
    }
  });

  initProductSelector(container);

  // Submit Handler
  setupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.selectedProducts.size === 0) {
      showToast('Vui lòng chọn ít nhất một sản phẩm để tạo Flash Sale!', 'error');
      return;
    }

    const startVal = container.querySelector('#fs-start').value;
    if (!startVal) {
      showToast('Vui lòng chọn Ngày & Giờ Bắt Đầu!', 'error');
      return;
    }

    const durationDays = parseInt(container.querySelector('#fs-duration-days').value);
    
    // Validate pricing of selected products
    let hasInvalidPrice = false;
    state.selectedProducts.forEach((price) => {
      if (price === undefined || price === null || isNaN(price) || price <= 0) {
        hasInvalidPrice = true;
      }
    });

    if (hasInvalidPrice) {
      showToast('Vui lòng nhập giá Flash Sale hợp lệ (> 0) cho tất cả sản phẩm đã chọn!', 'error');
      return;
    }
    
    // Calculate end date-time
    const startDateObj = new Date(startVal);
    const endDateObj = new Date(startDateObj.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const formatDateTime = (date) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    const productsPayload = [];
    state.selectedProducts.forEach((price, pid) => {
      productsPayload.push({
        product_id: pid,
        sale_price: price
      });
    });

    const payload = {
      product_id: productsPayload[0].product_id, // Backward compatibility for single product controller signature if bulk fails
      products: productsPayload,
      start_time: formatDateTime(startDateObj),
      end_time: formatDateTime(endDateObj),
      is_active: 1
    };

    const submitBtn = container.querySelector('#fs-submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang kích hoạt...';

    // Support both bulk create API and fallbacks
    try {
      // Loop or call single endpoints if backend does not support array
      // In our updated backend Controller, we added array support!
      await createFlashSale(payload);
      showToast(`Đã tạo chiến dịch Flash Sale thành công cho ${productsPayload.length} sản phẩm!`);
      state.selectedProducts.clear();
      container.querySelector('#fs-selected-count').textContent = '0';
      container.querySelector('#fs-select-all-visible').checked = false;
      renderProductList(container);
      loadFlashSalesList(container);
    } catch (err) {
      showToast(err.message || 'Lỗi lưu dữ liệu', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Kích Hoạt Flash Sale Hàng Loạt';
    }
  });

  loadFlashSalesList(container);
}
