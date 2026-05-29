export function renderBreadcrumb(container, title) {
  const nav = document.createElement('nav');
  nav.className = 'flex items-center gap-2 text-sm';
  nav.innerHTML = `
    <a href="#dashboard" class="text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
      Home
    </a>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-300">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
    <span class="text-gray-700 font-medium">${title}</span>
  `;
  container.innerHTML = '';
  container.appendChild(nav);
}
