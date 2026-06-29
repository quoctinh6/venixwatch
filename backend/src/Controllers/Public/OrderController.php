<?php

declare(strict_types=1);

namespace App\Controllers\Public;

use App\Config\Config;
use App\Config\Database;
use App\Middleware\AuthMiddleware;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\CartItem;
use App\Models\Product;
use App\Services\Mailer;

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

        // Extract user_id from token if logged in
        $user = AuthMiddleware::getUser();
        $userId = $user ? (int)$user['user_id'] : ($body['user_id'] ?? null);

        // Create order
        $orderId = $this->orderModel->create([
            'user_id'          => $userId,
            'customer_name'    => $body['customer_name'],
            'customer_email'   => $body['customer_email'] ?? '',
            'customer_phone'   => $body['customer_phone'],
            'shipping_address' => $body['shipping_address'],
            'total_amount'     => $total,
            'status'           => 'pending',
            'notes'            => $body['notes'] ?? null,
            'payment_method'   => $body['payment_method'] ?? 'cod',
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
        if ($order && (!isset($order['payment_method']) || empty($order['payment_method']))) {
            $order['payment_method'] = $body['payment_method'] ?? 'cod';
        }
        $order['items'] = $this->itemModel->getByOrder($orderId);

        // Send confirmation email
        $this->sendOrderEmail($order, $order['items']);

        $this->respond(['success' => true, 'data' => $order], 201);
    }

    private function sendOrderEmail(array $order, array $items): void
    {
        $to = $order['customer_email'] ?? '';
        if (empty($to)) {
            return;
        }

        $orderId = $order['id'];
        $isCod = ($order['payment_method'] ?? 'cod') === 'cod';
        
        $subject = $isCod 
            ? "[Venix Watch] Đặt hàng thành công #" . $orderId 
            : "[Venix Watch] Xác nhận thanh toán thành công #" . $orderId;

        $emailTitle = $isCod 
            ? "Xác nhận đặt hàng" 
            : "Xác nhận thanh toán";

        $titleHeading = $isCod
            ? "Cảm ơn bạn đã đặt hàng thành công!"
            : "Cảm ơn bạn đã thanh toán thành công!";

        $desc = $isCod
            ? "Xin chào <strong>{$order['customer_name']}</strong>, chúng tôi đã tiếp nhận đơn hàng <strong>#{$orderId}</strong> của bạn và đang tiến hành xử lý."
            : "Xin chào <strong>{$order['customer_name']}</strong>, chúng tôi đã tiếp nhận thanh toán cho đơn hàng <strong>#{$orderId}</strong> của bạn và đang tiến hành xử lý.";

        $statusLabel = $isCod ? "Chờ xác nhận" : "Đã thanh toán";
        
        $itemsHtml = '';
        foreach ($items as $item) {
            $formattedPrice = number_format((float)$item['product_price'], 0, ',', '.') . ' ₫';
            $formattedSubtotal = number_format((float)($item['product_price'] * $item['quantity']), 0, ',', '.') . ' ₫';
            $itemsHtml .= "
                <tr>
                    <td style='padding: 12px 8px; border-bottom: 1px solid #eeeeee; font-size: 14px; color: #333333; line-height: 1.5;'>
                        <div style='font-weight: 500; margin-bottom: 4px; color: #111111;'>{$item['product_name']}</div>
                        <div style='font-size: 12px; color: #666666;'>Số lượng: {$item['quantity']} × {$formattedPrice}</div>
                    </td>
                    <td style='padding: 12px 8px; border-bottom: 1px solid #eeeeee; font-size: 14px; color: #C9A961; text-align: right; font-weight: bold; white-space: nowrap; vertical-align: top;'>
                        {$formattedSubtotal}
                    </td>
                </tr>
            ";
        }

        $formattedTotal = number_format((float)$order['total_amount'], 0, ',', '.') . ' ₫';
        $paymentLabel = match ($order['payment_method'] ?? 'cod') {
            'cod' => 'Thanh toán khi nhận hàng (COD)',
            'bank' => 'Chuyển khoản ngân hàng',
            'momo' => 'Ví MoMo',
            default => $order['payment_method']
        };

        $message = "
        <html>
        <head>
            <title>{$emailTitle}</title>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; background-color: #f6f6f6; }
                .container { max-width: 600px; margin: 20px auto; background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                .header { text-align: center; border-bottom: 2px solid #C9A961; padding-bottom: 20px; margin-bottom: 20px; }
                .logo { font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #0A0A0A; text-transform: uppercase; margin: 0; }
                .tagline { font-size: 10px; color: #888888; letter-spacing: 2px; text-transform: uppercase; margin-top: 5px; }
                .order-summary { width: 100%; border-collapse: collapse; margin-top: 20px; }
                .order-summary th { background: #fafafa; padding: 12px 8px; font-size: 12px; font-weight: bold; color: #555555; text-transform: uppercase; border-bottom: 2px solid #eeeeee; }
                .info-grid { width: 100%; margin-bottom: 20px; }
                .info-card { background: #fafafa; padding: 15px; border-radius: 8px; border: 1px solid #eeeeee; margin-bottom: 10px; }
                .info-card h4 { margin: 0 0 10px 0; font-size: 13px; color: #0A0A0A; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
                .info-card p { margin: 5px 0; font-size: 13px; color: #555555; }
                .total-row td { padding: 15px 8px 12px 8px; font-size: 15px; font-weight: bold; color: #0A0A0A; border-top: 2px solid #eeeeee; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 12px; color: #888888; }
                
                @media only screen and (max-width: 600px) {
                    .container { padding: 15px !important; margin: 10px auto !important; border-radius: 8px !important; }
                    .header { padding-bottom: 15px !important; margin-bottom: 15px !important; }
                    .logo { font-size: 20px !important; }
                }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1 class='logo'>Venix Watch</h1>
                    <div class='tagline'>Đỉnh cao tinh xảo — Phong cách vĩnh cửu</div>
                </div>
                
                <h2 style='color: #0A0A0A; font-size: 20px; margin-bottom: 10px;'>{$titleHeading}</h2>
                <p style='font-size: 14px; color: #555555;'>{$desc}</p>
                
                <div class='info-grid'>
                    <div class='info-card'>
                        <h4>Thông tin giao hàng</h4>
                        <p><strong>Người nhận:</strong> {$order['customer_name']}</p>
                        <p><strong>Điện thoại:</strong> {$order['customer_phone']}</p>
                        <p><strong>Địa chỉ:</strong> {$order['shipping_address']}</p>
                    </div>
                    <div class='info-card'>
                        <h4>Chi tiết thanh toán</h4>
                        <p><strong>Phương thức:</strong> {$paymentLabel}</p>
                        <p><strong>Trạng thái:</strong> {$statusLabel}</p>
                    </div>
                </div>

                <table class='order-summary'>
                    <thead>
                        <tr>
                            <th style='text-align: left;'>Sản phẩm</th>
                            <th style='text-align: right; width: 120px;'>Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {$itemsHtml}
                        <tr class='total-row'>
                            <td style='text-align: right;'>Tổng cộng:</td>
                            <td style='text-align: right; color: #C9A961; font-size: 16px; font-weight: bold; white-space: nowrap;'>{$formattedTotal}</td>
                        </tr>
                    </tbody>
                </table>

                <div class='footer'>
                    <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ hotline: <strong>0929 000 063</strong> hoặc email: <strong>venixwatch@gmail.com</strong>.</p>
                    <p>© 2026 Venix Watch. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        ";

        try {
            if (Config::isDevelopment()) {
                $logDir = BASE_DIR . '/scratch';
                if (!is_dir($logDir)) {
                    mkdir($logDir, 0755, true);
                }
                file_put_contents($logDir . "/email_order_{$orderId}.html", $message);
            }
            Mailer::send($to, $subject, $message);
        } catch (\Throwable $t) {
            error_log("Failed to send order email: " . $t->getMessage());
        }
    }

    private function resolveItems(array $body): array
    {
        $resolved = [];
        $flashSales = new \App\Models\FlashSale(Database::getInstance());

        // Option A: explicit items array in body
        if (!empty($body['items']) && is_array($body['items'])) {
            foreach ($body['items'] as $item) {
                $productId = (int)($item['product_id'] ?? 0);
                $quantity  = max(1, (int)($item['quantity'] ?? $item['qty'] ?? 1));
                if ($productId === 0) continue;

                $product = $this->productModel->findById($productId);
                if (!$product || !$product['is_active']) continue;

                $price = $product['sale_price'] ?? $product['price'];
                $activeFlash = $flashSales->findByProduct($productId);
                if ($activeFlash) {
                    $price = $activeFlash['sale_price'];
                }
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
                $activeFlash = $flashSales->findByProduct((int)$item['product_id']);
                if ($activeFlash) {
                    $price = $activeFlash['sale_price'];
                }
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
