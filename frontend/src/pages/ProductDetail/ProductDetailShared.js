import { getMockProducts } from '../../services/productService.js';
import { STORAGE_KEYS, resolveImageUrl } from '../../services/config.js';
import { formatPrice } from '../../utils/helpers.js';

const SVG_PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%"><rect width="100%" height="100%" fill="%23F3F4F6"/><g transform="translate(160, 140)" stroke="%239CA3AF" stroke-width="2" fill="none"><circle cx="40" cy="40" r="30"/><line x1="40" y1="40" x2="40" y2="22"/><line x1="40" y1="40" x2="52" y2="40"/><path d="M40 10 V 2 M40 70 V 78 M10 40 H 2 M70 40 H 78"/></g><text x="50%" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="%239CA3AF" text-anchor="middle">Hình ảnh đang cập nhật</text></svg>`;

export const PDP_FALLBACK_IMAGES = [
  SVG_PLACEHOLDER
];

const ICONS = {
  arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14"/><path d="m13 5 7 7-7 7"/></svg>',
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M6 8h12l-1 11H7L6 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-6.7-4.3-9.2-8.2C1.2 10.3 2.1 7 4.9 5.6c1.9-.9 4.1-.5 5.6 1 1.4-1.5 3.6-1.9 5.5-1 2.9 1.4 3.8 4.7 2.2 7.2C18.7 16.7 12 21 12 21z"/></svg>',
  heartFill: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-6.7-4.3-9.2-8.2C1.2 10.3 2.1 7 4.9 5.6c1.9-.9 4.1-.5 5.6 1 1.4-1.5 3.6-1.9 5.5-1 2.9 1.4 3.8 4.7 2.2 7.2C18.7 16.7 12 21 12 21z"/></svg>',
  compare: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="3" width="8" height="18" rx="1.5"/><rect x="14" y="3" width="8" height="18" rx="1.5"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4"/><path d="m15.4 6.5-6.8 4"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  rotate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="m5 12 5 5L20 7"/></svg>',
  credit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>',
  message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m9 6 6 6-6 6"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.8 6.9-1L12 2z"/></svg>',
};

export function icon(name, className = 'h-4 w-4') {
  return `<span class="${className} shrink-0">${ICONS[name] || ''}</span>`;
}

export function renderStars(rating = 0, size = 'h-4 w-4') {
  const full = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return Array.from({ length: 5 }, (_, i) => `<span class="${size} ${i < full ? 'text-[#C9A961]' : 'text-zinc-200'}">${ICONS.star}</span>`).join('');
}

export function normalizeImages(images = []) {
  const source = (Array.isArray(images) ? images : []).filter(Boolean);
  if (source.length === 0) {
    return [SVG_PLACEHOLDER];
  }
  return source.map(resolveImageUrl);
}

