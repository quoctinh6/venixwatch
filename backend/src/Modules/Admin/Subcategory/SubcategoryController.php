<?php

declare(strict_types=1);

namespace App\Modules\Admin\Subcategory;

use App\Middleware\RBACMiddleware;

class SubcategoryController
{
    private SubcategoryService $service;

    public function __construct()
    {
        $this->service = new SubcategoryService();
    }

    /** GET /api/admin/subcategories */
    public function index(): void
    {
        RBACMiddleware::require('categories:read');
        $categoryId = isset($_GET['category_id']) ? (int)$_GET['category_id'] : null;
        if ($categoryId) {
            $this->respond($this->service->getByCategoryId($categoryId));
        } else {
            $this->respond($this->service->getAll());
        }
    }

    /** GET /api/admin/subcategories/{id} */
    public function show(int $id): void
    {
        RBACMiddleware::require('categories:read');
        $this->respond($this->service->getById($id));
    }

    /** POST /api/admin/subcategories */
    public function store(): void
    {
        RBACMiddleware::require('categories:write');
        $this->respond($this->service->create($this->body()), 201);
    }

    /** PUT /api/admin/subcategories/{id} */
    public function update(int $id): void
    {
        RBACMiddleware::require('categories:write');
        $this->respond($this->service->update($id, $this->body()));
    }

    /** DELETE /api/admin/subcategories/{id} */
    public function destroy(int $id): void
    {
        RBACMiddleware::require('categories:delete');
        $this->respond($this->service->delete($id));
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
