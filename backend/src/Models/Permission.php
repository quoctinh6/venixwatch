<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

class Permission
{
    public function __construct(private PDO $pdo) {}

    public function findAll(): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM permissions ORDER BY group_name, name'
        );
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function findById(int $id): array|false
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM permissions WHERE id = :id LIMIT 1'
        );
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function findByName(string $name): array|false
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM permissions WHERE name = :name LIMIT 1'
        );
        $stmt->bindValue(':name', $name, PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function findByGroup(string $group): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM permissions WHERE group_name = :group ORDER BY name'
        );
        $stmt->bindValue(':group', $group, PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO permissions (name, group_name) VALUES (:name, :group_name)'
        );
        $stmt->bindValue(':name',       $data['name'],       PDO::PARAM_STR);
        $stmt->bindValue(':group_name', $data['group_name'], PDO::PARAM_STR);
        $stmt->execute();
        return (int)$this->pdo->lastInsertId();
    }

    public function getGroups(): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT DISTINCT group_name FROM permissions ORDER BY group_name'
        );
        $stmt->execute();
        return array_column($stmt->fetchAll(), 'group_name');
    }

    public function getAllGrouped(): array
    {
        $all    = $this->findAll();
        $result = [];
        foreach ($all as $perm) {
            $result[$perm['group_name']][] = $perm;
        }
        return $result;
    }
}
