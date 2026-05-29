<?php

declare(strict_types=1);

namespace App\Modules\Admin\Warranty;

use App\Middleware\RBACMiddleware;

class WarrantyController
{
    private WarrantyService $service;

    public function __construct()
    {
        $this->service = new WarrantyService();
    }

    public function index(): void
    {
        RBACMiddleware::require('warranties:read');
        $page = (int)($_GET['page'] ?? 1);
        $limit = (int)($_GET['limit'] ?? 20);
        $status = trim($_GET['status'] ?? '');
        $search = trim($_GET['search'] ?? '');

        if (!empty($_GET['serial'])) {
            $this->respond($this->service->getBySerial(trim($_GET['serial'])));
            return;
        }

        $this->respond($this->service->paginate($page, $limit, $status, $search));
    }

    public function show(int $id): void
    {
        RBACMiddleware::require('warranties:read');
        $this->respond($this->service->getById($id));
    }

    public function store(): void
    {
        RBACMiddleware::require('warranties:write');
        $this->respond($this->service->create($this->body()), 201);
    }

    public function update(int $id): void
    {
        RBACMiddleware::require('warranties:write');
        $this->respond($this->service->update($id, $this->body()));
    }

    public function destroy(int $id): void
    {
        RBACMiddleware::require('warranties:write');
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
