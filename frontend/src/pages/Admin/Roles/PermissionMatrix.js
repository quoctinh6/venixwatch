import { showToast } from '../shared/ui.js';
import { getRoles, getPermissions, updateRolePermissions } from '../../../services/adminService.js';

const ENTITY_LABELS = {
  products: 'Sản phẩm',
  orders: 'Đơn hàng',
  users: 'Người dùng',
  categories: 'Danh mục',
  warranties: 'Bảo hành',
  flash_sales: 'Flash Sale',
  analytics: 'Analytics',
  roles: 'Phân quyền',
  settings: 'Cài đặt',
  'System Settings': 'Cài đặt hệ thống',
};

const ACTION_LABELS = {
  read: 'Xem',
  write: 'Thêm/Sửa',
  delete: 'Xóa',
  manage: 'Quản lý',
  quick_edit: 'Sửa nhanh',
};

function getPermissionLabel(name) {
  const parts = name.split(':');
  if (parts.length === 2) {
    const [entity, action] = parts;
    const actionLabel = ACTION_LABELS[action] || action;
    return `${actionLabel} (${name})`;
  }
  return name;
}

export function openPermissionMatrix(role, onSaved) {
  const isSuperAdmin = role.name === 'super_admin';
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
  overlay.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <div>
          <h2 class="text-lg font-bold text-gray-900">Phân quyền: ${role.display_name || role.name}</h2>
          <p class="text-xs text-gray-400 mt-0.5">${isSuperAdmin ? 'Vai trò quản trị tối cao (luôn có tất cả quyền)' : 'Chọn các quyền cho vai trò này'}</p>
        </div>
        <button id="pm-close" class="text-gray-400 hover:text-gray-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      
      <!-- Copy Widget Container -->
      <div id="copy-widget-container" class="px-6 py-3 bg-gray-50 border-b border-gray-200 hidden flex items-center gap-3"></div>

      <div class="flex-1 overflow-y-auto p-6" id="pm-body" data-lenis-prevent>
        <div class="text-center py-8 text-gray-400">Đang tải...</div>
      </div>
      <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
        <button id="pm-cancel" class="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">Hủy</button>
        ${isSuperAdmin ? '' : '<button id="pm-save" class="px-5 py-2 rounded-lg bg-[#C9A84C] text-white hover:bg-[#b8963e] text-sm font-medium">Lưu thay đổi</button>'}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('#pm-close').addEventListener('click', close);
  overlay.querySelector('#pm-cancel').addEventListener('click', close);

  let checkedIds = new Set(role.permissions?.map(p => Number(p.id || p)) || []);
  loadMatrix(overlay, role, checkedIds);

  const saveBtn = overlay.querySelector('#pm-save');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      saveBtn.textContent = 'Đang lưu...'; saveBtn.disabled = true;
      try {
        await updateRolePermissions(role.id, [...checkedIds]);
        showToast('Cập nhật quyền thành công!');
        close();
        if (onSaved) onSaved();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        saveBtn.textContent = 'Lưu thay đổi'; saveBtn.disabled = false;
      }
    });
  }
}

async function loadMatrix(overlay, role, checkedIds) {
  const isSuperAdmin = role.name === 'super_admin';
  const body = overlay.querySelector('#pm-body');
  try {
    const [resPerms, resRoles] = await Promise.all([getPermissions(), getRoles()]);
    const perms = resPerms.data || resPerms;
    const list = Array.isArray(perms) ? perms : Object.values(perms || {}).flat();
    const rolesList = resRoles.data || resRoles || [];

    renderMatrix(body, list, checkedIds, isSuperAdmin);
    if (!isSuperAdmin) {
      renderCopyWidget(overlay, rolesList, role, list, checkedIds, body);
    }
  } catch (err) {
    console.error('Error loading matrix:', err);
    body.innerHTML = renderFallbackMatrix(checkedIds, isSuperAdmin);
    attachFallback(body, checkedIds, isSuperAdmin);
  }
}

