import { updateOrderStatus, getOrder } from '../../../services/adminService.js';
import { formatPrice, formatDate, showToast } from '../shared/ui.js';

const STATUS_STEPS = ['pending', 'processing', 'shipping', 'completed'];
const STATUS_LABELS = {
  pending: 'Chờ xử lý', processing: 'Đang xử lý',
  shipping: 'Đang giao', completed: 'Hoàn thành', cancelled: 'Đã hủy',
};

export function renderOrderDetail(container, orderId, onBack) {
  container.innerHTML = `<div class="text-center py-12 text-gray-400">Đang tải đơn hàng...</div>`;
  loadDetail(container, orderId, onBack);
}

async function loadDetail(container, orderId, onBack) {
  try {
    const res = await getOrder(orderId);
    const order = res.data || res;
    renderDetail(container, order, onBack);
  } catch {
    container.innerHTML = `<div class="text-center py-12 text-red-400">Không tải được đơn hàng</div>`;
  }
}

function renderDetail(container, order, onBack) {
  const isCancelled = order.status === 'cancelled';
  const currentIdx = STATUS_STEPS.indexOf(order.status);

  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <button id="od-back" class="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <h2 class="text-xl font-bold text-gray-900">Đơn hàng #${order.id}</h2>
          <p class="text-sm text-gray-500">${formatDate(order.created_at)}</p>
        </div>
        <div class="ml-auto">
          <span class="px-3 py-1.5 text-sm rounded-full font-semibold ${statusClass(order.status)}">${STATUS_LABELS[order.status] || order.status}</span>
        </div>
      </div>

      ${!isCancelled ? `
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Trạng thái đơn hàng</h3>
        <div class="flex items-center justify-between relative">
          <div class="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0"></div>
          <div class="absolute top-4 left-0 h-0.5 bg-[#C9A84C] z-0 transition-all" style="width:${currentIdx >= 0 ? (currentIdx / (STATUS_STEPS.length - 1)) * 100 : 0}%"></div>
          ${STATUS_STEPS.map((s, i) => `
            <div class="flex flex-col items-center z-10 flex-1">
              <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 ${i <= currentIdx ? 'bg-[#C9A84C] border-[#C9A84C] text-white' : 'bg-white border-gray-300 text-gray-400'}">
                ${i < currentIdx ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` : i + 1}
              </div>
              <p class="text-xs mt-1 font-medium ${i <= currentIdx ? 'text-gray-700' : 'text-gray-400'}">${STATUS_LABELS[s]}</p>
            </div>
          `).join('')}
        </div>
      </div>` : ''}

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Thông tin khách hàng</h3>
          <div class="space-y-2 text-sm text-gray-600">
            <div class="flex gap-2"><span class="text-gray-400 w-28">Họ tên:</span><span class="font-medium text-gray-800">${order.customer_name || order.user?.name || '—'}</span></div>
            <div class="flex gap-2"><span class="text-gray-400 w-28">Email:</span><span>${order.customer_email || order.user?.email || '—'}</span></div>
            <div class="flex gap-2"><span class="text-gray-400 w-28">Điện thoại:</span><span>${order.customer_phone || '—'}</span></div>
            <div class="flex gap-2"><span class="text-gray-400 w-28">Địa chỉ:</span><span>${order.shipping_address || '—'}</span></div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Thông tin thanh toán</h3>
          <div class="space-y-2 text-sm text-gray-600">
            <div class="flex gap-2"><span class="text-gray-400 w-28">Phương thức:</span><span>${order.payment_method || '—'}</span></div>
            <div class="flex gap-2"><span class="text-gray-400 w-28">Tạm tính:</span><span>${formatPrice(order.subtotal)}</span></div>
            <div class="flex gap-2"><span class="text-gray-400 w-28">Phí ship:</span><span>${formatPrice(order.shipping_fee)}</span></div>
            <div class="flex gap-2"><span class="text-gray-400 w-28 font-semibold">Tổng cộng:</span><span class="text-[#C9A84C] font-bold text-base">${formatPrice(order.total)}</span></div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">Sản phẩm trong đơn</h3>
        <div class="space-y-3">
          ${(order.items || order.order_items || []).map(item => `
            <div class="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
              <img src="${item.product?.images?.[0] || item.image || ''}" alt="" class="w-14 h-14 object-cover rounded-lg bg-gray-200" onerror="this.style.display='none'">
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 truncate">${item.product?.name || item.product_name || '—'}</p>
                <p class="text-xs text-gray-500 mt-0.5">SKU: ${item.product?.sku || item.sku || '—'}</p>
              </div>
              <div class="text-right flex-shrink-0">
                <p class="font-semibold text-gray-900">${formatPrice(item.price)}</p>
                <p class="text-xs text-gray-500">x${item.quantity}</p>
              </div>
            </div>
          `).join('') || '<p class="text-gray-400 text-sm">Không có sản phẩm</p>'}
        </div>
      </div>

      ${!isCancelled ? `
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">Cập nhật trạng thái</h3>
        <div class="flex items-center gap-3">
          <select id="od-status-sel" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]">
            ${Object.entries(STATUS_LABELS).map(([v, l]) => `<option value="${v}" ${order.status === v ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
          <button id="od-update-btn" class="px-5 py-2 bg-[#C9A84C] text-white rounded-lg text-sm font-medium hover:bg-[#b8963e]">Cập nhật</button>
        </div>
      </div>` : ''}
    </div>
  `;

  container.querySelector('#od-back')?.addEventListener('click', onBack);
  const updateBtn = container.querySelector('#od-update-btn');
  if (updateBtn) {
    updateBtn.addEventListener('click', async () => {
      const status = container.querySelector('#od-status-sel').value;
      updateBtn.textContent = 'Đang lưu...'; updateBtn.disabled = true;
      try {
        await updateOrderStatus(order.id, status);
        showToast('Cập nhật trạng thái thành công!');
        order.status = status;
        renderDetail(container, order, onBack);
      } catch (e) { showToast(e.message, 'error'); }
      finally { updateBtn.textContent = 'Cập nhật'; updateBtn.disabled = false; }
    });
  }
}

function statusClass(s) {
  const m = { pending: 'bg-yellow-100 text-yellow-700', processing: 'bg-blue-100 text-blue-700', shipping: 'bg-purple-100 text-purple-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };
  return m[s] || 'bg-gray-100 text-gray-600';
}
