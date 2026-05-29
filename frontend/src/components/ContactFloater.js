const PHONE = '0929000063';
const ZALO_URL = `https://zalo.me/${PHONE}`;
const PHONE_URL = `tel:${PHONE}`;
const FB_URL = 'https://facebook.com/donghoatuan';

export class ContactFloater {
  mount() {
    if (document.getElementById('contact-floater')) return;

    const style = document.createElement('style');
    style.id = 'contact-floater-style';
    style.textContent = `
      #contact-floater {
        position: fixed;
        right: calc(20px + env(safe-area-inset-right, 0px));
        bottom: calc(20px + env(safe-area-inset-bottom, 0px));
        z-index: 180;
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-items: center;
        transition: right 0.35s cubic-bezier(.4,0,.2,1), opacity 0.3s ease, transform 0.3s ease;
      }
      body.cart-drawer-open #contact-floater {
        right: calc(404px + env(safe-area-inset-right, 0px));
      }
      .contact-btn {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 9999px;
        color: #ffffff;
        text-decoration: none;
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        overflow: hidden;
      }
      .contact-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 14px 28px rgba(0, 0, 0, 0.16);
      }
      .contact-btn-zalo { background: #0068FF; }
      .contact-btn-facebook { background: #1877F2; }
      .contact-btn-phone { background: #C9A961; }
      .contact-label {
        position: absolute;
        right: 60px;
        top: 50%;
        transform: translateY(-50%);
        border-radius: 9999px;
        background: #0A0A0A;
        border: 1px solid #E8E4DC;
        color: #ffffff;
        padding: 6px 10px;
        font-size: 11px;
        font-weight: 600;
        font-family: Montserrat, sans-serif;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
      }
      .contact-btn:hover .contact-label {
        opacity: 1;
      }
      @media (max-width: 640px) {
        #contact-floater {
          right: calc(16px + env(safe-area-inset-right, 0px));
          bottom: calc(16px + env(safe-area-inset-bottom, 0px));
        }
        body.cart-drawer-open #contact-floater {
          right: calc(16px + env(safe-area-inset-right, 0px));
          opacity: 0;
          pointer-events: none;
          transform: translateX(30px);
        }
        .contact-btn {
          width: 44px;
          height: 44px;
        }
      }
    `;
    document.head.appendChild(style);

    const floater = document.createElement('div');
    floater.id = 'contact-floater';

    const zaloBtn = document.createElement('a');
    zaloBtn.href = ZALO_URL;
    zaloBtn.target = '_blank';
    zaloBtn.rel = 'noopener noreferrer';
    zaloBtn.title = 'Chat Zalo';
    zaloBtn.className = 'contact-btn contact-btn-zalo';
    zaloBtn.innerHTML = `
      <span class="contact-label">Chat Zalo</span>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect width="48" height="48" rx="24" fill="#0068FF"/>
        <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
          font-family="Montserrat, Arial, sans-serif" font-size="10" font-weight="800" fill="white">Zalo</text>
      </svg>
    `;

    const facebookBtn = document.createElement('a');
    facebookBtn.href = FB_URL;
    facebookBtn.target = '_blank';
    facebookBtn.rel = 'noopener noreferrer';
    facebookBtn.title = 'Facebook Fanpage';
    facebookBtn.className = 'contact-btn contact-btn-facebook';
    facebookBtn.innerHTML = `
      <span class="contact-label">Facebook</span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
      </svg>
    `;

    const phoneBtn = document.createElement('a');
    phoneBtn.href = PHONE_URL;
    phoneBtn.title = `Gọi ${PHONE}`;
    phoneBtn.className = 'contact-btn contact-btn-phone';
    phoneBtn.innerHTML = `
      <span class="contact-label">${PHONE}</span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.44 2 2 0 0 1 3.62 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.84a16 16 0 0 0 6.08 6.08l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.03z"/>
      </svg>
    `;

    floater.appendChild(facebookBtn);
    floater.appendChild(zaloBtn);
    floater.appendChild(phoneBtn);
    document.body.appendChild(floater);

    const adjustForCompareBar = (hasBar) => {
      if (window.innerWidth >= 1024) return;
      floater.style.bottom = hasBar
        ? 'calc(82px + env(safe-area-inset-bottom, 0px))'
        : '';
    };

    try {
      const stored = JSON.parse(localStorage.getItem('dhat_compare') || '[]');
      adjustForCompareBar(stored.length >= 2);
    } catch { }

    window.addEventListener('compare-updated', (e) => {
      adjustForCompareBar((e.detail || []).length >= 2);
    });
  }
}
