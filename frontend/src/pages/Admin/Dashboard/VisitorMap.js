let mapInstance = null;
let markerLayers = [];

const COUNTRY_COORDS = {
  VN: [14.0583, 108.2772], US: [37.0902, -95.7129], JP: [36.2048, 138.2529],
  CN: [35.8617, 104.1954], KR: [35.9078, 127.7669], GB: [55.3781, -3.4360],
  DE: [51.1657, 10.4515], FR: [46.2276, 2.2137], SG: [1.3521, 103.8198],
  AU: [25.2744, 133.7751], TH: [15.8700, 100.9925], MY: [4.2105, 101.9758],
  IN: [20.5937, 78.9629], ID: [0.7893, 113.9213], PH: [12.8797, 121.7740],
  CA: [56.1304, -106.3468], BR: [14.2350, -51.9253], MX: [23.6345, -102.5528],
  RU: [61.5240, 105.3188], IT: [41.8719, 12.5674],
};

export function renderVisitorMap(container, stats) {
  container.innerHTML = `
    <div class="bg-white rounded-xl shadow-sm p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-base font-semibold text-gray-900">Bản Đồ Khách Truy Cập</h3>
          <p class="text-xs text-gray-400 mt-0.5">Phân bố địa lý</p>
        </div>
      </div>
      <div id="visitor-map" class="rounded-lg overflow-hidden" style="height:280px;"></div>
    </div>
  `;

  setTimeout(() => initMap(container, stats), 50);
}

function initMap(container, stats) {
  const mapEl = container.querySelector('#visitor-map');
  if (!mapEl || typeof L === 'undefined') return;

  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
    markerLayers = [];
  }

  mapInstance = L.map(mapEl, { zoomControl: true, scrollWheelZoom: false }).setView([20, 0], 2);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(mapInstance);

  const countries = stats.countries || [];
  const maxCount = Math.max(...countries.map(c => c.count || 0), 1);

  countries.forEach(({ code, name, count }) => {
    const coords = COUNTRY_COORDS[code];
    if (!coords) return;
    const radius = 8 + (count / maxCount) * 30;
    const circle = L.circleMarker(coords, {
      radius,
      fillColor: '#C9A84C',
      color: '#fff',
      weight: 1,
      opacity: 0.9,
      fillOpacity: 0.6,
    }).addTo(mapInstance);
    circle.bindPopup(`<b>${name || code}</b><br>${count.toLocaleString()} khách`);
    markerLayers.push(circle);
  });
}

export function updateVisitorMap(stats) {
  if (!mapInstance) return;
  markerLayers.forEach(m => m.remove());
  markerLayers = [];
  const countries = stats.countries || [];
  const maxCount = Math.max(...countries.map(c => c.count || 0), 1);
  countries.forEach(({ code, name, count }) => {
    const coords = COUNTRY_COORDS[code];
    if (!coords) return;
    const radius = 8 + (count / maxCount) * 30;
    const circle = L.circleMarker(coords, {
      radius, fillColor: '#C9A84C', color: '#fff',
      weight: 1, opacity: 0.9, fillOpacity: 0.6,
    }).addTo(mapInstance);
    circle.bindPopup(`<b>${name || code}</b><br>${count.toLocaleString()} khách`);
    markerLayers.push(circle);
  });
}
