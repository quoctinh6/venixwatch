<?php

declare(strict_types=1);

namespace App\Controllers\Public;

use App\Config\Database;
use App\Models\CartItem;
use App\Models\Product;

class CartController
{
    private CartItem $cartModel;
    private Product  $productModel;

    public function __construct()
    {
        $pdo                = Database::getInstance();
        $this->cartModel    = new CartItem($pdo);
        $this->productModel = new Product($pdo);
    }

    /** GET /api/cart */
    public function index(): void
    {
        $sessionId = $this->getSessionId();
        $items     = $this->cartModel->getBySession($sessionId);
        $flashSales = new \App\Models\FlashSale(Database::getInstance());
        foreach ($items as &$item) {
            $activeFlash = $flashSales->findByProduct((int)$item['product_id']);
            if ($activeFlash) {
                $item['sale_price'] = $activeFlash['sale_price'];
            }
        }
        unset($item);

        $total     = array_reduce($items, function ($carry, $item) {
            $price = $item['sale_price'] ?? $item['price'];
            return $carry + ((float)$price * (int)$item['quantity']);
        }, 0);

        $this->respond([
            'success' => true,
            'data'    => [
                'session_id' => $sessionId,
                'items'      => $items,
                'total'      => $total,
                'count'      => array_sum(array_column($items, 'quantity')),
            ],
        ]);
    }

    /** POST /api/cart */
    public function store(): void
    {
        $body      = $this->body();
        $sessionId = $this->getSessionId();
        $productId = (int)($body['product_id'] ?? 0);
        $quantity  = max(1, (int)($body['quantity'] ?? 1));

        if ($productId === 0) {
            $this->respond(['success' => false, 'error' => 'product_id is required.', 'code' => 400]);
            return;
        }

        $product = $this->productModel->findById($productId);
        if (!$product || !$product['is_active']) {
            $this->respond(['success' => false, 'error' => 'Product not found.', 'code' => 404]);
            return;
        }

        if ($product['stock'] < $quantity) {
            $this->respond(['success' => false, 'error' => 'Insufficient stock.', 'code' => 422]);
            return;
        }

        $this->cartModel->addItem($sessionId, $productId, $quantity);
        $this->respond(['success' => true, 'data' => ['message' => 'Item added to cart.', 'session_id' => $sessionId]]);
    }

    /** PUT /api/cart/{productId} */
    public function update(int $productId): void
    {
        $body      = $this->body();
        $sessionId = $this->getSessionId();
        $quantity  = (int)($body['quantity'] ?? 0);

        $this->cartModel->updateQuantity($sessionId, $productId, $quantity);
        $this->respond(['success' => true, 'data' => ['message' => 'Cart updated.']]);
    }

    /** DELETE /api/cart/{productId} */
    public function destroy(int $productId): void
    {
        $sessionId = $this->getSessionId();
        $this->cartModel->removeItem($sessionId, $productId);
        $this->respond(['success' => true, 'data' => ['message' => 'Item removed.']]);
    }

    /** DELETE /api/cart */
    public function clear(): void
    {
        $sessionId = $this->getSessionId();
        $this->cartModel->clearSession($sessionId);
        $this->respond(['success' => true, 'data' => ['message' => 'Cart cleared.']]);
    }

    private function getSessionId(): string
    {
        // Try header first, then query param, then generate new
        $sessionId = $_SERVER['HTTP_X_CART_SESSION'] ?? $_GET['session_id'] ?? '';
        if (empty($sessionId)) {
            $sessionId = bin2hex(random_bytes(16));
        }
        return $sessionId;
    }

    private function body(): array
    {
        $raw = file_get_contents('php://input');
        return $raw ? (json_decode($raw, true) ?? []) : [];
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
