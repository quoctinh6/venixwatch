<?php

declare(strict_types=1);

namespace App\Modules\Admin\Product;

use App\Middleware\RBACMiddleware;

class ProductController
{
    private ProductService $service;

    public function __construct()
    {
        $this->service = new ProductService();
    }

    /** GET /api/admin/products */
    public function index(): void
    {
        RBACMiddleware::require('products:read');
        $filters = [
            'page'        => (int)($_GET['page']        ?? 1),
            'limit'       => (int)($_GET['limit']       ?? 20),
            'search'      => trim($_GET['search']       ?? ''),
            'category_id' => (int)($_GET['category_id'] ?? 0) ?: null,
            'badge'       => trim($_GET['badge']        ?? ''),
            'sort'        => trim($_GET['sort']         ?? ''),
            'price_min'   => isset($_GET['price_min']) ? (float)$_GET['price_min'] : null,
            'price_max'   => isset($_GET['price_max']) ? (float)$_GET['price_max'] : null,
            'is_active'   => isset($_GET['is_active']) ? (int)$_GET['is_active'] : null,
        ];
        $this->respond($this->service->paginate(array_filter($filters, fn($v) => $v !== null && $v !== '')));
    }

    /** GET /api/admin/products/{id} */
    public function show(int $id): void
    {
        RBACMiddleware::require('products:read');
        $this->respond($this->service->getById($id));
    }

    /** POST /api/admin/products */
    public function store(): void
    {
        RBACMiddleware::require('products:write');
        $this->respond($this->service->create($this->body()), 201);
    }

    /** PUT /api/admin/products/{id} */
    public function update(int $id): void
    {
        RBACMiddleware::require('products:write');
        $this->respond($this->service->update($id, $this->body()));
    }

    /** DELETE /api/admin/products/{id} */
    public function destroy(int $id): void
    {
        RBACMiddleware::require('products:delete');
        $this->respond($this->service->delete($id));
    }

    /** PATCH /api/admin/products/{id}/toggle */
    public function toggle(int $id): void
    {
        RBACMiddleware::require('products:write');
        $this->respond($this->service->toggleActive($id));
    }

    /** POST /api/admin/products/compute-badges */
    public function computeBadges(): void
    {
        RBACMiddleware::require('products:write');
        $this->respond($this->service->computeBadges());
    }

    /** GET /api/admin/products/low-stock */
    public function lowStock(): void
    {
        RBACMiddleware::require('products:read');
        $threshold = (int)($_GET['threshold'] ?? 5);
        $this->respond($this->service->getLowStock($threshold));
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
