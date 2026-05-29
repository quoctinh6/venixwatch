import { getAnalytics } from '../../../services/adminService.js?v=1.0.5';
import { formatDate, formatDuration } from '../shared/ui.js?v=1.0.5';

let charts = {};
let latestData = null; // Store fetched data for exporting

function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function renderAnalytics(container) {
  container.innerHTML = `
    <div class="space-y-4 font-sans text-xs">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-gray-900 tracking-tight">Analytics</h2>
          <p class="text-xs text-gray-500 mt-0.5">Phân tích lượng truy cập & hiệu quả kinh doanh</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <!-- Preset buttons and Custom date inputs wrapper -->
          <div class="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-150 shadow-sm">
            <div class="flex gap-1">
              ${[['today', 'Hôm nay'], ['7', '7 ngày'], ['30', '30 ngày'], ['90', '90 ngày']].map(([value, label]) => `
                <button class="range-btn px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 cursor-pointer ${value === '30' ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm' : 'border-gray-100 text-gray-500 hover:text-[#C9A84C] hover:border-[#C9A84C]/30 hover:bg-amber-50/20'}" data-range="${value}">${label}</button>
              `).join('')}
            </div>
            <div class="h-4 w-px bg-gray-200 hidden md:block"></div>
            <div class="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
              <span class="px-1 text-gray-400 uppercase tracking-widest text-[9px] font-bold">Lịch:</span>
              <input type="date" id="analytics-start-date" class="px-2.5 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] font-semibold text-xs text-gray-700 bg-gray-50 hover:bg-white focus:bg-white transition-all" />
              <span class="text-gray-450 font-normal">→</span>
              <input type="date" id="analytics-end-date" class="px-2.5 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] font-semibold text-xs text-gray-700 bg-gray-50 hover:bg-white focus:bg-white transition-all" />
              <button id="analytics-apply-date" class="bg-[#C9A84C] hover:bg-[#b8963e] active:scale-95 text-white px-3.5 py-1.5 rounded-lg transition-all font-bold cursor-pointer ml-1 text-xs shadow-sm hover:shadow">Lọc</button>
            </div>
          </div>

          <!-- Export button -->
          <button id="analytics-export-btn" class="bg-zinc-950 hover:bg-zinc-800 active:scale-95 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div id="analytics-summary" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"></div>

      <!-- Main Visitors Chart -->
      <div class="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-bold text-gray-800">Biểu đồ lượt truy cập</h3>
            <p class="text-[10px] text-gray-400 mt-0.5">Thống kê số lượng phiên và khách truy cập độc nhất</p>
          </div>
          <div class="flex items-center gap-3 text-[10px] font-bold text-gray-500">
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-1.5 rounded bg-[#C9A84C]"></span>
              <span>Lượt truy cập</span>
            </div>
          </div>
        </div>
        <div class="relative h-64"><canvas id="analytics-visitors-chart"></canvas></div>
      </div>

      <!-- Products & Searches Section -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <!-- Top Products -->
        <div class="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm xl:col-span-2">
          <div class="flex items-center justify-between border-b pb-4 mb-4">
            <div>
              <h3 class="text-sm font-bold text-gray-800">Sản phẩm xem nhiều nhất</h3>
              <p class="text-[10px] text-gray-400 mt-0.5">Top sản phẩm được khách hàng quan tâm nhiều nhất</p>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th class="pb-3 pl-2">Sản phẩm</th>
                  <th class="pb-3 text-right">Lượt xem</th>
                  <th class="pb-3 text-right">Giá bán</th>
                </tr>
              </thead>
              <tbody id="analytics-products-tbody" class="divide-y divide-gray-50">
                <tr><td colspan="3" class="py-6 text-center text-gray-400">Đang tải...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Top Search Keywords -->
        <div class="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
          <div class="flex items-center justify-between border-b pb-4 mb-4">
            <div>
              <h3 class="text-sm font-bold text-gray-800">Từ khóa tìm kiếm nhiều nhất</h3>
              <p class="text-[10px] text-gray-400 mt-0.5">Từ khóa tìm kiếm trên thanh search</p>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th class="pb-3">Từ khóa</th>
                  <th class="pb-3 text-right">Tần suất</th>
                </tr>
              </thead>
              <tbody id="analytics-searches-tbody" class="divide-y divide-gray-50">
                <tr><td colspan="2" class="py-6 text-center text-gray-400">Đang tải...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Sources, Countries, Categories & Devices charts -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <!-- Top Categories -->
        <div class="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm">
          <h3 class="text-sm font-bold text-gray-800 mb-3">Danh mục ưa thích</h3>
          <div class="relative h-44"><canvas id="analytics-category-chart"></canvas></div>
          <div id="analytics-category-legend" class="mt-4 space-y-2"></div>
        </div>
        <!-- Device Split -->
        <div class="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm">
          <h3 class="text-sm font-bold text-gray-800 mb-3">Thiết bị truy cập</h3>
          <div class="relative h-44"><canvas id="analytics-device-chart"></canvas></div>
          <div id="analytics-device-legend" class="mt-4 space-y-2"></div>
        </div>
        <!-- Traffic Source -->
        <div class="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm">
          <h3 class="text-sm font-bold text-gray-800 mb-3">Nguồn lưu lượng</h3>
          <div class="relative h-44"><canvas id="analytics-source-chart"></canvas></div>
          <div id="analytics-source-legend" class="mt-4 space-y-2"></div>
        </div>
        <!-- Top Countries -->
        <div class="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm">
          <h3 class="text-sm font-bold text-gray-800 mb-3">Theo quốc gia</h3>
          <div class="relative h-44"><canvas id="analytics-country-chart"></canvas></div>
          <div id="analytics-country-legend" class="mt-4 space-y-2"></div>
        </div>
      </div>

      <!-- Top Pages & Cities -->
      <div class="grid grid-cols-1 lg:grid-cols-[1.3fr,0.7fr] gap-4">
        <!-- Top Pages Table -->
        <div class="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
          <h3 class="text-sm font-bold text-gray-800 mb-4">Các trang được xem nhiều</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th class="pb-3 pl-2">Đường dẫn trang</th>
                  <th class="pb-3 text-right">Lượt xem</th>
                  <th class="pb-3 text-right">Khách riêng biệt</th>
                  <th class="pb-3 text-right">T.gian TB</th>
                </tr>
              </thead>
              <tbody id="analytics-pages-tbody" class="divide-y divide-gray-50">
                <tr><td colspan="4" class="py-6 text-center text-gray-400">Đang tải...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Top Cities List -->
        <div class="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
          <h3 class="text-sm font-bold text-gray-800 mb-4">Khu vực truy cập chính</h3>
          <div id="analytics-cities" class="space-y-3.5">
            <div class="text-center py-6 text-gray-400">Đang tải...</div>
          </div>
        </div>
      </div>
    </div>
  `;

  let currentRange = '30';
  let startDate = '';
  let endDate = '';

  const loadData = () => {
    const params = {};
    if (currentRange === 'today') {
      const todayStr = getLocalDateString();
      params.start_date = todayStr;
      params.end_date = todayStr;
    } else if (startDate && endDate) {
      params.start_date = startDate;
      params.end_date = endDate;
    } else {
      params.days = currentRange;
    }
    loadAnalytics(container, params);
  };

  // Bind Preset range buttons
  container.querySelectorAll('.range-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentRange = btn.dataset.range;
      if (currentRange === 'today') {
        const todayStr = getLocalDateString();
        startDate = todayStr;
        endDate = todayStr;
        container.querySelector('#analytics-start-date').value = todayStr;
        container.querySelector('#analytics-end-date').value = todayStr;
      } else {
        startDate = '';
        endDate = '';
        container.querySelector('#analytics-start-date').value = '';
        container.querySelector('#analytics-end-date').value = '';
      }

      container.querySelectorAll('.range-btn').forEach((item) => {
        item.className = `range-btn px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 cursor-pointer ${
          item.dataset.range === currentRange 
            ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm' 
            : 'border-gray-100 text-gray-500 hover:text-[#C9A84C] hover:border-[#C9A84C]/30 hover:bg-amber-50/20'
        }`;
      });
      loadData();
    });
  });

  // Bind Custom Date Picker
  container.querySelector('#analytics-apply-date').addEventListener('click', () => {
    const startVal = container.querySelector('#analytics-start-date').value;
    const endVal = container.querySelector('#analytics-end-date').value;

    if (!startVal || !endVal) {
      alert('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.');
      return;
    }
    if (new Date(startVal) > new Date(endVal)) {
      alert('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      return;
    }

    startDate = startVal;
    endDate = endVal;
    currentRange = '';

    // Clear active preset buttons styling
    container.querySelectorAll('.range-btn').forEach((item) => {
      item.className = 'range-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-100 text-gray-500 hover:text-[#C9A84C] hover:border-[#C9A84C]/30 hover:bg-amber-50/20 transition-all duration-200 cursor-pointer';
    });

    loadData();
  });

  // Bind Export CSV button
  container.querySelector('#analytics-export-btn').addEventListener('click', () => {
    if (!latestData) {
      alert('Đang tải dữ liệu, vui lòng đợi một chút...');
      return;
    }
    exportCSVReport(latestData);
  });

  loadData();
}

