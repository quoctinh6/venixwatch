-- ============================================================
-- Venix Watch - Full Database Schema
-- MySQL 8.x | utf8mb4_unicode_ci
-- ============================================================

CREATE DATABASE IF NOT EXISTS dong_ho_a_tuan
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE dong_ho_a_tuan;

-- ============================================================
-- ROLES & PERMISSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(80)  NOT NULL UNIQUE,
  display_name  VARCHAR(120) NOT NULL,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS permissions (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  group_name  VARCHAR(60)  NOT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       INT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id)       REFERENCES roles(id)       ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(150) NOT NULL,
  phone         VARCHAR(20)  DEFAULT NULL,
  avatar        VARCHAR(500) DEFAULT NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id INT UNSIGNED NOT NULL,
  role_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- CATEGORIES
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  slug        VARCHAR(160) NOT NULL UNIQUE,
  parent_id   INT UNSIGNED DEFAULT NULL,
  image_url   VARCHAR(500) DEFAULT NULL,
  description TEXT         DEFAULT NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_slug     (slug),
  INDEX idx_parent   (parent_id),
  INDEX idx_active   (is_active)
) ENGINE=InnoDB;

-- ============================================================
-- BRANDS
-- ============================================================

CREATE TABLE IF NOT EXISTS brands (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  slug        VARCHAR(160) NOT NULL UNIQUE,
  source_name VARCHAR(150) NOT NULL UNIQUE,
  logo_url    VARCHAR(500) DEFAULT NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug        (slug),
  INDEX idx_source_name (source_name),
  INDEX idx_active      (is_active)
) ENGINE=InnoDB;

-- ============================================================
-- PRODUCTS
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id      INT UNSIGNED NOT NULL,
  name             VARCHAR(250) NOT NULL,
  slug             VARCHAR(260) NOT NULL UNIQUE,
  description      TEXT         DEFAULT NULL,
  price            DECIMAL(15,2) NOT NULL,
  sale_price       DECIMAL(15,2) DEFAULT NULL,
  stock            INT          NOT NULL DEFAULT 0,
  sku              VARCHAR(80)  NOT NULL UNIQUE,
  brand            VARCHAR(100) DEFAULT NULL,
  case_material    VARCHAR(100) DEFAULT NULL,
  case_size        VARCHAR(20)  DEFAULT NULL,
  movement_type    ENUM('automatic','quartz','mechanical','solar') NOT NULL DEFAULT 'quartz',
  water_resistance VARCHAR(50)  DEFAULT NULL,
  images           JSON         DEFAULT NULL,
  is_active        TINYINT(1)   NOT NULL DEFAULT 1,
  is_featured      TINYINT(1)   NOT NULL DEFAULT 0,
  badge            ENUM('NEW','BESTSELLER','SALE') DEFAULT NULL,
  meta_title       VARCHAR(200) DEFAULT NULL,
  meta_description VARCHAR(350) DEFAULT NULL,
  og_image         VARCHAR(500) DEFAULT NULL,
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  INDEX idx_slug       (slug),
  INDEX idx_category   (category_id),
  INDEX idx_active     (is_active),
  INDEX idx_featured   (is_featured),
  INDEX idx_badge      (badge)
) ENGINE=InnoDB;

-- ============================================================
-- FLASH SALES
-- ============================================================

CREATE TABLE IF NOT EXISTS flash_sales (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id  INT UNSIGNED NOT NULL,
  sale_price  DECIMAL(15,2) NOT NULL,
  starts_at   TIMESTAMP    NOT NULL,
  ends_at     TIMESTAMP    NOT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product  (product_id),
  INDEX idx_dates    (starts_at, ends_at)
) ENGINE=InnoDB;

-- ============================================================
-- ORDERS
-- ============================================================