function renderCopyWidget(overlay, rolesList, currentRole, allPermissions, checkedIds, body) {
  const container = overlay.querySelector('#copy-widget-container');
  if (!container) return;

  const selectableRoles = rolesList.filter(r => r.id !== currentRole.id);
  if (selectableRoles.length === 0) return;

  container.classList.remove('hidden');
  container.innerHTML = `
    <span class="text-xs font-semibold text-gray-600">Sao chép quyền từ vai trò khác:</span>
    <select id="copy-role-select" class="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:border-[#C9A84C]">
      <option value="">-- Chọn vai trò --</option>
      ${selectableRoles.map(r => `<option value="${r.id}">${r.display_name || r.name}</option>`).join('')}
    </select>
    <button id="copy-role-btn" class="px-3 py-1.5 bg-[#C9A84C] hover:bg-[#b8963e] text-white font-semibold rounded-lg text-xs transition-colors">
      Sao chép
    </button>
  `;

  const select = container.querySelector('#copy-role-select');
  const btn = container.querySelector('#copy-role-btn');

  btn.addEventListener('click', () => {
    const roleId = Number(select.value);
    if (!roleId) {
      showToast('Vui lòng chọn một vai trò để sao chép quyền.', 'warning');
      return;
    }

    const sourceRole = rolesList.find(r => r.id === roleId);
    if (!sourceRole) return;

    const sourcePermIds = sourceRole.permissions?.map(p => Number(p.id || p)) || [];

    checkedIds.clear();
    sourcePermIds.forEach(id => checkedIds.add(id));

    renderMatrix(body, allPermissions, checkedIds, false);
    showToast(`Đã sao chép các quyền từ vai trò "${sourceRole.display_name || sourceRole.name}"!`, 'success');
  });
}

function renderMatrix(body, permissions, checkedIds, isSuperAdmin) {
  const grouped = {};
  permissions.forEach(p => {
    const entity = p.group_name || p.entity || p.name?.split(':')[0] || p.name?.split('_')[0] || p.name?.split('.')[0] || 'other';
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
        ${perms.map(p => {
          const isChecked = isSuperAdmin || checkedIds.has(Number(p.id));
          return `
            <label class="flex items-center gap-2 p-2.5 border rounded-lg ${isSuperAdmin ? 'cursor-not-allowed bg-gray-50/50' : 'cursor-pointer'} hover:bg-gray-50 ${isChecked ? 'border-[#C9A84C] bg-yellow-50' : 'border-gray-200'}">
              <input type="checkbox" class="perm-check w-4 h-4 accent-[#C9A84C]" data-id="${p.id}" ${isChecked ? 'checked' : ''} ${isSuperAdmin ? 'disabled' : ''}>
              <span class="text-xs text-gray-700 font-medium">${p.display_name || getPermissionLabel(p.name)}</span>
            </label>
          `;
        }).join('')}
      </div>
    `;
    body.appendChild(section);
  });

  if (isSuperAdmin) return;

  body.querySelectorAll('.perm-check').forEach(cb => {
    cb.addEventListener('change', () => {
      const id = Number(cb.dataset.id);
      if (cb.checked) {
        checkedIds.add(id);
        cb.closest('label').className = cb.closest('label').className.replace('border-gray-200', 'border-[#C9A84C] bg-yellow-50');

        // Auto-check read permission of the same group if write/delete is selected
        const currentPerm = permissions.find(p => Number(p.id) === id);
        if (currentPerm && !currentPerm.name.endsWith(':read')) {
          const readPerm = permissions.find(p => p.group_name === currentPerm.group_name && p.name.endsWith(':read'));
          if (readPerm && !checkedIds.has(Number(readPerm.id))) {
            const readId = Number(readPerm.id);
            checkedIds.add(readId);
            const readCb = body.querySelector(`.perm-check[data-id="${readId}"]`);
            if (readCb) {
              readCb.checked = true;
              readCb.closest('label').className = readCb.closest('label').className.replace('border-gray-200', 'border-[#C9A84C] bg-yellow-50');
            }
          }
        }
      } else {
        checkedIds.delete(id);
        cb.closest('label').className = cb.closest('label').className.replace('border-[#C9A84C] bg-yellow-50', 'border-gray-200');
      }
    });
  });
}

const DEFAULT_PERMS = ['products.view', 'products.create', 'products.edit', 'products.delete', 'orders.view', 'orders.update', 'users.view', 'users.create', 'users.edit', 'users.delete', 'categories.view', 'categories.manage', 'analytics.view', 'warranties.view', 'warranties.manage'];

function renderFallbackMatrix(checkedIds, isSuperAdmin) {
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
        ${perms.map(p => {
          const isChecked = isSuperAdmin || checkedIds.has(p.id);
          return `
            <label class="flex items-center gap-2 p-2.5 border rounded-lg ${isSuperAdmin ? 'cursor-not-allowed bg-gray-50/50' : 'cursor-pointer'} hover:bg-gray-50 ${isChecked ? 'border-[#C9A84C] bg-yellow-50' : 'border-gray-200'}">
              <input type="checkbox" class="perm-check w-4 h-4 accent-[#C9A84C]" data-id="${p.id}" ${isChecked ? 'checked' : ''} ${isSuperAdmin ? 'disabled' : ''}>
              <span class="text-xs text-gray-700 font-medium">${p.display_name}</span>
            </label>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');
}

function attachFallback(body, checkedIds, isSuperAdmin) {
  if (isSuperAdmin) return;
  body.querySelectorAll('.perm-check').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) checkedIds.add(cb.dataset.id);
      else checkedIds.delete(cb.dataset.id);
    });
  });
}
