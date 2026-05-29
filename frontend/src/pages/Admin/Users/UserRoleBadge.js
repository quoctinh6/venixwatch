const ROLE_STYLES = {
  super_admin: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  admin: 'bg-gray-900 text-white',
  editor: 'bg-blue-100 text-blue-700',
  viewer: 'bg-gray-100 text-gray-600',
};

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

export function createRoleBadge(role) {
  const span = document.createElement('span');
  const roleName = (typeof role === 'object' && role !== null) ? role.name : role;
  span.className = `inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_STYLES[roleName] || 'bg-gray-100 text-gray-600'}`;
  span.textContent = ROLE_LABELS[roleName] || roleName || '—';
  return span;
}

export function renderRoleBadges(roles) {
  if (!roles || !roles.length) return '—';
  return roles.map(r => {
    const roleName = (typeof r === 'object' && r !== null) ? r.name : r;
    const style = ROLE_STYLES[roleName] || 'bg-gray-100 text-gray-600';
    const label = ROLE_LABELS[roleName] || roleName || '—';
    return `<span class="inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${style} mr-1">${label}</span>`;
  }).join('');
}
