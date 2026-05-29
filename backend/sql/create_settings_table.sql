-- ============================================================
-- Venix Watch - Create Settings & Settings History Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS settings (
  `key` VARCHAR(50) NOT NULL PRIMARY KEY,
  `value` LONGTEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings_history (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT NOT NULL,
  `changed_by` VARCHAR(150) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default settings
INSERT INTO settings (`key`, `value`) VALUES 
('brand_name', 'Venix Watch'),
('logo_url', ''),
('hero_banners', '[{"img":"https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2","eyebrow":"Bộ Sưu Tập Mới 2025","title":"Đỉnh Cao Tinh Xảo","subtitle":"Khám phá những mẫu đồng hồ chính hãng cao cấp được tuyển chọn kỹ lưỡng nhất.","cta":"Khám Phá Ngay","ctaHref":"/nam"},{"img":"https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2","eyebrow":"Phong Cách Vĩnh Cửu","title":"Thời Gian Là Nghệ Thuật","subtitle":"Mỗi chiếc đồng hồ là một tác phẩm nghệ thuật, nói lên cá tính riêng của bạn.","cta":"Xem Bộ Sưu Tập","ctaHref":"/nu"},{"img":"https://images.pexels.com/photos/280250/pexels-photo-280250.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2","eyebrow":"Sale - Đến 40% Off","title":"Ưu Đãi Không Thể Bỏ Lỡ","subtitle":"Những mẫu hot nhất, giá tốt nhất. Số lượng có hạn - đặt hàng ngay hôm nay.","cta":"Mua Ngay","ctaHref":"/sale"}]'),
('theme_colors', '{"primary":"#1a1a1a","secondary":"#ffffff","accent-gold":"#C9A84C","accent-dark":"#2d2d2d","text-muted":"#888888","border-color":"#e8e8e8","sale-red":"#c0392b","primary-gold":"#C9A961","primary-gold-dark":"#A88840","ink":"#0A0A0A","ink-soft":"#1F1F1F","paper":"#FFFFFF","paper-warm":"#FAF8F3","line":"#E8E4DC"}')
ON DUPLICATE KEY UPDATE `value`=VALUES(`value`);

-- Seed default settings permissions
INSERT IGNORE INTO permissions (name, group_name) VALUES 
('settings:read', 'System Settings'),
('settings:write', 'System Settings');

-- Assign permissions to super_admin (ID = 1, via role_permissions)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'super_admin' AND p.name IN ('settings:read', 'settings:write');

-- Assign permissions to admin
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'admin' AND p.name IN ('settings:read', 'settings:write');
