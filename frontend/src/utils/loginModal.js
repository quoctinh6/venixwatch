import { navigate } from './helpers.js';

export const POST_LOGIN_KEY = 'dhat_post_login_redirect';

export function showLoginModal(message) {
  const existing = document.querySelector('[data-login-modal]');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.setAttribute('data-login-modal', 'true');
  modal.className = 'fixed inset-0 z-[150] flex items-center justify-center bg-black/55 p-4';
  modal.innerHTML = `
    <div class="w-full max-w-md rounded-[18px] bg-white p-6 shadow-2xl">
      <h3 class="text-xl font-bold text-[#0A0A0A]">Yêu cầu đăng nhập</h3>
      <p class="mt-3 text-sm leading-6 text-[#4B5563]">${message}</p>
      <div class="mt-6 flex flex-col gap-3 sm:flex-row">
        <button type="button" data-login-go class="inline-flex h-11 flex-1 items-center justify-center rounded-[10px] bg-[#0A0A0A] px-4 text-sm font-bold uppercase tracking-[0.08em] text-white">Đăng nhập</button>
        <button type="button" data-register-go class="inline-flex h-11 flex-1 items-center justify-center rounded-[10px] border border-[#0A0A0A] px-4 text-sm font-bold uppercase tracking-[0.08em] text-[#0A0A0A]">Đăng ký</button>
      </div>
      <button type="button" data-close-modal class="mt-3 w-full text-sm font-medium text-[#6B7280]">Đóng</button>
    </div>
  `;

  const go = (tab) => {
    localStorage.setItem(POST_LOGIN_KEY, `${window.location.pathname}${window.location.search}`);
    modal.remove();
    navigate(`/tai-khoan?tab=${tab}`);
  };

  modal.addEventListener('click', (event) => {
    if (event.target === modal || event.target.closest('[data-close-modal]')) modal.remove();
    if (event.target.closest('[data-login-go]')) go('login');
    if (event.target.closest('[data-register-go]')) go('register');
  });

  document.body.appendChild(modal);
}
