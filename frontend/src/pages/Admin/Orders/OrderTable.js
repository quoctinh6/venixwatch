import { getOrders, updateOrderStatus } from '../../../services/adminService.js';
import { showToast, createPagination, formatPrice, formatDate } from '../shared/ui.js';
import { renderOrderDetail } from './OrderDetail.js';

function downloadXLS(filename, reportTitle, sections) {
  const dateStr = new Date().toLocaleDateString('vi-VN');
  const maxCols = Math.max(...sections.map(s => s.columns.length));
  const esc = (v) => String(v === null || v === undefined ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const S = {
    ti: 'font-family:Arial,sans-serif;font-size:15pt;font-weight:bold;color:#C9A961;background:#0A0A0A;text-align:center;padding:10px 20px;',
    su: 'font-family:Arial,sans-serif;font-size:10pt;color:#9CA3AF;background:#0A0A0A;text-align:center;padding:4px 20px;',
    sp: 'background:#FFFFFF;padding:5px;',
    se: 'font-family:Arial,sans-serif;font-size:11pt;font-weight:bold;color:#C9A961;background:#1A1A1A;padding:7px 10px;',
    ch: 'font-family:Arial,sans-serif;font-size:11pt;font-weight:bold;color:#FFFFFF;background:#C9A84C;text-align:center;padding:6px 10px;border:1px solid #B8963E;',
    re: 'font-family:Arial,sans-serif;font-size:10pt;color:#374151;background:#FFFFFF;padding:5px 10px;border:1px solid #E5E7EB;',
    ro: 'font-family:Arial,sans-serif;font-size:10pt;color:#374151;background:#F3F4F6;padding:5px 10px;border:1px solid #E5E7EB;',
  };

  let t = '<table cellspacing="0" cellpadding="0" border="0">';
  t += `<tr><td colspan="${maxCols}" style="${S.ti}">VENIX WATCH</td></tr>`;
  t += `<tr><td colspan="${maxCols}" style="${S.su}">${esc(reportTitle)}</td></tr>`;
  t += `<tr><td colspan="${maxCols}" style="${S.su}">Xuất ngày: ${dateStr}</td></tr>`;

  sections.forEach(sec => {
    t += `<tr>${Array(maxCols).fill(`<td style="${S.sp}"> </td>`).join('')}</tr>`;
    if (sec.heading) t += `<tr><td colspan="${maxCols}" style="${S.se}">${esc(sec.heading)}</td></tr>`;
    t += '<tr>';
    for (let i = 0; i < maxCols; i++) t += `<td style="${S.ch}">${esc(sec.columns[i] || '')}</td>`;
    t += '</tr>';
    sec.rows.forEach((row, idx) => {
      const s = idx % 2 === 0 ? S.re : S.ro;
      t += '<tr>';
      for (let i = 0; i < maxCols; i++) {
        const v = row[i] === null || row[i] === undefined ? '' : row[i];
        t += `<td style="${s}">${esc(v)}</td>`;
      }
      t += '</tr>';
    });
  });
  t += '</table>';

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Bao cao</x:Name><x:WorksheetOptions><x:Selected/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>${t}</body></html>`;

  const blob = new Blob(['\uFEFF', html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const STATUS_LABELS = {
  all:        'Tất cả',
  pending:    'Chờ xử lý',
  processing: 'Đang xử lý',
  shipping:   'Đang giao',
  completed:  'Hoàn thành',
  cancelled:  'Đã hủy',
};

const PAGE_SIZE = 20;
let state = { page: 1, status: 'all', total: 0, data: [], sortDir: {} };

export function renderOrderTable(container) {
  container.innerHTML = `
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-100">
        <div class="flex gap-1 flex-wrap">
          ${Object.entries(STATUS_LABELS).map(([value, label]) => `
            <button class="status-filter-btn px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${state.status === value ? 'bg-[#1a1a1a] text-white' : 'text-gray-600 hover:bg-gray-100'}" data-status="${value}">${label}</button>
          `).join('')}
        </div>
        <button id="orders-export-btn" class="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Xuất Excel
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 sort-th" data-col="id">
                <span class="flex items-center gap-1"># Đơn <span class="sort-icon text-gray-300">⇅</span></span>
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Khách hàng</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 sort-th" data-col="date">
                <span class="flex items-center gap-1">Ngày <span class="sort-icon text-gray-300">⇅</span></span>
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sản phẩm</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 sort-th" data-col="total">
                <span class="flex items-center gap-1">Tổng <span class="sort-icon text-gray-300">⇅</span></span>
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Hành động</th>
            </tr>
          </thead>
          <tbody id="order-tbody" class="divide-y divide-gray-50">
            <tr><td colspan="7" class="py-8 text-center text-gray-400 text-sm">Đang tải...</td></tr>
          </tbody>
        </table>
      </div>
      <div class="px-4 py-3 border-t border-gray-100" id="order-pagination"></div>
    </div>
  `;

  container.querySelectorAll('.status-filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.status = btn.dataset.status;
      state.page = 1;
      state.sortDir = {};
      renderOrderTable(container);
    });
  });

  container.querySelectorAll('.sort-th').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      const current = state.sortDir[col];
      state.sortDir = {};
      if (!current)            state.sortDir[col] = 'asc';
      else if (current === 'asc') state.sortDir[col] = 'desc';
      updateSortIcons(container);
      renderRows(container);
    });
  });

  container.querySelector('#orders-export-btn').addEventListener('click', () => exportOrdersCSV());

  loadOrders(container);
}

function exportOrdersCSV() {
  if (!state.data.length) {
    alert('Không có dữ liệu để xuất.');
    return;
  }
  const dateStr = new Date().toISOString().split('T')[0];
  const statusLabel = state.status !== 'all' ? ` — ${STATUS_LABELS[state.status]}` : '';
  downloadXLS(
    `don-hang${state.status !== 'all' ? '-' + state.status : ''}-${dateStr}.xls`,
    `DANH SÁCH ĐƠN HÀNG${statusLabel}`,
    [{
      heading: '▌ DANH SÁCH ĐƠN HÀNG',
      columns: ['# Đơn', 'Khách hàng', 'Email', 'SĐT', 'Ngày đặt', 'Số SP', 'Tổng tiền (VND)', 'Trạng thái', 'Thanh toán', 'Địa chỉ'],
      rows: getSorted(state.data).map(o => [
        o.id,
        o.customer_name || o.user?.full_name || '',
        o.customer_email || o.user?.email || '',
        o.customer_phone || '',
        o.created_at ? new Date(o.created_at).toLocaleDateString('vi-VN') : '',
        (o.items || o.order_items || []).length,
        o.total_amount ?? 0,
        STATUS_LABELS[o.status] || o.status || '',
        o.payment_method || '',
        o.shipping_address || '',
      ]),
    }]
  );
}

function updateSortIcons(container) {
  container.querySelectorAll('.sort-th').forEach(th => {
    const dir = state.sortDir[th.dataset.col];
    const icon = th.querySelector('.sort-icon');
    if (!icon) return;
    if (dir === 'asc')       { icon.textContent = '↑'; icon.className = 'sort-icon text-[#C9A84C]'; }
    else if (dir === 'desc') { icon.textContent = '↓'; icon.className = 'sort-icon text-[#C9A84C]'; }
    else                     { icon.textContent = '⇅'; icon.className = 'sort-icon text-gray-300'; }
  });
}

function getSorted(data) {
  const [col, dir] = Object.entries(state.sortDir).find(([, v]) => v) || [];
  if (!col) return data;
  const factor = dir === 'asc' ? 1 : -1;
  return [...data].sort((a, b) => {
    let va, vb;
    if (col === 'id')    { va = a.id; vb = b.id; }
    if (col === 'date')  { va = new Date(a.created_at).getTime(); vb = new Date(b.created_at).getTime(); }
    if (col === 'total') { va = Number(a.total_amount ?? 0); vb = Number(b.total_amount ?? 0); }
    return (va - vb) * factor;
  });
}

async function loadOrders(container) {
  const tbody = container.querySelector('#order-tbody');
  tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-gray-400 text-sm">Đang tải...</td></tr>`;

  try {
    const params = { page: state.page, limit: PAGE_SIZE };
    if (state.status !== 'all') params.status = state.status;

    const res = await getOrders(params);
    const items = Array.isArray(res.data) ? res.data : [];
    state.total = Number(res.meta?.total ?? items.length);
    state.data = items;

    renderRows(container);
    renderPageNav(container);
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-red-400 text-sm">${error.message || 'Lỗi tải dữ liệu'}</td></tr>`;
  }
}

function renderRows(container) {
  const tbody = container.querySelector('#order-tbody');
  const rows = getSorted(state.data);

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-10 text-center text-gray-400 text-sm">Không có đơn hàng</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  rows.forEach((order) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50 transition-colors cursor-pointer';
    const items = order.items || order.order_items || [];

    tr.innerHTML = `
      <td class="px-4 py-3 font-mono text-xs text-gray-500 font-medium">#${order.id}</td>
      <td class="px-4 py-3">
        <div class="font-medium text-gray-900">${order.customer_name || order.user?.full_name || '-'}</div>
        <div class="text-xs text-gray-400">${order.customer_email || order.user?.email || ''}</div>
      </td>
      <td class="px-4 py-3 text-gray-600 text-xs">${formatDate(order.created_at)}</td>
      <td class="px-4 py-3 text-gray-600 text-xs">${items.length} sản phẩm</td>
      <td class="px-4 py-3 font-semibold text-gray-900">${formatPrice(order.total_amount)}</td>
      <td class="px-4 py-3">
        <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass(order.status)}">${STATUS_LABELS[order.status] || order.status}</span>
      </td>
      <td class="px-4 py-3 text-right action-cell">
        <div class="flex items-center justify-end gap-2">
          <select class="quick-status text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:border-[#C9A84C]">
            ${Object.entries(STATUS_LABELS).filter(([value]) => value !== 'all').map(([value, label]) => `<option value="${value}" ${order.status === value ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
          <button class="view-btn p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Xem chi tiết">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      </td>
    `;

    tr.querySelector('.action-cell').addEventListener('click', (event) => {
      event.stopPropagation();
    });

    tr.querySelector('.view-btn').addEventListener('click', (event) => {
      event.stopPropagation();
      showDetailView(container, order.id);
    });

    tr.querySelector('.quick-status').addEventListener('change', async (event) => {
      event.stopPropagation();
      try {
        await updateOrderStatus(order.id, event.target.value);
        order.status = event.target.value;
        showToast('Cập nhật thành công');
        renderRows(container);
      } catch (error) {
        showToast(error.message, 'error');
      }
    });

    tr.addEventListener('click', () => showDetailView(container, order.id));
    tbody.appendChild(tr);
  });
}

function showDetailView(container, orderId) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
  overlay.innerHTML = `<div class="bg-gray-100 rounded-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6" data-lenis-prevent></div>`;
  document.body.appendChild(overlay);
  const inner = overlay.querySelector('div');
  overlay.addEventListener('click', (event) => { if (event.target === overlay) overlay.remove(); });
  renderOrderDetail(inner, orderId, () => overlay.remove());
}

function renderPageNav(container) {
  const wrap = container.querySelector('#order-pagination');
  wrap.innerHTML = '';
  const totalPages = Math.ceil(state.total / PAGE_SIZE);
  if (totalPages <= 1) return;
  wrap.appendChild(createPagination(state.page, totalPages, (page) => {
    state.page = page;
    loadOrders(container);
  }));
}

function statusClass(status) {
  const map = {
    pending:    'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    shipping:   'bg-purple-100 text-purple-700',
    completed:  'bg-green-100 text-green-700',
    cancelled:  'bg-red-100 text-red-700',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
}
