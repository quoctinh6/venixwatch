import { showToast } from '../shared/ui.js';

export function renderHistoryTab(historyLogs, currentPage) {
  const itemsPerPage = 15;
  const totalPages = Math.ceil(historyLogs.length / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = historyLogs.slice(startIndex, endIndex);

  let paginationControls = '';
  if (totalPages > 1) {
    paginationControls = `
      <div class="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
        <div class="text-xs text-gray-500">
          Hiển thị dòng <span class="font-semibold text-gray-700">${startIndex + 1}</span> đến <span class="font-semibold text-gray-700">${Math.min(endIndex, historyLogs.length)}</span> trong tổng số <span class="font-semibold text-gray-700">${historyLogs.length}</span> lịch sử
        </div>
        <div class="flex items-center gap-1.5">
          <button type="button" id="prev-page-btn" class="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center gap-1 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed" ${safeCurrentPage === 1 ? 'disabled' : ''}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Trang trước
          </button>
          
          <div class="flex items-center gap-1 flex-wrap">
            ${Array.from({ length: totalPages }).map((_, pIdx) => {
              const p = pIdx + 1;
              const isActive = p === safeCurrentPage;
              return `<button type="button" class="page-num-btn w-8 h-8 rounded-lg text-xs font-bold transition-all ${isActive ? 'bg-[#C9A84C]' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}" data-page="${p}">${p}</button>`;
            }).join('')}
          </div>

          <button type="button" id="next-page-btn" class="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center gap-1 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed" ${safeCurrentPage === totalPages ? 'disabled' : ''}>
            Trang sau
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div class="space-y-4">
      <h3 class="text-base font-bold text-gray-900 border-b pb-3">Lịch Sử Thao Tác Hệ Thống</h3>
      ${paginationControls}
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
              <th class="py-2.5 px-3 w-16">STT</th>
              <th class="py-2.5 px-3 w-48">Hành động</th>
              <th class="py-2.5 px-3">Chi tiết thay đổi</th>
              <th class="py-2.5 px-3 w-40">Người thực hiện</th>
              <th class="py-2.5 px-3 w-40">Thời gian</th>
              <th class="py-2.5 px-3 w-32 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            ${paginatedLogs.length === 0 
              ? `<tr><td colspan="6" class="text-center py-6 text-gray-400">Chưa ghi nhận sự kiện lịch sử thay đổi nào.</td></tr>` 
              : paginatedLogs.map((log, index) => `
                <tr class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="py-3 px-3 text-gray-400 font-medium">${historyLogs.length - (startIndex + index)}</td>
                  <td class="py-3 px-3 font-semibold text-zinc-800">${log.action}</td>
                  <td class="py-3 px-3 text-gray-600 font-medium">${log.details}</td>
                  <td class="py-3 px-3 text-gray-500">${log.changed_by}</td>
                  <td class="py-3 px-3 text-gray-400">${new Date(log.created_at).toLocaleString('vi-VN')}</td>
                  <td class="py-3 px-3 text-right">
                    ${log.settings_snapshot 
                      ? `<button type="button" class="rollback-btn text-[#C9A84C] hover:text-[#A88840] font-bold hover:underline transition-colors focus:outline-none" data-id="${log.id}">Hoàn tác về đây</button>`
                      : `<span class="text-gray-300">-</span>`
                    }
                  </td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export function bindHistoryTab(container, token, API_BASE, historyLogs, currentPage, ctx) {
  // Rollback Action
  container.querySelectorAll('.rollback-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const historyId = btn.dataset.id;
      if (!confirm('Bạn có chắc chắn muốn khôi phục cấu hình về phiên bản này?')) return;
      
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = 'Đang khôi phục...';
      
      try {
        const res = await fetch(`${API_BASE}/api/admin/settings/rollback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ history_id: parseInt(historyId, 10) })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast('Hoàn tác cấu hình thành công!', 'success');
          
          // Force reload page to apply everything cleanly
          setTimeout(() => {
            window.location.reload();
          }, 600);
        } else {
          showToast(data.error || 'Lỗi khi khôi phục.', 'error');
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      } catch {
        showToast('Lỗi kết nối khi hoàn tác.', 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  });

  // Pagination Actions
  container.querySelector('#prev-page-btn')?.addEventListener('click', () => {
    if (currentPage > 1) {
      ctx.setCurrentPage(currentPage - 1);
      ctx.renderUI();
    }
  });

  container.querySelector('#next-page-btn')?.addEventListener('click', () => {
    const itemsPerPage = 15;
    const totalPages = Math.ceil(historyLogs.length / itemsPerPage) || 1;
    if (currentPage < totalPages) {
      ctx.setCurrentPage(currentPage + 1);
      ctx.renderUI();
    }
  });

  container.querySelectorAll('.page-num-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = parseInt(btn.dataset.page, 10);
      ctx.setCurrentPage(p);
      ctx.renderUI();
    });
  });
}
