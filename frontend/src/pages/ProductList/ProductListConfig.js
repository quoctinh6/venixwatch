export const CATEGORY_LABELS = {
  nam: 'Đồng Hồ Nam',
  nu: 'Đồng Hồ Nữ',
  'phu-kien': 'Phụ Kiện',
  sale: 'Khuyến Mãi',
};

export const CATEGORY_DESCRIPTIONS = {
  nam: 'Bộ sưu tập đồng hồ nam cao cấp từ các thương hiệu hàng đầu thế giới. Cam kết chính hãng 100%, bảo hành toàn quốc.',
  nu: 'Các mẫu đồng hồ nữ thanh lịch, tinh gọn và dễ đeo hằng ngày, từ thiết kế tối giản đến phong cách cao cấp.',
  'phu-kien': 'Phụ kiện dành cho người chơi đồng hồ: dây đeo, hộp đựng, bộ dụng cụ và các vật phẩm chăm sóc cơ bản.',
  sale: 'Những sản phẩm đang có ưu đãi giá tốt, cập nhật liên tục theo đợt khuyến mãi và tình trạng tồn kho.',
};

export const SORT_OPTIONS = [
  { value: 'new', label: 'Mới nhất' },
  { value: 'bestseller', label: 'Bán chạy nhất' },
  { value: 'price_asc', label: 'Giá: Thấp đến Cao' },
  { value: 'price_desc', label: 'Giá: Cao đến Thấp' },
  { value: 'name_asc', label: 'Tên A-Z' },
];

export const PRICE_PRESETS = [
  { label: 'Dưới 5tr', min: '', max: '5000000' },
  { label: '5-15tr', min: '5000000', max: '15000000' },
  { label: '15-50tr', min: '15000000', max: '50000000' },
  { label: 'Trên 50tr', min: '50000000', max: '' },
];

export function chevronRightIcon() {
  return `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  `;
}

export function filterIcon() {
  return `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
      <path d="M4 6h16"/>
      <path d="M7 12h10"/>
      <path d="M10 18h4"/>
    </svg>
  `;
}

export function gridIcon() {
  return `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
    </svg>
  `;
}

export function listIcon() {
  return `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
      <path d="M8 6h13"/>
      <path d="M8 12h13"/>
      <path d="M8 18h13"/>
      <path d="M3 6h.01"/>
      <path d="M3 12h.01"/>
      <path d="M3 18h.01"/>
    </svg>
  `;
}
