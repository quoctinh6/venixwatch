<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

class Role
{
    public function __construct(private PDO $pdo) {}

    public function findAll(): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM roles ORDER BY id ASC');
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function findById(int $id): array|false
    {
        $stmt = $this->pdo->prepare('SELECT * FROM roles WHERE id = :id LIMIT 1');
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function findByName(string $name): array|false
    {
        $stmt = $this->pdo->prepare('SELECT * FROM roles WHERE name = :name LIMIT 1');
        $stmt->bindValue(':name', $name, PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO roles (name, display_name) VALUES (:name, :display_name)'
        );
        $stmt->bindValue(':name',         $data['name'],         PDO::PARAM_STR);
        $stmt->bindValue(':display_name', $data['display_name'], PDO::PARAM_STR);
        $stmt->execute();
        return (int)$this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE roles SET name = :name, display_name = :display_name WHERE id = :id'
        );
        $stmt->bindValue(':name',         $data['name'],         PDO::PARAM_STR);
        $stmt->bindValue(':display_name', $data['display_name'], PDO::PARAM_STR);
        $stmt->bindValue(':id',           $id,                   PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM roles WHERE id = :id');
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function getPermissions(int $roleId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT p.id, p.name, p.group_name
             FROM permissions p
             INNER JOIN role_permissions rp ON rp.permission_id = p.id
             WHERE rp.role_id = :role_id
             ORDER BY p.group_name, p.name'
        );
        $stmt->bindValue(':role_id', $roleId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function assignPermission(int $roleId, int $permissionId): bool
    {
        $stmt = $this->pdo->prepare(
            'INSERT IGNORE INTO role_permissions (role_id, permission_id)
             VALUES (:role_id, :permission_id)'
        );
        $stmt->bindValue(':role_id',       $roleId,       PDO::PARAM_INT);
        $stmt->bindValue(':permission_id', $permissionId, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function removePermission(int $roleId, int $permissionId): bool
    {
        $stmt = $this->pdo->prepare(
            'DELETE FROM role_permissions
             WHERE role_id = :role_id AND permission_id = :permission_id'
        );
        $stmt->bindValue(':role_id',       $roleId,       PDO::PARAM_INT);
        $stmt->bindValue(':permission_id', $permissionId, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function getUserPermissions(int $userId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT DISTINCT p.name
             FROM permissions p
             INNER JOIN role_permissions rp ON rp.permission_id = p.id
             INNER JOIN user_roles ur ON ur.role_id = rp.role_id
             WHERE ur.user_id = :user_id'
        );
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        return array_column($stmt->fetchAll(), 'name');
    }
}
