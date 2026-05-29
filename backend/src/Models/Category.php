<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

class Category
{
    public function __construct(private PDO $pdo) {}

    public function findAll(): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT c.*, COUNT(p.id) AS products_count
             FROM categories c
             LEFT JOIN products p ON p.category_id = c.id
             GROUP BY c.id
             ORDER BY c.sort_order ASC, c.id ASC'
        );
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function findById(int $id): array|false
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM categories WHERE id = :id LIMIT 1'
        );
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function findBySlug(string $slug): array|false
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM categories WHERE slug = :slug LIMIT 1'
        );
        $stmt->bindValue(':slug', $slug, PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function getActive(): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
        );
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getTree(): array
    {
        $categories = $this->getActive();

        $stmt = $this->pdo->prepare(
            'SELECT * FROM subcategories WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
        );
        $stmt->execute();
        $subcategories = $stmt->fetchAll();

        $subcategoriesByCategory = [];
        foreach ($subcategories as $sub) {
            $subcategoriesByCategory[$sub['category_id']][] = $sub;
        }

        foreach ($categories as &$cat) {
            $cat['children'] = $subcategoriesByCategory[$cat['id']] ?? [];
        }

        return $categories;
    }

    public function getDescendantIds(int $categoryId): array
    {
        return [$categoryId];
    }

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO categories
               (name, slug, image_url, description, is_active, sort_order)
             VALUES
               (:name, :slug, :image_url, :description, :is_active, :sort_order)'
        );
        $stmt->bindValue(':name',        $data['name'],                 PDO::PARAM_STR);
        $stmt->bindValue(':slug',        $data['slug'],                 PDO::PARAM_STR);
        $stmt->bindValue(':image_url',   $data['image_url']   ?? null,  PDO::PARAM_STR);
        $stmt->bindValue(':description', $data['description'] ?? null,  PDO::PARAM_STR);
        $stmt->bindValue(':is_active',   $data['is_active']   ?? 1,     PDO::PARAM_INT);
        $stmt->bindValue(':sort_order',  $data['sort_order']  ?? 0,     PDO::PARAM_INT);
        $stmt->execute();
        return (int)$this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE categories SET
               name = :name, slug = :slug,
               image_url = :image_url, description = :description,
               is_active = :is_active, sort_order = :sort_order
             WHERE id = :id'
        );
        $stmt->bindValue(':name',        $data['name'],                PDO::PARAM_STR);
        $stmt->bindValue(':slug',        $data['slug'],                PDO::PARAM_STR);
        $stmt->bindValue(':image_url',   $data['image_url']  ?? null,  PDO::PARAM_STR);
        $stmt->bindValue(':description', $data['description'] ?? null, PDO::PARAM_STR);
        $stmt->bindValue(':is_active',   $data['is_active']  ?? 1,     PDO::PARAM_INT);
        $stmt->bindValue(':sort_order',  $data['sort_order'] ?? 0,     PDO::PARAM_INT);
        $stmt->bindValue(':id',          $id,                          PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM categories WHERE id = :id');
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
