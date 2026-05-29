/**
 * Compare/index.js — Product comparison page (/so-sanh)
 */
import { getProduct, getMockProducts } from '../../services/productService.js';
import { formatPrice, navigate } from '../../utils/helpers.js';
import { cartService } from '../../services/cartService.js';

const SPEC_ROWS = [
  { key: 'price',       label: 'Giá Bán', format: (v) => formatPrice(v) },
  { key: 'brand',       label: 'Thương Hiệu' },
  { key: 'category_name', label: 'Danh Mục' },
  { key: 'material',    label: 'Chất Liệu Vỏ' },
  { key: 'glass',       label: 'Chất Liệu Kính' },
  { key: 'movement',    label: 'Bộ Máy' },
  { key: 'water_resist',label: 'Chống Nước' },
  { key: 'case_size',   label: 'Đường Kính Mặt' },
  { key: 'warranty',    label: 'Bảo Hành' },
  { key: 'origin',      label: 'Xuất Xứ' },
];

export default class ComparePage {
  constructor() {
    this._items = JSON.parse(localStorage.getItem('dhat_compare') || '[]');
    this._products = [];
  }

  async render() {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'font-family:Montserrat,sans-serif;min-height:60vh;';

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'background:#f8f8f8;padding:24px 40px;border-bottom:1px solid #e8e8e8;';
    header.innerHTML = `
      <div style="max-width:1280px;margin:0 auto;">
        <h1 style="font-size:28px;font-weight:800;letter-spacing:0.8px;margin:0;text-transform:uppercase;">SO SÁNH SẢN PHẨM</h1>
      </div>`;
    wrap.appendChild(header);

    const content = document.createElement('div');
    content.style.cssText = 'max-width:1280px;margin:0 auto;padding:48px 40px;';

    if (this._items.length === 0) {
      content.innerHTML = `
        <div style="text-align:center;padding:80px 20px;">
          <p style="font-size:16px;color:#888;margin:0 0 24px;">Chưa có sản phẩm nào để so sánh.</p>
          <button data-nav="/nam" style="padding:12px 32px;background:#1a1a1a;color:#fff;border:none;font-size:12px;font-weight:700;letter-spacing:1.2px;cursor:pointer;font-family:Montserrat,sans-serif;">
            KHÁM PHÁ SẢN PHẨM
          </button>
        </div>`;
      content.querySelector('[data-nav]').addEventListener('click', () => navigate('/nam'));
      wrap.appendChild(content);
      return wrap;
    }

    // Load products
    const slugs = this._items.map(i => i.slug);
    const mocks = getMockProducts(8);
    this._products = await Promise.all(slugs.map(async (slug) => {
      try {
        const res = await getProduct(slug);
        return res.data || res.product || res;
      } catch {
        return mocks.find(m => m.slug === slug) || { ...mocks[0], slug, name: this._items.find(i => i.slug === slug)?.name || slug };
      }
    }));

    // Fill defaults
    this._products = this._products.map(p => ({
      brand: 'N/A', material: 'Thép 316L', glass: 'Sapphire', movement: 'Automatic',
      water_resist: '50m', case_size: '42mm', warranty: '2 năm', origin: 'Nhật Bản',
      ...p,
    }));

    content.appendChild(this._buildTable());
    wrap.appendChild(content);

    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        #compare-table { font-size: 12px !important; }
        #compare-table td, #compare-table th { padding: 8px 10px !important; }
      }
    `;
    document.head.appendChild(style);

    return wrap;
  }

  _buildTable() {
    const products = this._products;
    const colCount = products.length;

    const table = document.createElement('table');
    table.id = 'compare-table';
    table.style.cssText = 'width:100%;border-collapse:collapse;font-size:13px;';

    // Product header row
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th style="width:200px;padding:16px;text-align:left;font-size:10px;letter-spacing:0.5px;font-weight:800;border-bottom:2px solid #1a1a1a;background:#fff;"></th>
        ${products.map((p, i) => `
          <th style="padding:16px;border-bottom:2px solid #1a1a1a;background:#fff;vertical-align:top;">
            <div style="position:relative;">
              <button data-remove-idx="${i}" style="position:absolute;top:0;right:0;background:none;border:none;cursor:pointer;color:#aaa;font-size:16px;line-height:1;padding:0;" title="Xóa" onmouseover="this.style.color='#c0392b'" onmouseout="this.style.color='#aaa'">×</button>
              <div style="width:120px;height:120px;background:#f8f8f8;margin:0 auto 12px;overflow:hidden;">
                <img src="${p.image || 'https://images.pexels.com/photos/236915/pexels-photo-236915.jpeg?auto=compress&cs=tinysrgb&w=400'}" alt="${p.name}" style="width:100%;height:100%;object-fit:contain;padding:8px;" loading="lazy" />
              </div>
              <p style="font-size:13px;font-weight:700;margin:0 0 6px;text-align:center;cursor:pointer;" data-slug="${p.slug}">${p.name}</p>
              <p style="font-size:15px;font-weight:800;color:#C9A84C;margin:0;text-align:center;">${formatPrice(p.sale_price&&p.sale_price<p.price?p.sale_price:p.price)}</p>
            </div>
          </th>`).join('')}
      </tr>`;
    table.appendChild(thead);

