let currentSort = { col: 'views', dir: 'desc' };

export function renderTopPagesTable(container, stats) {
  const pages = stats.top_pages || [];
  container.innerHTML = `
    <div class="bg-white rounded-xl shadow-sm p-6">
      <h3 class="text-base font-semibold text-gray-900 mb-4">Trang Được Xem Nhiều Nhất</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm" id="pages-table">
          <thead>
            <tr class="border-b border-gray-100">
              ${['page,Trang', 'views,Lượt Xem', 'avg_time,Thời Gian TB', 'scroll_depth,Scroll Depth']
                .map(col => {
                  const [key, label] = col.split(',');
                  const active = currentSort.col === key;
                  return `<th data-col="${key}" class="text-left py-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-[0.05em] cursor-pointer hover:text-gray-700 select-none">
                    <span class="flex items-center gap-1">
                      ${label}
                      ${active ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="${currentSort.dir === 'asc' ? '6 15 12 9 18 15' : '18 9 12 15 6 9'}"/></svg>` : ''}
                    </span>
                  </th>`;
                }).join('')}
            </tr>
          </thead>
          <tbody id="pages-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  renderRows(container, pages);

  container.querySelectorAll('th[data-col]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      if (currentSort.col === col) {
        currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort = { col, dir: 'desc' };
      }
      const sorted = sortPages([...pages], currentSort);
      renderRows(container, sorted);
      renderTopPagesTable(container, { top_pages: pages });
    });
  });
}

function sortPages(pages, sort) {
  return pages.sort((a, b) => {
    const va = a[sort.col] ?? '';
    const vb = b[sort.col] ?? '';
    if (typeof va === 'number') return sort.dir === 'asc' ? va - vb : vb - va;
    return sort.dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });
}

function renderRows(container, pages) {
  const tbody = container.querySelector('#pages-tbody');
  if (!tbody) return;
  const sorted = sortPages([...pages], currentSort).slice(0, 10);
  tbody.innerHTML = sorted.length
    ? sorted.map(p => `
        <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
          <td class="py-2.5 px-2 text-gray-700 max-w-xs truncate font-medium">${p.page || '/'}</td>
          <td class="py-2.5 px-2 text-gray-600">${Number(p.views || 0).toLocaleString('vi-VN')}</td>
          <td class="py-2.5 px-2 text-gray-600">${formatTime(p.avg_time)}</td>
          <td class="py-2.5 px-2">
            <div class="flex items-center gap-2">
              <div class="flex-1 bg-gray-100 rounded-full h-1.5">
                <div class="bg-[#C9A84C] h-1.5 rounded-full" style="width:${Math.min(p.scroll_depth || 0, 100)}%"></div>
              </div>
              <span class="text-xs text-gray-500 w-8 text-right">${Math.round(p.scroll_depth || 0)}%</span>
            </div>
          </td>
        </tr>
      `).join('')
    : `<tr><td colspan="4" class="py-8 text-center text-gray-400 text-sm">Chưa có dữ liệu</td></tr>`;
}

function formatTime(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
