/**
 * CartDrawer.js — Slide-in cart drawer from right
 */
import { cartService } from '../services/cartService.js';
import { formatPrice, navigate } from '../utils/helpers.js';
import { resolveImageUrl } from '../services/config.js';

export class CartDrawer {
  constructor() {
    this._overlay = null;
    this._drawer = null;
    this._isOpen = false;
    this._init();
  }

  _init() {
    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'drawer-overlay';
    overlay.addEventListener('click', () => this.close());
    document.body.appendChild(overlay);
    this._overlay = overlay;

    // Drawer panel
    const drawer = document.createElement('div');
    drawer.id = 'cart-drawer';
    Object.assign(drawer.style, {
      position: 'fixed', top: '0', right: '0', width: '384px', height: '100vh',
      background: '#fff', zIndex: '101', display: 'flex', flexDirection: 'column',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.15)', transform: 'translateX(100%)',
      transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      fontFamily: 'Montserrat, sans-serif', willChange: 'transform',
    });
    document.body.appendChild(drawer);
    this._drawer = drawer;

    // Listen for open-cart event
    window.addEventListener('open-cart', () => this.open());
    window.addEventListener('cart-updated', () => this._renderItems());
  }

  open() {
    this._render();
    this._overlay.classList.add('active');
    setTimeout(() => { this._drawer.style.transform = 'translateX(0)'; }, 10);
    this._isOpen = true;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('cart-drawer-open');
  }

  close() {
    this._drawer.style.transform = 'translateX(100%)';
    this._overlay.classList.remove('active');
    this._isOpen = false;
    document.body.style.overflow = '';
    document.body.classList.remove('cart-drawer-open');
  }

  _render() {
    this._drawer.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #e8e8e8;';
    header.innerHTML = `
      <h2 style="margin:0;font-size:16px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;">GIỎ HÀNG</h2>
      <button id="close-drawer" style="background:none;border:none;cursor:pointer;padding:4px;color:#1a1a1a;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>`;
    header.querySelector('#close-drawer').addEventListener('click', () => this.close());
    this._drawer.appendChild(header);

    // Items container
    const itemsWrap = document.createElement('div');
    itemsWrap.id = 'cart-items-wrap';
    itemsWrap.style.cssText = 'flex:1;overflow-y:auto;padding:16px 24px;';
    itemsWrap.setAttribute('data-lenis-prevent', '');
    this._drawer.appendChild(itemsWrap);

    // Footer
    const footer = document.createElement('div');
    footer.id = 'cart-footer';
    footer.style.cssText = 'border-top:1px solid #e8e8e8;padding:20px 24px;';
    this._drawer.appendChild(footer);

    this._renderItems();
  }

  _renderItems() {
    const wrap = document.getElementById('cart-items-wrap');
    const footer = document.getElementById('cart-footer');
    if (!wrap || !footer) return;

    const items = cartService.getCart();
    const total = cartService.getTotal();

    if (items.length === 0) {
      wrap.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:16px;padding:40px 0;color:#888;">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#e8e8e8" stroke-width="1.5">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <p style="margin:0;font-size:14px;font-weight:500;">Giỏ hàng trống</p>
          <button onclick="window.dispatchEvent(new CustomEvent('close-cart'))"
            style="padding:10px 24px;background:#1a1a1a;color:#fff;border:none;font-size:12px;font-weight:700;letter-spacing:1.2px;cursor:pointer;font-family:Montserrat,sans-serif;">
            TIẾP TỤC MUA SẮM
          </button>
        </div>`;
      footer.innerHTML = '';
      window.addEventListener('close-cart', () => this.close(), { once: true });
      return;
    }

    wrap.innerHTML = items.map(item => this._itemHTML(item)).join('');
    wrap.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => { cartService.removeItem(btn.dataset.remove); this._renderItems(); });
    });
    wrap.querySelectorAll('[data-qty-dec]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.qtyDec;
        const item = cartService.getCart().find(i => String(i.id) === String(id));
        if (item) cartService.updateQty(id, item.qty - 1);
        this._renderItems();
      });
    });
    wrap.querySelectorAll('[data-qty-inc]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.qtyInc;
        const item = cartService.getCart().find(i => String(i.id) === String(id));
        if (item) cartService.updateQty(id, item.qty + 1);
        this._renderItems();
      });
    });

    footer.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:15px;font-weight:700;">
        <span>Tạm tính:</span>
        <span style="color:#C9A84C;">${formatPrice(total)}</span>
      </div>
      <button id="checkout-btn" style="width:100%;padding:14px;background:#1a1a1a;color:#fff;border:none;font-size:13px;font-weight:700;letter-spacing:1.4px;cursor:pointer;font-family:Montserrat,sans-serif;transition:background .2s;"
        onmouseover="this.style.background='#C9A84C'"
        onmouseout="this.style.background='#1a1a1a'">
        THANH TOÁN
      </button>`;
    footer.querySelector('#checkout-btn').addEventListener('click', () => {
      this.close();
      navigate('/thanh-toan');
    });
  }

  _itemHTML(item) {
    const price = item.sale_price && item.sale_price < item.price ? item.sale_price : item.price;
    const img = resolveImageUrl(item.image) || 'https://images.pexels.com/photos/236915/pexels-photo-236915.jpeg?auto=compress&cs=tinysrgb&w=400';
    return `
      <div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #f5f5f5;align-items:flex-start;">
        <div style="width:72px;height:72px;background:#f8f8f8;flex-shrink:0;border-radius:2px;overflow:hidden;">
          <img src="${img}" alt="${item.name}" style="width:100%;height:100%;object-fit:contain;padding:4px;"
            onerror="this.src='https://images.pexels.com/photos/236915/pexels-photo-236915.jpeg?auto=compress&cs=tinysrgb&w=400'"/>
        </div>
        <div style="flex:1;min-width:0;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:600;line-height:1.4;
            overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${item.name}</p>
          <p style="margin:0 0 8px;font-size:12px;color:#888;">${item.category_name || ''}</p>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="display:flex;align-items:center;border:1px solid #e8e8e8;border-radius:2px;">
              <button data-qty-dec="${item.id}" style="width:28px;height:28px;background:none;border:none;cursor:pointer;font-size:16px;color:#1a1a1a;">−</button>
              <span style="padding:0 8px;font-size:13px;font-weight:600;min-width:20px;text-align:center;">${item.qty}</span>
              <button data-qty-inc="${item.id}" style="width:28px;height:28px;background:none;border:none;cursor:pointer;font-size:16px;color:#1a1a1a;">+</button>
            </div>
            <span style="font-size:13px;font-weight:700;color:#C9A84C;">${formatPrice(price * item.qty)}</span>
          </div>
        </div>
        <button data-remove="${item.id}" style="background:none;border:none;cursor:pointer;color:#888;flex-shrink:0;padding:4px;"
          onmouseover="this.style.color='#c0392b'" onmouseout="this.style.color='#888'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>`;
  }
}
