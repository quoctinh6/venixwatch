let trafficChart = null;
let deviceChart = null;

export function renderTrafficSourceChart(container, stats) {
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h3 class="text-base font-semibold text-gray-900 mb-4">Nguồn Truy Cập</h3>
        <div class="relative h-48 flex items-center justify-center">
          <canvas id="traffic-source-chart"></canvas>
        </div>
        <div id="traffic-legend" class="mt-4 space-y-2"></div>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h3 class="text-base font-semibold text-gray-900 mb-4">Thiết Bị</h3>
        <div class="relative h-48 flex items-center justify-center">
          <canvas id="device-chart"></canvas>
        </div>
        <div id="device-legend" class="mt-4 space-y-2"></div>
      </div>
    </div>
  `;

  buildTrafficChart(container, stats);
  buildDeviceChart(container, stats);
}

function buildTrafficChart(container, stats) {
  const sources = stats.traffic_sources || {
    direct: 0, google: 0, facebook: 0, other: 0,
  };
  const labels = ['Trực tiếp', 'Google', 'Facebook', 'Khác'];
  const data = [sources.direct || 0, sources.google || 0, sources.facebook || 0, sources.other || 0];
  const colors = ['#C9A84C', '#1a1a1a', '#c0392b', '#888'];

  if (trafficChart) { trafficChart.destroy(); trafficChart = null; }

  const ctx = container.querySelector('#traffic-source-chart').getContext('2d');
  trafficChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      cutout: '65%',
    },
  });

  const total = data.reduce((a, b) => a + b, 0);
  const legend = container.querySelector('#traffic-legend');
  legend.innerHTML = labels.map((l, i) => `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full flex-shrink-0" style="background:${colors[i]}"></span>
        <span class="text-sm text-gray-600">${l}</span>
      </div>
      <span class="text-sm font-medium text-gray-900">${total ? Math.round(data[i] / total * 100) : 0}%</span>
    </div>
  `).join('');
}

function buildDeviceChart(container, stats) {
  const devices = stats.devices || { desktop: 0, mobile: 0, tablet: 0 };
  const labels = ['Desktop', 'Mobile', 'Tablet'];
  const data = [devices.desktop || 0, devices.mobile || 0, devices.tablet || 0];
  const colors = ['#3b82f6', '#8b5cf6', '#f59e0b'];

  if (deviceChart) { deviceChart.destroy(); deviceChart = null; }

  const ctx = container.querySelector('#device-chart').getContext('2d');
  deviceChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      cutout: '65%',
    },
  });

  const total = data.reduce((a, b) => a + b, 0);
  const legend = container.querySelector('#device-legend');
  legend.innerHTML = labels.map((l, i) => `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full flex-shrink-0" style="background:${colors[i]}"></span>
        <span class="text-sm text-gray-600">${l}</span>
      </div>
      <span class="text-sm font-medium text-gray-900">${total ? Math.round(data[i] / total * 100) : 0}%</span>
    </div>
  `).join('');
}
