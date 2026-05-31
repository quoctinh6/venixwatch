/**
 * Home/index.js — Homepage orchestrator
 */
import { AnnouncementBar } from './AnnouncementBar.js';
import { Hero } from './Hero.js';
import { PromoBanner } from './PromoBanner.js';
import { BestSellers } from './BestSellers.js';
import { CategoryBanners } from './CategoryBanners.js';
import { NewArrivals } from './NewArrivals.js';
import { BrandStory } from './BrandStory.js';
import { TrustBadges } from './TrustBadges.js';
import { Newsletter } from './Newsletter.js';
import { getProducts, getMockProducts } from '../../services/productService.js';

export default class HomePage {
  constructor() {
    this.components = [];
  }

  async render() {
    const wrap = document.createElement('div');
    wrap.id = 'home-page';

    // Mount sections in order
    const announcementBar = new AnnouncementBar();
    wrap.appendChild(announcementBar.render());
    this.components.push(announcementBar);

    const hero = new Hero();
    wrap.appendChild(hero.render());
    this.components.push(hero);

    const promoBanner = new PromoBanner();
    wrap.appendChild(promoBanner.render());
    this.components.push(promoBanner);

    const trustBadges = new TrustBadges();
    wrap.appendChild(trustBadges.render());
    this.components.push(trustBadges);

    // Placeholder grids while products load
    const bestSellersPlaceholder = this._createPlaceholder('BestSellers');
    wrap.appendChild(bestSellersPlaceholder);

    const categoryBanners = new CategoryBanners();
    wrap.appendChild(categoryBanners.render());
    this.components.push(categoryBanners);

    const newArrivalsPlaceholder = this._createPlaceholder('NewArrivals');
    wrap.appendChild(newArrivalsPlaceholder);

    const brandStory = new BrandStory();
    wrap.appendChild(brandStory.render());
    this.components.push(brandStory);

    const newsletter = new Newsletter();
    wrap.appendChild(newsletter.render());
    this.components.push(newsletter);

    // Fetch products asynchronously and replace placeholders
    this._loadProducts(wrap, bestSellersPlaceholder, newArrivalsPlaceholder);

    return wrap;
  }

  destroy() {
    this.aborted = true;
    this.components.forEach((comp) => {
      if (comp && typeof comp.destroy === 'function') {
        try { comp.destroy(); } catch (e) { }
      }
    });
  }

  _createPlaceholder(id) {
    const el = document.createElement('div');
    el.id = `placeholder-${id}`;
    el.style.cssText = 'padding:64px 0;';
    el.innerHTML = `
      <div style="max-width:1280px;margin:0 auto;padding:0 40px;">
        <div style="height:32px;background:#f0f0f0;width:200px;margin-bottom:36px;border-radius:2px;animation:shimmer 1.5s infinite linear;background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);background-size:400% 100%;"></div>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:20px;">
          ${Array(5).fill(0).map(() => `
            <div>
              <div style="aspect-ratio:1;background:#f0f0f0;margin-bottom:12px;border-radius:2px;animation:shimmer 1.5s infinite linear;background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);background-size:400% 100%;"></div>
              <div style="height:14px;background:#f0f0f0;margin-bottom:8px;border-radius:2px;width:80%;"></div>
              <div style="height:14px;background:#f0f0f0;border-radius:2px;width:60%;"></div>
            </div>`).join('')}
        </div>
      </div>
      <style>@keyframes shimmer{0%{background-position:-400% 0}100%{background-position:400% 0}}</style>`;
    return el;
  }

  async _loadProducts(wrap, bsPlaceholder, naPlaceholder) {
    let bsProducts = [];
    let naProducts = [];

    try {
      const [bsRes, naRes] = await Promise.all([
        getProducts({ sort: 'bestseller', limit: 10 }),
        getProducts({ sort: 'new', limit: 10 }),
      ]);
      if (this.aborted) return;
      bsProducts = bsRes.data || bsRes || [];
      naProducts = naRes.data || naRes || [];
    } catch (err) {
      if (this.aborted) return;
      console.warn('Failed to load real products, using mock:', err);
      bsProducts = getMockProducts(10);
      naProducts = getMockProducts(10);
    }

    // Replace BestSellers placeholder
    const bsSection = new BestSellers(bsProducts, {
      title: 'Best Sellers',
      showAllHref: '/nam?sort=bestseller',
    }).render();
    bsPlaceholder.replaceWith(bsSection);

    // Replace NewArrivals placeholder
    const naSection = new NewArrivals(naProducts).render();
    naPlaceholder.replaceWith(naSection);

    // Dispatch page-rendered event so the dynamically loaded products are observed and displayed!
    window.dispatchEvent(new CustomEvent('page-rendered'));
  }
}
