<?php

declare(strict_types=1);

namespace App\Modules\Admin\Role;

use App\Middleware\RBACMiddleware;
use App\Config\Database;
use App\Models\Role;
use App\Models\Permission;

class RoleController
{
    private Role       $roleModel;
    private Permission $permModel;

    public function __construct()
    {
        $pdo             = Database::getInstance();
        $this->roleModel = new Role($pdo);
        $this->permModel = new Permission($pdo);
    }

    /** GET /api/admin/roles */
    public function index(): void
    {
        RBACMiddleware::require('roles:manage');
        $roles = $this->roleModel->findAll();
        foreach ($roles as &$role) {
            $role['permissions'] = $this->roleModel->getPermissions((int)$role['id']);
        }
        $this->respond(['success' => true, 'data' => $roles]);
    }

    /** GET /api/admin/roles/{id} */
    public function show(int $id): void
    {
        RBACMiddleware::require('roles:manage');
        $role = $this->roleModel->findById($id);
        if (!$role) {
            $this->respond(['success' => false, 'error' => 'Role not found.', 'code' => 404]);
            return;
        }
        $role['permissions'] = $this->roleModel->getPermissions($id);
        $this->respond(['success' => true, 'data' => $role]);
    }

    /** POST /api/admin/roles */
    public function store(): void
    {
        RBACMiddleware::require('roles:manage');
        $data = $this->body();
        if (empty($data['name']) || empty($data['display_name'])) {
            $this->respond(['success' => false, 'error' => 'name and display_name are required.', 'code' => 400]);
            return;
        }
        $id   = $this->roleModel->create($data);
        $role = $this->roleModel->findById($id);
        $this->respond(['success' => true, 'data' => $role], 201);
    }

    /** PUT /api/admin/roles/{id} */
    public function update(int $id): void
    {
        RBACMiddleware::require('roles:manage');
        if (!$this->roleModel->findById($id)) {
            $this->respond(['success' => false, 'error' => 'Role not found.', 'code' => 404]);
            return;
        }
        $data = $this->body();
        $this->roleModel->update($id, $data);
        $this->respond(['success' => true, 'data' => $this->roleModel->findById($id)]);
    }

    /** DELETE /api/admin/roles/{id} */
    public function destroy(int $id): void
    {
        RBACMiddleware::require('roles:manage');
        if (!$this->roleModel->findById($id)) {
            $this->respond(['success' => false, 'error' => 'Role not found.', 'code' => 404]);
            return;
        }
        $this->roleModel->delete($id);
        $this->respond(['success' => true, 'data' => ['message' => 'Role deleted.']]);
    }

    /** POST /api/admin/roles/{id}/permissions */
    public function assignPermission(int $id): void
    {
        RBACMiddleware::require('roles:manage');
        $body  = $this->body();
        $permId = (int)($body['permission_id'] ?? 0);
        if ($permId === 0) {
            $this->respond(['success' => false, 'error' => 'permission_id is required.', 'code' => 400]);
            return;
        }
        $this->roleModel->assignPermission($id, $permId);
        $this->respond(['success' => true, 'data' => ['message' => 'Permission assigned.']]);
    }

    /** PUT /api/admin/roles/{id}/permissions */
    public function syncPermissions(int $id): void
    {
        RBACMiddleware::require('roles:manage');
        if (!$this->roleModel->findById($id)) {
            $this->respond(['success' => false, 'error' => 'Role not found.', 'code' => 404]);
            return;
        }

        $body = $this->body();
        $permissionIds = $body['permission_ids'] ?? null;
        if (!is_array($permissionIds)) {
            $this->respond(['success' => false, 'error' => 'permission_ids must be an array.', 'code' => 400]);
            return;
        }

        $current = array_map('intval', array_column($this->roleModel->getPermissions($id), 'id'));
        $next = array_values(array_unique(array_map('intval', $permissionIds)));

        foreach (array_diff($current, $next) as $permissionId) {
            $this->roleModel->removePermission($id, $permissionId);
        }
        foreach (array_diff($next, $current) as $permissionId) {
            if ($permissionId > 0) {
                $this->roleModel->assignPermission($id, $permissionId);
            }
        }

        $this->respond(['success' => true, 'data' => $this->roleModel->getPermissions($id)]);
    }

    /** DELETE /api/admin/roles/{id}/permissions/{permId} */
    public function removePermission(int $id, int $permId): void
    {
        RBACMiddleware::require('roles:manage');
        $this->roleModel->removePermission($id, $permId);
        $this->respond(['success' => true, 'data' => ['message' => 'Permission removed.']]);
    }

    /** GET /api/admin/permissions */
    public function permissions(): void
    {
        RBACMiddleware::require('roles:manage');
        $this->respond(['success' => true, 'data' => $this->permModel->getAllGrouped()]);
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
