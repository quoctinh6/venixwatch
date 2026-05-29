/**
 * cartService.js — localStorage cart management for Venix Watch
 */
import { STORAGE_KEYS } from './config.js';

const KEY = STORAGE_KEYS.CART;

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function save(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items } }));
}

export const cartService = {
  getCart() {
    return load();
  },

  getCount() {
    return load().reduce((sum, item) => sum + (item.qty || 1), 0);
  },

  getTotal() {
    return load().reduce((sum, item) => {
      const price = item.sale_price && item.sale_price < item.price ? item.sale_price : item.price;
      return sum + price * (item.qty || 1);
    }, 0);
  },

  addItem(product, qty = 1) {
    const items = load();
    const idx = items.findIndex(i => i.id === product.id);
    if (idx > -1) {
      items[idx].qty = (items[idx].qty || 1) + qty;
    } else {
      items.push({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        sale_price: product.sale_price || null,
        image: product.image || product.images?.[0] || '',
        category_name: product.category_name || '',
        qty,
      });
    }
    save(items);
    return items;
  },

  removeItem(productId) {
    const items = load().filter(i => i.id !== productId);
    save(items);
    return items;
  },

  updateQty(productId, qty) {
    const items = load();
    const idx = items.findIndex(i => i.id === productId);
    if (idx === -1) return items;
    if (qty <= 0) {
      items.splice(idx, 1);
    } else {
      items[idx].qty = qty;
    }
    save(items);
    return items;
  },

  clearCart() {
    save([]);
  },
};