export function readStoredArray(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

export function writeStoredArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function toggleStoredItem(key, item, limit = 20) {
  const list = readStoredArray(key);
  const exists = list.some((entry) => String(entry.id) === String(item.id));
  if (exists) {
    const next = list.filter((entry) => String(entry.id) !== String(item.id));
    writeStoredArray(key, next);
    return { active: false, items: next };
  }
  const next = [...list.slice(0, Math.max(0, limit - 1)), item];
  writeStoredArray(key, next);
  return { active: true, items: next };
}

let toastHost = null;
function ensureToastHost() {
  if (toastHost) return toastHost;
  toastHost = document.createElement('div');
  toastHost.id = 'pdp-toast-host';
  toastHost.className = 'fixed right-4 top-4 z-[220] flex w-[min(92vw,380px)] flex-col gap-3';
  document.body.appendChild(toastHost);
  return toastHost;
}

export function showToast(msgOrType, typeOrMsg = 'dark') {
  let message = msgOrType;
  let type = typeOrMsg;
  
  const knownTypes = ['success', 'error', 'info', 'warning', 'dark'];
  if (knownTypes.includes(msgOrType) && !knownTypes.includes(typeOrMsg)) {
    type = msgOrType;
    message = typeOrMsg;
  } else if (!knownTypes.includes(msgOrType) && !typeOrMsg) {
    type = 'dark';
    message = msgOrType;
  }

  const root = ensureToastHost();
  const toast = document.createElement('div');
  
  let title = 'Thông báo';
  let iconHtml = '';
  
  if (type === 'success') {
    title = 'Thành công';
    iconHtml = `<svg class="w-5 h-5 text-[#C9A961]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`;
  } else if (type === 'error') {
    title = 'Thất bại';
    iconHtml = `<svg class="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`;
  } else if (type === 'warning') {
    title = 'Cảnh báo';
    iconHtml = `<svg class="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`;
  } else {
    iconHtml = `<svg class="w-5 h-5 text-[#C9A961]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
  }

  toast.className = `flex items-center gap-4 rounded-xl px-5 py-4 border border-[#C9A961]/30 bg-[#0D0D0C]/95 backdrop-blur-md text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out opacity-0 translate-y-[-20px] scale-95`;
  
  toast.innerHTML = `
    <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#FAF8F3]/5 border border-[#C9A961]/20">
      ${iconHtml}
    </div>
    <div class="flex-grow min-w-0">
      <div class="text-[10px] font-bold uppercase tracking-[0.15em] text-[#C9A961] mb-0.5">${title}</div>
      <div class="text-sm font-medium text-white/95 leading-relaxed truncate-2-lines">${message}</div>
    </div>
  `;

  root.appendChild(toast);
  
  if (!document.getElementById('pdp-toast-style')) {
    const s = document.createElement('style');
    s.id = 'pdp-toast-style';
    s.textContent = `
      .truncate-2-lines {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `;
    document.head.appendChild(s);
  }

  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-y-[-20px]', 'scale-95');
    toast.classList.add('opacity-100', 'translate-y-0', 'scale-100');
  });

  setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0', 'scale-100');
    toast.classList.add('opacity-0', 'translate-y-[-10px]', 'scale-95');
    setTimeout(() => toast.remove(), 500);
  }, 2800);
}

export function buildMockDetail(slug = '') {
  const base = getMockProducts(8).find((item) => item.slug === slug) || getMockProducts(1)[0];
  return {
    ...base,
    images: normalizeImages(base.images || [base.image]),
    category_slug: 'nam',
    category_name: base.category_name || 'Đồng Hồ Nam',
    ref_number: base.slug?.toUpperCase() || 'SKU-001',
    sold_count: 126,
    short_description: 'Thiết kế cân đối, hoàn thiện chỉn chu và phù hợp để đeo hằng ngày hoặc trong những dịp trang trọng.',
    long_description: 'Mẫu đồng hồ này kết hợp đường nét cổ điển với hoàn thiện hiện đại, mang lại cảm giác sang trọng nhưng vẫn dễ dùng mỗi ngày.',
    rating: { total: 24, avg_rating: 4.8, five_star: 18, four_star: 5, three_star: 1, two_star: 0, one_star: 0 },
    trust_badges: [
      { title: 'Bảo hành', subtitle: '2 năm chính hãng' },
      { title: 'Đổi trả', subtitle: '30 ngày minh bạch' },
      { title: 'Chính hãng', subtitle: 'Cam kết 100%' },
      { title: 'Freeship', subtitle: 'Đơn từ 500K' },
    ],
    delivery: { delivery_eta: '2-3 ngày làm việc', pickup_store: '123 Nguyễn Huệ, Q.1, TP.HCM' },
    specs: [
      ['Thương hiệu', base.brand || 'Longines'], ['Bộ sưu tập', 'Elegant Collection'], ['Mã sản phẩm', base.slug?.toUpperCase() || 'SKU-001'],
      ['Xuất xứ', 'Thụy Sỹ (Swiss Made)'], ['Giới tính', 'Nam'], ['Đường kính mặt', '40mm'], ['Độ dày', '8.2mm'],
      ['Chất liệu vỏ', 'Thép không gỉ 316L'], ['Mặt kính', 'Sapphire chống xước'], ['Chất liệu dây', 'Da bê Ý cao cấp'],
      ['Màu mặt số', 'Trắng ngọc trai'], ['Loại máy', 'Automatic'], ['Độ chính xác', '±10s/tháng'], ['Trữ năng lượng', '72 giờ'],
      ['Chống nước', '5ATM (50m)'], ['Trọng lượng', '38g'], ['Bảo hành', '2 năm chính hãng'], ['Phụ kiện đi kèm', 'Hộp đựng, sách, thẻ bảo hành'],
    ].map(([label, value]) => ({ label, value })),
  };
}

