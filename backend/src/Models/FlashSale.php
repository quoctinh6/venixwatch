<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

class FlashSale
{
    public function __construct(private PDO $pdo) {}

    public function findActive(): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT fs.*, fs.starts_at AS start_time, fs.ends_at AS end_time,
                    p.name AS product_name, p.slug AS product_slug,
                    p.price AS original_price, p.images AS product_images, p.sku AS product_sku
             FROM flash_sales fs
             INNER JOIN products p ON p.id = fs.product_id
             WHERE fs.is_active = 1 AND fs.starts_at <= NOW() AND fs.ends_at >= NOW()
             ORDER BY fs.ends_at ASC"
        );
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$row) {
            $row['product_images'] = $row['product_images']
                ? json_decode($row['product_images'], true)
                : [];
        }
        return $rows;
    }

    public function findAll(): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT fs.*, fs.starts_at AS start_time, fs.ends_at AS end_time,
                    p.name AS product_name, p.slug AS product_slug,
                    p.price AS original_price, p.sku AS product_sku
             FROM flash_sales fs
             INNER JOIN products p ON p.id = fs.product_id
             ORDER BY fs.id DESC"
        );
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById(int $id): array|false
    {
        $stmt = $this->pdo->prepare(
            "SELECT fs.*, fs.starts_at AS start_time, fs.ends_at AS end_time,
                    p.name AS product_name, p.price AS original_price, p.sku AS product_sku
             FROM flash_sales fs
             INNER JOIN products p ON p.id = fs.product_id
             WHERE fs.id = :id LIMIT 1"
        );
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findByProduct(int $productId): array|false
    {
        $stmt = $this->pdo->prepare(
            "SELECT *, starts_at AS start_time, ends_at AS end_time FROM flash_sales
             WHERE product_id = :product_id AND is_active = 1
               AND starts_at <= NOW() AND ends_at >= NOW()
             LIMIT 1"
        );
        $stmt->bindValue(':product_id', $productId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO flash_sales (product_id, sale_price, starts_at, ends_at, is_active)
             VALUES (:product_id, :sale_price, :starts_at, :ends_at, :is_active)'
        );
        $stmt->bindValue(':product_id', (int)$data['product_id'], PDO::PARAM_INT);
        $stmt->bindValue(':sale_price', $data['sale_price']);
        $stmt->bindValue(':starts_at',  $data['start_time'] ?? $data['starts_at'], PDO::PARAM_STR);
        $stmt->bindValue(':ends_at',    $data['end_time'] ?? $data['ends_at'], PDO::PARAM_STR);
        $stmt->bindValue(':is_active',  isset($data['is_active']) ? (int)$data['is_active'] : 1, PDO::PARAM_INT);
        $stmt->execute();
        return (int)$this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE flash_sales SET
               product_id = :product_id,
               sale_price = :sale_price,
               starts_at  = :starts_at,
               ends_at    = :ends_at,
               is_active  = :is_active
             WHERE id = :id'
        );
        $stmt->bindValue(':product_id', (int)$data['product_id'], PDO::PARAM_INT);
        $stmt->bindValue(':sale_price', $data['sale_price']);
        $stmt->bindValue(':starts_at',  $data['start_time'] ?? $data['starts_at'], PDO::PARAM_STR);
        $stmt->bindValue(':ends_at',    $data['end_time'] ?? $data['ends_at'], PDO::PARAM_STR);
        $stmt->bindValue(':is_active',  isset($data['is_active']) ? (int)$data['is_active'] : 1, PDO::PARAM_INT);
        $stmt->bindValue(':id',         $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM flash_sales WHERE id = :id');
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function bulkDelete(array $ids): bool
    {
        if (empty($ids)) return true;
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $this->pdo->prepare("DELETE FROM flash_sales WHERE id IN ($placeholders)");
        return $stmt->execute($ids);
    }

    public function bulkToggle(array $ids, int $isActive): bool
    {
        if (empty($ids)) return true;
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $this->pdo->prepare("UPDATE flash_sales SET is_active = ? WHERE id IN ($placeholders)");
        $params = array_merge([$isActive], $ids);
        return $stmt->execute($params);
    }
}
