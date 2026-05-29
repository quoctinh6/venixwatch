import { showToast } from '../shared/ui.js';
import { getRoles, getPermissions, updateRolePermissions } from '../../../services/adminService.js';

const ENTITY_LABELS = {
  products: 'Sản phẩm', orders: 'Đơn hàng', users: 'Người dùng',
  categories: 'Danh mục', warranties: 'Bảo hành', flash_sales: 'Flash Sale',
  analytics: 'Analytics', roles: 'Phân quyền', settings: 'Cài đặt',
};

export function openPermissionMatrix(role, onSaved) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
  overlay.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <div>
          <h2 class="text-lg font-bold text-gray-900">Phân quyền: ${role.display_name || role.name}</h2>
          <p class="text-xs text-gray-400 mt-0.5">Chọn các quyền cho vai trò này</p>
        </div>
        <button id="pm-close" class="text-gray-400 hover:text-gray-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="flex-1 overflow-y-auto p-6" id="pm-body" data-lenis-prevent>
        <div class="text-center py-8 text-gray-400">Đang tải...</div>
      </div>
      <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
        <button id="pm-cancel" class="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">Hủy</button>
        <button id="pm-save" class="px-5 py-2 rounded-lg bg-[#C9A84C] text-white hover:bg-[#b8963e] text-sm font-medium">Lưu thay đổi</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('#pm-close').addEventListener('click', close);
  overlay.querySelector('#pm-cancel').addEventListener('click', close);

  let checkedIds = new Set(role.permissions?.map(p => p.id || p) || []);
  loadMatrix(overlay, role, checkedIds);

  overlay.querySelector('#pm-save').addEventListener('click', async () => {
    const btn = overlay.querySelector('#pm-save');
    btn.textContent = 'Đang lưu...'; btn.disabled = true;
    try {
      await updateRolePermissions(role.id, [...checkedIds]);
      showToast('Cập nhật quyền thành công!');
      close();
      if (onSaved) onSaved();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.textContent = 'Lưu thay đổi'; btn.disabled = false;
    }
  });
}

async function loadMatrix(overlay, role, checkedIds) {
  const body = overlay.querySelector('#pm-body');
  try {
    const res = await getPermissions();
    const perms = res.data || res;
    const list = Array.isArray(perms) ? perms : Object.values(perms || {}).flat();
    renderMatrix(body, list, checkedIds);
  } catch {
    body.innerHTML = renderFallbackMatrix(checkedIds);
    attachFallback(body, checkedIds);
  }
}

function renderMatrix(body, permissions, checkedIds) {
  const grouped = {};
  permissions.forEach(p => {
    const entity = p.entity || p.name?.split('_')[0] || 'other';
    if (!grouped[entity]) grouped[entity] = [];
    grouped[entity].push(p);
  });

  body.innerHTML = '';
  Object.entries(grouped).forEach(([entity, perms]) => {
    const section = document.createElement('div');
    section.className = 'mb-4';
    section.innerHTML = `
      <h4 class="text-xs font-bold text-gray-400 uppercase tracking-[0.05em] mb-2">${ENTITY_LABELS[entity] || entity}</h4>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        ${perms.map(p => `
          <label class="flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer hover:bg-gray-50 ${checkedIds.has(p.id) ? 'border-[#C9A84C] bg-yellow-50' : 'border-gray-200'}">
            <input type="checkbox" class="perm-check w-4 h-4 accent-[#C9A84C]" data-id="${p.id}" ${checkedIds.has(p.id) ? 'checked' : ''}>
            <span class="text-xs text-gray-700 font-medium">${p.display_name || p.name}</span>
          </label>
        `).join('')}
      </div>
    `;
    body.appendChild(section);
  });

  body.querySelectorAll('.perm-check').forEach(cb => {
    cb.addEventListener('change', () => {
      const id = Number(cb.dataset.id);
      if (cb.checked) { checkedIds.add(id); cb.closest('label').className = cb.closest('label').className.replace('border-gray-200', 'border-[#C9A84C] bg-yellow-50'); }
      else { checkedIds.delete(id); cb.closest('label').className = cb.closest('label').className.replace('border-[#C9A84C] bg-yellow-50', 'border-gray-200'); }
    });
  });
}

const DEFAULT_PERMS = ['products.view', 'products.create', 'products.edit', 'products.delete', 'orders.view', 'orders.update', 'users.view', 'users.create', 'users.edit', 'users.delete', 'categories.view', 'categories.manage', 'analytics.view', 'warranties.view', 'warranties.manage'];

function renderFallbackMatrix(checkedIds) {
  const grouped = {};
  DEFAULT_PERMS.forEach(p => {
    const [entity, action] = p.split('.');
    if (!grouped[entity]) grouped[entity] = [];
    grouped[entity].push({ id: p, name: p, display_name: action });
  });
  return Object.entries(grouped).map(([entity, perms]) => `
    <div class="mb-4">
      <h4 class="text-xs font-bold text-gray-400 uppercase tracking-[0.05em] mb-2">${ENTITY_LABELS[entity] || entity}</h4>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        ${perms.map(p => `
          <label class="flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer hover:bg-gray-50 border-gray-200">
            <input type="checkbox" class="perm-check w-4 h-4 accent-[#C9A84C]" data-id="${p.id}">
            <span class="text-xs text-gray-700 font-medium">${p.display_name}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function attachFallback(body, checkedIds) {
  body.querySelectorAll('.perm-check').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) checkedIds.add(cb.dataset.id);
      else checkedIds.delete(cb.dataset.id);
    });
  });
}
