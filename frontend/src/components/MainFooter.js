import { navigate } from '../utils/helpers.js';
import { authService } from '../services/authService.js';
import { openQuickSettings } from './QuickSettingsModal.js?v=1.0.5';

const FOOTER_LINKS = {
  SHOP: [
    { label: 'Đồng Hồ Nam', href: '/nam' },
    { label: 'Đồng Hồ Nữ', href: '/nu' },
    { label: 'Phụ Kiện', href: '/phu-kien' },
    { label: 'Sale', href: '/sale' },
    { label: 'Hàng Mới Về', href: '/nam?sort=new' },
    { label: 'Best Sellers', href: '/nam?sort=bestseller' },
  ],
  SERVICE: [
    { label: 'Chính Sách Vận Chuyển', href: '/van-chuyen' },
    { label: 'Đổi Trả & Hoàn Tiền', href: '/doi-tra' },
    { label: 'Bảo Hành', href: '/bao-hanh' },
    { label: 'Hỏi Đáp (FAQ)', href: '/faq' },
    { label: 'Liên Hệ', href: '/lien-he' },
  ],
  ABOUT: [
    { label: 'Về Chúng Tôi', href: '/gioi-thieu' },
    { label: 'Blog & Tin Tức', href: '/blog' },
    { label: 'Tuyển Dụng', href: '/tuyen-dung' },
    { label: 'Chính Sách Bảo Mật', href: '/bao-mat' },
    { label: 'Điều Khoản Dịch Vụ', href: '/dieu-khoan' },
  ],
};

