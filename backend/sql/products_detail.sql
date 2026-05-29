ALTER TABLE products
  ADD COLUMN IF NOT EXISTS short_description TEXT NULL AFTER description,
  ADD COLUMN IF NOT EXISTS long_description LONGTEXT NULL AFTER short_description,
  ADD COLUMN IF NOT EXISTS ref_number VARCHAR(50) NULL AFTER sku,
  ADD COLUMN IF NOT EXISTS status ENUM('active','out_of_stock','pre_order','draft') NOT NULL DEFAULT 'active' AFTER stock,
  ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0 AFTER badge,
  ADD COLUMN IF NOT EXISTS sold_count INT NOT NULL DEFAULT 0 AFTER view_count,
  ADD COLUMN IF NOT EXISTS rating_avg DECIMAL(2,1) NOT NULL DEFAULT 0 AFTER sold_count,
  ADD COLUMN IF NOT EXISTS rating_count INT NOT NULL DEFAULT 0 AFTER rating_avg;

CREATE TABLE IF NOT EXISTS product_images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255) DEFAULT NULL,
  sort_order TINYINT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  INDEX idx_product_sort (product_id, sort_order),
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_specs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  spec_key VARCHAR(100) NOT NULL,
  spec_value VARCHAR(255) NOT NULL,
  sort_order TINYINT NOT NULL DEFAULT 0,
  INDEX idx_product (product_id),
  CONSTRAINT fk_product_specs_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  user_name VARCHAR(120) NOT NULL,
  rating TINYINT NOT NULL,
  title VARCHAR(255) DEFAULT NULL,
  comment TEXT DEFAULT NULL,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  helpful_count INT NOT NULL DEFAULT 0,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved',
  shop_reply TEXT DEFAULT NULL,
  shop_reply_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_product_status (product_id, status),
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_questions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  user_name VARCHAR(120) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT DEFAULT NULL,
  answered_by BIGINT UNSIGNED NULL,
  answered_at TIMESTAMP NULL DEFAULT NULL,
  status ENUM('pending','answered') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_product_created (product_id, created_at),
  CONSTRAINT fk_questions_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recently_viewed (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  session_id VARCHAR(120) NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session_viewed (session_id, viewed_at),
  INDEX idx_user_viewed (user_id, viewed_at),
  CONSTRAINT fk_recently_viewed_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
