<?php

declare(strict_types=1);

namespace App\Modules\Admin\Category;

use App\Middleware\RBACMiddleware;

class CategoryController
{
    private CategoryService $service;

    public function __construct()
    {
        $this->service = new CategoryService();
    }

    /** GET /api/admin/categories */
    public function index(): void
    {
        RBACMiddleware::require('categories:read');
        $tree = filter_var($_GET['tree'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $this->respond($tree ? $this->service->getTree() : $this->service->getAll());
    }

    /** GET /api/admin/categories/{id} */
    public function show(int $id): void
    {
        RBACMiddleware::require('categories:read');
        $this->respond($this->service->getById($id));
    }

    /** POST /api/admin/categories */
    public function store(): void
    {
        RBACMiddleware::require('categories:write');
        $this->respond($this->service->create($this->body()), 201);
    }

    /** PUT /api/admin/categories/{id} */
    public function update(int $id): void
    {
        RBACMiddleware::require('categories:write');
        $this->respond($this->service->update($id, $this->body()));
    }

    /** DELETE /api/admin/categories/{id} */
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
