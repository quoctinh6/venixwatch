<?php

declare(strict_types=1);

namespace App\Controllers\Public;

use App\Config\Database;
use App\Middleware\AuthMiddleware;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\CartItem;
use App\Models\Product;

class OrderController
{
    private Order     $orderModel;
    private OrderItem $itemModel;
    private CartItem  $cartModel;
    private Product   $productModel;

    public function __construct()
    {
        $pdo                = Database::getInstance();
        $this->orderModel   = new Order($pdo);
        $this->itemModel    = new OrderItem($pdo);
        $this->cartModel    = new CartItem($pdo);
        $this->productModel = new Product($pdo);
    }

    public function index(): void
    {
        $user = AuthMiddleware::requireAuth();
        $orders = $this->orderModel->getByUser((int)$user['user_id']);
        foreach ($orders as &$order) {
            $order['items'] = $this->itemModel->getByOrder((int)$order['id']);
        }
        $this->respond(['success' => true, 'data' => $orders]);
    }

    /**
     * POST /api/orders
     * Public checkout — creates order from cart or explicit items array.
     */
    public function store(): void
    {
        $body = $this->body();

        // Validate required fields
        $required = ['customer_name', 'customer_phone', 'shipping_address'];
        foreach ($required as $field) {
            if (empty($body[$field])) {
                $this->respond(['success' => false, 'error' => "Field '{$field}' is required.", 'code' => 400]);
                return;
            }
        }

        if (!empty($body['customer_email']) && !filter_var($body['customer_email'], FILTER_VALIDATE_EMAIL)) {
            $this->respond(['success' => false, 'error' => 'Invalid email format.', 'code' => 400]);
            return;
        }

        // Resolve items from cart or explicit list
        $items = $this->resolveItems($body);
        if (empty($items)) {
            $this->respond(['success' => false, 'error' => 'No items in order.', 'code' => 400]);
            return;
        }

        // Calculate total
        $total = array_reduce($items, fn($carry, $item) =>
            $carry + ($item['unit_price'] * $item['quantity']), 0);

        // Create order
        $orderId = $this->orderModel->create([
            'user_id'          => $body['user_id']  ?? null,
            'customer_name'    => $body['customer_name'],
            'customer_email'   => $body['customer_email'] ?? '',
            'customer_phone'   => $body['customer_phone'],
            'shipping_address' => $body['shipping_address'],
            'total_amount'     => $total,
            'status'           => 'pending',
            'notes'            => $body['notes'] ?? null,
        ]);

        // Create order items
        foreach ($items as $item) {
            $this->itemModel->create([
                'order_id'      => $orderId,
                'product_id'    => $item['product_id'],
                'product_name'  => $item['product_name'],
                'product_price' => $item['unit_price'],
                'quantity'      => $item['quantity'],
            ]);
        }

        // Clear cart if session provided
        if (!empty($body['session_id'])) {
            $this->cartModel->clearSession($body['session_id']);
        }

        $order          = $this->orderModel->findById($orderId);
        $order['items'] = $this->itemModel->getByOrder($orderId);

        $this->respond(['success' => true, 'data' => $order], 201);
    }

    private function resolveItems(array $body): array
    {
        $resolved = [];

        // Option A: explicit items array in body
        if (!empty($body['items']) && is_array($body['items'])) {
            foreach ($body['items'] as $item) {
                $productId = (int)($item['product_id'] ?? 0);
                $quantity  = max(1, (int)($item['quantity'] ?? $item['qty'] ?? 1));
                if ($productId === 0) continue;

                $product = $this->productModel->findById($productId);
                if (!$product || !$product['is_active']) continue;

                $price = $product['sale_price'] ?? $product['price'];
                $resolved[] = [
                    'product_id'   => $productId,
                    'product_name' => $product['name'],
                    'unit_price'   => (float)$price,
                    'quantity'     => $quantity,
                ];
            }
            return $resolved;
        }

        // Option B: pull from cart session
        if (!empty($body['session_id'])) {
            $cartItems = $this->cartModel->getBySession($body['session_id']);
            foreach ($cartItems as $item) {
                $price = $item['sale_price'] ?? $item['price'];
                $resolved[] = [
                    'product_id'   => (int)$item['product_id'],
                    'product_name' => $item['name'],
                    'unit_price'   => (float)$price,
                    'quantity'     => (int)$item['quantity'],
                ];
            }
        }

        return $resolved;
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
