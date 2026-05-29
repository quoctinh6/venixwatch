let host = null;

function ensureHost() {
  if (host) return host;
  host = document.createElement('div');
  host.className = 'fixed right-4 top-4 z-[220] flex w-[min(92vw,380px)] flex-col gap-3';
  document.body.appendChild(host);
  return host;
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

  const root = ensureHost();
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
