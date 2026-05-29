let host = null;

function ensureHost() {
  if (host) return host;
  host = document.createElement('div');
  host.className = 'fixed right-4 top-4 z-[160] flex w-[min(92vw,360px)] flex-col gap-3';
  document.body.appendChild(host);
  return host;
}

export function showToast(type, message) {
  const root = ensureHost();
  const toast = document.createElement('div');
  const palette = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    error: 'border-rose-200 bg-rose-50 text-rose-900',
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
  };

  toast.className = `rounded-[12px] border px-4 py-3 text-sm shadow-lg transition-all duration-300 ${palette[type] || palette.info} opacity-0 translate-y-[-8px]`;
  toast.textContent = message;
  root.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-y-[-8px]');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-[-8px]');
    setTimeout(() => toast.remove(), 280);
  }, 3200);
}