async function loadAnalytics(container, params) {
  showTableLoadings(container);
  try {
    const res = await getAnalytics(params);
    const data = res.data || {};
    latestData = data; // Cache data for exporting
    renderSummary(container, data.summary || {});
    renderVisitorsChart(container, data, params);
    renderDonutChart(container, '#analytics-category-chart', '#analytics-category-legend', data.top_categories || [], ['#C9A84C', '#1a1a1a', '#3b82f6', '#10b981', '#f59e0b'], 'category');
    renderDonutChart(container, '#analytics-device-chart', '#analytics-device-legend', 
      Object.entries(data.devices || {}).map(([key, val]) => ({ name: key.toUpperCase(), count: val })), 
      ['#3b82f6', '#8b5cf6', '#f59e0b'], 'device');
    renderDonutChart(container, '#analytics-source-chart', '#analytics-source-legend', data.sources || [], ['#1a1a1a', '#C9A84C', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'], 'source');
    renderDonutChart(container, '#analytics-country-chart', '#analytics-country-legend', data.countries || [], ['#C9A84C', '#1a1a1a', '#3b82f6', '#8b5cf6', '#f59e0b', '#6b7280'], 'country');
    renderProductsTable(container, data.top_products || []);
    renderSearchesTable(container, data.top_searches || []);
    renderPagesTable(container, data.top_pages || []);
    renderCities(container, data.cities || []);
  } catch (err) {
    console.error(err);
    // Fallback to mock data on error
    const rangeVal = params.days || '30';
    const mock = getMockData(rangeVal);
    latestData = mock;
    renderSummary(container, mock.summary);
    renderVisitorsChart(container, mock, params);
    renderDonutChart(container, '#analytics-category-chart', '#analytics-category-legend', mock.top_categories, ['#C9A84C', '#1a1a1a', '#3b82f6', '#10b981', '#f59e0b'], 'category');
    renderDonutChart(container, '#analytics-device-chart', '#analytics-device-legend', 
      Object.entries(mock.devices).map(([key, val]) => ({ name: key.toUpperCase(), count: val })), 
      ['#3b82f6', '#8b5cf6', '#f59e0b'], 'device');
    renderDonutChart(container, '#analytics-source-chart', '#analytics-source-legend', mock.sources, ['#1a1a1a', '#C9A84C', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'], 'source');
    renderDonutChart(container, '#analytics-country-chart', '#analytics-country-legend', mock.countries, ['#C9A84C', '#1a1a1a', '#3b82f6', '#8b5cf6', '#f59e0b', '#6b7280'], 'country');
    renderProductsTable(container, mock.top_products);
    renderSearchesTable(container, mock.top_searches);
    renderPagesTable(container, mock.top_pages);
    renderCities(container, mock.cities);
  }
}

function showTableLoadings(container) {
  const tr = `<tr><td colspan="4" class="py-6 text-center text-gray-400 animate-pulse">Đang tải dữ liệu...</td></tr>`;
  const productsTbody = container.querySelector('#analytics-products-tbody');
  const searchesTbody = container.querySelector('#analytics-searches-tbody');
  const pagesTbody = container.querySelector('#analytics-pages-tbody');
  if (productsTbody) productsTbody.innerHTML = tr;
  if (searchesTbody) searchesTbody.innerHTML = tr.replace('colspan="4"', 'colspan="2"');
  if (pagesTbody) pagesTbody.innerHTML = tr;
}

function renderSummary(container, summary) {
  const wrap = container.querySelector('#analytics-summary');
  if (!wrap) return;

  const cards = [
    {
      label: 'Tổng lượt truy cập', 
      value: Number(summary.total_visits || 0).toLocaleString('vi-VN'),
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M2 12h22"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
      iconBg: 'bg-amber-50/60 text-[#C9A84C] group-hover:bg-[#C9A84C] group-hover:text-white',
    },
    {
      label: 'Khách hàng độc nhất', 
      value: Number(summary.unique_visitors || 0).toLocaleString('vi-VN'),
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      iconBg: 'bg-amber-50/60 text-[#C9A84C] group-hover:bg-[#C9A84C] group-hover:text-white',
    },
    {
      label: 'Thời gian lưu lại TB', 
      value: formatDuration(summary.avg_time_on_page || 0),
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
      iconBg: 'bg-amber-50/60 text-[#C9A84C] group-hover:bg-[#C9A84C] group-hover:text-white',
    },
    {
      label: 'Doanh thu (Ước tính)', 
      value: Number(summary.total_revenue || 0).toLocaleString('vi-VN') + 'đ',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
      iconBg: 'bg-amber-50/60 text-[#C9A84C] group-hover:bg-[#C9A84C] group-hover:text-white',
    },
    {
      label: 'Tổng số đơn hàng', 
      value: Number(summary.total_orders || 0).toLocaleString('vi-VN'),
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
      iconBg: 'bg-amber-50/60 text-[#C9A84C] group-hover:bg-[#C9A84C] group-hover:text-white',
    },
    {
      label: 'Đơn hàng trung bình (AOV)', 
      value: Number(summary.aov || 0).toLocaleString('vi-VN') + 'đ',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
      iconBg: 'bg-amber-50/60 text-[#C9A84C] group-hover:bg-[#C9A84C] group-hover:text-white',
    },
    {
      label: 'Lượt xem trang (Views)', 
      value: Number(summary.page_views || 0).toLocaleString('vi-VN'),
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
      iconBg: 'bg-amber-50/60 text-[#C9A84C] group-hover:bg-[#C9A84C] group-hover:text-white',
    },
    {
      label: 'Hoạt động trực tiếp', 
      value: `${summary.active_users || 0} online`,
      icon: `<span class="relative flex h-3.5 w-3.5"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500"></span></span>`,
      iconBg: 'bg-green-50 text-green-500 group-hover:bg-green-100 group-hover:text-green-600',
    }
  ];

  wrap.innerHTML = cards.map(c => `
    <div class="bg-white rounded-2xl border border-gray-150 p-5.5 shadow-sm hover:shadow-md hover:border-[#C9A84C]/45 transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-between group">
      <div class="space-y-2">
        <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${c.label}</div>
        <div class="text-xl font-extrabold text-gray-900 tracking-tight leading-none sm:text-2xl">${c.value}</div>
      </div>
      <div class="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${c.iconBg}">
        ${c.icon}
      </div>
    </div>
  `).join('');
}

function renderVisitorsChart(container, data, params) {
  const canvas = container.querySelector('#analytics-visitors-chart');
  if (!canvas) return;

  const rangeVal = params.days ? Number(params.days) : 30;
  const daily = data.daily_visitors || generateMockDaily(rangeVal);
  const labels = daily.map((item) => {
    if (!item.date) return '';
    if (item.date.includes(':')) return item.date;
    return formatDate(item.date);
  });
  const values = daily.map((item) => item.count || 0);

  if (charts.visitors) charts.visitors.destroy();

  const ctx = canvas.getContext('2d');
  
  // Custom Golden Gradient for a Premium look
  const gradient = ctx.createLinearGradient(0, 0, 0, 240);
  gradient.addColorStop(0, 'rgba(201, 168, 76, 0.25)');
  gradient.addColorStop(1, 'rgba(201, 168, 76, 0.0)');

  charts.visitors = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Lượt truy cập',
        data: values,
        borderColor: '#C9A84C',
        borderWidth: 2.5,
        backgroundColor: gradient,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#C9A84C',
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5,
        pointRadius: 3,
        pointHoverRadius: 5.5,
        pointHoverBackgroundColor: '#1a1a1a',
        pointHoverBorderColor: '#C9A84C',
        pointHoverBorderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a1a',
          titleFont: { family: 'Montserrat', size: 11, weight: 'bold' },
          bodyFont: { family: 'Montserrat', size: 11 },
          padding: 10,
          borderRadius: 8,
          borderColor: '#C9A84C',
          borderWidth: 1,
        }
      },
      scales: {
        x: { 
          grid: { display: false }, 
          ticks: { color: '#9ca3af', font: { family: 'Montserrat', size: 9, weight: '600' }, maxTicksLimit: 12 } 
        },
        y: { 
          grid: { color: '#f3f4f6' }, 
          ticks: { color: '#9ca3af', font: { family: 'Montserrat', size: 9, weight: '600' } }, 
          beginAtZero: true 
        },
      },
    },
  });
}

