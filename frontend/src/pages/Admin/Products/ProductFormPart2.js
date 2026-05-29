// ProductFormPart2.js — SEO preview + flash-sale section helpers
// Used as supplements to ProductForm.js

export function renderSEOPreview(container, { name, metaTitle, metaDescription, slug }) {
  const title = metaTitle || name || 'Tiêu đề trang';
  const url = `donghoatuan.vn/products/${slug || 'san-pham'}`;
  const desc = metaDescription || 'Mô tả meta cho trang sản phẩm này...';

  container.innerHTML = `
    <div class="border border-gray-200 rounded-xl p-4 bg-gray-50">
      <p class="text-xs font-semibold text-gray-400 uppercase mb-2">Xem trước Google</p>
      <div class="text-blue-700 text-base font-medium hover:underline cursor-pointer leading-snug truncate">${title}</div>
      <div class="text-green-700 text-xs mt-0.5 truncate">${url}</div>
      <div class="text-gray-600 text-sm mt-1 line-clamp-2">${desc}</div>
    </div>
  `;
}

export function renderFlashSaleLink(container, productId) {
  container.innerHTML = `
    <div class="border border-yellow-200 rounded-xl p-4 bg-yellow-50 flex items-center justify-between">
      <div>
        <p class="text-sm font-semibold text-yellow-800">Flash Sale</p>
        <p class="text-xs text-yellow-600 mt-0.5">Thiết lập giá flash sale cho sản phẩm này</p>
      </div>
      <a href="#flash-sales" class="px-3 py-1.5 rounded-lg bg-yellow-400 text-yellow-900 text-xs font-semibold hover:bg-yellow-500 transition-colors flex items-center gap-1.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        Cấu hình Flash Sale
      </a>
    </div>
  `;
}

export function createCharCounter(input, maxLen) {
  const counter = document.createElement('p');
  counter.className = 'text-xs text-gray-400 mt-1 text-right';
  const update = () => {
    const len = input.value.length;
    counter.textContent = `${len}/${maxLen}`;
    counter.className = `text-xs mt-1 text-right ${len > maxLen ? 'text-red-500' : 'text-gray-400'}`;
  };
  input.addEventListener('input', update);
  update();
  input.parentElement.appendChild(counter);
  return counter;
}

export function buildImagePreviewGrid(urls) {
  if (!urls || !urls.length) return '';
  return `
    <div class="grid grid-cols-5 gap-2 mt-2">
      ${urls.filter(Boolean).map(url => `
        <div class="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
          <img src="${url}" alt="" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<div class=\\'w-full h-full flex items-center justify-center text-gray-300 text-xs\\'>404</div>'">
        </div>
      `).join('')}
    </div>
  `;
}
