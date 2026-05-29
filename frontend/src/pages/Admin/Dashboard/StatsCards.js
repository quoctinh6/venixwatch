import { formatPrice } from '../shared/ui.js';

const CARDS = [
  {
    key: 'online_users',
    label: 'Người Dùng Online',
    color: 'green',
    colorClass: 'text-green-600 bg-green-50',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  },
  {
    key: 'visitors_today',
    label: 'Người Truy Cập Hôm Nay',
    color: 'orange',
    colorClass: 'text-orange-600 bg-orange-50',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  },
  {
    key: 'views_today',
    label: 'Lượt Xem Hôm Nay',
    color: 'blue',
    colorClass: 'text-blue-600 bg-blue-50',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  },
  {
    key: 'orders_today',
    label: 'Đơn Hàng Hôm Nay',
    color: 'yellow',
    colorClass: 'text-yellow-600 bg-yellow-50',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  },
  {
    key: 'revenue_today',
    label: 'Doanh Thu Hôm Nay',
    color: 'purple',
    colorClass: 'text-purple-600 bg-purple-50',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    format: 'price',
  },
];

function trendHtml(trend) {
  if (trend === undefined || trend === null) return '';
  const up = trend >= 0;
  const color = up ? 'text-green-600' : 'text-red-500';
  const arrow = up
    ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>`
    : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>`;
  return `<span class="flex items-center gap-0.5 text-xs font-medium ${color}">${arrow}${Math.abs(trend).toFixed(1)}%</span>`;
}

export function renderStatsCards(container, stats) {
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4';

  CARDS.forEach(card => {
    const raw = stats[card.key] ?? 0;
    const value = card.format === 'price' ? formatPrice(raw) : Number(raw).toLocaleString('vi-VN');
    const trend = stats[card.key + '_trend'];
    const div = document.createElement('div');
    div.className = 'bg-white rounded-xl shadow-sm p-6 flex items-start justify-between';
    div.innerHTML = `
      <div>
        <p class="text-sm text-gray-500 mb-1">${card.label}</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">${value}</p>
        <div class="mt-2 flex items-center gap-2">
          ${trendHtml(trend)}
          <span class="text-xs text-gray-400">so với hôm qua</span>
        </div>
      </div>
      <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${card.colorClass}">
        ${card.icon}
      </div>
    `;
    grid.appendChild(div);
  });

  container.appendChild(grid);
}
