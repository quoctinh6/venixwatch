<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

class Warranty
{
    public function __construct(private PDO $pdo) {}

    public function findAll(int $page = 1, int $limit = 20, string $status = '', string $search = ''): array
    {
        $where = ['1=1'];
        $params = [];

        if ($status !== '') {
            $where[] = 'w.status = :status';
            $params[':status'] = $status;
        }

        if ($search !== '') {
            $where[] = '(w.serial_number LIKE :search_serial OR w.customer_name LIKE :search_customer OR w.customer_phone LIKE :search_phone OR p.name LIKE :search_product)';
            $params[':search_serial'] = '%' . $search . '%';
            $params[':search_customer'] = '%' . $search . '%';
            $params[':search_phone'] = '%' . $search . '%';
            $params[':search_product'] = '%' . $search . '%';
        }

        $offset = ($page - 1) * $limit;
        $whereStr = implode(' AND ', $where);

        $countStmt = $this->pdo->prepare(
            "SELECT COUNT(*)
             FROM warranties w
             LEFT JOIN products p ON p.id = w.product_id
             WHERE {$whereStr}"
        );
        foreach ($params as $k => $v) {
            $countStmt->bindValue($k, $v, PDO::PARAM_STR);
        }
        $countStmt->execute();
        $total = (int)$countStmt->fetchColumn();

        $stmt = $this->pdo->prepare(
            "SELECT w.*, p.name AS product_name, p.sku AS product_sku
             FROM warranties w
             LEFT JOIN products p ON p.id = w.product_id
             WHERE {$whereStr}
             ORDER BY w.created_at DESC
             LIMIT :limit OFFSET :offset"
        );
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v, PDO::PARAM_STR);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return ['data' => $stmt->fetchAll(), 'total' => $total, 'page' => $page, 'limit' => $limit];
    }

    public function findById(int $id): array|false
    {
        $stmt = $this->pdo->prepare(
            'SELECT w.*, p.name AS product_name, p.sku AS product_sku
             FROM warranties w
             LEFT JOIN products p ON p.id = w.product_id
             WHERE w.id = :id LIMIT 1'
        );
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function findBySerial(string $serial): array|false
    {
        $stmt = $this->pdo->prepare(
            'SELECT w.*, p.name AS product_name, p.sku AS product_sku
             FROM warranties w
             LEFT JOIN products p ON p.id = w.product_id
             WHERE w.serial_number = :serial LIMIT 1'
        );
        $stmt->bindValue(':serial', $serial, PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO warranties
               (order_item_id, serial_number, product_id, customer_name,
                customer_phone, warranty_expires_at, status, notes)
             VALUES
               (:order_item_id, :serial_number, :product_id, :customer_name,
                :customer_phone, :warranty_expires_at, :status, :notes)'
        );
        $stmt->bindValue(':order_item_id',       $data['order_item_id'] ?? null,      PDO::PARAM_INT);
        $stmt->bindValue(':serial_number',       $data['serial_number'],               PDO::PARAM_STR);
        $stmt->bindValue(':product_id',          $data['product_id'] ?? null,          PDO::PARAM_INT);
        $stmt->bindValue(':customer_name',       $data['customer_name'],               PDO::PARAM_STR);
        $stmt->bindValue(':customer_phone',      $data['customer_phone'],              PDO::PARAM_STR);
        $stmt->bindValue(':warranty_expires_at', $data['warranty_expires_at'],         PDO::PARAM_STR);
        $stmt->bindValue(':status',              $data['status'] ?? 'active',          PDO::PARAM_STR);
        $stmt->bindValue(':notes',               $data['notes'] ?? null,               PDO::PARAM_STR);
        $stmt->execute();
        return (int)$this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE warranties SET
               customer_name = :customer_name, customer_phone = :customer_phone,
               warranty_expires_at = :warranty_expires_at, status = :status, notes = :notes
             WHERE id = :id'
        );
        $stmt->bindValue(':customer_name',       $data['customer_name'],       PDO::PARAM_STR);
        $stmt->bindValue(':customer_phone',      $data['customer_phone'],      PDO::PARAM_STR);
        $stmt->bindValue(':warranty_expires_at', $data['warranty_expires_at'], PDO::PARAM_STR);
        $stmt->bindValue(':status',              $data['status'],              PDO::PARAM_STR);
        $stmt->bindValue(':notes',               $data['notes'] ?? null,       PDO::PARAM_STR);
        $stmt->bindValue(':id',                  $id,                          PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM warranties WHERE id = :id');
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
