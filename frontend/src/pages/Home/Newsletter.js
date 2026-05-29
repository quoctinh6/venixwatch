import { API_BASE } from '../../services/config.js';
import { authService } from '../../services/authService.js';
import { openQuickSettings } from '../../components/QuickSettingsModal.js?v=1.0.3';

export class Newsletter {
  render() {
    const nl = window.APP_SETTINGS?.home_sections?.newsletter || {
      title: "Nhận Ưu Đãi Độc Quyền",
      description: "Đăng ký để nhận thông tin về bộ sưu tập mới, ưu đãi đặc biệt và tips chăm sóc đồng hồ từ các chuyên gia.",
      button_label: "Đăng Ký Ngay"
    };

    const user = authService.getUser();
    const hasAdminRole = user && user.roles && user.roles.some(r => {
      const name = (typeof r === 'object' && r !== null) ? r.name : r;
      return name === 'super_admin' || name === 'admin' || name === 'editor';
    });
    const canEditSettings = user && (
      (user.permissions && user.permissions.includes('settings:write')) || hasAdminRole
    );

    const section = document.createElement('section');
    section.className = 'bg-zinc-950 py-12 font-sans sm:py-16 lg:py-20 relative';

    const container = document.createElement('div');
    container.className = 'mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr,1.05fr] lg:gap-16 lg:px-8';

    const left = document.createElement('div');
    left.innerHTML = `
      <p class="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#C9A961]">Newsletter</p>
      <h2 class="text-3xl font-black leading-tight tracking-[0.05em] text-white sm:text-4xl">${nl.title}</h2>
      <p class="mt-5 max-w-xl text-sm leading-8 text-zinc-400">
        ${nl.description}
      </p>
      
      <!-- Counters Section -->
      <div class="mt-8 grid grid-cols-3 gap-4">
        <div>
          <div class="counter-val text-2xl font-black text-[#C9A961]" data-target="10" data-suffix="%">0%</div>
          <div class="mt-2 text-[10px] uppercase tracking-[0.05em] text-zinc-500">Giảm đơn đầu</div>
        </div>
        <div>
          <div class="counter-val text-2xl font-black text-[#C9A961]" data-target="2" data-suffix="K+">0K+</div>
          <div class="mt-2 text-[10px] uppercase tracking-[0.05em] text-zinc-500">Thành viên</div>
        </div>
        <div>
          <div class="counter-val text-2xl font-black text-[#C9A961]" data-target="48" data-suffix="h">0h</div>
          <div class="mt-2 text-[10px] uppercase tracking-[0.05em] text-zinc-500">Ưu đãi riêng</div>
        </div>
      </div>
    `;

    const right = document.createElement('div');
    right.innerHTML = `
      <div id="nl-form-wrap" class="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm sm:p-6">
        <form id="newsletter-form" novalidate class="space-y-4">
          <!-- Floating Label Name Input -->
          <div class="relative">
            <input type="text" id="nl-name" placeholder=" " autocomplete="name"
              class="peer h-12 w-full rounded-2xl border border-zinc-700 bg-zinc-900/60 px-4 pt-4 pb-1 text-sm text-white outline-none transition-all placeholder-shown:pt-3 placeholder-shown:pb-3 focus:border-[#C9A961] focus:ring-1 focus:ring-[#C9A961]/30 focus:pt-4 focus:pb-1" />
            <label for="nl-name" class="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 transition-all pointer-events-none peer-focus:top-3 peer-focus:text-[10px] peer-focus:text-[#C9A961] peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-zinc-500">
              Họ và tên
            </label>
          </div>
          
          <!-- Floating Label Email Input -->
          <div class="relative">
            <input type="email" id="nl-email" placeholder=" " autocomplete="email" required
              class="peer h-12 w-full rounded-2xl border border-zinc-700 bg-zinc-900/60 px-4 pt-4 pb-1 text-sm text-white outline-none transition-all placeholder-shown:pt-3 placeholder-shown:pb-3 focus:border-[#C9A961] focus:ring-1 focus:ring-[#C9A961]/30 focus:pt-4 focus:pb-1" />
            <label for="nl-email" class="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 transition-all pointer-events-none peer-focus:top-3 peer-focus:text-[10px] peer-focus:text-[#C9A961] peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-zinc-500">
              Địa chỉ email của bạn *
            </label>
          </div>
          
          <label class="flex items-start gap-3 text-sm text-zinc-500">
            <input type="checkbox" id="nl-agree" class="mt-1 h-4 w-4 shrink-0 accent-[#C9A961]" />
            <span>Tôi đồng ý nhận thông tin ưu đãi và có thể hủy đăng ký bất cứ lúc nào.</span>
          </label>
          
          <!-- Gradient Shift Newsletter Button -->
          <button type="submit" id="nl-submit"
            class="newsletter-btn inline-flex h-12 w-full items-center justify-center rounded-xl px-4 text-xs font-black uppercase tracking-[0.12em] text-zinc-950">
            ${nl.button_label}
          </button>
          <p id="nl-error" class="hidden text-xs text-red-500"></p>
        </form>
      </div>
    `;

    const form = right.querySelector('#newsletter-form');
    const submitBtn = right.querySelector('#nl-submit');

    // Hiệu ứng Ripple sóng nước khi click nút gửi
    submitBtn.addEventListener('click', (e) => {
      const circle = document.createElement("span");
      const diameter = Math.max(submitBtn.clientWidth, submitBtn.clientHeight);
      const radius = diameter / 2;

      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - submitBtn.getBoundingClientRect().left - radius}px`;
      circle.style.top = `${e.clientY - submitBtn.getBoundingClientRect().top - radius}px`;
      circle.className = "ripple";

      const existingRipple = submitBtn.querySelector('.ripple');
      if (existingRipple) existingRipple.remove();

      submitBtn.appendChild(circle);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = right.querySelector('#nl-email').value.trim();
      const name = right.querySelector('#nl-name').value.trim();
      const agree = right.querySelector('#nl-agree').checked;
      const errEl = right.querySelector('#nl-error');

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errEl.textContent = 'Vui lòng nhập email hợp lệ.';
        errEl.classList.remove('hidden');
        return;
      }
      if (!agree) {
        errEl.textContent = 'Vui lòng đồng ý điều khoản.';
        errEl.classList.remove('hidden');
        return;
      }
      errEl.classList.add('hidden');

      submitBtn.textContent = 'Đang Gửi...';
      submitBtn.disabled = true;

      try {
        await fetch(`${API_BASE}/api/newsletter/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name }),
        });
      } catch {}

      right.querySelector('#nl-form-wrap').innerHTML = `
        <div class="px-2 py-10 text-center">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#C9A961" stroke-width="1.5" class="mx-auto mb-5 animate-bounce">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <h3 class="text-xl font-bold uppercase tracking-[0.05em] text-white">Cảm Ơn Bạn</h3>
          <p class="mt-3 text-sm leading-7 text-zinc-400">
            Bạn đã đăng ký thành công. Kiểm tra email để nhận mã giảm giá <strong class="text-[#C9A961]">10%</strong> đầu tiên.
          </p>
        </div>
      `;
    });

    container.appendChild(left);
    container.appendChild(right);
    section.appendChild(container);

    if (canEditSettings) {
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'absolute right-8 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 border border-zinc-200 text-[#A88840] hover:bg-[#C9A84C] hover:text-white hover:border-[#C9A84C] transition-all shadow-md cursor-pointer';
      editBtn.title = 'Chỉnh sửa Newsletter';
      editBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
      editBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openQuickSettings('sections', 'newsletter');
      });
      section.appendChild(editBtn);
    }

    return section;
  }
}
