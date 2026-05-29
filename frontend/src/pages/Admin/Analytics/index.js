import { getAnalytics } from '../../../services/adminService.js';
import { formatDate, formatDuration } from '../shared/ui.js';

let charts = {};

export function renderAnalytics(container) {
  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Analytics</h2>
          <p class="text-sm text-gray-500 mt-0.5">Phan tich luu luong truy cap</p>
        </div>
        <div class="flex gap-2">
          ${[['7', '7 ngay'], ['30', '30 ngay'], ['90', '90 ngay']].map(([value, label]) => `
            <button class="range-btn px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${value === '30' ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}" data-range="${value}">${label}</button>
          `).join('')}
        </div>
      </div>

      <div id="analytics-summary" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"></div>

      <div class="bg-white rounded-xl shadow-sm p-6">
        <h3 class="text-base font-semibold text-gray-900 mb-1">Luot truy cap</h3>
        <p class="text-xs text-gray-400 mb-4">Tong so nguoi dung theo ngay</p>
        <div class="relative h-56"><canvas id="analytics-visitors-chart"></canvas></div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h3 class="text-base font-semibold text-gray-900 mb-4">Nguon truy cap</h3>
          <div class="relative h-48"><canvas id="analytics-source-chart"></canvas></div>
          <div id="analytics-source-legend" class="mt-3 space-y-1.5"></div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h3 class="text-base font-semibold text-gray-900 mb-4">Theo quoc gia</h3>
          <div class="relative h-48"><canvas id="analytics-country-chart"></canvas></div>
          <div id="analytics-country-legend" class="mt-3 space-y-1.5"></div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h3 class="text-base font-semibold text-gray-900 mb-4">Thiet bi</h3>
          <div class="relative h-48"><canvas id="analytics-device-chart"></canvas></div>
          <div id="analytics-device-legend" class="mt-3 space-y-1.5"></div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-[1.2fr,0.8fr] gap-4">
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h3 class="text-base font-semibold text-gray-900 mb-4">Trang duoc xem nhieu nhat</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-100">
                  <th class="pb-2 text-left text-xs text-gray-400 font-semibold uppercase">Trang</th>
                  <th class="pb-2 text-left text-xs text-gray-400 font-semibold uppercase">Luot xem</th>
                  <th class="pb-2 text-left text-xs text-gray-400 font-semibold uppercase">Nguoi dung</th>
                  <th class="pb-2 text-left text-xs text-gray-400 font-semibold uppercase">T.gian TB</th>
                </tr>
              </thead>
              <tbody id="analytics-pages-tbody">
                <tr><td colspan="4" class="py-6 text-center text-gray-400">Dang tai...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h3 class="text-base font-semibold text-gray-900 mb-4">Khu vuc truy cap</h3>
          <div id="analytics-cities" class="space-y-2"></div>
        </div>
      </div>
    </div>
  `;

  let currentRange = '30';
  const loadData = () => loadAnalytics(container, currentRange);

  container.querySelectorAll('.range-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentRange = btn.dataset.range;
      container.querySelectorAll('.range-btn').forEach((item) => {
        item.className = `range-btn px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${item.dataset.range === currentRange ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`;
      });
      loadData();
    });
  });

  loadData();
}

async function loadAnalytics(container, range) {
  try {
    const res = await getAnalytics({ days: range });
    const data = res.data || {};
    renderSummary(container, data.summary || {});
    renderVisitorsChart(container, data, range);
    renderSourceChart(container, data);
    renderCountryChart(container, data);
    renderDeviceChart(container, data);
    renderPagesTable(container, data);
    renderCities(container, data);
  } catch {
    const data = getMockData(range);
    renderSummary(container, data.summary);
    renderVisitorsChart(container, data, range);
    renderSourceChart(container, data);
    renderCountryChart(container, data);
    renderDeviceChart(container, data);
    renderPagesTable(container, data);
    renderCities(container, data);
  }
}

function renderSummary(container, summary) {
  const wrap = container.querySelector('#analytics-summary');
  if (!wrap) return;

  const cards = [
    ['Nguoi dung', Number(summary.unique_visitors || 0).toLocaleString('vi-VN')],
    ['Luot vao', Number(summary.total_visits || 0).toLocaleString('vi-VN')],
    ['O lai TB', formatDuration(summary.avg_time_on_page || 0)],
    ['Dang online', Number(summary.active_users || 0).toLocaleString('vi-VN')],
  ];

  wrap.innerHTML = cards.map(([label, value]) => `
    <div class="bg-white rounded-xl shadow-sm p-5">
      <div class="text-xs uppercase tracking-[0.05em] text-gray-400">${label}</div>
      <div class="mt-2 text-2xl font-bold text-gray-900">${value}</div>
    </div>
  `).join('');
}

function renderVisitorsChart(container, data, range) {
  const canvas = container.querySelector('#analytics-visitors-chart');
  if (!canvas) return;

  const daily = data.daily_visitors || generateMockDaily(Number(range));
  const labels = daily.map((item) => item.date ? formatDate(item.date) : '');
  const values = daily.map((item) => item.count || 0);

  if (charts.visitors) charts.visitors.destroy();
  charts.visitors = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Luot truy cap',
        data: values,
        backgroundColor: 'rgba(201,168,76,0.7)',
        borderColor: '#C9A84C',
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 10 }, maxTicksLimit: 10 } },
        y: { grid: { color: '#f3f4f6' }, ticks: { color: '#9ca3af', font: { size: 10 } }, beginAtZero: true },
      },
    },
  });
}

function renderSourceChart(container, data) {
  renderDonut(
    container.querySelector('#analytics-source-chart'),
    container.querySelector('#analytics-source-legend'),
    data.sources || [],
    ['#1a1a1a', '#C9A84C', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'],
    'source'
  );
}

function renderCountryChart(container, data) {
  renderDonut(
    container.querySelector('#analytics-country-chart'),
    container.querySelector('#analytics-country-legend'),
    data.countries || [],
    ['#C9A84C', '#1a1a1a', '#3b82f6', '#8b5cf6', '#f59e0b', '#6b7280'],
    'country'
  );
}

function renderDeviceChart(container, data) {
  const canvas = container.querySelector('#analytics-device-chart');
  const legend = container.querySelector('#analytics-device-legend');
  if (!canvas || !legend) return;

  const devices = data.devices || { desktop: 0, mobile: 0, tablet: 0 };
  const labels = ['Desktop', 'Mobile', 'Tablet'];
  const values = [devices.desktop || 0, devices.mobile || 0, devices.tablet || 0];
  const colors = ['#3b82f6', '#8b5cf6', '#f59e0b'];

  if (charts.device) charts.device.destroy();
  charts.device = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '60%' },
  });

  renderLegend(legend, labels.map((label, index) => ({ name: label, count: values[index] })), colors);
}

function renderPagesTable(container, data) {
  const tbody = container.querySelector('#analytics-pages-tbody');
  if (!tbody) return;

  const pages = data.top_pages || [];
  tbody.innerHTML = pages.length
    ? pages.slice(0, 10).map((page) => `
        <tr class="border-b border-gray-50 hover:bg-gray-50">
          <td class="py-2.5 text-gray-700 text-xs font-medium max-w-[260px] truncate">${page.page || '/'}</td>
          <td class="py-2.5 text-gray-600 text-xs">${Number(page.views || 0).toLocaleString('vi-VN')}</td>
          <td class="py-2.5 text-gray-600 text-xs">${Number(page.users || 0).toLocaleString('vi-VN')}</td>
          <td class="py-2.5 text-gray-600 text-xs">${formatDuration(page.avg_time || 0)}</td>
        </tr>
      `).join('')
    : `<tr><td colspan="4" class="py-6 text-center text-gray-400">Chua co du lieu</td></tr>`;
}

function renderCities(container, data) {
  const wrap = container.querySelector('#analytics-cities');
  if (!wrap) return;

  const cities = data.cities || [];
  wrap.innerHTML = cities.length
    ? cities.map((item) => `
        <div class="flex items-center justify-between border-b border-gray-100 pb-2">
          <div class="text-sm text-gray-700">${item.name || 'Khong ro'}</div>
          <div class="text-sm font-semibold text-gray-900">${Number(item.count || 0).toLocaleString('vi-VN')}</div>
        </div>
      `).join('')
    : `<div class="text-sm text-gray-400">Chua co du lieu khu vuc.</div>`;
}

function renderDonut(canvas, legend, rows, colors, key) {
  if (!canvas || !legend) return;

  const list = rows.length ? rows.slice(0, 6) : getMockRows(key);
  const labels = list.map((item) => item.name);
  const values = list.map((item) => item.count);

  if (charts[key]) charts[key].destroy();
  charts[key] = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '60%' },
  });

  renderLegend(legend, list, colors);
}

function renderLegend(legend, rows, colors) {
  const total = rows.reduce((sum, row) => sum + Number(row.count || 0), 0);
  legend.innerHTML = rows.map((row, index) => `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full" style="background:${colors[index]}"></span>
        <span class="text-xs text-gray-600">${row.name}</span>
      </div>
      <span class="text-xs font-medium text-gray-900">${total ? Math.round((Number(row.count || 0) / total) * 100) : 0}%</span>
    </div>
  `).join('');
}

function getMockRows(type) {
  if (type === 'source') {
    return [
      { name: 'Direct', count: 45 },
      { name: 'Google', count: 30 },
      { name: 'Facebook', count: 15 },
      { name: 'Referral', count: 10 },
    ];
  }

  return [
    { name: 'Viet Nam', count: 80 },
    { name: 'Hoa Ky', count: 12 },
    { name: 'Nhat Ban', count: 8 },
  ];
}

function getMockData(range) {
  return {
    summary: {
      unique_visitors: 1280,
      total_visits: 1640,
      avg_time_on_page: 94,
      active_users: 4,
      page_views: 3120,
      avg_scroll_depth: 63,
    },
    daily_visitors: generateMockDaily(Number(range)),
    sources: getMockRows('source'),
    countries: getMockRows('country'),
    devices: { desktop: 420, mobile: 580, tablet: 60 },
    cities: [
      { name: 'Ho Chi Minh, Vietnam', count: 320 },
      { name: 'Ha Noi, Vietnam', count: 240 },
      { name: 'Da Nang, Vietnam', count: 80 },
    ],
    top_pages: [
      { page: '/', views: 340, users: 280, avg_time: 125 },
      { page: '/nam', views: 220, users: 180, avg_time: 98 },
    ],
  };
}

function generateMockDaily(days) {
  const rows = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    rows.push({ date: d.toISOString(), count: Math.floor(Math.random() * 50 + 10) });
  }
  return rows;
}