export function setProductMeta(product) {
  document.title = `${product.name} | Venix Watch`;
  const description = product.short_description || product.description || 'Đồng hồ chính hãng, bảo hành toàn quốc.';
  updateMeta('description', description);
  updateMeta('og:title', product.name, 'property');
  updateMeta('og:description', description, 'property');
  updateMeta('og:image', product.images?.[0] || PDP_FALLBACK_IMAGES[0], 'property');
  let script = document.getElementById('product-jsonld');
  if (!script) {
    script = document.createElement('script');
    script.id = 'product-jsonld';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images || [PDP_FALLBACK_IMAGES[0]],
    sku: product.ref_number,
    description,
    brand: { '@type': 'Brand', name: product.brand || 'Venix Watch' },
    offers: { '@type': 'Offer', priceCurrency: 'VND', price: product.sale_price || product.price, availability: 'https://schema.org/InStock' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating?.avg_rating || 4.8, reviewCount: product.rating?.total || 24 },
  });
}

export function ensureProductDetailStyles() {
  if (document.getElementById('pdp-styles')) return;
  const style = document.createElement('style');
  style.id = 'pdp-styles';
  style.textContent = `
    .pdp-hide-scroll::-webkit-scrollbar{display:none}
    .pdp-hide-scroll{scrollbar-width:none}
    
    .pdp-luxury-scroll::-webkit-scrollbar {
      height: 6px;
      background-color: transparent;
    }
    .pdp-luxury-scroll::-webkit-scrollbar-thumb {
      background-color: transparent;
      border-radius: 9999px;
      transition: background-color 0.2s;
    }
    .pdp-luxury-scroll:hover::-webkit-scrollbar-thumb {
      background-color: rgba(201, 169, 97, 0.45);
    }
    .pdp-luxury-scroll::-webkit-scrollbar-thumb:hover {
      background-color: rgba(201, 169, 97, 0.8);
    }
    .pdp-luxury-scroll {
      scrollbar-width: thin;
      scrollbar-color: transparent transparent;
      transition: scrollbar-color 0.2s;
      overscroll-behavior-x: contain;
    }
    .pdp-luxury-scroll:hover {
      scrollbar-color: rgba(201, 169, 97, 0.45) transparent;
    }

    .pdp-gradient-gold{background:linear-gradient(135deg,#dcc488 0%,#c9a961 45%,#a88840 100%)}
    .pdp-tab-panel{animation:pdp-fade .22s ease}
    .pdp-lens-active img{transform:scale(1.8)}
    @keyframes pdp-fade{from{opacity:.2;transform:translateY(6px)}to{opacity:1;transform:none}}
    
    .pdp-description-content p {
      margin-bottom: 1.25rem;
      line-height: 2;
      color: #4B5563;
    }
    .pdp-description-content h2 {
      font-size: 1.35rem;
      font-weight: 700;
      color: #0A0A0A;
      margin-top: 2rem;
      margin-bottom: 0.85rem;
    }
    .pdp-description-content h3 {
      font-size: 1.15rem;
      font-weight: 700;
      color: #0A0A0A;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
    }
    .pdp-description-content ul {
      list-style-type: disc;
      padding-left: 1.5rem;
      margin-bottom: 1.25rem;
    }
    .pdp-description-content li {
      margin-bottom: 0.5rem;
      line-height: 1.8;
      color: #4B5563;
    }
    .pdp-description-content img {
      border-radius: 10px;
      margin: 1.5rem auto;
      max-width: 100%;
      height: auto;
      object-fit: cover;
      display: block;
    }
  `;
  document.head.appendChild(style);
}

export function formatInstallment(price = 0) {
  return formatPrice(Math.ceil(Number(price || 0) / 12));
}

export function dispatchCompare(items) {
  window.dispatchEvent(new CustomEvent('compare-updated', { detail: items }));
}

export const PDP_KEYS = {
  wishlist: 'dhat_wishlist',
  compare: STORAGE_KEYS.COMPARE,
};

function updateMeta(name, content, attr = 'name') {
  let tag = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}
