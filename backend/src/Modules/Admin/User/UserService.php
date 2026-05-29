<?php

declare(strict_types=1);

namespace App\Modules\Admin\User;

use App\Config\Database;
use App\Models\User;
use App\Models\Role;

class UserService
{
    private User $userModel;
    private Role $roleModel;

    public function __construct()
    {
        $pdo             = Database::getInstance();
        $this->userModel = new User($pdo);
        $this->roleModel = new Role($pdo);
    }

    public function paginate(int $page, int $limit, string $search = ''): array
    {
        $result = $this->userModel->paginate($page, $limit, $search);

        // Attach roles to each user
        foreach ($result['data'] as &$user) {
            $user['roles'] = $this->userModel->getRoles((int)$user['id']);
        }

        return [
            'success' => true,
            'data'    => $result['data'],
            'meta'    => [
                'total'      => $result['total'],
                'page'       => $result['page'],
                'limit'      => $result['limit'],
                'total_pages'=> (int)ceil($result['total'] / $result['limit']),
            ],
        ];
    }

    public function create(array $data): array
    {
        if (empty($data['email']) || empty($data['password']) || empty($data['full_name'])) {
            return ['success' => false, 'error' => 'email, password, full_name are required.', 'code' => 400];
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'error' => 'Invalid email.', 'code' => 400];
        }

        if ($this->userModel->findByEmail($data['email'])) {
            return ['success' => false, 'error' => 'Email already in use.', 'code' => 409];
        }

        $userId = $this->userModel->create([
            'email'         => $data['email'],
            'password_hash' => password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]),
            'full_name'     => $data['full_name'],
            'phone'         => $data['phone'] ?? null,
            'is_active'     => (int)($data['is_active'] ?? 1),
        ]);

        if (!empty($data['role_id'])) {
            $this->userModel->assignRole($userId, (int)$data['role_id']);
        }

        $user = $this->userModel->findById($userId);
        return ['success' => true, 'data' => $user];
    }

    public function update(int $id, array $data): array
    {
        $user = $this->userModel->findById($id);
        if (!$user) {
            return ['success' => false, 'error' => 'User not found.', 'code' => 404];
        }

        $updateData = array_intersect_key($data, array_flip(['full_name', 'phone', 'avatar', 'is_active']));

        if (!empty($data['password'])) {
            $updateData['password_hash'] = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]);
        }

        $this->userModel->update($id, $updateData);
        $user = $this->userModel->findById($id);
        return ['success' => true, 'data' => $user];
    }

    public function delete(int $id): array
    {
        if (!$this->userModel->findById($id)) {
            return ['success' => false, 'error' => 'User not found.', 'code' => 404];
        }
        $this->userModel->delete($id);
        return ['success' => true, 'data' => ['message' => 'User deleted.']];
    }

    public function assignRole(int $userId, int $roleId): array
    {
        if (!$this->userModel->findById($userId)) {
            return ['success' => false, 'error' => 'User not found.', 'code' => 404];
        }
        if (!$this->roleModel->findById($roleId)) {
            return ['success' => false, 'error' => 'Role not found.', 'code' => 404];
        }
        $this->userModel->assignRole($userId, $roleId);
        return ['success' => true, 'data' => ['message' => 'Role assigned.']];
    }

    public function removeRole(int $userId, int $roleId): array
    {
        $this->userModel->removeRole($userId, $roleId);
        return ['success' => true, 'data' => ['message' => 'Role removed.']];
    }

    public function getById(int $id): array
    {
        $user = $this->userModel->findById($id);
        if (!$user) {
            return ['success' => false, 'error' => 'User not found.', 'code' => 404];
        }
        $user['roles'] = $this->userModel->getRoles($id);
        return ['success' => true, 'data' => $user];
    }
}
