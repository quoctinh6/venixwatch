<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

class Subcategory
{
    public function __construct(private PDO $pdo) {}

    public function findAll(): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT s.*, c.name AS category_name, COUNT(p.id) AS products_count
             FROM subcategories s
             LEFT JOIN categories c ON c.id = s.category_id
             LEFT JOIN products p ON p.subcategory_id = s.id
             GROUP BY s.id
             ORDER BY c.sort_order ASC, s.sort_order ASC, s.id ASC'
        );
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function findById(int $id): array|false
    {
        $stmt = $this->pdo->prepare(
            'SELECT s.*, c.name AS category_name 
             FROM subcategories s
             LEFT JOIN categories c ON c.id = s.category_id
             WHERE s.id = :id LIMIT 1'
        );
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function findBySlug(string $slug): array|false
    {
        $stmt = $this->pdo->prepare(
            'SELECT s.*, c.name AS category_name 
             FROM subcategories s
             LEFT JOIN categories c ON c.id = s.category_id
             WHERE s.slug = :slug LIMIT 1'
        );
        $stmt->bindValue(':slug', $slug, PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function findByCategoryId(int $categoryId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM subcategories 
             WHERE category_id = :category_id AND is_active = 1 
             ORDER BY sort_order ASC, id ASC'
        );
        $stmt->bindValue(':category_id', $categoryId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getActive(): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT s.*, c.name AS category_name 
             FROM subcategories s
             LEFT JOIN categories c ON c.id = s.category_id
             WHERE s.is_active = 1 
             ORDER BY c.sort_order ASC, s.sort_order ASC, s.id ASC'
        );
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO subcategories
               (category_id, name, slug, description, is_active, sort_order)
             VALUES
               (:category_id, :name, :slug, :description, :is_active, :sort_order)'
        );
        $stmt->bindValue(':category_id', (int)$data['category_id'],     PDO::PARAM_INT);
        $stmt->bindValue(':name',        $data['name'],                 PDO::PARAM_STR);
        $stmt->bindValue(':slug',        $data['slug'],                 PDO::PARAM_STR);
        $stmt->bindValue(':description', $data['description'] ?? null,  PDO::PARAM_STR);
        $stmt->bindValue(':is_active',   $data['is_active']   ?? 1,     PDO::PARAM_INT);
        $stmt->bindValue(':sort_order',  $data['sort_order']  ?? 0,     PDO::PARAM_INT);
        $stmt->execute();
        return (int)$this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE subcategories SET
               category_id = :category_id, name = :name, slug = :slug,
               description = :description, is_active = :is_active, sort_order = :sort_order
             WHERE id = :id'
        );
        $stmt->bindValue(':category_id', (int)$data['category_id'],    PDO::PARAM_INT);
        $stmt->bindValue(':name',        $data['name'],                PDO::PARAM_STR);
        $stmt->bindValue(':slug',        $data['slug'],                PDO::PARAM_STR);
        $stmt->bindValue(':description', $data['description'] ?? null, PDO::PARAM_STR);
        $stmt->bindValue(':is_active',   $data['is_active']  ?? 1,     PDO::PARAM_INT);
        $stmt->bindValue(':sort_order',  $data['sort_order'] ?? 0,     PDO::PARAM_INT);
        $stmt->bindValue(':id',          $id,                          PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM subcategories WHERE id = :id');
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
