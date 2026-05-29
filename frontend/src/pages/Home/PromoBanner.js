import { navigate } from '../../utils/helpers.js';

export class PromoBanner {
  render() {
    const bar = document.createElement('section');
    bar.className = 'bg-gradient-to-r from-[#C9A961] to-[#A88840] font-sans';
    bar.innerHTML = `
      <div class="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div class="flex flex-col gap-1 text-center lg:text-left">
          <div class="flex items-center justify-center gap-2 lg:justify-start">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span class="text-xs font-black uppercase tracking-[0.18em] text-white">Mua 1 Tặng 1 — Ưu đãi 50%</span>
          </div>
          <div class="text-xs font-semibold tracking-normal text-white/95">
            Dùng code:
            <span class="ml-2 inline-flex rounded bg-white/20 px-2 py-0.5 font-extrabold uppercase tracking-[0.12em] text-white leading-none">BOGOSO</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center lg:justify-end">
          <button data-href="/nam" class="promo-btn inline-flex h-11 items-center justify-center rounded-xl border border-white/40 bg-white/10 px-6 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-zinc-950">
            Shop Nam
          </button>
          <button data-href="/nu" class="promo-btn inline-flex h-11 items-center justify-center rounded-xl border border-white/40 bg-white/10 px-6 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-zinc-950">
            Shop Nữ
          </button>
        </div>
      </div>
    `;

    bar.querySelectorAll('.promo-btn').forEach((btn) => {
      btn.addEventListener('click', () => navigate(btn.dataset.href));
    });

    return bar;
  }
}
