import { STORAGE_KEYS } from '../../../services/config.js';

export function createModal(content, onClose) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
  overlay.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative" data-lenis-prevent>
      <button id="modal-close" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <div id="modal-body"></div>
    </div>
  `;

  overlay.querySelector('#modal-body').appendChild(
    typeof content === 'string'
      ? Object.assign(document.createElement('div'), { innerHTML: content })
      : content
  );

  const close = () => {
    overlay.remove();
    if (onClose) onClose();
  };

  overlay.querySelector('#modal-close').addEventListener('click', close);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });

  document.body.appendChild(overlay);
  return overlay;
}

export function createConfirmDialog(message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
  overlay.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-2">Xac nhan</h3>
      <p class="text-gray-600 mb-6">${message}</p>
      <div class="flex gap-3 justify-end">
        <button id="confirm-cancel" class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm">Huy</button>
        <button id="confirm-ok" class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium text-sm">Xoa</button>
      </div>
    </div>
  `;

  overlay.querySelector('#confirm-cancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#confirm-ok').addEventListener('click', () => {
    overlay.remove();
    if (onConfirm) onConfirm();
  });

  document.body.appendChild(overlay);
  return overlay;
}

export function showToast(message, type = 'success') {
  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-500',
    info: 'bg-blue-600',
  };

  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-[9999] px-5 py-3 rounded-lg text-white text-sm font-medium shadow-lg transition-all duration-300 ${colors[type] || colors.success}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function createPagination(current, total, onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'flex items-center gap-1 justify-end mt-4';

  const triggerChange = (page) => {
    onChange(page);
    const adminContent = document.getElementById('admin-content');
    if (adminContent) {
      adminContent.scrollTop = 0; // Scroll admin content container to top
    } else if (window.lenis) {
      window.lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  };

  const button = (label, page, disabled = false) => {
    const el = document.createElement('button');
    el.className = `px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
      page === current
        ? 'bg-[#C9A84C] text-white border-[#C9A84C]'
        : disabled
          ? 'text-gray-300 border-gray-200 cursor-not-allowed'
          : 'text-gray-600 border-gray-300 hover:bg-gray-50'
    }`;
    el.textContent = label;
    el.disabled = disabled;
    if (!disabled) {
      el.addEventListener('click', () => triggerChange(page));
    }
    return el;
  };

  // Prepend Prev Button
  wrap.appendChild(button('<<', current - 1, current <= 1));

  // Determine candidate page numbers to keep (at most 5 numbers)
  const pages = new Set();
  pages.add(1);
  if (total >= 2) pages.add(2);
  pages.add(current);
  if (total - 1 >= 1) pages.add(total - 1);
  if (total >= 1) pages.add(total);

  // Filter and sort page numbers
  const validPages = Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  // Build items array with ellipses
  const items = [];
  let prev = 0;
  for (const page of validPages) {
    if (prev > 0) {
      if (page - prev > 1) {
        items.push('...');
      }
    }
    items.push(page);
    prev = page;
  }

  // Render numbers and ellipses
  items.forEach((item) => {
    if (item === '...') {
      const span = document.createElement('span');
      span.className = 'px-3 py-1.5 text-sm font-medium text-gray-400';
      span.textContent = '...';
      wrap.appendChild(span);
    } else {
      wrap.appendChild(button(String(item), item));
    }
  });

  // Append Next Button
  wrap.appendChild(button('>>', current + 1, current >= total));

  return wrap;
}

export function formatPrice(num) {
  if (!num && num !== 0) return '-';
  return `${Number(num).toLocaleString('vi-VN')}đ`;
}

export function formatDate(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function formatDuration(seconds) {
  const value = Number(seconds || 0);
  if (!value) return '0s';
  const mins = Math.floor(value / 60);
  const secs = value % 60;
  if (!mins) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export function authHeaders() {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || localStorage.getItem('dhat_token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}
