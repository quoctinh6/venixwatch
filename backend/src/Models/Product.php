<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

class Product
{
    public function __construct(private PDO $pdo) {}

    public function findAll(array $filters = []): array
    {
        $where  = ['1=1'];
        $params = [];

        if (!empty($filters['category_ids']) && is_array($filters['category_ids'])) {
            $placeholders = [];
            foreach (array_values($filters['category_ids']) as $index => $categoryId) {
                $key = ":category_id_{$index}";
                $placeholders[] = $key;
                $params[$key] = (int)$categoryId;
            }
            if ($placeholders) {
                $where[] = 'p.category_id IN (' . implode(', ', $placeholders) . ')';
            }
        } elseif (!empty($filters['category_id'])) {
            $where[]                   = 'p.category_id = :category_id';
            $params[':category_id']    = (int)$filters['category_id'];
        }

        if (!empty($filters['subcategory_id'])) {
            $where[]                   = 'p.subcategory_id = :subcategory_id';
            $params[':subcategory_id'] = (int)$filters['subcategory_id'];
        }

        if (!empty($filters['brand_id'])) {
            $where[]                   = 'p.brand_id = :brand_id';
            $params[':brand_id']       = (int)$filters['brand_id'];
        }

        if (!empty($filters['badge'])) {
            if (strtoupper($filters['badge']) === 'SALE') {
                $where[] = 'fs.sale_price IS NOT NULL';
            } else {
                $where[]          = 'p.badge = :badge';
                $params[':badge'] = $filters['badge'];
            }
        }
        if (!empty($filters['featured'])) {
            $where[] = 'p.is_featured = 1';
        }
        if (!empty($filters['is_active'])) {
            $where[]              = 'p.is_active = :is_active';
            $params[':is_active'] = (int)$filters['is_active'];
        }
        if (!empty($filters['search'])) {
            $where[]                      = '(p.name LIKE :search_name OR p.sku LIKE :search_sku OR p.brand LIKE :search_brand OR b.name LIKE :search_brand_name OR c.name LIKE :search_cat OR s.name LIKE :search_sub)';
            $params[':search_name']       = '%' . $filters['search'] . '%';
            $params[':search_sku']        = '%' . $filters['search'] . '%';
            $params[':search_brand']      = '%' . $filters['search'] . '%';
            $params[':search_brand_name'] = '%' . $filters['search'] . '%';
            $params[':search_cat']        = '%' . $filters['search'] . '%';
            $params[':search_sub']        = '%' . $filters['search'] . '%';
        }
        if (!empty($filters['brand'])) {
            $where[] = 'p.brand = :brand';
            $params[':brand'] = $filters['brand'];
        }
        if (isset($filters['price_min']) && $filters['price_min'] !== null && $filters['price_min'] !== '') {
            $where[] = 'COALESCE(fs.sale_price, p.sale_price, p.price) >= :price_min';
            $params[':price_min'] = (float)$filters['price_min'];
        }
        if (isset($filters['price_max']) && $filters['price_max'] !== null && $filters['price_max'] !== '') {
            $where[] = 'COALESCE(fs.sale_price, p.sale_price, p.price) <= :price_max';
            $params[':price_max'] = (float)$filters['price_max'];
        }

        if (isset($filters['parent_only']) && (int)$filters['parent_only'] === 1) {
            $where[] = 'p.parent_id IS NULL';
        }
        if (!empty($filters['dial_color'])) {
            $where[] = '(p.dial_color = :dial_color_f1 OR p.id IN (SELECT DISTINCT parent_id FROM products WHERE dial_color = :dial_color_f2 AND parent_id IS NOT NULL))';
            $params[':dial_color_f1'] = $filters['dial_color'];
            $params[':dial_color_f2'] = $filters['dial_color'];
        }
        if (!empty($filters['strap_type'])) {
            $where[] = '(p.strap_type = :strap_type_f1 OR p.id IN (SELECT DISTINCT parent_id FROM products WHERE strap_type = :strap_type_f2 AND parent_id IS NOT NULL))';
            $params[':strap_type_f1'] = $filters['strap_type'];
            $params[':strap_type_f2'] = $filters['strap_type'];
        }

        $page   = max(1, (int)($filters['page']  ?? 1));
        $limit  = max(1, (int)($filters['limit'] ?? 20));
        $offset = ($page - 1) * $limit;

        $whereStr  = implode(' AND ', $where);
        $countStmt = $this->pdo->prepare(
            "SELECT COUNT(*) FROM products p 
             LEFT JOIN categories c ON c.id = p.category_id
             LEFT JOIN subcategories s ON s.id = p.subcategory_id
             LEFT JOIN brands b ON b.id = p.brand_id 
             LEFT JOIN flash_sales fs ON fs.product_id = p.id AND fs.starts_at <= NOW() AND fs.ends_at >= NOW()
             WHERE {$whereStr}"
        );
        foreach ($params as $k => $v) {
            $type = is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR;
            $countStmt->bindValue($k, $v, $type);
        }
        $countStmt->execute();
        $total = (int)$countStmt->fetchColumn();

        $orderBy = match ($filters['sort'] ?? '') {
            'price_asc'  => 'COALESCE(fs.sale_price, p.sale_price, p.price) ASC, p.created_at DESC',
            'price_desc' => 'COALESCE(fs.sale_price, p.sale_price, p.price) DESC, p.created_at DESC',
            'name_asc'   => 'p.name ASC',
            'name_desc'  => 'p.name DESC',
            'cat_asc'    => 'c.name ASC, p.name ASC',
            'cat_desc'   => 'c.name DESC, p.name ASC',
            'sku_asc'    => 'p.sku ASC',
            'sku_desc'   => 'p.sku DESC',
            'stock_asc'  => 'p.stock ASC, p.created_at DESC',
            'stock_desc' => 'p.stock DESC, p.created_at DESC',
            'bestseller' => 'p.sold_count DESC, p.created_at DESC',
            'new'        => 'p.created_at DESC',
            default      => 'p.created_at DESC',
        };

        $sql = "SELECT p.*, c.name AS category_name, s.name AS subcategory_name, b.name AS brand_name,
                       fs.sale_price AS flash_sale_price
                FROM products p
                LEFT JOIN categories c ON c.id = p.category_id
                LEFT JOIN subcategories s ON s.id = p.subcategory_id
                LEFT JOIN brands b ON b.id = p.brand_id
                LEFT JOIN flash_sales fs ON fs.product_id = p.id AND fs.starts_at <= NOW() AND fs.ends_at >= NOW()
                WHERE {$whereStr}
                ORDER BY {$orderBy}
                LIMIT :limit OFFSET :offset";

        $stmt = $this->pdo->prepare($sql);
        foreach ($params as $k => $v) {
            $type = is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR;
            $stmt->bindValue($k, $v, $type);
        }
        $stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();

        foreach ($rows as &$row) {
            if (isset($row['flash_sale_price']) && $row['flash_sale_price'] !== null) {
                $row['sale_price'] = $row['flash_sale_price'];
            }
            $row['images'] = $row['images'] ? json_decode($row['images'], true) : [];
            $row['specs'] = !empty($row['specs']) ? json_decode($row['specs'], true) : null;
        }

        return ['data' => $rows, 'total' => $total, 'page' => $page, 'limit' => $limit];
    }