CREATE TABLE IF NOT EXISTS orders (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          INT UNSIGNED DEFAULT NULL,
  customer_name    VARCHAR(150) NOT NULL,
  customer_email   VARCHAR(180) NOT NULL,
  customer_phone   VARCHAR(20)  NOT NULL,
  shipping_address TEXT         NOT NULL,
  total_amount     DECIMAL(15,2) NOT NULL,
  status           ENUM('pending','processing','shipping','completed','cancelled')
                   NOT NULL DEFAULT 'pending',
  notes            TEXT         DEFAULT NULL,
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user   (user_id),
  INDEX idx_status (status),
  INDEX idx_email  (customer_email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id      INT UNSIGNED NOT NULL,
  product_id    INT UNSIGNED DEFAULT NULL,
  product_name  VARCHAR(250) NOT NULL,
  product_price DECIMAL(15,2) NOT NULL,
  quantity      INT          NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  INDEX idx_order   (order_id),
  INDEX idx_product (product_id)
) ENGINE=InnoDB;

-- ============================================================
-- WARRANTIES
-- ============================================================

CREATE TABLE IF NOT EXISTS warranties (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_item_id     INT UNSIGNED DEFAULT NULL,
  serial_number     VARCHAR(100) NOT NULL UNIQUE,
  product_id        INT UNSIGNED DEFAULT NULL,
  customer_name     VARCHAR(150) NOT NULL,
  customer_phone    VARCHAR(20)  NOT NULL,
  warranty_expires_at DATE        NOT NULL,
  status            ENUM('active','claimed','expired') NOT NULL DEFAULT 'active',
  notes             TEXT         DEFAULT NULL,
  created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE SET NULL,
  FOREIGN KEY (product_id)    REFERENCES products(id)    ON DELETE SET NULL,
  INDEX idx_serial  (serial_number),
  INDEX idx_status  (status)
) ENGINE=InnoDB;

-- ============================================================
-- CART
-- ============================================================

CREATE TABLE IF NOT EXISTS cart_items (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(128) NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity   INT          NOT NULL DEFAULT 1,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uk_session_product (session_id, product_id),
  INDEX idx_session (session_id)
) ENGINE=InnoDB;

-- ============================================================
-- ANALYTICS
-- ============================================================

CREATE TABLE IF NOT EXISTS visitor_logs (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id   VARCHAR(128) NOT NULL,
  ip_address   VARCHAR(45)  NOT NULL,
  country_code CHAR(2)      DEFAULT NULL,
  country_name VARCHAR(100) DEFAULT NULL,
  city         VARCHAR(100) DEFAULT NULL,
  device_type  ENUM('desktop','mobile','tablet') DEFAULT 'desktop',
  browser      VARCHAR(100) DEFAULT NULL,
  referrer     TEXT         DEFAULT NULL,
  landing_page VARCHAR(500) DEFAULT NULL,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session      (session_id),
  INDEX idx_country_code (country_code),
  INDEX idx_created_at   (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS page_view_events (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id   VARCHAR(128) NOT NULL,
  page_url     VARCHAR(500) NOT NULL,
  page_title   VARCHAR(300) DEFAULT NULL,
  time_on_page INT          NOT NULL DEFAULT 0,
  scroll_depth TINYINT      NOT NULL DEFAULT 0,
  exited_at    TIMESTAMP    NULL      DEFAULT NULL,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session    (session_id),
  INDEX idx_page_url   (page_url(191)),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS page_sessions (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id   VARCHAR(128) NOT NULL UNIQUE,
  last_ping    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  current_page VARCHAR(500) DEFAULT NULL,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_last_ping (last_ping)
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO roles (name, display_name) VALUES
  ('super_admin',      'Super Administrator'),
  ('admin',            'Administrator'),
  ('editor',           'Editor'),
  ('viewer',           'Viewer'),
  ('user_page_editor', 'User Page Editor');

INSERT INTO permissions (name, group_name) VALUES
  ('products:read',       'products'),
  ('products:write',      'products'),
  ('products:delete',     'products'),
  ('products:quick_edit', 'products'),
  ('orders:read',         'orders'),
  ('orders:write',        'orders'),
  ('users:read',          'users'),
  ('users:write',         'users'),
  ('users:delete',        'users'),
  ('roles:manage',        'roles'),
  ('analytics:read',      'analytics'),
  ('warranties:read',     'warranties'),
  ('warranties:write',    'warranties'),
  ('flash_sales:manage',  'flash_sales'),
  ('categories:read',     'categories'),
  ('categories:write',    'categories'),
  ('categories:delete',   'categories');

-- super_admin: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'super_admin';

-- admin: all except roles:manage
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.name != 'roles:manage'
WHERE r.name = 'admin';

-- editor: products:read/write, orders:read/write, categories:read/write, warranties:read/write
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.name IN (
  'products:read','products:write',
  'orders:read','orders:write',
  'categories:read','categories:write',
  'warranties:read','warranties:write'
)
WHERE r.name = 'editor';

-- viewer: all :read permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.name LIKE '%:read'
WHERE r.name = 'viewer';

-- user_page_editor: products:read, products:write, products:quick_edit
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.name IN ('products:read', 'products:write', 'products:quick_edit')
WHERE r.name = 'user_page_editor';

-- Default super_admin user
-- Password: Admin@123456
-- To regenerate hash: echo password_hash('Admin@123456', PASSWORD_BCRYPT, ['cost'=>12]);
INSERT INTO users (email, password_hash, full_name, phone, is_active) VALUES (
  'admin@donghoatuan.vn',
  '$2y$12$yTibnFj9PLg/b9sBNCFxK.dfBuUgDeJgC5jqdUMKmuG1OjXA.GK.a',
  'Admin Venix Watch',
  '0901234567',
  1
);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'admin@donghoatuan.vn' AND r.name = 'super_admin';

-- Categories
INSERT INTO categories (name, slug, description, is_active, sort_order) VALUES
  ('Đồng Hồ Nam',  'nam',       'Bộ sưu tập đồng hồ dành cho nam giới', 1, 1),
  ('Đồng Hồ Nữ',  'nu',        'Bộ sưu tập đồng hồ dành cho phái nữ',  1, 2),
  ('Phụ Kiện',     'phu-kien',  'Dây đeo, hộp đồng hồ và phụ kiện',     1, 3);

-- Sau khi import schema cơ bản, chạy thêm backend/update_category_tree.sql
-- để đồng bộ danh mục cha/con với menu frontend.

-- ============================================================
-- SAMPLE PRODUCTS (15 products, 5 per category)
-- ============================================================

-- Đồng Hồ Nam (category_id = 1)
INSERT INTO products (category_id, name, slug, description, price, sale_price, stock, sku, brand, case_material, case_size, movement_type, water_resistance, is_active, is_featured, badge, meta_title, meta_description) VALUES
(1, 'Seiko Presage Automatic SPB143J1',
 'seiko-presage-automatic-spb143j1',
 'Đồng hồ nam Seiko Presage với máy automatic, mặt số emaille tinh tế, dây da nâu sang trọng.',
 8990000, 7990000, 15, 'SKU-NAM-001', 'Seiko', 'Thép không gỉ', '40.5mm', 'automatic', '100m', 1, 1, 'BESTSELLER',
 'Seiko Presage Automatic SPB143J1 - Venix Watch',
 'Đồng hồ nam Seiko Presage automatic chính hãng, mặt số emaille, chống nước 100m'),

(1, 'Citizen Eco-Drive BM8180-03E',
 'citizen-eco-drive-bm8180-03e',
 'Đồng hồ nam Citizen Eco-Drive chạy bằng năng lượng ánh sáng, không cần thay pin.',
 3990000, NULL, 30, 'SKU-NAM-002', 'Citizen', 'Thép không gỉ', '38mm', 'solar', '50m', 1, 0, 'NEW',
 'Citizen Eco-Drive BM8180-03E - Đồng Hồ Nam Năng Lượng Sáng',
 'Đồng hồ nam Citizen Eco-Drive chính hãng, tiết kiệm năng lượng, chống nước 50m'),

(1, 'Orient Bambino Open Heart FAG00003W0',
 'orient-bambino-open-heart-fag00003w0',
 'Đồng hồ nam Orient Bambino lộ máy, phong cách cổ điển Nhật Bản, dây da đen.',
 4990000, 4490000, 20, 'SKU-NAM-003', 'Orient', 'Thép không gỉ', '41mm', 'automatic', '30m', 1, 1, 'SALE',
 'Orient Bambino Open Heart - Đồng Hồ Nam Lộ Máy',
 'Đồng hồ nam Orient Bambino lộ máy automatic, phong cách cổ điển, dây da cao cấp'),

(1, 'Casio G-Shock GW-M5610-1',
 'casio-g-shock-gw-m5610-1',
 'Đồng hồ nam Casio G-Shock siêu bền, chống va đập, chống nước 200m, solar radio controlled.',
 2990000, NULL, 50, 'SKU-NAM-004', 'Casio', 'Nhựa cao cấp', '46.3mm', 'solar', '200m', 1, 0, NULL,
 'Casio G-Shock GW-M5610-1 - Đồng Hồ Nam Thể Thao',
 'Đồng hồ nam Casio G-Shock solar, chống sốc, chống nước 200m, nhận tín hiệu vô tuyến'),

(1, 'Tissot T-Race Automatic T115.407.27.041.00',
 'tissot-t-race-automatic-t115',
 'Đồng hồ nam Tissot T-Race phong cách đua xe, máy tự động ETA, mặt đồng hồ thể thao năng động.',
 12990000, 11990000, 8, 'SKU-NAM-005', 'Tissot', 'Thép không gỉ / Cao su', '45mm', 'automatic', '100m', 1, 1, 'SALE',
 'Tissot T-Race Automatic - Đồng Hồ Nam Cao Cấp',
 'Đồng hồ nam Tissot T-Race automatic chính hãng Thụy Sĩ, phong cách đua xe, chống nước 100m');

-- Đồng Hồ Nữ (category_id = 2)
INSERT INTO products (category_id, name, slug, description, price, sale_price, stock, sku, brand, case_material, case_size, movement_type, water_resistance, is_active, is_featured, badge, meta_title, meta_description) VALUES
(2, 'Seiko Conceptual SRZ528P1',
 'seiko-conceptual-srz528p1',
 'Đồng hồ nữ Seiko Conceptual dây kim loại ánh vàng hồng, mặt số trắng thanh lịch.',
 3490000, NULL, 25, 'SKU-NU-001', 'Seiko', 'Thép không gỉ mạ vàng hồng', '28mm', 'quartz', '50m', 1, 1, 'NEW',
 'Seiko Conceptual SRZ528P1 - Đồng Hồ Nữ Vàng Hồng',
 'Đồng hồ nữ Seiko Conceptual vàng hồng, dây kim loại, chống nước 50m, chính hãng'),

(2, 'Citizen Silhouette Crystal EX1482-01D',
 'citizen-silhouette-crystal-ex1482-01d',
 'Đồng hồ nữ Citizen Silhouette đính đá pha lê, vỏ vàng hồng, mặt số trắng ngọc trai.',
 5990000, 5490000, 18, 'SKU-NU-002', 'Citizen', 'Thép không gỉ mạ vàng hồng', '27mm', 'quartz', '30m', 1, 1, 'BESTSELLER',
 'Citizen Silhouette Crystal - Đồng Hồ Nữ Đính Đá',
 'Đồng hồ nữ Citizen Silhouette đính đá pha lê, mặt xà cừ, phong cách quý phái'),

(2, 'Orient Floral Automatic RA-AG0019S10B',
 'orient-floral-automatic-ra-ag0019s10b',
 'Đồng hồ nữ Orient Floral máy automatic, họa tiết hoa tinh tế, dây da màu trắng kem.',
 4190000, NULL, 22, 'SKU-NU-003', 'Orient', 'Thép không gỉ', '30mm', 'automatic', '30m', 1, 0, 'NEW',
 'Orient Floral Automatic - Đồng Hồ Nữ Máy Tự Động',
 'Đồng hồ nữ Orient Floral automatic, họa tiết hoa, dây da trắng, phong cách nữ tính'),

(2, 'Casio Sheen SHE-4543PGL-7AUEF',
 'casio-sheen-she-4543pgl-7auef',
 'Đồng hồ nữ Casio Sheen dây kim loại ánh vàng, mặt số xanh lam gradient sang trọng.',
 1990000, NULL, 40, 'SKU-NU-004', 'Casio', 'Thép không gỉ mạ vàng', '36mm', 'quartz', '50m', 1, 0, NULL,
 'Casio Sheen SHE-4543 - Đồng Hồ Nữ Sang Trọng',
 'Đồng hồ nữ Casio Sheen dây kim loại vàng, mặt xanh gradient, chính hãng giá tốt'),

(2, 'Longines Elegant Collection L4.309.4.87.6',
 'longines-elegant-collection-l4309',
 'Đồng hồ nữ Longines Elegant thép mạ vàng, đính kim cương, mặt số trắng ngọc trai cao cấp.',
 12990000, NULL, 5, 'SKU-NU-005', 'Longines', 'Thép không gỉ mạ vàng', '25.5mm', 'quartz', '30m', 1, 1, NULL,
 'Longines Elegant Collection - Đồng Hồ Nữ Cao Cấp',
 'Đồng hồ nữ Longines Elegant chính hãng Thụy Sĩ, đính kim cương, mặt xà cừ');

-- Phụ Kiện (category_id = 3)
INSERT INTO products (category_id, name, slug, description, price, sale_price, stock, sku, brand, case_material, case_size, movement_type, water_resistance, is_active, is_featured, badge, meta_title, meta_description) VALUES
(3, 'Dây Da Seiko Gốc 22mm Nâu Đậm',
 'day-da-seiko-goc-22mm-nau-dam',
 'Dây da thật 22mm chính hãng Seiko, màu nâu đậm, khóa thép không gỉ, phù hợp nhiều dòng đồng hồ.',
 490000, NULL, 100, 'SKU-PK-001', 'Seiko', 'Da bò thật', '22mm', 'quartz', NULL, 1, 0, NULL,
 'Dây Da Seiko 22mm Nâu - Phụ Kiện Đồng Hồ',
 'Dây da thật 22mm Seiko chính hãng, màu nâu đậm, bền đẹp, dễ thay thế'),

(3, 'Hộp Đựng Đồng Hồ 6 Ngăn Da Pu',
 'hop-dung-dong-ho-6-ngan-da-pu',
 'Hộp đựng đồng hồ 6 ngăn bọc da PU cao cấp, lót nhung mềm, khoá từ tính, bảo vệ đồng hồ tốt.',
 590000, 490000, 60, 'SKU-PK-002', 'Generic', 'Da PU', NULL, 'quartz', NULL, 1, 0, 'SALE',
 'Hộp Đựng Đồng Hồ 6 Ngăn - Phụ Kiện Bảo Quản',
 'Hộp đựng 6 đồng hồ bọc da PU sang trọng, lót nhung, khoá từ bảo vệ an toàn'),

(3, 'Dây Nato Nylon 20mm Nhiều Màu',
 'day-nato-nylon-20mm-nhieu-mau',
 'Dây đeo Nato nylon 20mm bền chắc, nhiều màu sắc trẻ trung, phù hợp phong cách thể thao casual.',
 190000, NULL, 200, 'SKU-PK-003', 'Generic', 'Nylon cao cấp', '20mm', 'quartz', NULL, 1, 0, 'NEW',
 'Dây Nato Nylon 20mm - Dây Đeo Đồng Hồ Thể Thao',
 'Dây Nato nylon 20mm nhiều màu, bền chắc, phong cách thể thao trẻ trung, giá tốt'),

(3, 'Bộ Dụng Cụ Thay Dây Đồng Hồ Chuyên Dụng',
 'bo-dung-cu-thay-day-dong-ho',
 'Bộ dụng cụ thay dây đồng hồ gồm 10 món, tháo lò xo, chốt dây dễ dàng tại nhà.',
 290000, 250000, 80, 'SKU-PK-004', 'Generic', 'Kim loại + nhựa', NULL, 'quartz', NULL, 1, 0, 'SALE',
 'Bộ Dụng Cụ Thay Dây Đồng Hồ - Phụ Kiện Sửa Chữa',
 'Bộ dụng cụ 10 món thay dây đồng hồ tại nhà, dễ sử dụng, chất liệu bền'),

(3, 'Gối Lên Dây Đồng Hồ Automatic Cao Cấp',
 'goi-len-day-dong-ho-automatic',
 'Gối lên dây (Watch Winder) cho đồng hồ automatic, 1 chiếc, 3 chế độ xoay, vỏ gỗ sang trọng.',
 1490000, NULL, 25, 'SKU-PK-005', 'Generic', 'Gỗ + da PU', NULL, 'quartz', NULL, 1, 1, 'NEW',
 'Gối Lên Dây Đồng Hồ Automatic - Watch Winder',
 'Watch Winder gỗ cao cấp cho đồng hồ automatic, 3 chế độ xoay, bảo vệ cơ chế đồng hồ');
