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
            "SELECT fs.*, p.name AS product_name, p.slug AS product_slug,
                    p.price AS original_price, p.sku AS product_sku, p.images AS product_images
             FROM flash_sales fs
             INNER JOIN products p ON p.id = fs.product_id
             WHERE fs.starts_at <= NOW() AND fs.ends_at >= NOW()
             ORDER BY fs.ends_at ASC"
        );
        $stmt->execute();
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $images = $row['product_images'] ? json_decode($row['product_images'], true) : [];
            $row['product'] = [
                'id' => $row['product_id'],
                'name' => $row['product_name'],
                'slug' => $row['product_slug'],
                'price' => $row['original_price'],
                'sku' => $row['product_sku'],
                'images' => $images
            ];
            $row['product_images'] = $images;
        }
        return $rows;
    }

    public function findAll(): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT fs.*, p.name AS product_name, p.slug AS product_slug,
                    p.price AS original_price, p.sku AS product_sku, p.images AS product_images
             FROM flash_sales fs
             INNER JOIN products p ON p.id = fs.product_id
             ORDER BY fs.starts_at DESC"
        );
        $stmt->execute();
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $images = $row['product_images'] ? json_decode($row['product_images'], true) : [];
            $row['product'] = [
                'id' => $row['product_id'],
                'name' => $row['product_name'],
                'slug' => $row['product_slug'],
                'price' => $row['original_price'],
                'sku' => $row['product_sku'],
                'images' => $images
            ];
        }
        return $rows;
    }

    public function findById(int $id): array|false
    {
        $stmt = $this->pdo->prepare(
            "SELECT fs.*, p.name AS product_name, p.price AS original_price, p.sku AS product_sku, p.images AS product_images, p.slug AS product_slug
             FROM flash_sales fs
             INNER JOIN products p ON p.id = fs.product_id
             WHERE fs.id = :id LIMIT 1"
        );
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch();
        if ($row) {
            $images = $row['product_images'] ? json_decode($row['product_images'], true) : [];
            $row['product'] = [
                'id' => $row['product_id'],
                'name' => $row['product_name'],
                'slug' => $row['product_slug'],
                'price' => $row['original_price'],
                'sku' => $row['product_sku'],
                'images' => $images
            ];
        }
        return $row;
    }

    public function findByProduct(int $productId): array|false
    {
        $stmt = $this->pdo->prepare(
            "SELECT * FROM flash_sales
             WHERE product_id = :product_id
               AND starts_at <= NOW() AND ends_at >= NOW()
             LIMIT 1"
        );
        $stmt->bindValue(':product_id', $productId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO flash_sales (product_id, sale_price, starts_at, ends_at)
             VALUES (:product_id, :sale_price, :starts_at, :ends_at)'
        );
        $stmt->bindValue(':product_id', (int)$data['product_id'], PDO::PARAM_INT);
        $stmt->bindValue(':sale_price', $data['sale_price']);
        $stmt->bindValue(':starts_at',  $data['starts_at'],        PDO::PARAM_STR);
        $stmt->bindValue(':ends_at',    $data['ends_at'],           PDO::PARAM_STR);
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
               ends_at    = :ends_at
             WHERE id = :id'
        );
        $stmt->bindValue(':product_id', (int)$data['product_id'], PDO::PARAM_INT);
        $stmt->bindValue(':sale_price', $data['sale_price']);
        $stmt->bindValue(':starts_at',  $data['starts_at'],        PDO::PARAM_STR);
        $stmt->bindValue(':ends_at',    $data['ends_at'],           PDO::PARAM_STR);
        $stmt->bindValue(':id',         $id,                        PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM flash_sales WHERE id = :id');
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