const SOCIAL = [
  {
    name: 'Facebook', href: 'https://www.facebook.com/people/Venix-Watch/61590595195580/',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>`,
  },
  {
    name: 'Instagram', href: 'https://instagram.com/donghoatuan',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>`,
  },
  {
    name: 'TikTok', href: 'https://tiktok.com/@donghoatuan',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.79 1.53V6.75a4.85 4.85 0 0 1-1.02-.06z"/>
    </svg>`,
  },
];

export class MainFooter {
  render() {
    const footer = document.createElement('footer');
    footer.className = 'relative';
    footer.innerHTML = this._html();

    const user = authService.getUser();
    const hasAdminRole = user && user.roles && user.roles.some(r => {
      const name = (typeof r === 'object' && r !== null) ? r.name : r;
      return name === 'super_admin' || name === 'admin' || name === 'editor';
    });
    const canEditSettings = user && (
      (user.permissions && user.permissions.includes('settings:write')) || hasAdminRole
    );

    if (canEditSettings) {
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'absolute right-8 top-8 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 border border-zinc-200 text-[#A88840] hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all shadow-md cursor-pointer';
      editBtn.title = 'Chỉnh sửa Chân Trang';
      editBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
      editBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openQuickSettings('footer');
      });
      footer.appendChild(editBtn);
    }

    return footer;
  }

  _colTitle(text) {
    return `<h4 class="footer-title">${text}</h4>`;
  }

  _links(arr) {
    return arr.map(l => `
      <a href="${l.href}" data-nav class="footer-link">${l.label}</a>`).join('');
  }

  _html() {
    const brandName = window.APP_SETTINGS?.brand_name || 'Venix Watch';
    const footer = window.APP_SETTINGS?.footer_settings || {
      hotline: '0929 000 063',
      email: 'venixwatch@gmail.com',
      address: 'B37-44 Khu B Geleximco Lê Trọng Tấn, Xã An Khánh, TP Hà Nội',
      social_facebook: 'https://www.facebook.com/people/Venix-Watch/61590595195580/',
      social_instagram: 'https://www.instagram.com/venixwatch/',
      social_tiktok: 'https://www.tiktok.com/@venix.watch',
      social_youtube: 'https://www.youtube.com/@Venixwatch'
    };

    const shopLinks = footer.shop_links || FOOTER_LINKS.SHOP;
    const serviceLinks = footer.service_links || FOOTER_LINKS.SERVICE;
    const aboutLinks = footer.about_links || FOOTER_LINKS.ABOUT;

    const socialIconsHtml = [
      { name: 'Facebook', href: footer.social_facebook, icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>` },
      { name: 'Instagram', href: footer.social_instagram, icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>` },
      { name: 'TikTok', href: footer.social_tiktok, icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.79 1.53V6.75a4.85 4.85 0 0 1-1.02-.06z"/></svg>` },
      { name: 'YouTube', href: footer.social_youtube, icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.516 3.5 12 3.5 12 3.5s-7.517 0-9.388.555A3.002 3.002 0 0 0 .5 6.163C0 8.037 0 12 0 12s0 3.963.502 5.837a3.003 3.003 0 0 0 2.11 2.108C4.483 20.5 12 20.5 12 20.5s7.517 0 9.388-.555a3.003 3.003 0 0 0 2.11-2.108C24 15.963 24 12 24 12s0-3.963-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>` }
    ]
      .filter(s => s.href)
      .map(s => `
        <a href="${s.href}" target="_blank" rel="noopener" title="${s.name}" class="social-icon">
          ${s.icon}
        </a>
      `).join('');

    return `
      <div class="footer-wrap">
        <!-- Logo + tagline -->
        <div class="footer-logo-section">
          <div class="footer-logo">${brandName}</div>
          <p class="footer-tagline">ĐỈNH CAO TINH XẢO — PHONG CÁCH VĨNH CỬU</p>
        </div>
 
        <!-- 4 columns grid -->
        <div class="footer-grid">
          <!-- SHOP -->
          <div class="footer-col">
            ${this._colTitle('Shop')}
            ${this._links(shopLinks)}
          </div>
          <!-- SERVICE -->
          <div class="footer-col">
            ${this._colTitle('Dịch Vụ KH')}
            ${this._links(serviceLinks)}
          </div>
          <!-- ABOUT -->
          <div class="footer-col">
            ${this._colTitle('Về Chúng Tôi')}
            ${this._links(aboutLinks)}
          </div>
          <!-- SOCIAL + CONTACT -->
          <div class="footer-col">
            ${this._colTitle('Theo Dõi')}
            <div class="social-icons">
              ${socialIconsHtml}
            </div>
            <div class="contact-info">
              <p><span>Hotline:</span> ${footer.hotline || ''}</p>
              <p><span>Email:</span> ${footer.email || ''}</p>
              <p><span>Địa chỉ:</span> ${footer.address || ''}</p>
            </div>
          </div>
        </div>

        <!-- Trust badges row -->
        <div class="footer-badges">
          ${[
        { icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`, text: 'Miễn phí ship 500K+' },
        { icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`, text: 'Đổi trả 30 ngày' },
        { icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`, text: 'Bảo hành 2 năm' },
        { icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`, text: 'Chính hãng 100%' },
      ].map(b => `
            <div class="footer-badge-item">
              ${b.icon}
              <span>${b.text}</span>
            </div>`).join('')}
        </div>

        <!-- Bottom bar -->
        <div class="footer-bottom">
          <p class="footer-copyright">© 2026 ${brandName}. All rights reserved.</p>
        </div>
      </div>

      <style>
        footer {
          background: #121212 !important;
          color: #f5f5f7 !important;
          font-family: 'Outfit', 'Montserrat', sans-serif !important;
          border-top: 1px solid #1c1c1e !important;
        }
        
        .footer-wrap {
          max-width: 1280px;
          margin: 0 auto;
          padding: 80px 40px 40px;
        }
        
        .footer-logo-section {
          text-align: center;
          margin-bottom: 56px;
          padding-bottom: 44px;
          border-bottom: 1px solid #242426;
        }
        
        .footer-logo {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: 8px;
          margin-bottom: 12px;
          color: #fff;
          text-shadow: 0 0 20px rgba(255,255,255,0.05);
        }
        
        .footer-tagline {
          color: #8e8e93;
          font-size: 13px;
          letter-spacing: 2px;
          margin: 0;
          text-transform: uppercase;
        }
        
        .footer-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 40px;
          margin-bottom: 48px;
        }
        
        .footer-title {
          margin: 0 0 24px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #fff;
          position: relative;
          padding-bottom: 8px;
        }
        
        .footer-title::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 24px;
          height: 1.5px;
          background: #C9A84C;
        }
        
        .footer-link {
          display: block;
          margin-bottom: 12px;
          font-size: 13px;
          color: #8e8e93;
          text-decoration: none;
          letter-spacing: 0.5px;
          transition: all 0.25s ease;
        }
        
        .footer-link:hover {
          color: #C9A84C !important;
          transform: translateX(4px);
        }
        
        .social-icons {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }
        
        .social-icon {
          width: 40px;
          height: 40px;
          border: 1px solid #242426;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8e8e93;
          text-decoration: none;
          transition: all 0.25s ease;
          background: #18181b;
        }
        
        .social-icon:hover {
          border-color: #C9A84C !important;
          color: #C9A84C !important;
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(201, 168, 76, 0.15);
        }
        
        .contact-info {
          font-size: 13px;
          color: #8e8e93;
          line-height: 1.8;
        }
        
        .contact-info p {
          margin: 0 0 8px;
        }
        
        .contact-info span {
          color: #fff;
          font-weight: 600;
        }
        
        .footer-badges {
          display: flex;
          gap: 32px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 40px;
          padding: 32px 0;
          border-top: 1px solid #242426;
          border-bottom: 1px solid #242426;
        }
        
        .footer-badge-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #aeaeb2;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          transition: all 0.25s ease;
        }
        
        .footer-badge-item:hover {
          color: #fff;
          transform: translateY(-2px);
        }
        
        .footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          padding-top: 12px;
        }
        
        .footer-copyright {
          margin: 0;
          font-size: 12px;
          color: #636366;
          letter-spacing: 0.5px;
        }
        
/* Responsive Breakpoints */
        @media (max-width: 768px) {
          .footer-wrap {
            padding: 60px 24px 32px;
          }
          .footer-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 36px !important;
          }
          .footer-badges {
            gap: 24px;
            padding: 24px 0;
          }
        }
        
        @media (max-width: 480px) {
          .footer-wrap {
            padding: 48px 20px 110px !important; /* Added large bottom padding to clear the sticky actions bar! */
          }
          .footer-logo {
            font-size: 22px;
            letter-spacing: 6px;
          }
          .footer-tagline {
            font-size: 11px;
            letter-spacing: 1px;
          }
          .footer-grid {
            grid-template-columns: 1fr !important; /* Single column layout for clean spacing on phone */
            gap: 36px !important;
          }
          .footer-title {
            margin-bottom: 16px;
          }
          .footer-badges {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important; /* 2x2 grid for badges on mobile, incredibly clean! */
            gap: 16px !important;
            justify-items: start;
            padding: 24px 0 !important;
          }
          .footer-badge-item {
            font-size: 11px;
          }
          .footer-bottom {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 12px;
          }
        }
      </style>`;
  }
}
