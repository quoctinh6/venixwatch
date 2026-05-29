<?php

declare(strict_types=1);

namespace App\Modules\Admin\User;

use App\Middleware\RBACMiddleware;

class UserController
{
    private UserService $service;

    public function __construct()
    {
        $this->service = new UserService();
    }

    /** GET /api/admin/users */
    public function index(): void
    {
        RBACMiddleware::require('users:read');
        $page   = (int)($_GET['page']   ?? 1);
        $limit  = (int)($_GET['limit']  ?? 20);
        $search = trim($_GET['search']  ?? '');
        $this->respond($this->service->paginate($page, $limit, $search));
    }

    /** GET /api/admin/users/{id} */
    public function show(int $id): void
    {
        RBACMiddleware::require('users:read');
        $this->respond($this->service->getById($id));
    }

    /** POST /api/admin/users */
    public function store(): void
    {
        RBACMiddleware::require('users:write');
        $this->respond($this->service->create($this->body()), 201);
    }

    /** PUT /api/admin/users/{id} */
    public function update(int $id): void
    {
        RBACMiddleware::require('users:write');
        $this->respond($this->service->update($id, $this->body()));
    }

    /** DELETE /api/admin/users/{id} */
    public function destroy(int $id): void
    {
        RBACMiddleware::require('users:delete');
        $this->respond($this->service->delete($id));
    }

    /** GET /api/admin/users/{id}/roles */
    public function getRoles(int $id): void
    {
        RBACMiddleware::require('users:read');
        $result = $this->service->getById($id);
        if (!$result['success']) {
            $this->respond($result);
            return;
        }
        $this->respond(['success' => true, 'data' => $result['data']['roles'] ?? []]);
    }

    /** POST /api/admin/users/{id}/roles */
    public function assignRole(int $id): void
    {
        RBACMiddleware::require('users:write');
        $body   = $this->body();
        $roleId = (int)($body['role_id'] ?? 0);
        if ($roleId === 0) {
            $this->respond(['success' => false, 'error' => 'role_id is required.', 'code' => 400]);
            return;
        }
        $this->respond($this->service->assignRole($id, $roleId));
    }

    /** DELETE /api/admin/users/{id}/roles/{roleId} */
    public function removeRole(int $id, int $roleId): void
    {
        RBACMiddleware::require('users:write');
        $this->respond($this->service->removeRole($id, $roleId));
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
