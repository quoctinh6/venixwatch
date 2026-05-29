<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

class User
{
    public function __construct(private PDO $pdo) {}

    public function findByEmail(string $email): array|false
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM users WHERE email = :email LIMIT 1'
        );
        $stmt->bindValue(':email', $email, PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function findById(int $id): array|false
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, email, full_name, phone, avatar, is_active, created_at, updated_at
             FROM users WHERE id = :id LIMIT 1'
        );
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO users (email, password_hash, full_name, phone, avatar, is_active)
             VALUES (:email, :password_hash, :full_name, :phone, :avatar, :is_active)'
        );
        $stmt->bindValue(':email',         $data['email'],                      PDO::PARAM_STR);
        $stmt->bindValue(':password_hash', $data['password_hash'],              PDO::PARAM_STR);
        $stmt->bindValue(':full_name',     $data['full_name'],                  PDO::PARAM_STR);
        $stmt->bindValue(':phone',         $data['phone']  ?? null,             PDO::PARAM_STR);
        $stmt->bindValue(':avatar',        $data['avatar'] ?? null,             PDO::PARAM_STR);
        $stmt->bindValue(':is_active',     $data['is_active'] ?? 1,             PDO::PARAM_INT);
        $stmt->execute();
        return (int)$this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $fields = [];
        $allowed = ['full_name', 'phone', 'avatar', 'is_active', 'password_hash'];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "{$field} = :{$field}";
            }
        }
        if (empty($fields)) {
            return false;
        }
        $sql  = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $stmt = $this->pdo->prepare($sql);
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $stmt->bindValue(":{$field}", $data[$field]);
            }
        }
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM users WHERE id = :id');
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function paginate(int $page = 1, int $limit = 20, string $search = ''): array
    {
        $offset = ($page - 1) * $limit;
        $where  = '';
        $params = [];

        if ($search !== '') {
            $where    = 'WHERE (email LIKE :search OR full_name LIKE :search OR phone LIKE :search)';
            $params[':search'] = '%' . $search . '%';
        }

        $countStmt = $this->pdo->prepare("SELECT COUNT(*) FROM users {$where}");
        foreach ($params as $k => $v) {
            $countStmt->bindValue($k, $v, PDO::PARAM_STR);
        }
        $countStmt->execute();
        $total = (int)$countStmt->fetchColumn();

        $sql  = "SELECT id, email, full_name, phone, avatar, is_active, created_at, updated_at
                 FROM users {$where} ORDER BY id DESC LIMIT :limit OFFSET :offset";
        $stmt = $this->pdo->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v, PDO::PARAM_STR);
        }
        $stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return ['data' => $stmt->fetchAll(), 'total' => $total, 'page' => $page, 'limit' => $limit];
    }

    public function getRoles(int $userId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT r.id, r.name, r.display_name
             FROM roles r
             INNER JOIN user_roles ur ON ur.role_id = r.id
             WHERE ur.user_id = :user_id'
        );
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function assignRole(int $userId, int $roleId): bool
    {
        $stmt = $this->pdo->prepare(
            'INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (:user_id, :role_id)'
        );
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':role_id', $roleId, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function removeRole(int $userId, int $roleId): bool
    {
        $stmt = $this->pdo->prepare(
            'DELETE FROM user_roles WHERE user_id = :user_id AND role_id = :role_id'
        );
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':role_id', $roleId, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
