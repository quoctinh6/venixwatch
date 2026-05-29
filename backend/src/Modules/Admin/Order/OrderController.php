<?php

declare(strict_types=1);

namespace App\Modules\Admin\Order;

use App\Middleware\RBACMiddleware;

class OrderController
{
    private OrderService $service;

    public function __construct()
    {
        $this->service = new OrderService();
    }

    /** GET /api/admin/orders */
    public function index(): void
    {
        RBACMiddleware::require('orders:read');
        $page   = (int)($_GET['page']   ?? 1);
        $limit  = (int)($_GET['limit']  ?? 20);
        $status = trim($_GET['status']  ?? '');
        $this->respond($this->service->paginate($page, $limit, $status));
    }

    /** GET /api/admin/orders/{id} */
    public function show(int $id): void
    {
        RBACMiddleware::require('orders:read');
        $this->respond($this->service->getById($id));
    }

    /** PUT /api/admin/orders/{id}/status */
    public function updateStatus(int $id): void
    {
        RBACMiddleware::require('orders:write');
        $body   = $this->body();
        $status = trim($body['status'] ?? '');
        if (empty($status)) {
            $this->respond(['success' => false, 'error' => 'status is required.', 'code' => 400]);
            return;
        }
        $this->respond($this->service->updateStatus($id, $status));
    }

    /** GET /api/admin/orders/stats */
    public function stats(): void
    {
        RBACMiddleware::require('orders:read');
        $this->respond($this->service->getStats());
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
