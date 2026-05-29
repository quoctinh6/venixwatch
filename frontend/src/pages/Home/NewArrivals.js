/**
 * NewArrivals.js — New arrivals product section
 */
import { BestSellers } from './BestSellers.js';

export class NewArrivals {
  constructor(products = []) {
    this._products = products.slice(0, 8);
  }

  render() {
    const section = new BestSellers(this._products, {
      title: 'Hàng Mới Về',
      showAllHref: '/nam?sort=new',
    }).render();

    return section;
  }
}
