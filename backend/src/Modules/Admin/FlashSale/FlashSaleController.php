<?php

declare(strict_types=1);

namespace App\Modules\Admin\FlashSale;

use App\Middleware\RBACMiddleware;

class FlashSaleController
{
    private FlashSaleService $service;

    public function __construct()
    {
        $this->service = new FlashSaleService();
    }

    /** GET /api/admin/flash-sales */
    public function index(): void
    {
        RBACMiddleware::require('flash_sales:manage');
        $activeOnly = filter_var($_GET['active'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $this->respond($activeOnly ? $this->service->getActive() : $this->service->getAll());
    }

    /** GET /api/admin/flash-sales/{id} */
    public function show(int $id): void
    {
        RBACMiddleware::require('flash_sales:manage');
        $this->respond($this->service->getById($id));
    }

    /** POST /api/admin/flash-sales */
    public function store(): void
    {
        RBACMiddleware::require('flash_sales:manage');
        $this->respond($this->service->create($this->body()), 201);
    }

    /** PUT /api/admin/flash-sales/{id} */
    public function update(int $id): void
    {
        RBACMiddleware::require('flash_sales:manage');
        $this->respond($this->service->update($id, $this->body()));
    }

    /** DELETE /api/admin/flash-sales/{id} */
    public function destroy(int $id): void
    {
        RBACMiddleware::require('flash_sales:manage');
        $this->respond($this->service->delete($id));
    }

    /** POST /api/admin/flash-sales/bulk-delete */
    public function bulkDestroy(): void
    {
        RBACMiddleware::require('flash_sales:manage');
        $body = $this->body();
        $ids = $body['ids'] ?? [];
        if (empty($ids) || !is_array($ids)) {
            $this->respond(['success' => false, 'error' => 'Danh sách ID không hợp lệ.', 'code' => 400]);
            return;
        }
        $this->respond($this->service->bulkDelete($ids));
    }

    /** POST /api/admin/flash-sales/bulk-toggle */
    public function bulkToggle(): void
    {
        RBACMiddleware::require('flash_sales:manage');
        $body = $this->body();
        $ids = $body['ids'] ?? [];
        $isActive = isset($body['is_active']) ? (int)$body['is_active'] : 1;
        if (empty($ids) || !is_array($ids)) {
            $this->respond(['success' => false, 'error' => 'Danh sách ID không hợp lệ.', 'code' => 400]);
            return;
        }
        $this->respond($this->service->bulkToggle($ids, $isActive));
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