    public function findById(int $id): array|false
    {
        $stmt = $this->pdo->prepare(
            'SELECT p.*, c.name AS category_name, s.name AS subcategory_name, b.name AS brand_name,
                    fs.sale_price AS flash_sale_price
             FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             LEFT JOIN subcategories s ON s.id = p.subcategory_id
             LEFT JOIN brands b ON b.id = p.brand_id
             LEFT JOIN flash_sales fs ON fs.product_id = p.id AND fs.starts_at <= NOW() AND fs.ends_at >= NOW()
             WHERE p.id = :id LIMIT 1'
        );
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch();
        if ($row) {
            if (isset($row['flash_sale_price']) && $row['flash_sale_price'] !== null) {
                $row['sale_price'] = $row['flash_sale_price'];
            }
            $row['images'] = $row['images'] ? json_decode($row['images'], true) : [];
            $row['specs'] = !empty($row['specs']) ? json_decode($row['specs'], true) : null;
        }
        return $row;
    }

    public function findBySlug(string $slug): array|false
    {
        $stmt = $this->pdo->prepare(
            'SELECT p.*, c.name AS category_name, s.name AS subcategory_name, b.name AS brand_name,
                    fs.sale_price AS flash_sale_price
             FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             LEFT JOIN subcategories s ON s.id = p.subcategory_id
             LEFT JOIN brands b ON b.id = p.brand_id
             LEFT JOIN flash_sales fs ON fs.product_id = p.id AND fs.starts_at <= NOW() AND fs.ends_at >= NOW()
             WHERE p.slug = :slug LIMIT 1'
        );
        $stmt->bindValue(':slug', $slug, PDO::PARAM_STR);
        $stmt->execute();
        $row = $stmt->fetch();
        if ($row) {
            if (isset($row['flash_sale_price']) && $row['flash_sale_price'] !== null) {
                $row['sale_price'] = $row['flash_sale_price'];
            }
            $row['images'] = $row['images'] ? json_decode($row['images'], true) : [];
            $row['specs'] = !empty($row['specs']) ? json_decode($row['specs'], true) : null;
        }
        return $row;
    }

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO products
               (category_id, subcategory_id, brand_id, name, slug, description, price, sale_price, stock, sku,
                brand, case_material, case_size, movement_type, water_resistance,
                images, is_active, is_featured, badge,
                meta_title, meta_description, og_image, parent_id, strap_type, dial_color, specs)
             VALUES
               (:category_id, :subcategory_id, :brand_id, :name, :slug, :description, :price, :sale_price, :stock, :sku,
                :brand, :case_material, :case_size, :movement_type, :water_resistance,
                :images, :is_active, :is_featured, :badge,
                :meta_title, :meta_description, :og_image, :parent_id, :strap_type, :dial_color, :specs)'
        );
        $this->bindProductValues($stmt, $data);
        $stmt->execute();
        return (int)$this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE products SET
               category_id = :category_id, subcategory_id = :subcategory_id, brand_id = :brand_id, 
               name = :name, slug = :slug, description = :description, 
               price = :price, sale_price = :sale_price, stock = :stock, sku = :sku, 
               brand = :brand, case_material = :case_material, case_size = :case_size,
               movement_type = :movement_type, water_resistance = :water_resistance,
               images = :images, is_active = :is_active, is_featured = :is_featured,
               badge = :badge, meta_title = :meta_title,
               meta_description = :meta_description, og_image = :og_image,
               parent_id = :parent_id, strap_type = :strap_type, dial_color = :dial_color, specs = :specs
             WHERE id = :id'
        );
        $this->bindProductValues($stmt, $data);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    private function bindProductValues(\PDOStatement $stmt, array $d): void
    {
        $images = isset($d['images']) ? json_encode($d['images']) : null;
        $specs = isset($d['specs']) ? json_encode($d['specs']) : null;
        $stmt->bindValue(':category_id',      (int)($d['category_id'] ?? 0),    PDO::PARAM_INT);
        $stmt->bindValue(':subcategory_id',   isset($d['subcategory_id']) && $d['subcategory_id'] !== '' ? (int)$d['subcategory_id'] : null, PDO::PARAM_INT);
        $stmt->bindValue(':brand_id',         isset($d['brand_id']) && $d['brand_id'] !== '' ? (int)$d['brand_id'] : null, PDO::PARAM_INT);
        $stmt->bindValue(':name',             $d['name']              ?? '',     PDO::PARAM_STR);
        $stmt->bindValue(':slug',             $d['slug']              ?? '',     PDO::PARAM_STR);
        $stmt->bindValue(':description',      $d['description']       ?? null,   PDO::PARAM_STR);
        $stmt->bindValue(':price',            $d['price']             ?? 0);
        $stmt->bindValue(':sale_price',       $d['sale_price']        ?? null);
        $stmt->bindValue(':stock',            (int)($d['stock']       ?? 0),     PDO::PARAM_INT);
        $stmt->bindValue(':sku',              $d['sku']               ?? '',     PDO::PARAM_STR);
        $stmt->bindValue(':brand',            $d['brand']             ?? null,   PDO::PARAM_STR);
        $stmt->bindValue(':case_material',    $d['case_material']     ?? null,   PDO::PARAM_STR);
        $stmt->bindValue(':case_size',        $d['case_size']         ?? null,   PDO::PARAM_STR);
        $stmt->bindValue(':movement_type',    $d['movement_type']     ?? 'quartz', PDO::PARAM_STR);
        $stmt->bindValue(':water_resistance', $d['water_resistance']  ?? null,   PDO::PARAM_STR);
        $stmt->bindValue(':images',           $images,                            PDO::PARAM_STR);
        $stmt->bindValue(':is_active',        (int)($d['is_active']   ?? 1),     PDO::PARAM_INT);
        $stmt->bindValue(':is_featured',      (int)($d['is_featured'] ?? 0),     PDO::PARAM_INT);
        $stmt->bindValue(':badge',            $d['badge']             ?? null,   PDO::PARAM_STR);
        $stmt->bindValue(':meta_title',       $d['meta_title']        ?? null,   PDO::PARAM_STR);
        $stmt->bindValue(':meta_description', $d['meta_description']  ?? null,   PDO::PARAM_STR);
        $stmt->bindValue(':og_image',         $d['og_image']          ?? null,   PDO::PARAM_STR);
        $stmt->bindValue(':parent_id',        isset($d['parent_id']) && $d['parent_id'] !== '' ? (int)$d['parent_id'] : null, PDO::PARAM_INT);
        $stmt->bindValue(':strap_type',       $d['strap_type']        ?? null,   PDO::PARAM_STR);
        $stmt->bindValue(':dial_color',       $d['dial_color']        ?? null,   PDO::PARAM_STR);
        $stmt->bindValue(':specs',            $specs,                            PDO::PARAM_STR);
    }

    public function delete(int $id): bool
    {
        $product = $this->findById($id);
        if ($product) {
            $images = $product['images'] ?? [];
            $publicDir = dirname(__DIR__, 2) . '/public';
            foreach ($images as $imgUrl) {
                if (is_string($imgUrl)) {
                    $pos = strpos($imgUrl, '/image/product/');
                    if ($pos !== false) {
                        $localPath = $publicDir . substr($imgUrl, $pos);
                        if (file_exists($localPath) && is_file($localPath)) {
                            unlink($localPath);
                        }
                    }
                }
            }
        }

        $stmt = $this->pdo->prepare('DELETE FROM products WHERE id = :id');
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function getFeatured(int $limit = 8): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT p.*, c.name AS category_name, s.name AS subcategory_name, b.name AS brand_name,
                    fs.sale_price AS flash_sale_price
             FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             LEFT JOIN subcategories s ON s.id = p.subcategory_id
             LEFT JOIN brands b ON b.id = p.brand_id
             LEFT JOIN flash_sales fs ON fs.product_id = p.id AND fs.starts_at <= NOW() AND fs.ends_at >= NOW()
             WHERE p.is_featured = 1 AND p.is_active = 1 AND p.parent_id IS NULL
             ORDER BY p.created_at DESC LIMIT :limit'
        );
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            if (isset($row['flash_sale_price']) && $row['flash_sale_price'] !== null) {
                $row['sale_price'] = $row['flash_sale_price'];
            }
            $row['images'] = $row['images'] ? json_decode($row['images'], true) : [];
            $row['specs'] = !empty($row['specs']) ? json_decode($row['specs'], true) : null;
        }
        return $rows;
    }

    public function getLowStock(int $threshold = 5): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT p.*, c.name AS category_name
             FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             WHERE p.stock <= :threshold AND p.is_active = 1
             ORDER BY p.stock ASC'
        );
        $stmt->bindValue(':threshold', $threshold, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function toggleActive(int $id): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE products SET is_active = 1 - is_active WHERE id = :id'
        );
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function recomputeBadges(): array
    {
        // Reset all badges
        $this->pdo->exec("UPDATE products SET badge = NULL");

        // BESTSELLER: top 10 products by total quantity sold from completed orders
        $bestsellers = $this->pdo->query(
            "SELECT oi.product_id
             FROM order_items oi
             INNER JOIN orders o ON o.id = oi.order_id
             GROUP BY oi.product_id
             ORDER BY SUM(oi.quantity) DESC
             LIMIT 10"
        );
        $bestIds = $bestsellers ? $bestsellers->fetchAll(PDO::FETCH_COLUMN) : [];

        if (!empty($bestIds)) {
            $placeholders = implode(',', array_fill(0, count($bestIds), '?'));
            $stmt = $this->pdo->prepare(
                "UPDATE products SET badge = 'BESTSELLER' WHERE id IN ({$placeholders})"
            );
            $stmt->execute($bestIds);
        }

        // NEW: created within last 30 days (only if not already BESTSELLER)
        $this->pdo->exec(
            "UPDATE products SET badge = 'NEW'
             WHERE badge IS NULL
               AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
        );

        // Return counts
        $stats = $this->pdo->query(
            "SELECT badge, COUNT(*) AS cnt FROM products GROUP BY badge"
        )->fetchAll();

        return $stats;
    }

    public function findVariants(int $id): array
    {
        $stmt = $this->pdo->prepare('SELECT parent_id FROM products WHERE id = :id LIMIT 1');
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $parentId = $stmt->fetchColumn();

        $effectiveParentId = ($parentId !== null && $parentId !== false && $parentId !== '') ? (int)$parentId : $id;

        $stmt = $this->pdo->prepare(
            'SELECT p.*, c.name AS category_name, s.name AS subcategory_name, b.name AS brand_name,
                    fs.sale_price AS flash_sale_price
             FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             LEFT JOIN subcategories s ON s.id = p.subcategory_id
             LEFT JOIN brands b ON b.id = p.brand_id
             LEFT JOIN flash_sales fs ON fs.product_id = p.id AND fs.starts_at <= NOW() AND fs.ends_at >= NOW()
             WHERE (p.id = :parent_id1 OR p.parent_id = :parent_id2) AND p.id != :id
             ORDER BY p.id ASC'
        );
        $stmt->bindValue(':parent_id1', $effectiveParentId, PDO::PARAM_INT);
        $stmt->bindValue(':parent_id2', $effectiveParentId, PDO::PARAM_INT);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            if (isset($row['flash_sale_price']) && $row['flash_sale_price'] !== null) {
                $row['sale_price'] = $row['flash_sale_price'];
            }
            $row['images'] = $row['images'] ? json_decode($row['images'], true) : [];
            $row['specs'] = !empty($row['specs']) ? json_decode($row['specs'], true) : null;
        }
        return $rows;
    }
}
