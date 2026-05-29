/**
 * NewsDetail/index.js — Public blog/news detail page
 */
import { API_BASE } from '../../services/config.js';
import { navigate } from '../../utils/helpers.js';

export default class NewsDetailPage {
  constructor(params = {}) {
    this._slug = params.slug || '';
    this._article = null;
    this._related = [];
  }

  async render() {
    const wrap = document.createElement('div');
    wrap.className = 'bg-[#FAF8F3]/40 min-h-screen font-sans pb-20';

    const container = document.createElement('div');
    container.className = 'max-w-4xl mx-auto px-6 py-8';
    wrap.appendChild(container);

    // Initial Loading skeleton
    container.innerHTML = `
      <div class="space-y-6 animate-pulse">
        <div class="h-4 bg-zinc-200 rounded w-1/4"></div>
        <div class="h-10 bg-zinc-200 rounded w-3/4"></div>
        <div class="h-4 bg-zinc-200 rounded w-1/3"></div>
        <div class="h-[400px] bg-zinc-200 rounded-3xl"></div>
        <div class="space-y-3">
          <div class="h-4 bg-zinc-200 rounded"></div>
          <div class="h-4 bg-zinc-200 rounded w-5/6"></div>
          <div class="h-4 bg-zinc-200 rounded w-2/3"></div>
        </div>
      </div>
    `;

    try {
      // 1. Fetch main article
      const res = await fetch(`${API_BASE}/api/news/${this._slug}?t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          this._article = json.data;
        }
      }

      // 2. Fetch recent articles as related list
      const listRes = await fetch(`${API_BASE}/api/news?t=${Date.now()}`);
      if (listRes.ok) {
        const listJson = await listRes.json();
        if (listJson.success && Array.isArray(listJson.data)) {
          this._related = listJson.data
            .filter(a => a.slug !== this._slug)
            .slice(0, 3);
        }
      }
    } catch (err) {
      console.error('Error loading news details:', err);
    }

    if (!this._article) {
      container.innerHTML = `
        <div class="text-center py-20 bg-white border border-zinc-200/50 rounded-2xl max-w-lg mx-auto shadow-sm">
          <svg class="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <h3 class="text-zinc-900 font-bold text-lg">Không tìm thấy bài viết</h3>
          <p class="text-zinc-500 text-sm mt-2 mb-6">Bài viết không tồn tại hoặc đã bị gỡ bỏ.</p>
          <button id="go-back-btn" class="px-6 py-2.5 bg-zinc-950 hover:bg-[#C9A84C] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md">Quay lại danh sách</button>
        </div>
      `;
      container.querySelector('#go-back-btn')?.addEventListener('click', () => navigate('/tin-tuc'));
      return wrap;
    }

    const art = this._article;
    const dateStr = new Date(art.created_at).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

    container.innerHTML = `
      <!-- Breadcrumbs -->
      <div class="flex items-center gap-2 text-xs text-zinc-400 font-semibold mb-6">
        <a href="/" data-nav class="hover:text-zinc-800 transition-colors">Trang chủ</a>
        <span>&rsaquo;</span>
        <a href="/tin-tuc" data-nav class="hover:text-zinc-800 transition-colors">Tin tức</a>
        <span>&rsaquo;</span>
        <span class="text-zinc-800 truncate max-w-[200px]">${art.title}</span>
      </div>

      <!-- Main Article Card -->
      <article class="bg-white border border-zinc-200/50 rounded-3xl shadow-sm p-6 sm:p-10 space-y-8">
        <!-- Header -->
        <div class="space-y-4">
          <span class="inline-block bg-[#C9A961]/10 text-[#C9A961] text-[10px] font-bold py-1 px-3.5 rounded-full border border-[#C9A961]/25 tracking-wider uppercase">TIN TỨC CHÍNH HÃNG</span>
          <h1 class="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 leading-tight">${art.title}</h1>
          <div class="flex items-center gap-3 text-zinc-400 text-xs font-semibold pt-2 border-t border-zinc-100">
            <span class="text-zinc-700">${art.author || 'Admin'}</span>
            <span class="w-1 h-1 rounded-full bg-zinc-300"></span>
            <span>Đăng ngày ${dateStr}</span>
          </div>
        </div>

        <!-- Thumbnail image (Large) -->
        ${art.thumbnail_url ? `
          <div class="w-full aspect-[21/9] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-200/40 shadow-sm">
            <img src="${art.thumbnail_url}" alt="${art.title}" class="w-full h-full object-cover" />
          </div>
        ` : ''}

        <!-- Content -->
        <div class="news-article-content prose max-w-none text-zinc-700 text-sm leading-relaxed space-y-6">
          ${art.content}
        </div>
      </article>

      <!-- Related articles section -->
      ${this._related.length > 0 ? `
        <div class="mt-16 space-y-6">
          <div class="flex items-center justify-between border-b border-zinc-200/60 pb-3">
            <h2 class="text-lg font-bold text-zinc-900 uppercase tracking-wide">Các bài viết mới khác</h2>
            <a href="/tin-tuc" data-nav class="text-[#C9A961] hover:underline text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              Xem tất cả
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            ${this._related.map(rel => `
              <div class="group bg-white border border-zinc-200/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer" data-slug="${rel.slug}">
                <div class="aspect-[16/10] overflow-hidden bg-zinc-950 relative">
                  <img src="${rel.thumbnail_url || 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=400'}" alt="${rel.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div class="p-4 flex-1 flex flex-col justify-between">
                  <h3 class="text-zinc-900 group-hover:text-[#C9A961] font-bold text-xs leading-snug transition-colors line-clamp-2">${rel.title}</h3>
                  <div class="pt-3 text-[10px] text-zinc-400 font-semibold flex items-center justify-between">
                    <span>${new Date(rel.created_at).toLocaleDateString('vi-VN')}</span>
                    <span class="text-[#C9A961] uppercase tracking-wider group-hover:underline">Đọc bài &rsaquo;</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;

    // Bind routing triggers
    container.querySelectorAll('[data-nav], [data-slug]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const slug = el.dataset.slug;
        const href = el.getAttribute('href');
        if (slug) {
          navigate(`/tin-tuc/${slug}`);
        } else if (href) {
          navigate(href);
        }
      });
    });

    this._injectStyles();
    return wrap;
  }

