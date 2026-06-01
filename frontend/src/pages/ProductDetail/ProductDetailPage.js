import {
  getCrossSellProducts, getProduct, getProductImages, getProductQuestions, getProductReviews,
  getProductSpecs, getRecentlyViewedProducts, getRelatedProducts, trackProductView,
} from '../../services/productService.js';
import { getSessionId, navigate } from '../../utils/helpers.js';
import { recentlyViewed } from '../../utils/recentlyViewed.js';
import ProductGallery from './ProductGallery.js';
import ProductInfo from './ProductInfo.js';
import ProductTabs from './ProductTabs.js';
import RelatedProducts from './RelatedProducts.js';
import { buildMockDetail, ensureProductDetailStyles, normalizeImages, setProductMeta } from './ProductDetailShared.js';

export default class ProductDetailPage {
  constructor(params = {}) {
    this._slug = params.slug || '';
  }

  async render() {
    ensureProductDetailStyles();
    const wrap = document.createElement('div');
    wrap.className = 'bg-white pb-20 md:pb-0';
    const payload = await this._loadPayload();
    if (this.aborted) {
      return wrap;
    }
    const { product } = payload;

    // Parse specs from description if present in HTML (dynamic client-side migration) for Carnival and Casio
    const brandLower = String(product.brand || '').toLowerCase();
    const isPremiumLayout = brandLower === 'carnival' || brandLower === 'casio' || brandLower === 'kemil';
    if (isPremiumLayout) {
      const descLower = (product.description || '').toLowerCase();
      if (descLower.includes('thông số kỹ thuật') || descLower.includes('thông số kĩ thuật') || descLower.includes('hông số kỹ thuật') || descLower.includes('hông số kĩ thuật')) {
        const parsed = parseSpecsFromDescription(product.description);
        product.description = parsed.description;
        const existingLabels = new Set((product.specs || []).map(s => s.label.toLowerCase().trim()));
        parsed.specs.forEach(spec => {
          if (!existingLabels.has(spec.label.toLowerCase().trim())) {
            product.specs.push(spec);
          }
        });
      }
    }

    setProductMeta(product);
    recentlyViewed.push(product);
    trackProductView(product.id, getSessionId()).catch(() => { });

    const gallery = new ProductGallery(product);
    this._gallery = gallery;
    const tabs = new ProductTabs(payload);
    const info = new ProductInfo(product, {
      onReviewJump: () => tabs.activate('reviews'),
    });
    this._info = info;
    const related = new RelatedProducts({ related: payload.related, crossSell: payload.crossSell, recently: payload.recently });

    wrap.innerHTML = this._headerHtml(product);
    const container = document.createElement('div');
    container.className = 'container-main py-8 lg:py-12';
    container.innerHTML = '<div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-12"></div>';
    const grid = container.firstElementChild;
    grid.appendChild(gallery.render());
    grid.appendChild(info.render());
    wrap.appendChild(container);

    const content = document.createElement('div');
    content.className = 'container-main space-y-10 pb-12';
    content.appendChild(tabs.render());
    if (related._sections.length) content.appendChild(related.render());
    wrap.appendChild(content);
    return wrap;
  }

  destroy() {
    this.aborted = true;
    if (this._gallery && typeof this._gallery.destroy === 'function') {
      try { this._gallery.destroy(); } catch (e) { }
    }
    if (this._info && typeof this._info.destroy === 'function') {
      try { this._info.destroy(); } catch (e) { }
    }
    const bar = document.getElementById('pdp-mobile-bar');
    if (bar) bar.remove();
  }

  async _loadPayload() {
    const base = await getProduct(this._slug).then((res) => res.data || res).catch(() => buildMockDetail(this._slug));
    const product = { ...base, images: normalizeImages(base.images || [base.image]) };
    const sessionId = getSessionId();
    const [
      images, specs, reviews, questions, related, crossSell, recent,
    ] = await Promise.allSettled([
      getProductImages(product.id),
      getProductSpecs(product.id),
      getProductReviews(product.id),
      getProductQuestions(product.id),
      getRelatedProducts(product.id),
      getCrossSellProducts(product.id),
      getRecentlyViewedProducts(sessionId),
    ]);
    product.images = this._pick(images, product.images);
    product.specs = this._pick(specs, product.specs || []);
    return {
      product,
      reviews: this._pick(reviews, this._mockReviews()),
      reviewMeta: reviews.status === 'fulfilled' ? reviews.value.meta : { total: 3, page: 1, total_pages: 1, summary: product.rating || {} },
      questions: this._pick(questions, this._mockQuestions()),
      related: this._pick(related, []).slice(0, 10),
      crossSell: this._pick(crossSell, []).slice(0, 10),
      recently: this._mergeRecently(this._pick(recent, []), product),
    };
  }

  _pick(entry, fallback) {
    return entry.status === 'fulfilled' ? (entry.value.data || fallback) : fallback;
  }

  _mergeRecently(server, current) {
    const local = recentlyViewed.get().filter((item) => String(item.id) !== String(current.id));
    const merged = [...server, ...local].filter(Boolean);
    const seen = new Set();
    return merged.filter((item) => {
      const key = String(item.id);
      if (seen.has(key) || key === String(current.id)) return false;
      seen.add(key);
      return true;
    }).slice(0, 8);
  }

