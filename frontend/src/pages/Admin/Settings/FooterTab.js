import { showToast } from '../shared/ui.js';

export function renderFooterTab(settings) {
  const footer = settings.footer_settings || {
    hotline: '',
    email: '',
    address: '',
    social_facebook: '',
    social_instagram: '',
    social_tiktok: '',
    bank_name: '',
    bank_account: '',
    bank_owner: '',
    momo_phone: '',
    momo_owner: ''
  };

  return `
    <div class="space-y-8">
      <h3 class="text-base font-bold text-gray-900 border-b pb-3">Cấu Hình Thông Tin Chân Trang & Liên Hệ</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Left: Form -->
        <div class="space-y-6">
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Thông tin liên hệ</h4>
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Hotline</label>
                <input type="text" id="footer-hotline" value="${footer.hotline || ''}" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/25 focus:border-[#C9A84C]" />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Email</label>
                <input type="email" id="footer-email" value="${footer.email || ''}" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/25 focus:border-[#C9A84C]" />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Địa chỉ</label>
                <textarea id="footer-address" rows="3" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/25 focus:border-[#C9A84C] resize-y">${footer.address || ''}</textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Social Links -->
        <div class="space-y-6">
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Liên kết Mạng xã hội</h4>
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Facebook URL</label>
                <input type="url" id="footer-facebook" value="${footer.social_facebook || ''}" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/25 focus:border-[#C9A84C]" placeholder="https://..." />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Instagram URL</label>
                <input type="url" id="footer-instagram" value="${footer.social_instagram || ''}" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/25 focus:border-[#C9A84C]" placeholder="https://..." />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">TikTok URL</label>
                <input type="url" id="footer-tiktok" value="${footer.social_tiktok || ''}" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/25 focus:border-[#C9A84C]" placeholder="https://..." />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="border-t pt-6 mt-6">
        <h4 class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Thông tin chuyển khoản (Để sinh mã QR tự động)</h4>
        <div class="max-w-md space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1">Ngân hàng</label>
            <select id="footer-bank-name"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/25 focus:border-[#C9A84C] bg-white">
              <option value="">-- Chọn ngân hàng --</option>
              ${[
                ['Vietcombank (VCB)', 'VCB'],
                ['VietinBank (CTG)', 'CTG'],
                ['BIDV', 'BIDV'],
                ['Agribank (VBA)', 'VBARD'],
                ['MB Bank (MB)', 'MB'],
                ['Techcombank (TCB)', 'TCB'],
                ['ACB', 'ACB'],
                ['VPBank (VPB)', 'VPB'],
                ['TPBank (TPB)', 'TPB'],
                ['Sacombank (STB)', 'STB'],
                ['HDBank (HDB)', 'HDB'],
                ['VIB', 'VIB'],
                ['MSB', 'MSB'],
                ['Eximbank', 'EIB'],
                ['OCB', 'OCB'],
                ['SeABank', 'SEAB'],
                ['LienVietPostBank', 'LPB'],
                ['PVcomBank', 'PVC'],
                ['Nam A Bank', 'NAB'],
                ['Kienlongbank', 'KLB'],
                ['Saigonbank', 'SGB'],
                ['BaoViet Bank', 'BVB'],
                ['Viet Capital Bank', 'BVB'],
              ].map(([name, code]) => {
                const optVal = `${name} | ${code}`;
                const isSelected = footer.bank_name === optVal || footer.bank_name === name || footer.bank_name === code;
                return `<option value="${optVal}" ${isSelected ? 'selected' : ''}>${name} (${code})</option>`;
              }).join('')}
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1">Số tài khoản</label>
            <input type="text" id="footer-bank-account" value="${footer.bank_account || ''}" 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/25 focus:border-[#C9A84C]" />
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1">Chủ tài khoản (Tên viết hoa không dấu)</label>
            <input type="text" id="footer-bank-owner" value="${footer.bank_owner || ''}" 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/25 focus:border-[#C9A84C]" />
          </div>
        </div>
      </div>
    </div>
  `;
}

export function bindFooterTab(container, settings, token, API_BASE, ctx) {
  if (!settings.footer_settings) {
    settings.footer_settings = {};
  }

  const updateVal = (id, key, eventType = 'input') => {
    container.querySelector(`#${id}`)?.addEventListener(eventType, (e) => {
      settings.footer_settings[key] = e.target.value.trim();
    });
  };

  updateVal('footer-hotline', 'hotline');
  updateVal('footer-email', 'email');
  updateVal('footer-address', 'address');
  updateVal('footer-facebook', 'social_facebook');
  updateVal('footer-instagram', 'social_instagram');
  updateVal('footer-tiktok', 'social_tiktok');
  updateVal('footer-bank-name', 'bank_name', 'change');
  updateVal('footer-bank-account', 'bank_account');
  updateVal('footer-bank-owner', 'bank_owner');
}
