<?php

declare(strict_types=1);

namespace App\Services\Auth;

use App\Config\Database;
use App\Middleware\AuthMiddleware;
use App\Models\User;

class AuthService
{
    private User $userModel;

    public function __construct()
    {
        $this->userModel = new User(Database::getInstance());
    }

    public function login(string $email, string $password): array
    {
        if (empty($email) || empty($password)) {
            return ['success' => false, 'error' => 'Email and password are required.', 'code' => 400];
        }

        $user = $this->userModel->findByEmail($email);

        if (!$user) {
            return ['success' => false, 'error' => 'Invalid credentials.', 'code' => 401];
        }

        if (!$user['is_active']) {
            return ['success' => false, 'error' => 'Account is deactivated.', 'code' => 403];
        }

        if (!password_verify($password, $user['password_hash'])) {
            return ['success' => false, 'error' => 'Invalid credentials.', 'code' => 401];
        }

        $roles = $this->userModel->getRoles((int)$user['id']);
        $permissions = \App\Middleware\RBACMiddleware::getUserPermissions((int)$user['id']);

        $payload = [
            'user_id'     => (int)$user['id'],
            'email'       => $user['email'],
            'full_name'   => $user['full_name'],
            'roles'       => array_column($roles, 'name'),
            'permissions' => $permissions,
        ];

        $token = AuthMiddleware::generateJWT($payload, 86400);

        return [
            'success' => true,
            'data'    => [
                'token'     => $token,
                'user'      => [
                    'id'          => (int)$user['id'],
                    'email'       => $user['email'],
                    'full_name'   => $user['full_name'],
                    'phone'       => $user['phone'],
                    'avatar'      => $user['avatar'],
                    'roles'       => $roles,
                    'permissions' => $permissions,
                ],
            ],
        ];
    }

    public function register(array $data): array
    {
        $required = ['email', 'password', 'full_name'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return ['success' => false, 'error' => "Field '{$field}' is required.", 'code' => 400];
            }
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'error' => 'Invalid email format.', 'code' => 400];
        }

        if (strlen($data['password']) < 8) {
            return ['success' => false, 'error' => 'Password must be at least 8 characters.', 'code' => 400];
        }

        $existing = $this->userModel->findByEmail($data['email']);
        if ($existing) {
            return ['success' => false, 'error' => 'Email already registered.', 'code' => 409];
        }

        $userId = $this->userModel->create([
            'email'         => $data['email'],
            'password_hash' => password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]),
            'full_name'     => $data['full_name'],
            'phone'         => $data['phone'] ?? null,
            'is_active'     => 1,
        ]);

        $user = $this->userModel->findById($userId);

        return [
            'success' => true,
            'data'    => [
                'id'        => $userId,
                'email'     => $user['email'],
                'full_name' => $user['full_name'],
            ],
        ];
    }

    public function logout(): array
    {
        // Stateless JWT — instruct client to discard token
        return [
            'success' => true,
            'data'    => ['message' => 'Logged out successfully.'],
        ];
    }

    public function refreshToken(string $token): array
    {
        $payload = AuthMiddleware::validateJWT($token);
        if (!$payload) {
            return ['success' => false, 'error' => 'Invalid or expired token.', 'code' => 401];
        }

        $user = $this->userModel->findById((int)$payload['user_id']);
        if (!$user || !$user['is_active']) {
            return ['success' => false, 'error' => 'User not found or inactive.', 'code' => 401];
        }

        $roles = $this->userModel->getRoles((int)$user['id']);
        $permissions = \App\Middleware\RBACMiddleware::getUserPermissions((int)$user['id']);

        $newPayload = [
            'user_id'     => (int)$user['id'],
            'email'       => $user['email'],
            'full_name'   => $user['full_name'],
            'roles'       => array_column($roles, 'name'),
            'permissions' => $permissions,
        ];

        $newToken = AuthMiddleware::generateJWT($newPayload, 86400);

        return ['success' => true, 'data' => ['token' => $newToken]];
    }
}