  _headerHtml(product) {
    return `
      <section class="border-b border-[#E8E4DC] bg-gradient-to-b from-[#FAF8F3] to-white">
        <div class="container-main py-6 lg:py-10">
          <div class="flex flex-wrap items-center gap-2 text-[13px] text-[#6B7280]">
            <a href="/" data-nav class="hover:text-[#0A0A0A]">Trang chủ</a>
            <span>${'>'}</span>
            <a href="/${product.category_slug || 'nam'}" data-nav class="hover:text-[#0A0A0A]">${product.category_name || 'Đồng hồ'}</a>
            <span>${'>'}</span>
            <span class="text-[#0A0A0A]">${product.name}</span>
          </div>
          <div class="mt-4 max-w-4xl">
            <h1 class="text-[28px] font-bold uppercase leading-[1.15] tracking-[0.02em] text-[#0A0A0A] md:text-[36px]">${product.name}</h1>
            <p class="mt-3 text-[15px] leading-7 text-[#6B7280]">Bộ sưu tập đồng hồ chính hãng được tuyển chọn kỹ, tối ưu trải nghiệm đeo và độ hoàn thiện cho khách hàng tìm kiếm một sản phẩm luxury nhưng dùng được lâu dài.</p>
          </div>
        </div>
      </section>
    `;
  }

  _mockReviews() {
    return [
      { user_name: 'Nguyễn Minh A', rating: 5, title: 'Thiết kế sang và đeo rất vừa tay', comment: 'Sản phẩm đẹp hơn hình, hoàn thiện tốt, giao hàng kỹ và đúng lịch.', shop_reply: 'Cảm ơn anh đã tin tưởng Venix Watch.', created_at: '2026-05-15' },
      { user_name: 'Trần Thu B', rating: 5, title: 'Mặt số rất thanh lịch', comment: 'Đeo đi làm rất hợp, dây và khóa hoàn thiện chắc tay.', created_at: '2026-05-12' },
      { user_name: 'Lê Quốc C', rating: 4, title: 'Đúng mô tả', comment: 'Máy ổn định, tư vấn tốt, đóng gói cẩn thận.', created_at: '2026-05-05' },
    ];
  }

  _mockQuestions() {
    return [
      { user_name: 'Khánh', question: 'Mẫu này có hỗ trợ trả góp không?', answer: 'Có, shop hỗ trợ trả góp 0% qua thẻ tín dụng theo kỳ hạn phù hợp.', created_at: '2026-05-10' },
      { user_name: 'Hà', question: 'Có sẵn tại cửa hàng Q.1 không?', answer: 'Hiện còn hàng và có thể giữ mẫu trong ngày nếu chị đặt trước.', created_at: '2026-05-08' },
    ];
  }
}

function parseSpecsFromDescription(html) {
  if (!html) return { description: '', specs: [] };

  const doc = document.createElement('div');
  doc.innerHTML = html;

  const specs = [];

  // 1. Try WooCommerce format: Table rows with th (label) and td (value)
  const rows = doc.querySelectorAll('tr');
  rows.forEach(row => {
    const th = row.querySelector('th');
    const td = row.querySelector('td');
    if (th && td) {
      const label = th.textContent.trim().replace(/:$/, '');
      const value = td.textContent.trim();
      if (label && value) {
        specs.push({ label, value });
      }
    }
  });

  // 2. Fallback to td with strong element format
  if (specs.length === 0) {
    const tds = doc.querySelectorAll('td');
    tds.forEach(td => {
      const strong = td.querySelector('strong');
      if (strong) {
        const label = strong.textContent.trim().replace(/:$/, '');
        let valText = td.innerHTML.replace(strong.outerHTML, '').replace(/<br\s*\/?>/gi, '\n');
        const temp = document.createElement('div');
        temp.innerHTML = valText;
        const value = temp.textContent.trim().replace(/\s+/g, ' ');
        
        if (label && value) {
          specs.push({ label, value });
        }
      }
    });
  }

  // 3. Remove all specification tables from description HTML
  const tables = doc.querySelectorAll('table');
  tables.forEach(table => table.remove());

  // 4. Remove headings or paragraphs introducing the specifications
  const headers = doc.querySelectorAll('h1, h2, h3, h4, p, strong, span');
  headers.forEach(el => {
    const text = el.textContent.toLowerCase().trim();
    if (
      text === 'thông số kỹ thuật' || text === 'thông số kĩ thuật' ||
      text === 'hông số kỹ thuật' || text === 'hông số kĩ thuật' ||
      text.includes('thông số kỹ thuật') || text.includes('thông số kĩ thuật')
    ) {
      const parentP = el.closest('p') || el.closest('h1') || el.closest('h2') || el.closest('h3') || el.closest('h4');
      if (parentP) {
        parentP.remove();
      } else {
        el.remove();
      }
    }
  });

  return {
    description: doc.innerHTML.trim(),
    specs
  };
}