function renderDonutChart(container, canvasSelector, legendSelector, list, colors, key) {
  const canvas = container.querySelector(canvasSelector);
  const legend = container.querySelector(legendSelector);
  if (!canvas || !legend) return;

  const labels = list.map((item) => item.name || item.label || 'Không rõ');
  const values = list.map((item) => Number(item.count || item.views || 0));

  if (charts[key]) charts[key].destroy();

  if (values.length === 0) {
    legend.innerHTML = `<div class="text-center py-6 text-gray-400">Không có dữ liệu</div>`;
    // Render blank chart
    charts[key] = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: { labels: ['Không có'], datasets: [{ data: [1], backgroundColor: ['#f3f4f6'] }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '70%' },
    });
    return;
  }

  charts[key] = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: { 
      labels, 
      datasets: [{ 
        data: values, 
        backgroundColor: colors, 
        borderWidth: 2, 
        borderColor: '#fff' 
      }] 
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: false, 
      plugins: { 
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a1a',
          titleFont: { family: 'Montserrat', size: 10, weight: 'bold' },
          bodyFont: { family: 'Montserrat', size: 10 },
          padding: 8,
          borderRadius: 6,
        }
      }, 
      cutout: '72%' 
    },
  });

  const total = values.reduce((sum, val) => sum + val, 0);
  legend.innerHTML = list.map((row, index) => {
    const val = Number(row.count || row.views || 0);
    const pct = total ? Math.round((val / total) * 100) : 0;
    return `
      <div class="flex items-center justify-between text-[11px] font-semibold text-gray-600 border-b border-gray-50 pb-1.5">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full" style="background:${colors[index % colors.length]}"></span>
          <span>${row.name || 'Khác'}</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-gray-400 font-mono text-[10px]">${val.toLocaleString('vi-VN')}</span>
          <span class="text-gray-800 font-bold w-8 text-right">${pct}%</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderProductsTable(container, list) {
  const tbody = container.querySelector('#analytics-products-tbody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="py-6 text-center text-gray-400">Chưa có dữ liệu sản phẩm nào được xem.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((prod) => {
    const defaultImg = '/frontend/src/assets/logo_icon.png';
    const displayImg = Array.isArray(prod.images) && prod.images.length > 0 ? prod.images[0] : defaultImg;
    const priceStr = Number(prod.sale_price || prod.price || 0).toLocaleString('vi-VN') + 'đ';
    const isSale = prod.sale_price && Number(prod.sale_price) < Number(prod.price);

    return `
      <tr class="hover:bg-gray-50/50 transition-colors">
        <td class="py-3 pl-2">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-zinc-950 overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center p-0.5">
              <img src="${displayImg}" class="max-h-full max-w-full object-contain" />
            </div>
            <div>
              <div class="font-bold text-gray-800 text-xs">${prod.name || 'Không tên'}</div>
              <div class="text-[9px] text-gray-400 font-mono mt-0.5">${prod.sku || 'N/A'}</div>
            </div>
          </div>
        </td>
        <td class="py-3 text-right text-gray-600 font-semibold font-mono text-[11px] pr-4">${Number(prod.views || 0).toLocaleString('vi-VN')} lượt</td>
        <td class="py-3 text-right text-gray-800 font-extrabold font-mono text-[11px] pr-2">
          ${isSale ? `
            <div class="text-[#c0392b]">${priceStr}</div>
            <div class="text-[9px] text-gray-400 line-through font-normal mt-0.5">${Number(prod.price).toLocaleString('vi-VN')}đ</div>
          ` : `
            <div>${priceStr}</div>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

function renderSearchesTable(container, list) {
  const tbody = container.querySelector('#analytics-searches-tbody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="2" class="py-6 text-center text-gray-400">Chưa có lượt tìm kiếm nào phát sinh.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((item) => `
    <tr class="hover:bg-gray-50/50 transition-colors">
      <td class="py-3 font-semibold text-gray-700 pl-2">"${item.name}"</td>
      <td class="py-3 text-right text-gray-900 font-bold font-mono text-[11px] pr-2">${Number(item.count || 0).toLocaleString('vi-VN')} lần</td>
    </tr>
  `).join('');
}

function renderPagesTable(container, list) {
  const tbody = container.querySelector('#analytics-pages-tbody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-gray-400">Chưa có dữ liệu trang.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((page) => `
    <tr class="hover:bg-gray-50/50 transition-colors">
      <td class="py-3 text-gray-700 font-medium max-w-[280px] truncate pl-2 font-mono text-[11px]">${page.page || '/'}</td>
      <td class="py-3 text-right text-gray-600 font-semibold font-mono text-[11px] pr-4">${Number(page.views || 0).toLocaleString('vi-VN')}</td>
      <td class="py-3 text-right text-gray-600 font-semibold font-mono text-[11px] pr-4">${Number(page.users || 0).toLocaleString('vi-VN')}</td>
      <td class="py-3 text-right text-gray-600 font-semibold font-mono text-[11px] pr-2">${formatDuration(page.avg_time || 0)}</td>
    </tr>
  `).join('');
}

function renderCities(container, list) {
  const wrap = container.querySelector('#analytics-cities');
  if (!wrap) return;

  if (list.length === 0) {
    wrap.innerHTML = `<div class="text-center py-6 text-gray-400">Chưa có dữ liệu khu vực.</div>`;
    return;
  }

  wrap.innerHTML = list.map((item) => `
    <div class="flex items-center justify-between border-b border-gray-50 pb-2">
      <div class="text-[11px] font-semibold text-gray-600 flex items-center gap-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2.5"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
        <span>${item.name || 'Không rõ'}</span>
      </div>
      <div class="text-[11px] font-extrabold text-gray-800 font-mono">${Number(item.count || 0).toLocaleString('vi-VN')} khách</div>
    </div>
  `).join('');
}

function downloadCSV(filename, headers, rows) {
  const csvContent = "\uFEFF" + [
    headers.join(','),
    ...rows.map(row => row.map(val => {
      const escaped = String(val === null || val === undefined ? '' : val).replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(','))
  ].join('\r\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportCSVReport(data) {
  // Export Summary metrics
  const sum = data.summary || {};
  downloadCSV(
    `Bao-cao-tom-tat-analytics-${new Date().toISOString().split('T')[0]}.csv`,
    ['Chỉ số', 'Giá trị'],
    [
      ['Tổng lượt truy cập', sum.total_visits],
      ['Khách hàng độc nhất', sum.unique_visitors],
      ['Tổng lượt xem trang', sum.page_views],
      ['Thời gian lưu lại trung bình (giây)', sum.avg_time_on_page],
      ['Cuộn sâu trung bình (%)', sum.avg_scroll_depth],
      ['Số đơn hàng phát sinh', sum.total_orders],
      ['Doanh thu ước tính (VND)', sum.total_revenue],
      ['Giá trị đơn hàng trung bình (VND)', sum.aov],
    ]
  );

  // Export top viewed products
  if (data.top_products && data.top_products.length > 0) {
    setTimeout(() => {
      downloadCSV(
        `Top-san-pham-xem-nhieu-${new Date().toISOString().split('T')[0]}.csv`,
        ['Mã SKU', 'Tên sản phẩm', 'Lượt xem', 'Giá bán'],
        data.top_products.map(p => [
          p.sku || 'N/A',
          p.name,
          p.views,
          p.sale_price || p.price
        ])
      );
    }, 300);
  }

  // Export top searches
  if (data.top_searches && data.top_searches.length > 0) {
    setTimeout(() => {
      downloadCSV(
        `Top-tu-khoa-tim-kiem-${new Date().toISOString().split('T')[0]}.csv`,
        ['Từ khóa', 'Tần suất tìm kiếm'],
        data.top_searches.map(s => [
          s.name,
          s.count
        ])
      );
    }, 600);
  }
}

function getMockRows(type) {
  if (type === 'source') {
    return [
      { name: 'Direct', count: 450 },
      { name: 'Google Search', count: 320 },
      { name: 'Facebook Ad', count: 215 },
      { name: 'Zalo Msg', count: 85 },
      { name: 'YouTube Direct', count: 60 },
      { name: 'Instagram Story', count: 40 },
    ];
  }
  return [
    { name: 'Việt Nam', count: 980 },
    { name: 'Hoa Kỳ', count: 120 },
    { name: 'Nhật Bản', count: 85 },
    { name: 'Singapore', count: 60 },
    { name: 'Hàn Quốc', count: 45 },
  ];
}

function getMockData(range) {
  const days = Number(range) || 30;
  return {
    summary: {
      total_visits: days * 55,
      unique_visitors: days * 42,
      page_views: days * 110,
      avg_time_on_page: 92,
      avg_scroll_depth: 63,
      active_users: 6,
      total_orders: days * 2,
      total_revenue: days * 2 * 12500000,
      aov: 12500000,
    },
    daily_visitors: generateMockDaily(days),
    sources: getMockRows('source'),
    countries: getMockRows('country'),
    devices: { desktop: days * 28, mobile: days * 24, tablet: days * 3 },
    cities: [
      { name: 'Hồ Chí Minh, Việt Nam', count: 480 },
      { name: 'Hà Nội, Việt Nam', count: 360 },
      { name: 'Đà Nẵng, Việt Nam', count: 120 },
      { name: 'Cần Thơ, Việt Nam', count: 50 },
    ],
    top_pages: [
      { page: '/', views: 820, users: 650, avg_time: 124 },
      { page: '/nam', views: 560, users: 440, avg_time: 98 },
      { page: '/nu', views: 320, users: 260, avg_time: 85 },
      { page: '/thanh-toan', views: 180, users: 150, avg_time: 215 },
      { page: '/tin-tuc', views: 120, users: 95, avg_time: 140 },
    ],
    top_products: [
      { sku: 'RLX-SUB-2025', name: 'Rolex Submariner Date Gold', views: 420, price: 450000000, sale_price: 435000000, images: ['https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg'] },
      { sku: 'OMG-SEA-300', name: 'Omega Seamaster Diver 300M', views: 350, price: 165000000, sale_price: null, images: ['https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg'] },
      { sku: 'HBT-CL-42', name: 'Hublot Classic Fusion Titanium', views: 290, price: 210000000, sale_price: 195000000, images: ['https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg'] },
      { sku: 'TIS-PRX-80', name: 'Tissot PRX Powermatic 80', views: 240, price: 21500000, sale_price: null, images: ['https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg'] },
    ],
    top_categories: [
      { name: 'Nam', count: 820 },
      { name: 'Nữ', count: 320 },
      { name: 'Phụ kiện', count: 140 },
      { name: 'Khuyến mãi', count: 90 },
    ],
    top_searches: [
      { name: 'rolex', count: 184 },
      { name: 'omega seamaster', count: 125 },
      { name: 'hublot classic', count: 92 },
      { name: 'tissot prx', count: 87 },
      { name: 'đồng hồ nam vàng', count: 64 },
    ]
  };
}

function generateMockDaily(days) {
  const rows = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    rows.push({ date: d.toISOString(), count: Math.floor(Math.random() * 80 + 30) });
  }
  return rows;
}
