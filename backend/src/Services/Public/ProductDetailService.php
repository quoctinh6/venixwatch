<?php

declare(strict_types=1);

namespace App\Services\Public;

use App\Config\Database;
use App\Models\Product;
use App\Models\RecentlyViewed;
use App\Models\Review;

class ProductDetailService
{
    private Product $products;
    private Review $reviews;
    private RecentlyViewed $recentlyViewed;

    public function __construct()
    {
        $pdo = Database::getInstance();
        $this->products = new Product($pdo);
        $this->reviews = new Review($pdo);
        $this->recentlyViewed = new RecentlyViewed($pdo);
    }

    public function getDetail(string $slug): array
    {
        $product = $this->products->findBySlug($slug);
        if (!$product || !(int)$product['is_active']) {
            return ['success' => false, 'error' => 'Product not found.', 'code' => 404];
        }

        $flashSales = new \App\Models\FlashSale(Database::getInstance());
        $activeFlash = $flashSales->findByProduct((int)$product['id']);
        if ($activeFlash) {
            $product['sale_price'] = $activeFlash['sale_price'];
        }

        $product['category_slug'] = $product['category_slug'] ?? $this->guessCategorySlug((string)($product['category_name'] ?? ''));
        $product['images'] = $this->buildImages($product);
        $product['ref_number'] = $product['sku'] ?? $product['slug'];
        $product['rating'] = $this->reviews->getSummary((int)$product['id']);
        $product['sold_count'] = ((int)$product['id'] * 7) % 140 + 12;
        $product['trust_badges'] = $this->trustBadges();
        $product['delivery'] = $this->deliveryInfo();
        $custom = [];
        if (!empty($product['specs'])) {
            $custom = is_string($product['specs']) ? json_decode($product['specs'], true) : $product['specs'];
        }
        $product['layout_desc_first'] = !isset($custom['_layout_desc_first']) || (bool)$custom['_layout_desc_first'];
        $product['specs'] = $this->buildSpecs($product);

        // Fetch variations/variants
        $parentId = $product['parent_id'] !== null ? (int)$product['parent_id'] : (int)$product['id'];
        
        $pdo = Database::getInstance();
        $vStmt = $pdo->prepare('
            SELECT id, name, slug, price, sale_price, stock, sku, strap_type, dial_color, images 
            FROM products 
            WHERE (id = :parent_id1 OR parent_id = :parent_id2) AND is_active = 1
        ');
        $vStmt->execute([
            ':parent_id1' => $parentId,
            ':parent_id2' => $parentId
        ]);
        $variantRows = $vStmt->fetchAll();
        
        $flashSalesModel = new \App\Models\FlashSale($pdo);
        foreach ($variantRows as &$vRow) {
            $vRow['images'] = $vRow['images'] ? json_decode($vRow['images'], true) : [];
            $vRow['image'] = !empty($vRow['images']) ? $vRow['images'][0] : null;
            
            $vFlash = $flashSalesModel->findByProduct((int)$vRow['id']);
            if ($vFlash) {
                $vRow['sale_price'] = $vFlash['sale_price'];
            }
        }
        $product['variants'] = $variantRows;

        return ['success' => true, 'data' => $product];
    }

    public function getImages(int $id): array
    {
        $product = $this->products->findById($id);
        if (!$product) return ['success' => false, 'error' => 'Product not found.', 'code' => 404];
        return ['success' => true, 'data' => $this->buildImages($product)];
    }

    public function getSpecs(int $id): array
    {
        $product = $this->products->findById($id);
        if (!$product) return ['success' => false, 'error' => 'Product not found.', 'code' => 404];
        return ['success' => true, 'data' => $this->buildSpecs($product)];
    }

    public function getRelated(int $id, string $mode = 'related'): array
    {
        $product = $this->products->findById($id);
        if (!$product) return ['success' => false, 'error' => 'Product not found.', 'code' => 404];

        $items = $this->products->findAll([
            'category_id' => (int)$product['category_id'],
            'is_active' => 1,
            'limit' => 20,
            'sort' => $mode === 'cross_sell' ? 'bestseller' : 'price_asc',
            'parent_only' => 1,
        ])['data'];

        $basePrice = (float)($product['sale_price'] ?: $product['price']);
        $filtered = array_values(array_filter($items, function (array $item) use ($id, $basePrice, $mode): bool {
            if ((int)$item['id'] === $id) return false;
            if ($mode === 'cross_sell') return true;
            $itemPrice = (float)($item['sale_price'] ?: $item['price']);
            return $itemPrice >= $basePrice * 0.7 && $itemPrice <= $basePrice * 1.3;
        }));

        return ['success' => true, 'data' => array_slice($filtered, 0, 10)];
    }

    public function trackView(int $id, string $sessionId): array
    {
        $product = $this->products->findById($id);
        if (!$product) return ['success' => false, 'error' => 'Product not found.', 'code' => 404];
        $this->recentlyViewed->track($id, $sessionId);
        return ['success' => true, 'data' => ['tracked' => true]];
    }

    public function getRecentlyViewed(string $sessionId): array
    {
        return ['success' => true, 'data' => $this->recentlyViewed->getBySession($sessionId)];
    }

    private function buildImages(array $product): array
    {
        $images = $product['images'] ?? [];
        if (is_string($images)) {
            $images = json_decode($images, true) ?: [];
        }
        return array_values(array_filter($images));
    }

    private function buildSpecs(array $p): array
    {
        $custom = [];
        if (!empty($p['specs'])) {
            $custom = is_string($p['specs']) ? json_decode($p['specs'], true) : $p['specs'];
        }

        $specs = [];

        // 1. Column-mapped core watch fields (only if filled in DB)
        if (!empty($p['brand'])) {
            $specs[] = ['label' => 'Thương hiệu', 'value' => $p['brand']];
        }
        if (!empty($p['category_name'])) {
            $specs[] = ['label' => 'Bộ sưu tập', 'value' => $p['category_name']];
        }
        if (!empty($p['sku'])) {
            $specs[] = ['label' => 'Mã sản phẩm', 'value' => $p['sku']];
        }
        if (!empty($p['case_material'])) {
            $specs[] = ['label' => 'Chất liệu vỏ', 'value' => $p['case_material']];
        }
        if (!empty($p['case_size'])) {
            $specs[] = ['label' => 'Đường kính mặt', 'value' => $p['case_size']];
        }
        if (!empty($p['movement_type'])) {
            $specs[] = ['label' => 'Loại máy', 'value' => strtoupper((string)$p['movement_type'])];
        }
        if (!empty($p['water_resistance'])) {
            $specs[] = ['label' => 'Chống nước', 'value' => $p['water_resistance']];
        }

        // 2. Custom specs from JSON (excluding internal layout keys, only if filled)
        if (is_array($custom)) {
            foreach ($custom as $label => $val) {
                if (str_starts_with((string)$label, '_')) {
                    continue; // Skip internal fields like _layout_desc_first
                }
                if ($val !== null && $val !== '') {
                    $exists = false;
                    foreach ($specs as $existingSpec) {
                        if (mb_strtolower($existingSpec['label']) === mb_strtolower($label)) {
                            $exists = true;
                            break;
                        }
                    }
                    if (!$exists) {
                        $specs[] = ['label' => $label, 'value' => $val];
                    }
                }
            }
        }

        return $specs;
    }

    private function deliveryInfo(): array
    {
        return ['delivery_eta' => '2-3 ngày làm việc', 'pickup_store' => '123 Nguyễn Huệ, Q.1, TP.HCM'];
    }

    private function trustBadges(): array
    {
        return [
            ['title' => 'Bảo hành', 'subtitle' => '2 năm chính hãng'],
            ['title' => 'Đổi trả', 'subtitle' => '30 ngày minh bạch'],
            ['title' => 'Chính hãng', 'subtitle' => 'Cam kết 100%'],
            ['title' => 'Freeship', 'subtitle' => 'Đơn từ 500K'],
        ];
    }

    private function guessCategorySlug(string $categoryName): string
    {
        $name = mb_strtolower($categoryName);
        if (str_contains($name, 'nữ')) return 'nu';
        if (str_contains($name, 'phụ kiện')) return 'phu-kien';
        return 'nam';
    }
}
