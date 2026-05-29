/**
 * config.js — Shared API configuration for Venix Watch
 */

function resolveProjectPrefix() {
  const { hostname, pathname } = window.location;

  if (hostname.endsWith('.test')) {
    return '';
  }

  if (pathname.startsWith('/dong-ho-a-tuan/')) {
    return '/dong-ho-a-tuan';
  }

  return '';
}

export const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'https://venixwatchvn464.mbws.vn/backend/public'
  : `${window.location.origin}${resolveProjectPrefix()}/backend/public`;

export function resolveImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  
  let cleanPath = path.replace(/^\//, ''); // remove leading slash
  const apiBaseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  const apiBaseRoot = apiBaseUrl.replace(/\/backend\/public$/, '');
  
  if (cleanPath.startsWith('backend/public/') || cleanPath.includes('/backend/public/')) {
    const index = cleanPath.indexOf('backend/public/');
    cleanPath = cleanPath.substring(index);
    return `${apiBaseRoot}/${cleanPath}`;
  }
  
  return `${apiBaseUrl}/${cleanPath}`;
}

export const STORAGE_KEYS = {
  CART: 'dhat_cart',
  RECENTLY_VIEWED: 'dhat_recently_viewed',
  COMPARE: 'dhat_compare',
  SESSION_ID: 'dhat_session_id',
  AUTH_TOKEN: 'dhat_auth_token',
  AUTH_USER: 'dhat_auth_user',
  SOUND: 'dhat_sound',
};

export const PEXELS = {
  HERO_1: 'https://ueeshop.ly200-cdn.com/u_file/UPAU/UPAU268/2207/22/products/silverwhiteblue02-ca8e.jpg?x-oss-process=image/quality,q_80/resize,m_lfit,h_500,w_500',
  HERO_2: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  HERO_3: 'https://images.pexels.com/photos/2783873/pexels-photo-2783873.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  CATEGORY_NAM: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=800',
  CATEGORY_NU: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=800',
  CATEGORY_PHU_KIEN: 'https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=800',
  BRAND_STORY: 'https://images.pexels.com/photos/125779/pexels-photo-125779.jpeg?auto=compress&cs=tinysrgb&w=800',
  PRODUCT_1: 'https://images.pexels.com/photos/236915/pexels-photo-236915.jpeg?auto=compress&cs=tinysrgb&w=400',
  PRODUCT_2: 'https://images.pexels.com/photos/2783873/pexels-photo-2783873.jpeg?auto=compress&cs=tinysrgb&w=400',
  PRODUCT_3: 'https://images.pexels.com/photos/364822/pexels-photo-364822.jpeg?auto=compress&cs=tinysrgb&w=400',
};
