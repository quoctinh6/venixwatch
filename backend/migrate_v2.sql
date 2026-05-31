-- ============================================================
-- Venix Watch - Database Migration v2
-- Split categories table into categories & subcategories
-- Associate products with brands & subcategories
-- ============================================================

USE db_4ed5c239;

-- 1. Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  name        VARCHAR(150) NOT NULL,
  slug        VARCHAR(160) NOT NULL UNIQUE,
  description TEXT         DEFAULT NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_slug     (slug),
  INDEX idx_category (category_id),
  INDEX idx_active   (is_active)
) ENGINE=InnoDB;

-- 2. Copy existing child categories from categories table
INSERT INTO subcategories (category_id, name, slug, description, is_active, sort_order)
SELECT parent_id, name, slug, description, is_active, sort_order
FROM categories
WHERE parent_id IS NOT NULL
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 3. Add subcategory_id and brand_id columns to products
ALTER TABLE products 
  ADD COLUMN subcategory_id INT UNSIGNED DEFAULT NULL,
  ADD COLUMN brand_id INT UNSIGNED DEFAULT NULL;

-- 4. Update products mapping: set subcategory_id by matching child category slug
UPDATE products p
JOIN categories old_cat ON old_cat.id = p.category_id AND old_cat.parent_id IS NOT NULL
JOIN subcategories new_sub ON new_sub.slug = old_cat.slug
SET p.subcategory_id = new_sub.id;

-- 5. Update products category_id to point to the large parent category (parent_id)
UPDATE products p
JOIN categories old_cat ON old_cat.id = p.category_id AND old_cat.parent_id IS NOT NULL
SET p.category_id = old_cat.parent_id;

-- 6. Insert core brands
INSERT INTO brands (name, slug, source_name, is_active) VALUES
  ('Casio', 'casio', 'Casio', 1),
  ('Seiko', 'seiko', 'Seiko', 1),
  ('Citizen', 'citizen', 'Citizen', 1),
  ('Orient', 'orient', 'Orient', 1),
  ('Tissot', 'tissot', 'Tissot', 1),
  ('Longines', 'longines', 'Longines', 1),
  ('Carnival', 'carnival', 'Carnival', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 7. Update products brand_id by matching the brand name text column
UPDATE products p
JOIN brands b ON LOWER(b.name) = LOWER(p.brand) OR LOWER(b.source_name) = LOWER(p.brand)
SET p.brand_id = b.id;

-- 8. Add foreign key constraints to products
ALTER TABLE products
  ADD CONSTRAINT fk_products_subcategory FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;

-- 9. Delete child categories from categories table
DELETE FROM categories WHERE parent_id IS NOT NULL;

-- 10. Remove parent_id column and foreign key constraint from categories table
ALTER TABLE categories DROP FOREIGN KEY categories_ibfk_1;
ALTER TABLE categories DROP COLUMN parent_id;
