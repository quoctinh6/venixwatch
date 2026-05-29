/**
 * Badge.js — Product badge component (NEW / BESTSELLER / SALE)
 */

const BADGE_STYLES = {
  NEW:        { bg: '#1a1a1a', color: '#ffffff', label: 'NEW' },
  BESTSELLER: { bg: '#C9A84C', color: '#ffffff', label: 'BESTSELLER' },
  SALE:       { bg: '#c0392b', color: '#ffffff', label: 'SALE' },
};

/**
 * Create a badge span element
 * @param {'NEW'|'BESTSELLER'|'SALE'} type
 * @returns {HTMLElement}
 */
export function createBadge(type) {
  const config = BADGE_STYLES[type?.toUpperCase()];
  if (!config) return null;

  const span = document.createElement('span');
  span.textContent = config.label;
  Object.assign(span.style, {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.8px',
    backgroundColor: config.bg,
    color: config.color,
    borderRadius: '2px',
    textTransform: 'uppercase',
    fontFamily: 'Montserrat, sans-serif',
  });
  span.dataset.badge = type.toUpperCase();
  return span;
}

/**
 * Get badge HTML string (for use in innerHTML)
 */
export function badgeHTML(type) {
  const config = BADGE_STYLES[type?.toUpperCase()];
  if (!config) return '';
  return `<span style="
    display:inline-block;
    padding:2px 8px;
    font-size:10px;
    font-weight:700;
    letter-spacing:0.8px;
    background-color:${config.bg};
    color:${config.color};
    border-radius:2px;
    text-transform:uppercase;
    font-family:Montserrat,sans-serif;
  ">${config.label}</span>`;
}

export default { createBadge, badgeHTML };
