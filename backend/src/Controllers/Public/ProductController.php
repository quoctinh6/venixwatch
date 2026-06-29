<?php

declare(strict_types=1);

namespace App\Controllers\Public;

use App\Config\Database;
use App\Models\Category;
use App\Models\FlashSale;
use App\Models\Product;
use App\Services\Public\ProductDetailService;

class ProductController
{
    private Product $model;
    private FlashSale $flashModel;
    private Category $categoryModel;
    private ProductDetailService $detailService;

    public function __construct()
    {
        $pdo = Database::getInstance();
        $this->model = new Product($pdo);
        $this->flashModel = new FlashSale($pdo);
        $this->categoryModel = new Category($pdo);
        $this->detailService = new ProductDetailService();
    }

    public function index(): void
    {
        $categoryId = (int)($_GET['category_id'] ?? 0) ?: null;
        $categorySlug = trim($_GET['category_slug'] ?? '');
        $childSlug = trim($_GET['category'] ?? '');
        
        $subId = null;
        
        if ($childSlug !== '') {
            $resolved = $childSlug;
            if ($categorySlug !== '') {
                $stmt = Database::getInstance()->prepare('SELECT id, category_id FROM subcategories WHERE slug = :slug OR slug = :slug2 LIMIT 1');
                $stmt->execute([':slug' => "{$categorySlug}-{$childSlug}", ':slug2' => $childSlug]);
                $sub = $stmt->fetch();
                if ($sub) {
                    $subId = (int)$sub['id'];
                    $categoryId = (int)$sub['category_id'];
                }
            }
        } elseif ($categorySlug !== '') {
            $stmt = Database::getInstance()->prepare('SELECT id, category_id FROM subcategories WHERE slug = :slug LIMIT 1');
            $stmt->execute([':slug' => $categorySlug]);
            $sub = $stmt->fetch();
            if ($sub) {
                $subId = (int)$sub['id'];
                $categoryId = (int)$sub['category_id'];
            } else {
                $stmt = Database::getInstance()->prepare('SELECT id FROM categories WHERE slug = :slug LIMIT 1');
                $stmt->execute([':slug' => $categorySlug]);
                $cat = $stmt->fetch();
                if ($cat) {
                    $categoryId = (int)$cat['id'];
                }
            }
        }

        $filters = [
            'page' => (int)($_GET['page'] ?? 1),
            'limit' => (int)($_GET['limit'] ?? 16),
            'search' => trim($_GET['search'] ?? ''),
            'category_id' => $categoryId,
            'subcategory_id' => $subId,
            'badge' => trim($_GET['badge'] ?? ''),
            'brand' => trim($_GET['brand'] ?? ''),
            'featured' => (int)($_GET['featured'] ?? 0) ?: null,
            'sort' => trim($_GET['sort'] ?? ''),
            'price_min' => isset($_GET['price_min']) ? (float)$_GET['price_min'] : null,
            'price_max' => isset($_GET['price_max']) ? (float)$_GET['price_max'] : null,
            'dial_color' => trim($_GET['dial_color'] ?? '') ?: null,
            'strap_type' => trim($_GET['strap_type'] ?? '') ?: null,
            'is_active' => 1,
            'parent_only' => 1,
        ];

        $result = $this->model->findAll(array_filter($filters, fn($v) => $v !== null && $v !== ''));
        foreach ($result['data'] as &$product) {
            $product['flash_sale'] = $this->flashModel->findByProduct((int)$product['id']) ?: null;
        }

        $this->respond([
            'success' => true,
            'data' => $result['data'],
            'meta' => [
                'total' => $result['total'],
                'page' => $result['page'],
                'limit' => $result['limit'],
                'total_pages' => (int)ceil($result['total'] / max(1, $result['limit'])),
            ],
        ]);
    }

    public function featured(): void { $this->respond(['success' => true, 'data' => $this->model->getFeatured((int)($_GET['limit'] ?? 8))]); }
    public function show(string $slug): void { $this->respond($this->detailService->getDetail($slug)); }
    public function images(int $id): void { $this->respond($this->detailService->getImages($id)); }
    public function specs(int $id): void { $this->respond($this->detailService->getSpecs($id)); }
    public function related(int $id): void { $this->respond($this->detailService->getRelated($id)); }
    public function crossSell(int $id): void { $this->respond($this->detailService->getRelated($id, 'cross_sell')); }

    public function trackView(int $id): void
    {
        $sessionId = trim($_SERVER['HTTP_X_CART_SESSION'] ?? ($_GET['session_id'] ?? session_id() ?: 'guest'));
        $this->respond($this->detailService->trackView($id, $sessionId));
    }

    public function recentlyViewed(): void
    {
        $sessionId = trim($_SERVER['HTTP_X_CART_SESSION'] ?? ($_GET['session_id'] ?? session_id() ?: 'guest'));
        $this->respond($this->detailService->getRecentlyViewed($sessionId));
    }

    private function respond(array $result, int $successCode = 200): void
    {
        if (!($result['success'] ?? false)) {
            http_response_code($result['code'] ?? 400);
            echo json_encode(['success' => false, 'error' => $result['error'] ?? 'Error', 'code' => $result['code'] ?? 400]);
            return;
        }
        http_response_code($successCode);
        echo json_encode(['success' => true, 'data' => $result['data'] ?? null, 'meta' => $result['meta'] ?? null]);
    }
}
