<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

class OrderItem
{
    public function __construct(private PDO $pdo) {}

    public function getByOrder(int $orderId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT oi.*, p.slug AS product_slug, p.images AS product_images
             FROM order_items oi
             LEFT JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id = :order_id
             ORDER BY oi.id ASC'
        );
        $stmt->bindValue(':order_id', $orderId, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['product_images'] = $row['product_images']
                ? json_decode($row['product_images'], true)
                : [];
        }
        return $rows;
    }

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO order_items
               (order_id, product_id, product_name, product_price, quantity)
             VALUES
               (:order_id, :product_id, :product_name, :product_price, :quantity)'
        );
        $stmt->bindValue(':order_id',      $data['order_id'],                PDO::PARAM_INT);
        $stmt->bindValue(':product_id',    $data['product_id']    ?? null,   PDO::PARAM_INT);
        $stmt->bindValue(':product_name',  $data['product_name'],            PDO::PARAM_STR);
        $stmt->bindValue(':product_price', $data['product_price']);
        $stmt->bindValue(':quantity',      (int)($data['quantity'] ?? 1),    PDO::PARAM_INT);
        $stmt->execute();
        return (int)$this->pdo->lastInsertId();
    }

    public function findById(int $id): array|false
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM order_items WHERE id = :id LIMIT 1'
        );
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch();
    }
}
