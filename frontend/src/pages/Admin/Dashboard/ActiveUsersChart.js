let chartInstance = null;

export function renderActiveUsersChart(container, stats) {
  container.innerHTML = `
    <div class="bg-white rounded-xl shadow-sm p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-base font-semibold text-gray-900">Lượt Truy Cập Hôm Nay</h3>
          <p class="text-xs text-gray-400 mt-0.5">Theo từng giờ trong ngày</p>
        </div>
        <div class="flex items-center gap-1.5 text-xs text-green-600 font-medium">
          <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Trực tiếp
        </div>
      </div>
      <div class="relative h-52">
        <canvas id="active-users-chart"></canvas>
      </div>
    </div>
  `;

  const hourly = stats.hourly_views || Array(24).fill(0);
  const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

  const ctx = container.querySelector('#active-users-chart').getContext('2d');

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Lượt xem',
        data: hourly,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.08)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#22c55e',
        pointHoverRadius: 5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a1a',
          titleColor: '#fff',
          bodyColor: '#ccc',
          padding: 10,
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y} lượt xem`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#9ca3af', font: { size: 10 }, maxTicksLimit: 12 },
        },
        y: {
          grid: { color: '#f3f4f6' },
          ticks: { color: '#9ca3af', font: { size: 10 } },
          beginAtZero: true,
        },
      },
      interaction: { mode: 'index', intersect: false },
    },
  });
}

export function updateActiveUsersChart(stats) {
  if (!chartInstance) return;
  const hourly = stats.hourly_views || Array(24).fill(0);
  chartInstance.data.datasets[0].data = hourly;
  chartInstance.update('none');
}
