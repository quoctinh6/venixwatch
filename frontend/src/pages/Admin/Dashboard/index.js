import { getDashboardStats } from '../../../services/adminService.js';
import { renderStatsCards } from './StatsCards.js';
import { renderActiveUsersChart, updateActiveUsersChart } from './ActiveUsersChart.js';
import { renderVisitorMap, updateVisitorMap } from './VisitorMap.js';
import { renderTopPagesTable } from './TopPagesTable.js';
import { renderTrafficSourceChart } from './TrafficSourceChart.js';

let refreshTimer = null;

export function renderDashboard(container) {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }

  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Dashboard</h2>
          <p class="text-sm text-gray-500 mt-0.5">Tổng quan hoạt động</p>
        </div>
        <div class="flex items-center gap-2 text-xs text-gray-400">
          <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Tự cập nhật sau 30 giây
        </div>
      </div>
      <div id="dash-stats"></div>
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div id="dash-chart"></div>
        <div id="dash-map"></div>
      </div>
      <div id="dash-traffic"></div>
      <div id="dash-pages"></div>
    </div>
  `;

  const sections = {
    stats: container.querySelector('#dash-stats'),
    chart: container.querySelector('#dash-chart'),
    map: container.querySelector('#dash-map'),
    traffic: container.querySelector('#dash-traffic'),
    pages: container.querySelector('#dash-pages'),
  };

  loadAll(sections);

  refreshTimer = setInterval(() => {
    if (!document.getElementById('dash-stats')) {
      clearInterval(refreshTimer);
      return;
    }
    refreshAll(sections);
  }, 30000);

  document.addEventListener('hashchange', () => {
    if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
  }, { once: true });
}

async function loadAll(sections) {
  showSkeletons(sections);
  let stats;
  try {
    const res = await getDashboardStats();
    stats = res.data || res;
  } catch (err) {
    console.warn('Dashboard API error, using mock data:', err);
    stats = getMockStats();
  }
  renderStatsCards(sections.stats, stats);
  renderActiveUsersChart(sections.chart, stats);
  renderVisitorMap(sections.map, stats);
  renderTrafficSourceChart(sections.traffic, stats);
  renderTopPagesTable(sections.pages, stats);
}

async function refreshAll(sections) {
  try {
    const res = await getDashboardStats();
    const stats = res.data || res;
    renderStatsCards(sections.stats, stats);
    updateActiveUsersChart(stats);
    updateVisitorMap(stats);
  } catch {}
}

function showSkeletons(sections) {
  const sk = `<div class="animate-pulse bg-white rounded-xl h-32"></div>`;
  sections.stats.innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">${sk}${sk}${sk}${sk}${sk}</div>`;
}

function getMockStats() {
  return {
    online_users: 42, online_users_trend: 12.5,
    views_today: 1284, views_today_trend: 8.3,
    orders_today: 17, orders_today_trend: -3.2,
    revenue_today: 45890000, revenue_today_trend: 15.7,
    pending_orders: 5, low_stock_count: 3,
    hourly_views: [2,1,0,0,1,3,8,15,22,31,45,38,42,37,29,33,41,48,39,28,19,14,9,5],
    countries: [
      { code: 'VN', name: 'Việt Nam', count: 980 },
      { code: 'US', name: 'Hoa Kỳ', count: 120 },
      { code: 'JP', name: 'Nhật Bản', count: 85 },
      { code: 'SG', name: 'Singapore', count: 60 },
    ],
    traffic_sources: { direct: 450, google: 380, facebook: 220, other: 120 },
    devices: { desktop: 520, mobile: 680, tablet: 84 },
    top_pages: [
      { page: '/', views: 340, avg_time: 125, scroll_depth: 68 },
      { page: '/products', views: 220, avg_time: 98, scroll_depth: 55 },
      { page: '/product/omega-seamaster', views: 180, avg_time: 210, scroll_depth: 82 },
      { page: '/cart', views: 95, avg_time: 145, scroll_depth: 90 },
    ],
  };
}
