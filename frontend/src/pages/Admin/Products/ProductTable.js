import { getProducts, deleteProduct, toggleProduct } from '../../../services/adminService.js';
import { computeBadges } from '../../../services/adminService.js';
import { createConfirmDialog, showToast, createPagination, formatPrice } from '../shared/ui.js';
import { openProductForm } from './ProductForm.js';
import { openBulkDiscountModal } from './BulkDiscountModal.js';
import { resolveImageUrl } from '../../../services/config.js';

function downloadXLS(filename, reportTitle, sections) {
  const dateStr = new Date().toLocaleDateString('vi-VN');
  const maxCols = Math.max(...sections.map(s => s.columns.length));
  const esc = (v) => String(v === null || v === undefined ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const S = {
    ti: 'font-family:Arial,sans-serif;font-size:15pt;font-weight:bold;color:#C9A961;background:#0A0A0A;text-align:center;padding:10px 20px;',
    su: 'font-family:Arial,sans-serif;font-size:10pt;color:#9CA3AF;background:#0A0A0A;text-align:center;padding:4px 20px;',
    sp: 'background:#FFFFFF;padding:5px;',
    se: 'font-family:Arial,sans-serif;font-size:11pt;font-weight:bold;color:#C9A961;background:#1A1A1A;padding:7px 10px;',
    ch: 'font-family:Arial,sans-serif;font-size:11pt;font-weight:bold;color:#FFFFFF;background:#C9A84C;text-align:center;padding:6px 10px;border:1px solid #B8963E;',
    re: 'font-family:Arial,sans-serif;font-size:10pt;color:#374151;background:#FFFFFF;padding:5px 10px;border:1px solid #E5E7EB;',
    ro: 'font-family:Arial,sans-serif;font-size:10pt;color:#374151;background:#F3F4F6;padding:5px 10px;border:1px solid #E5E7EB;',
  };

  let t = '<table cellspacing="0" cellpadding="0" border="0">';
  t += `<tr><td colspan="${maxCols}" style="${S.ti}">VENIX WATCH</td></tr>`;
  t += `<tr><td colspan="${maxCols}" style="${S.su}">${esc(reportTitle)}</td></tr>`;
  t += `<tr><td colspan="${maxCols}" style="${S.su}">Xuất ngày: ${dateStr}</td></tr>`;

  sections.forEach(sec => {
    t += `<tr>${Array(maxCols).fill(`<td style="${S.sp}"> </td>`).join('')}</tr>`;
    if (sec.heading) t += `<tr><td colspan="${maxCols}" style="${S.se}">${esc(sec.heading)}</td></tr>`;
    t += '<tr>';
    for (let i = 0; i < maxCols; i++) t += `<td style="${S.ch}">${esc(sec.columns[i] || '')}</td>`;
    t += '</tr>';
    sec.rows.forEach((row, idx) => {
      const s = idx % 2 === 0 ? S.re : S.ro;
      t += '<tr>';
      for (let i = 0; i < maxCols; i++) {
        const v = row[i] === null || row[i] === undefined ? '' : row[i];
        t += `<td style="${s}">${esc(v)}</td>`;
      }
      t += '</tr>';
    });
  });
  t += '</table>';

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Bao cao</x:Name><x:WorksheetOptions><x:Selected/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>${t}</body></html>`;

  const blob = new Blob(['\uFEFF', html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const PAGE_SIZE = 10;

// sort field → [asc key, desc key]
const SORT_COLS = {
  sku:      ['sku_asc',    'sku_desc'],
  name:     ['name_asc',   'name_desc'],
  category: ['cat_asc',    'cat_desc'],
  price:    ['price_asc',  'price_desc'],
  stock:    ['stock_asc',  'stock_desc'],
};

let state = { page: 1, search: '', sort: '', sortDir: {}, total: 0, data: [] };

export function renderProductTable(container) {
  container.innerHTML = `
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-gray-100">
        <div class="relative w-full sm:w-72">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input id="prod-search" class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]"
            placeholder="Tìm theo tên, SKU..." value="${state.search}">
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <button id="prod-export-btn"
            class="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Xuất Excel
          </button>
          <button id="prod-export-meta-btn"
            class="flex items-center gap-2 px-3 py-2 border border-[#C9A84C] text-[#C9A84C] rounded-lg text-sm hover:bg-amber-50 transition-colors"
            title="Xuất sản phẩm sang tệp CSV chuẩn Meta/Facebook Product Catalog">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Xuất Catalog Meta
          </button>
          <button id="prod-badge-btn" title="Tính toán lại badge dựa trên dữ liệu thực"
            class="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            Cập nhật badge
          </button>
          <button id="prod-discount-btn" title="Xét giảm giá hàng loạt"
            class="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
            Giảm giá hàng loạt
          </button>
          <button id="prod-add-btn"
            class="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-white rounded-lg text-sm font-medium hover:bg-[#b8963e] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Thêm sản phẩm
          </button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-14">Ảnh</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 sort-th" data-col="sku">
                <span class="flex items-center gap-1">SKU <span class="sort-icon text-gray-300">⇅</span></span>
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 sort-th" data-col="name">
                <span class="flex items-center gap-1">Tên <span class="sort-icon text-gray-300">⇅</span></span>
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 sort-th" data-col="category">
                <span class="flex items-center gap-1">Danh mục <span class="sort-icon text-gray-300">⇅</span></span>
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 sort-th" data-col="price">
                <span class="flex items-center gap-1">Giá <span class="sort-icon text-gray-300">⇅</span></span>
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 sort-th" data-col="stock">
                <span class="flex items-center gap-1">Tồn <span class="sort-icon text-gray-300">⇅</span></span>
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Badge</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Hành động</th>
            </tr>
          </thead>
          <tbody id="prod-tbody" class="divide-y divide-gray-50">
            <tr><td colspan="9" class="py-8 text-center text-gray-400 text-sm">Đang tải...</td></tr>
          </tbody>
        </table>
      </div>
      <div class="px-4 py-3 border-t border-gray-100" id="prod-pagination"></div>
    </div>
  `;

  // Search
  let searchTimer;
  container.querySelector('#prod-search').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = e.target.value.trim();
      state.page = 1;
      loadProducts(container);
    }, 300);
  });

  // Export CSV
  container.querySelector('#prod-export-btn').addEventListener('click', () => exportProductsCSV());
  container.querySelector('#prod-export-meta-btn').addEventListener('click', () => exportMetaCatalog());

  // Add product
  container.querySelector('#prod-add-btn').addEventListener('click', () => {
    openProductForm(null, () => loadProducts(container));
  });

  // Bulk discount
  container.querySelector('#prod-discount-btn').addEventListener('click', () => {
    openBulkDiscountModal(() => loadProducts(container));
  });

  // Compute badges
  container.querySelector('#prod-badge-btn').addEventListener('click', async () => {
    const btn = container.querySelector('#prod-badge-btn');
    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Đang tính...`;
    try {
      await computeBadges();
      showToast('Badge đã được cập nhật tự động!');
      loadProducts(container);
    } catch (err) {
      showToast(err.message || 'Lỗi cập nhật badge', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Cập nhật badge`;
    }
  });

  // Sortable column headers
  container.querySelectorAll('.sort-th').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      const [asc, desc] = SORT_COLS[col];
      const current = state.sortDir[col]; // undefined → asc → desc → undefined

      // Reset other columns
      state.sortDir = {};

      if (!current) {
        state.sort = asc;
        state.sortDir[col] = 'asc';
      } else if (current === 'asc') {
        state.sort = desc;
        state.sortDir[col] = 'desc';
      } else {
        state.sort = '';
        state.sortDir[col] = undefined;
      }

      state.page = 1;
      updateSortIcons(container);
      loadProducts(container);
    });
  });

  loadProducts(container);
}

function exportProductsCSV() {
  if (!state.data.length) {
    alert('Không có dữ liệu để xuất.');
    return;
  }
  const dateStr = new Date().toISOString().split('T')[0];
  downloadXLS(`san-pham-${dateStr}.xls`, 'DANH SÁCH SẢN PHẨM', [{
    heading: '▌ DANH SÁCH SẢN PHẨM',
    columns: ['SKU', 'Tên sản phẩm', 'Danh mục', 'Giá gốc (VND)', 'Giá sale (VND)', 'Tồn kho', 'Trạng thái', 'Badge'],
    rows: state.data.map(p => [
      p.sku || '',
      p.name || '',
      p.category_name || '',
      p.price ?? 0,
      p.sale_price ?? '',
      p.stock ?? '',
      p.is_active ? 'Kích hoạt' : 'Ẩn',
      p.badge || '',
    ]),
  }]);
}

async function exportMetaCatalog() {
  const btn = document.querySelector('#prod-export-meta-btn');
  const originalHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Đang tải...`;
  }

  try {
    const res = await getProducts({ limit: 5000 });
    const products = Array.isArray(res.data) ? res.data : [];
    if (!products.length) {
      showToast('Không có dữ liệu sản phẩm để xuất', 'error');
      return;
    }

    const metaDescriptions = [
      "# Bắt buộc | A unique content ID for the item. Use the item's SKU if you can. Each content ID must appear only once in your catalog. To run dynamic ads this ID must exactly match the content ID for the same item in your Meta Pixel code. Character limit: 100",
      "# Bắt buộc | A specific and relevant title for the item. See title specifications: https://www.facebook.com/business/help/2104231189874655 Character limit: 200",
      "# Bắt buộc | A short and relevant description of the item. Include specific or unique product features like material or color. Use plain text and don't enter text in all capital letters. See description specifications: https://www.facebook.com/business/help/2302017289821154 Character limit: 9999",
      "# Bắt buộc | The current availability of the item. | Giá trị được hỗ trợ: in stock; out of stock",
      "# Bắt buộc | The current condition of the item. | Giá trị được hỗ trợ: new; used",
      "# Bắt buộc | The price of the item. Format the price as a number followed by the 3-letter currency code (ISO 4217 standards). Use a period (.) as the decimal point; don't use a comma.",
      "# Bắt buộc | The URL of the specific product page where people can buy the item.",
      "# Bắt buộc | The URL for the main image of your item. Images must be in a supported format (JPG/GIF/PNG) and at least 500 x 500 pixels.",
      "# Bắt buộc | Tên thương hiệu của mặt hàng. Giới hạn ký tự: 100.",
      "# Không bắt buộc | The Google product category for the item. Learn more about product categories: https://www.facebook.com/business/help/526764014610932.",
      "# Không bắt buộc | The Facebook product category for the item. Learn more about product categories: https://www.facebook.com/business/help/526764014610932.",
      "# Không bắt buộc | The quantity of this item you have to sell on Facebook and Instagram with checkout. Must be 1 or higher or the item won't be buyable",
      "# Không bắt buộc | The discounted price of the item if it's on sale. Format the price as a number followed by the 3-letter currency code (ISO 4217 standards). Use a period (.) as the decimal point; don't use a comma. A sale price is required if you want to use an overlay for discounted prices.",
      "# Không bắt buộc | The time range for your sale period. Includes the date and time/time zone when your sale starts and ends. If this field is blank any items with a sale_price remain on sale until you remove the sale price. Use this format: YYYY-MM-DDT23:59+00:00/YYYY-MM-DDT23:59+00:00. Enter the start date as YYYY-MM-DD. Enter a 'T'. Enter the start time in 24-hour format (00:00 to 23:59) followed by the UTC time zone (-12:00 to +14:00). Enter '/' and then repeat the same format for your end date and time. The example row below uses PST time zone (-08:00).",
      "# Không bắt buộc | Use this field to create variants of the same item. Enter the same group ID for all variants within a group. Learn more about variants: https://www.facebook.com/business/help/2256580051262113 Character limit: 100.",
      "# Không bắt buộc | Giới tính của người mà mặt hàng đang nhắm mục tiêu. | Giá trị được hỗ trợ: female; male; unisex",
      "# Không bắt buộc | The color of the item. Use one or more words to describe the color. Don't use a hex code. Character limit: 200.",
      "# Không bắt buộc | The size of the item written as a word or abbreviation or number. For example: small; XL; 12. Character limit: 200.",
      "# Không bắt buộc | Nhóm tuổi mà mặt hàng đang nhắm mục tiêu. | Giá trị được hỗ trợ: adult; all ages; infant; kids; newborn; teen; toddler",
      "# Không bắt buộc | Chất liệu của mặt hàng; chẳng hạn như cotton; denim hoặc da. Giới hạn ký tự: 200.",
      "# Không bắt buộc | The pattern or graphic print on the item. Character limit: 100.",
      "# Không bắt buộc | Thông tin vận chuyển của mặt hàng. Định dạng là Quốc gia:Khu vực:Dịch vụ:Giá. Giá hiển thị kèm cả mã đơn vị tiền tệ gồm 3 chữ cái theo tiêu chuẩn ISO 4217. Để sử dụng lớp phủ vận chuyển miễn phí trong quảng cáo; hãy nhập giá là 0.0. Sử dụng dấu chấm phẩy \";\" hoặc dấu phẩy \";\" để phân cách nhiều thông tin vận chuyển cho các khu vực hoặc quốc gia khác nhau. Chỉ những người ở khu vực/quốc gia đã chỉ định mới nhìn thấy thông tin vận chuyển cho khu vực/quốc gia đó. Bạn có thể bỏ phần khu vực (vẫn giữ 2 dấu \"::\") nếu thông tin vận chuyển trên toàn quốc là như nhau.",
      "# Không bắt buộc | The shipping weight of the item. Include the unit of measurement (lb/oz/g/kg).",
      "# Không bắt buộc | Legal disclaimer text for product offers. This text provides important legal or regulatory information that must be displayed with the product offer. For example: \"Valid while supplies last. Terms and conditions apply.\"",
      "# Không bắt buộc | URL linking to the full disclaimer text. This provides a link to a page containing the complete disclaimer information for the product offer. For example: \"https://example.com/terms-and-conditions\"",
      "# Không bắt buộc | URL cho video sản phẩm. Liên kết phải là file video trên trang web lưu trữ file; không phải trình phát video. Video phải ở định dạng được hỗ trợ (.3g2; .3gp; .3gpp; .asf; .avi; .dat; .divx; .dv; .f4v; .flv; .gif; .m2ts; .m4v; .mkv; .mod; .mov; .mp4; .mpe; .mpeg; .mpeg4; .mpg; .mts; .nsv; .ogm; .ogv; .qt; .tod; .ts; .vob hoặc .wmv).",
      "# Không bắt buộc | URL cho video sản phẩm. Liên kết phải là file video trên trang web lưu trữ file; không phải trình phát video. Video phải ở định dạng được hỗ trợ (.3g2; .3gp; .3gpp; .asf; .avi; .dat; .divx; .dv; .f4v; .flv; .gif; .m2ts; .m4v; .mkv; .mod; .mov; .mp4; .mpe; .mpeg; .mpeg4; .mpg; .mts; .nsv; .ogm; .ogv; .qt; .tod; .ts; .vob hoặc .wmv).",
      "# Không bắt buộc | Mã số sản phẩm thương mại toàn cầu (GTIN). Nên dùng để giúp phân loại mặt hàng. Có thể xuất hiện trên mã vạch; bao bì hoặc bìa sách. Chỉ cung cấp GTIN nếu bạn chắc chắn mã đó chính xác. GTIN gồm các loại sau: UPC (12 chữ số); EAN (13 chữ số); JAN (8 hoặc 13 chữ số); ISBN (13 chữ số) hoặc ITF-14 (14 chữ số)",
      "# Không bắt buộc | Add labels to products to help filter them into product sets. Max characters: 110 per label; 5000 labels per product",
      "# Không bắt buộc | Add labels to products to help filter them into product sets. Max characters: 110 per label; 5000 labels per product",
      "# Không bắt buộc | Mô tả phong cách thời trang của mặt hàng này."
    ];

    const metaKeys = [
      'id', 'title', 'description', 'availability', 'condition', 'price', 'link', 'image_link', 'brand',
      'google_product_category', 'fb_product_category', 'quantity_to_sell_on_facebook', 'sale_price',
      'sale_price_effective_date', 'item_group_id', 'gender', 'color', 'size', 'age_group', 'material',
      'pattern', 'shipping', 'shipping_weight', 'offer_disclaimer', 'offer_disclaimer_url',
      'video[0].url', 'video[0].tag[0]', 'gtin', 'product_tags[0]', 'product_tags[1]', 'style[0]'
    ];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      str = str.replace(/"/g, '""');
      if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
        return `"${str}"`;
      }
      return str;
    };

    const csvRows = [];
    csvRows.push(metaDescriptions.map(escapeCSV).join(','));
    csvRows.push(metaKeys.map(escapeCSV).join(','));

    const origin = window.location.origin;

    products.forEach(p => {
      let imageUrl = '';
      if (p.images) {
        let imgArray = [];
        try {
          imgArray = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
        } catch(e) {
          imgArray = [];
        }
        if (Array.isArray(imgArray) && imgArray.length > 0) {
          imageUrl = resolveImageUrl(imgArray[0]);
        }
      }
      if (!imageUrl && p.thumbnail) {
        imageUrl = resolveImageUrl(p.thumbnail);
      }

      const priceVal = p.price ? `${Math.round(p.price)} VND` : '0 VND';
      const salePriceVal = p.sale_price ? `${Math.round(p.sale_price)} VND` : '';

      let gender = 'unisex';
      const nameLower = (p.name || '').toLowerCase();
      const catLower = (p.category_name || '').toLowerCase();
      if (nameLower.includes('nữ') || nameLower.includes('nu') || catLower.includes('nữ') || catLower.includes('nu')) {
        gender = 'female';
      } else if (nameLower.includes('nam') || catLower.includes('nam')) {
        gender = 'male';
      }

      const row = [
        p.sku || p.id,
        p.name || '',
        p.description || '',
        Number(p.stock) > 0 ? 'in stock' : 'out of stock',
        'new',
        priceVal,
        `${origin}/san-pham/${p.slug}`,
        imageUrl,
        p.brand || 'Venix Watch',
        'Apparel & Accessories > Jewelry > Watches',
        'Clothing & Accessories > Jewelry & Accessories > Watches',
        p.stock ?? 0,
        salePriceVal,
        '',
        p.parent_id || '',
        gender,
        p.dial_color || '',
        p.case_size || '',
        'adult',
        p.case_material || '',
        p.strap_type || '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        p.badge || '',
        '',
        ''
      ];

      csvRows.push(row.map(escapeCSV).join(','));
    });

    const bom = '\uFEFF';
    const csvContent = bom + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.setAttribute('download', `meta-catalog-${dateStr}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Đã xuất file Catalog Meta thành công!');
  } catch (err) {
    showToast(err.message || 'Lỗi xuất Catalog Meta', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }
}

function updateSortIcons(container) {
  container.querySelectorAll('.sort-th').forEach(th => {
    const col = th.dataset.col;
    const dir = state.sortDir[col];
    const icon = th.querySelector('.sort-icon');
    if (!icon) return;
    if (dir === 'asc')  { icon.textContent = '↑'; icon.classList.replace('text-gray-300', 'text-[#C9A84C]'); }
    else if (dir === 'desc') { icon.textContent = '↓'; icon.classList.replace('text-gray-300', 'text-[#C9A84C]'); }
    else { icon.textContent = '⇅'; icon.className = 'sort-icon text-gray-300'; }
  });
}

async function loadProducts(container) {
  const tbody = container.querySelector('#prod-tbody');
  tbody.innerHTML = `<tr><td colspan="9" class="py-8 text-center text-gray-400 text-sm">Đang tải...</td></tr>`;

  try {
    const res = await getProducts({
      page: state.page,
      limit: PAGE_SIZE,
      search: state.search,
      sort: state.sort,
    });

    const items = Array.isArray(res.data) ? res.data : [];
    state.total = Number(res.meta?.total ?? items.length);
    state.data = items;

    renderRows(container);
    renderPageNav(container);
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="9" class="py-8 text-center text-red-400 text-sm">${error.message || 'Lỗi tải dữ liệu'}</td></tr>`;
  }
}

function renderRows(container) {
  const tbody = container.querySelector('#prod-tbody');
  if (!state.data.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="py-10 text-center text-gray-400 text-sm">Chưa có sản phẩm nào</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  state.data.forEach((product) => {
    const lowStock = Number(product.stock ?? 0) < 5;
    const image = product.images?.[0] || product.thumbnail || '';
    const tr = document.createElement('tr');
    tr.className = `hover:bg-gray-50 transition-colors ${lowStock ? 'bg-yellow-50' : ''}`;
    tr.innerHTML = `
      <td class="px-4 py-3">
        ${image
          ? `<img src="${image}" alt="" class="w-10 h-10 object-cover rounded-lg bg-gray-100" onerror="this.style.display='none'">`
          : `<div class="w-10 h-10 rounded-lg bg-gray-100"></div>`}
      </td>
      <td class="px-4 py-3 text-gray-500 font-mono text-xs">${product.sku || '-'}</td>
      <td class="px-4 py-3 max-w-[200px]">
        <div class="font-medium text-gray-900 truncate" title="${product.name || ''}">${product.name || '-'}</div>
        ${product.parent_id 
          ? `<div class="flex flex-wrap gap-1 mt-1">
              <span class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100 rounded">Biến thể (Cha: #${product.parent_id})</span>
              ${product.dial_color ? `<span class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-100 rounded">${product.dial_color}</span>` : ''}
              ${product.strap_type ? `<span class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-100 rounded">${product.strap_type}</span>` : ''}
             </div>`
          : ''}
      </td>
      <td class="px-4 py-3 text-gray-600 text-xs">${product.category_name || '-'}</td>
      <td class="px-4 py-3 text-gray-800 font-medium whitespace-nowrap">${formatPrice(product.sale_price || product.price)}</td>
      <td class="px-4 py-3 ${lowStock ? 'text-red-600 font-bold' : 'text-gray-600'}">${product.stock ?? 0}</td>
      <td class="px-4 py-3">${product.badge
          ? `<span class="px-2 py-0.5 text-xs rounded-full font-semibold ${badgeClass(product.badge)}">${product.badge}</span>`
          : '<span class="text-gray-300 text-xs">—</span>'}</td>
      <td class="px-4 py-3">
        <button class="toggle-status relative w-10 h-6 rounded-full transition-colors ${Number(product.is_active) ? 'bg-green-500' : 'bg-gray-300'}" data-id="${product.id}">
          <span class="absolute top-0.5 ${Number(product.is_active) ? 'left-[18px]' : 'left-0.5'} w-5 h-5 bg-white rounded-full shadow transition-all"></span>
        </button>
      </td>
      <td class="px-4 py-3 text-right">
        <div class="flex items-center justify-end gap-1">
          <button class="edit-btn p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Chỉnh sửa">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="del-btn p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Xóa">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </td>
    `;

    tr.querySelector('.edit-btn').addEventListener('click', () => {
      openProductForm(product, () => loadProducts(container));
    });

    tr.querySelector('.del-btn').addEventListener('click', () => {
      createConfirmDialog(`Xóa sản phẩm "${product.name}"?`, async () => {
        try {
          await deleteProduct(product.id);
          showToast('Đã xóa');
          loadProducts(container);
        } catch (error) {
          showToast(error.message, 'error');
        }
      });
    });

    tr.querySelector('.toggle-status').addEventListener('click', async () => {
      try {
        await toggleProduct(product.id);
        loadProducts(container);
      } catch (error) {
        showToast(error.message, 'error');
      }
    });

    tbody.appendChild(tr);
  });
}

function renderPageNav(container) {
  const wrap = container.querySelector('#prod-pagination');
  wrap.innerHTML = '';
  const totalPages = Math.ceil(state.total / PAGE_SIZE);
  if (totalPages <= 1) return;
  wrap.appendChild(createPagination(state.page, totalPages, (page) => {
    state.page = page;
    loadProducts(container);
  }));
}

function badgeClass(badge) {
  const map = { NEW: 'bg-blue-100 text-blue-700', BESTSELLER: 'bg-yellow-100 text-yellow-700', SALE: 'bg-red-100 text-red-700' };
  return map[badge] || 'bg-gray-100 text-gray-700';
}
