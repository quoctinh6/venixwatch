/**
 * NewsList/index.js — Public blog/news listing page
 */
import { API_BASE } from '../../services/config.js';
import { navigate } from '../../utils/helpers.js';

export default class NewsListPage {
  constructor() {
    this._articles = [];
    this._currentPage = 1;
    this._itemsPerPage = 9;
  }

  async render() {
    const wrap = document.createElement('div');
    wrap.className = 'bg-[#FAF8F3]/40 min-h-screen font-sanspb-16';

    // Premium banner header
    const header = document.createElement('div');
    header.className = 'relative bg-zinc-950 py-16 px-6 text-center text-white overflow-hidden';
    header.innerHTML = `
      <div class="absolute inset-0 bg-cover bg-center opacity-25" style="background-image: url('https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg');"></div>
      <div class="relative max-w-4xl mx-auto space-y-4">
        <span class="text-xs font-black tracking-[0.2em] text-[#C9A961] uppercase">Tin Tức & Sự Kiện</span>
        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase">Venix Chronicle</h1>
        <p class="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">Cập nhật tin tức mới nhất về đồng hồ, các chương trình ưu đãi độc quyền và xu hướng thời trang thượng lưu.</p>
        <div class="h-1 w-12 bg-[#C9A961] mx-auto mt-4"></div>
      </div>
    `;
    wrap.appendChild(header);

    const container = document.createElement('div');
    container.className = 'max-w-7xl mx-auto px-6 py-12';
    
    // Loading skeleton
    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        ${Array.from({ length: 6 }).map(() => `
          <div class="border border-zinc-200/60 rounded-2xl p-4 bg-white animate-pulse space-y-4">
            <div class="h-48 bg-zinc-100 rounded-xl"></div>
            <div class="h-4 bg-zinc-200 rounded w-1/3"></div>
            <div class="h-6 bg-zinc-200 rounded w-3/4"></div>
            <div class="h-4 bg-zinc-200 rounded w-full"></div>
            <div class="h-4 bg-zinc-200 rounded w-5/6"></div>
          </div>
        `).join('')}
      </div>
    `;
    wrap.appendChild(container);

    try {
      const res = await fetch(`${API_BASE}/api/news?t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          this._articles = json.data || [];
        }
      }
    } catch (err) {
      console.error('Error fetching public news:', err);
    }

    this._renderList(container);
    return wrap;
  }

  _renderList(container) {
    if (this._articles.length === 0) {
      container.innerHTML = `
        <div class="text-center py-20 bg-white border border-zinc-200/50 rounded-2xl max-w-lg mx-auto shadow-sm">
          <svg class="w-12 h-12 text-zinc-400 mx-auto mb-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
          <p class="text-zinc-500 font-medium text-sm">Chưa có bài viết tin tức nào được đăng tải.</p>
        </div>
      `;
      return;
    }

    const startIndex = (this._currentPage - 1) * this._itemsPerPage;
    const endIndex = startIndex + this._itemsPerPage;
    const paginated = this._articles.slice(startIndex, endIndex);
    const totalPages = Math.ceil(this._articles.length / this._itemsPerPage);

    let listHtml = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        ${paginated.map(art => {
          const dateStr = new Date(art.created_at).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
          });
          const thumbnail = art.thumbnail_url || 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=600';
          return `
            <article class="group bg-white border border-zinc-200/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full cursor-pointer" data-slug="${art.slug}">
              <div class="relative overflow-hidden aspect-[16/10] bg-zinc-950">
                <img src="${thumbnail}" alt="${art.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                <span class="absolute top-4 left-4 bg-zinc-950/80 backdrop-blur-sm text-[#C9A961] text-[10px] font-bold py-1 px-3.5 rounded-full border border-zinc-800 tracking-wider">TIN TỨC</span>
              </div>
              <div class="p-6 flex-1 flex flex-col justify-between">
                <div class="space-y-3">
                  <div class="flex items-center gap-2 text-zinc-400 text-xs font-semibold">
                    <span>${art.author || 'Admin'}</span>
                    <span class="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
                    <span>${dateStr}</span>
                  </div>
                  <h3 class="text-zinc-900 group-hover:text-[#C9A961] font-bold text-lg leading-snug transition-colors line-clamp-2">${art.title}</h3>
                  <p class="text-zinc-500 text-sm leading-relaxed line-clamp-3">${art.summary || ''}</p>
                </div>
                <div class="pt-6 border-t border-zinc-100 flex items-center justify-between text-[#C9A961] text-xs font-bold uppercase tracking-wider group-hover:underline">
                  <span>Đọc tiếp</span>
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" class="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </div>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;

    // Pagination
    if (totalPages > 1) {
      listHtml += `
        <div class="flex items-center justify-center gap-2 mt-12 border-t border-zinc-200/50 pt-8">
          <button type="button" id="prev-page" class="p-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" ${this._currentPage === 1 ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          
          <div class="flex items-center gap-1.5">
            ${Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1;
              const active = p === this._currentPage;
              return `<button type="button" class="page-btn w-10 h-10 rounded-xl text-xs font-bold transition-all ${active ? 'bg-[#C9A84C] text-white' : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50'}" data-page="${p}">${p}</button>`;
            }).join('')}
          </div>

          <button type="button" id="next-page" class="p-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" ${this._currentPage === totalPages ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      `;
    }

    container.innerHTML = listHtml;

    // Bind navigation click handlers
    container.querySelectorAll('[data-slug]').forEach(art => {
      art.addEventListener('click', () => navigate(`/tin-tuc/${art.dataset.slug}`));
    });

    // Bind pagination handlers
    container.querySelector('#prev-page')?.addEventListener('click', () => {
      if (this._currentPage > 1) {
        this._currentPage--;
        this._renderList(container);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    container.querySelector('#next-page')?.addEventListener('click', () => {
      if (this._currentPage < totalPages) {
        this._currentPage++;
        this._renderList(container);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    container.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._currentPage = parseInt(btn.dataset.page, 10);
        this._renderList(container);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }
}