    // Bind remove buttons
    thead.querySelectorAll('[data-remove-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.removeIdx);
        this._items.splice(idx, 1);
        localStorage.setItem('dhat_compare', JSON.stringify(this._items));
        window.dispatchEvent(new CustomEvent('compare-updated', { detail: this._items }));
        this._products.splice(idx, 1);
        if (this._products.length === 0) { navigate('/so-sanh'); return; }
        table.replaceWith(this._buildTable());
      });
    });

    thead.querySelectorAll('[data-slug]').forEach(el => {
      el.addEventListener('click', () => navigate(`/san-pham/${el.dataset.slug}`));
    });

    // Spec rows
    const tbody = document.createElement('tbody');
    SPEC_ROWS.forEach((row) => {
      const values = products.map(p => {
        if (row.key === 'price') {
          const displayPrice = p.sale_price && p.sale_price < p.price ? p.sale_price : p.price;
          return row.format(displayPrice);
        }
        return p[row.key] || '—';
      });
      const allSame = values.every(v => v === values[0]);
      const tr = document.createElement('tr');
      tr.style.cssText = 'border-bottom:1px solid #f0f0f0;transition:background .15s;';
      tr.addEventListener('mouseenter', () => { tr.style.background = '#fafafa'; });
      tr.addEventListener('mouseleave', () => { tr.style.background = ''; });
      tr.innerHTML = `
        <td style="padding:14px 16px;font-size:11px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;color:#555;background:#f8f8f8;border-right:1px solid #e8e8e8;">
          ${row.label}
        </td>
        ${values.map((val, i) => `
          <td style="padding:14px 16px;text-align:center;font-weight:600;color:${!allSame?'#C9A84C':'#1a1a1a'};${!allSame?'font-weight:800;':''}">${val}</td>`).join('')}`;
      tbody.appendChild(tr);
    });

    // Add to cart row
    const cartRow = document.createElement('tr');
    cartRow.innerHTML = `
      <td style="padding:16px;background:#f8f8f8;border-right:1px solid #e8e8e8;"></td>
      ${products.map(p => `
        <td style="padding:16px;text-align:center;">
          <button data-product-id="${p.id}" style="padding:10px 24px;background:#1a1a1a;color:#fff;border:none;font-size:10px;font-weight:800;letter-spacing:1.2px;cursor:pointer;font-family:Montserrat,sans-serif;transition:background .2s;width:100%;"
            onmouseover="this.style.background='#C9A84C'" onmouseout="this.style.background='#1a1a1a'">
            + GIỎ HÀNG
          </button>
        </td>`).join('')}`;
    cartRow.querySelectorAll('[data-product-id]').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        cartService.addItem(products[i]);
        btn.textContent = '✓ ĐÃ THÊM';
        btn.style.background = '#22c55e';
        setTimeout(() => { btn.textContent = '+ GIỎ HÀNG'; btn.style.background = '#1a1a1a'; }, 1500);
      });
    });
    tbody.appendChild(cartRow);
    table.appendChild(tbody);

    return table;
  }
}
