<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

class Brand
{
    public function __construct(private PDO $pdo)
    {
        $this->ensureTable();
    }

    private function ensureTable(): void
    {
        $this->pdo->exec(
            'CREATE TABLE IF NOT EXISTS brands (
                id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                name        VARCHAR(150) NOT NULL,
                slug        VARCHAR(160) NOT NULL UNIQUE,
                source_name VARCHAR(150) NOT NULL UNIQUE,
                logo_url    VARCHAR(500) DEFAULT NULL,
                is_active   TINYINT(1) NOT NULL DEFAULT 1,
                sort_order  INT NOT NULL DEFAULT 0,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_slug (slug),
                INDEX idx_source_name (source_name),
                INDEX idx_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
    }

    public function findAll(): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT b.*,
                    COALESCE(pc.products_count, 0) AS products_count
             FROM brands b
             LEFT JOIN (
                 SELECT brand AS source_name, COUNT(*) AS products_count
                 FROM products
                 WHERE is_active = 1
                   AND brand IS NOT NULL
                   AND TRIM(brand) <> \'\'
                 GROUP BY brand
             ) pc ON pc.source_name = b.source_name
             ORDER BY pc.products_count DESC, b.sort_order ASC, b.name ASC'
        );
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function findById(int $id): array|false
    {
        $stmt = $this->pdo->prepare('SELECT * FROM brands WHERE id = :id LIMIT 1');
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function findBySlug(string $slug): array|false
    {
        $stmt = $this->pdo->prepare('SELECT * FROM brands WHERE slug = :slug LIMIT 1');
        $stmt->bindValue(':slug', $slug, PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function findBySourceName(string $sourceName): array|false
    {
        $stmt = $this->pdo->prepare('SELECT * FROM brands WHERE source_name = :source_name LIMIT 1');
        $stmt->bindValue(':source_name', $sourceName, PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO brands (name, slug, source_name, logo_url, is_active, sort_order)
             VALUES (:name, :slug, :source_name, :logo_url, :is_active, :sort_order)'
        );
        $this->bindValues($stmt, $data);
        $stmt->execute();
        return (int)$this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE brands
             SET name = :name,
                 slug = :slug,
                 source_name = :source_name,
                 logo_url = :logo_url,
                 is_active = :is_active,
                 sort_order = :sort_order
             WHERE id = :id'
        );
        $this->bindValues($stmt, $data);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    private function bindValues(\PDOStatement $stmt, array $data): void
    {
        $stmt->bindValue(':name', $data['name'] ?? '', PDO::PARAM_STR);
        $stmt->bindValue(':slug', $data['slug'] ?? '', PDO::PARAM_STR);
        $stmt->bindValue(':source_name', $data['source_name'] ?? '', PDO::PARAM_STR);
        $stmt->bindValue(':logo_url', $data['logo_url'] ?? null, PDO::PARAM_STR);
        $stmt->bindValue(':is_active', (int)($data['is_active'] ?? 1), PDO::PARAM_INT);
        $stmt->bindValue(':sort_order', (int)($data['sort_order'] ?? 0), PDO::PARAM_INT);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM brands WHERE id = :id');
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function getTop(int $limit = 6): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT b.id,
                    COALESCE(NULLIF(b.name, \'\'), agg.source_name) AS name,
                    b.slug,
                    agg.source_name,
                    b.logo_url,
                    COALESCE(b.sort_order, 0) AS sort_order,
                    agg.products_count
             FROM (
                 SELECT brand AS source_name, COUNT(*) AS products_count
                 FROM products
                 WHERE is_active = 1
                   AND brand IS NOT NULL
                   AND TRIM(brand) <> \'\'
                 GROUP BY brand
             ) agg
             LEFT JOIN brands b ON b.source_name = agg.source_name
             WHERE b.id IS NULL OR b.is_active = 1
             ORDER BY agg.products_count DESC, COALESCE(b.sort_order, 0) ASC, COALESCE(b.name, agg.source_name) ASC
             LIMIT :limit'
        );
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();

        foreach ($rows as &$row) {
            if (empty($row['slug'])) {
                $row['slug'] = $this->slugify((string)($row['source_name'] ?? $row['name'] ?? 'brand'));
            }
        }

        return $rows;
    }

    private function slugify(string $text): string
    {
        $text = mb_strtolower(trim($text));
        $map  = [
            'àáạảãâầấậẩẫăằắặẳẵ' => 'a',
            'èéẹẻẽêềếệểễ'        => 'e',
            'ìíịỉĩ'               => 'i',
            'òóọỏõôồốộổỗơờớợởỡ'  => 'o',
            'ùúụủũưừứựửữ'         => 'u',
            'ỳýỵỷỹ'               => 'y',
            'đ'                   => 'd',
        ];
        foreach ($map as $chars => $replacement) {
            $charArr = preg_split('//u', $chars, -1, PREG_SPLIT_NO_EMPTY);
            $text    = str_replace($charArr, $replacement, $text);
        }
        $text = preg_replace('/[^a-z0-9\s-]/', '', $text);
        $text = preg_replace('/[\s-]+/', '-', $text);
        return trim($text, '-');
    }
}
