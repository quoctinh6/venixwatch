import { navigate } from '../../utils/helpers.js';
import { authService } from '../../services/authService.js';
import { openQuickSettings } from '../../components/QuickSettingsModal.js?v=1.0.3';

export class PromoBanner {
  render() {
    const pb = window.APP_SETTINGS?.home_sections?.promo_banner || {
      title: "Mua 1 Tặng 1 — Ưu đãi 50%",
      code: "BOGOSO",
      buttons: [
        { label: "Shop Nam", href: "/nam" },
        { label: "Shop Nữ", href: "/nu" }
      ]
    };

    const user = authService.getUser();
    const hasAdminRole = user && user.roles && user.roles.some(r => {
      const name = (typeof r === 'object' && r !== null) ? r.name : r;
      return name === 'super_admin' || name === 'admin' || name === 'editor';
    });
    const canEditSettings = user && (
      (user.permissions && user.permissions.includes('settings:write')) || hasAdminRole
    );

    const bar = document.createElement('section');
    bar.className = 'bg-gradient-to-r from-[#C9A961] to-[#A88840] font-sans relative';
    bar.innerHTML = `
      <div class="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 ${canEditSettings ? 'pl-14 sm:pl-14 lg:pl-16' : ''}">
        <div class="flex flex-col gap-1 text-center lg:text-left">
          <div class="flex items-center justify-center gap-2 lg:justify-start">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span class="text-xs font-black uppercase tracking-[0.18em] text-white">${pb.title || ''}</span>
          </div>
          ${pb.code ? `
          <div class="text-xs font-semibold tracking-normal text-white/95">
            Dùng code:
            <span class="ml-2 inline-flex rounded bg-white/20 px-2 py-0.5 font-extrabold uppercase tracking-[0.12em] text-white leading-none">${pb.code}</span>
          </div>
          ` : ''}
        </div>

        <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center lg:justify-end">
          ${(pb.buttons || []).filter(btn => btn && btn.label).map(btn => `
            <button data-href="${btn.href || '#'}" class="promo-btn inline-flex h-11 items-center justify-center rounded-xl border border-white/40 bg-white/10 px-6 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-zinc-950">
              ${btn.label}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    bar.querySelectorAll('.promo-btn').forEach((btn) => {
      btn.addEventListener('click', () => navigate(btn.dataset.href));
    });

    if (canEditSettings) {
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 border border-zinc-200 text-[#A88840] hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all shadow-md cursor-pointer';
      editBtn.title = 'Chỉnh sửa Banner Khuyến Mãi';
      editBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
      editBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openQuickSettings('sections', 'promo_banner');
      });
      bar.appendChild(editBtn);
    }

    return bar;
  }
}