  _injectStyles() {
    const id = 'news-detail-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      .news-article-content {
        font-family: inherit;
        color: #374151;
      }
      .news-article-content p {
        line-height: 1.85 !important;
        margin-bottom: 1.5rem !important;
        font-size: 15px !important;
      }
      .news-article-content h1, 
      .news-article-content h2, 
      .news-article-content h3, 
      .news-article-content h4 {
        color: #111827;
        font-weight: 800;
        margin-top: 2rem;
        margin-bottom: 1rem;
        line-height: 1.3;
      }
      .news-article-content h1 { font-size: 24px; }
      .news-article-content h2 { font-size: 20px; }
      .news-article-content h3 { font-size: 18px; }
      .news-article-content img {
        max-width: 100%;
        height: auto;
        border-radius: 16px;
        margin: 2rem auto;
        display: block;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      }
      .news-article-content blockquote {
        border-left: 4px solid #C9A961;
        padding-left: 1.5rem;
        font-style: italic;
        color: #4B5563;
        margin: 2rem 0;
      }
      .news-article-content ul, .news-article-content ol {
        margin-left: 1.5rem;
        margin-bottom: 1.5rem;
        list-style-position: outside;
      }
      .news-article-content ul { list-style-type: disc; }
      .news-article-content ol { list-style-type: decimal; }
      .news-article-content li {
        margin-bottom: 0.5rem;
        line-height: 1.7;
      }
      .news-article-content a {
        color: #C9A961;
        text-decoration: underline;
        font-weight: 600;
      }
      .news-article-content a:hover {
        color: #A88840;
      }
    `;
    document.head.appendChild(style);
  }
}
