<?php

declare(strict_types=1);

namespace App\Modules\Admin\Brand;

use App\Middleware\RBACMiddleware;

class BrandController
{
    private BrandService $service;

    public function __construct()
    {
        $this->service = new BrandService();
    }

    public function index(): void
    {
        RBACMiddleware::require('products:read');
        $this->respond($this->service->getAll());
    }

    public function show(int $id): void
    {
        RBACMiddleware::require('products:read');
        $this->respond($this->service->getById($id));
    }

    public function store(): void
    {
        RBACMiddleware::require('products:write');
        $this->respond($this->service->create($this->body()), 201);
    }

    public function update(int $id): void
    {
        RBACMiddleware::require('products:write');
        $this->respond($this->service->update($id, $this->body()));
    }

    public function destroy(int $id): void
    {
        RBACMiddleware::require('products:delete');
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
