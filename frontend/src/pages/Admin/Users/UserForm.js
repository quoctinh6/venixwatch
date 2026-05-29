import { showToast } from '../shared/ui.js';
import { createUser, updateUser } from '../../../services/adminService.js';

const ALL_ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
];

export function openUserForm(user, onSaved) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
  const userRoles = (user?.roles || []).map(r => typeof r === 'object' && r !== null ? r.name : r);

  overlay.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" data-lenis-prevent>
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-bold text-gray-900">${user ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}</h2>
        <button id="uf-close" class="text-gray-400 hover:text-gray-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <form id="user-form" class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên *</label>
          <input name="name" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]" value="${user?.name || ''}"/>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
          <input name="email" type="email" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]" value="${user?.email || ''}"/>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
          <input name="phone" type="tel" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]" value="${user?.phone || ''}"/>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">${user ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu *'}</label>
          <input name="password" type="password" ${user ? '' : 'required'} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]" placeholder="••••••••"/>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Vai trò</label>
          <div class="grid grid-cols-2 gap-2">
            ${ALL_ROLES.map(r => `
              <label class="flex items-center gap-2 p-2.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" name="roles" value="${r.value}" class="w-4 h-4 accent-[#C9A84C]" ${userRoles.includes(r.value) ? 'checked' : ''}>
                <span class="text-sm text-gray-700">${r.label}</span>
              </label>
            `).join('')}
          </div>
        </div>
        <div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="is_active" class="w-4 h-4 accent-[#C9A84C]" ${user?.is_active !== false ? 'checked' : ''}>
            <span class="text-sm text-gray-700">Tài khoản hoạt động</span>
          </label>
        </div>
        <div class="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" id="uf-cancel" class="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">Hủy</button>
          <button type="submit" id="uf-submit" class="px-5 py-2 rounded-lg bg-[#C9A84C] text-white hover:bg-[#b8963e] text-sm font-medium">Lưu</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  if (window.lenis) window.lenis.stop();

  const close = () => {
    overlay.remove();
    document.body.style.overflow = '';
    if (window.lenis) window.lenis.start();
  };
  overlay.querySelector('#uf-close').addEventListener('click', close);
  overlay.querySelector('#uf-cancel').addEventListener('click', close);

  overlay.querySelector('#user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = overlay.querySelector('#uf-submit');
    btn.textContent = 'Đang lưu...'; btn.disabled = true;
    try {
      const fd = new FormData(e.target);
      const body = {
        name: fd.get('name'),
        email: fd.get('email'),
        phone: fd.get('phone'),
        is_active: fd.has('is_active'),
        roles: fd.getAll('roles'),
      };
      const pw = fd.get('password');
      if (pw) body.password = pw;
      if (user) await updateUser(user.id, body);
      else await createUser(body);
      showToast(user ? 'Cập nhật thành công!' : 'Thêm người dùng thành công!');
      close();
      if (onSaved) onSaved();
    } catch (err) {
      showToast(err.message || 'Có lỗi xảy ra', 'error');
    } finally {
      btn.textContent = 'Lưu'; btn.disabled = false;
    }
  });
}
