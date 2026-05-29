<?php

declare(strict_types=1);

namespace App\Modules\Admin\Product;

use App\Config\Database;
use App\Models\Product;

class ProductService
{
    private Product $model;

    public function __construct()
    {
        $this->model = new Product(Database::getInstance());
    }

    public function paginate(array $filters): array
    {
        $result = $this->model->findAll($filters);
        return [
            'success' => true,
            'data'    => $result['data'],
            'meta'    => [
                'total'       => $result['total'],
                'page'        => $result['page'],
                'limit'       => $result['limit'],
                'total_pages' => (int)ceil($result['total'] / max(1, $result['limit'])),
            ],
        ];
    }

    public function create(array $data): array
    {
        $this->resolveCategorySubcategoryAndBrand($data);

        $validation = $this->validate($data);
        if ($validation !== null) {
            return $validation;
        }

        $data['slug'] = $this->ensureUniqueSlug($data['slug'] ?? $this->slugify($data['name']));

        $id      = $this->model->create($data);
        $product = $this->model->findById($id);
        return ['success' => true, 'data' => $product];
    }

    public function update(int $id, array $data): array
    {
        $existing = $this->model->findById($id);
        if (!$existing) {
            return ['success' => false, 'error' => 'Product not found.', 'code' => 404];
        }

        $this->resolveCategorySubcategoryAndBrand($data, $existing);

        $validation = $this->validate($data, $id);
        if ($validation !== null) {
            return $validation;
        }

        if (empty($data['slug'])) {
            $data['slug'] = $existing['slug'];
        }

        $this->model->update($id, $data);
        return ['success' => true, 'data' => $this->model->findById($id)];
    }

    private function resolveCategorySubcategoryAndBrand(array &$data, ?array $existing = null): void
    {
        $pdo = Database::getInstance();

        // 1. Resolve subcategory_id
        if (empty($data['subcategory_id'])) {
            if ($existing && !empty($existing['subcategory_id'])) {
                $data['subcategory_id'] = (int)$existing['subcategory_id'];
            } elseif (!empty($data['category_id'])) {
                // Find first subcategory under category_id
                $stmt = $pdo->prepare("SELECT id FROM subcategories WHERE category_id = :category_id ORDER BY sort_order ASC, id ASC LIMIT 1");
                $stmt->execute([':category_id' => (int)$data['category_id']]);
                $subId = $stmt->fetchColumn();
                if ($subId) {
                    $data['subcategory_id'] = (int)$subId;
                }
            }
        }

        // 2. Resolve brand_id from brand string
        if (!empty($data['brand'])) {
            $brandName = trim($data['brand']);
            $stmt = $pdo->prepare("SELECT id FROM brands WHERE name = :name1 OR source_name = :name2 LIMIT 1");
            $stmt->execute([
                ':name1' => $brandName,
                ':name2' => $brandName
            ]);
            $brandId = $stmt->fetchColumn();
            
            if ($brandId) {
                $data['brand_id'] = (int)$brandId;
            } else {
                // Automatically create brand
                $slug = $this->slugify($brandName);
                $base = $slug;
                $counter = 1;
                while (true) {
                    $stmtCheck = $pdo->prepare("SELECT id FROM brands WHERE slug = :slug LIMIT 1");
                    $stmtCheck->execute([':slug' => $slug]);
                    if (!$stmtCheck->fetchColumn()) {
                        break;
                    }
                    $slug = $base . '-' . $counter++;
                }

                $stmtInsert = $pdo->prepare("INSERT INTO brands (name, source_name, slug) VALUES (:name, :source_name, :slug)");
                $stmtInsert->execute([
                    ':name' => $brandName,
                    ':source_name' => $brandName,
                    ':slug' => $slug
                ]);
                $data['brand_id'] = (int)$pdo->lastInsertId();
            }
        }

        // 3. Fallback brand_id if empty
        if (empty($data['brand_id'])) {
            if ($existing && !empty($existing['brand_id'])) {
                $data['brand_id'] = (int)$existing['brand_id'];
            } else {
                // Grab first available brand
                $brandId = $pdo->query("SELECT id FROM brands LIMIT 1")->fetchColumn();
                if ($brandId) {
                    $data['brand_id'] = (int)$brandId;
                }
            }
        }
    }

    public function delete(int $id): array
    {
        if (!$this->model->findById($id)) {
            return ['success' => false, 'error' => 'Product not found.', 'code' => 404];
        }
        $this->model->delete($id);
        return ['success' => true, 'data' => ['message' => 'Product deleted.']];
    }

    public function toggleActive(int $id): array
    {
        if (!$this->model->findById($id)) {
            return ['success' => false, 'error' => 'Product not found.', 'code' => 404];
        }
        $this->model->toggleActive($id);
        return ['success' => true, 'data' => $this->model->findById($id)];
    }

    public function getLowStock(int $threshold = 5): array
    {
        return [
            'success' => true,
            'data'    => $this->model->getLowStock($threshold),
        ];
    }

    public function computeBadges(): array
    {
        $stats = $this->model->recomputeBadges();
        return ['success' => true, 'data' => ['message' => 'Badge đã được cập nhật tự động.', 'stats' => $stats]];
    }

    public function getById(int $id): array
    {
        $product = $this->model->findById($id);
        if (!$product) {
            return ['success' => false, 'error' => 'Product not found.', 'code' => 404];
        }
        return ['success' => true, 'data' => $product];
    }

    private function validate(array $data, int $excludeId = 0): ?array
    {
        if (empty($data['name'])) {
            return ['success' => false, 'error' => 'Product name is required.', 'code' => 400];
        }
        if (empty($data['category_id'])) {
            return ['success' => false, 'error' => 'Category is required.', 'code' => 400];
        }
        if (empty($data['subcategory_id'])) {
            return ['success' => false, 'error' => 'Subcategory is required.', 'code' => 400];
        }
        if (empty($data['brand_id'])) {
            return ['success' => false, 'error' => 'Brand is required.', 'code' => 400];
        }
        if (!isset($data['price']) || $data['price'] < 0) {
            return ['success' => false, 'error' => 'Valid price is required.', 'code' => 400];
        }
        if (empty($data['sku'])) {
            return ['success' => false, 'error' => 'SKU is required.', 'code' => 400];
        }
        return null;
    }

    private function slugify(string $text): string
    {
        $text = mb_strtolower(trim($text));
        $text = preg_replace('/[àáạảãâầấậẩẫăằắặẳẵ]/u', 'a', $text);
        $text = preg_replace('/[èéẹẻẽêềếệểễ]/u', 'e', $text);
        $text = preg_replace('/[ìíịỉĩ]/u', 'i', $text);
        $text = preg_replace('/[òóọỏõôồốộổỗơờớợởỡ]/u', 'o', $text);
        $text = preg_replace('/[ùúụủũưừứựửữ]/u', 'u', $text);
        $text = preg_replace('/[ỳýỵỷỹ]/u', 'y', $text);
        $text = preg_replace('/[đ]/u', 'd', $text);
        $text = preg_replace('/[^a-z0-9\s-]/', '', $text);
        $text = preg_replace('/[\s-]+/', '-', $text);
        return trim($text, '-');
    }

    private function ensureUniqueSlug(string $slug, int $excludeId = 0): string
    {
        $base    = $slug;
        $counter = 1;
        while (true) {
            $existing = $this->model->findBySlug($slug);
            if (!$existing || (int)$existing['id'] === $excludeId) {
                break;
            }
            $slug = $base . '-' . $counter++;
        }
        return $slug;
    }
}
