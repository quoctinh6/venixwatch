<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

class Order
{
    public function __construct(private PDO $pdo) {}

    public function findAll(int $page = 1, int $limit = 20, string $status = ''): array
    {
        $where  = ['1=1'];
        $params = [];

        if ($status !== '') {
            $where[]           = 'status = :status';
            $params[':status'] = $status;
        }

        $offset    = ($page - 1) * $limit;
        $whereStr  = implode(' AND ', $where);

        $countStmt = $this->pdo->prepare("SELECT COUNT(*) FROM orders WHERE {$whereStr}");
        foreach ($params as $k => $v) {
            $countStmt->bindValue($k, $v, PDO::PARAM_STR);
        }
        $countStmt->execute();
        $total = (int)$countStmt->fetchColumn();

        $stmt = $this->pdo->prepare(
            "SELECT * FROM orders WHERE {$whereStr}
             ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
        );
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v, PDO::PARAM_STR);
        }
        $stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return ['data' => $stmt->fetchAll(), 'total' => $total, 'page' => $page, 'limit' => $limit];
    }

    public function findById(int $id): array|false
    {
        $stmt = $this->pdo->prepare('SELECT * FROM orders WHERE id = :id LIMIT 1');
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO orders
               (user_id, customer_name, customer_email, customer_phone,
                shipping_address, total_amount, status, notes, payment_method)
             VALUES
               (:user_id, :customer_name, :customer_email, :customer_phone,
                :shipping_address, :total_amount, :status, :notes, :payment_method)'
        );
        $stmt->bindValue(':user_id',          $data['user_id']          ?? null,      PDO::PARAM_INT);
        $stmt->bindValue(':customer_name',    $data['customer_name'],                 PDO::PARAM_STR);
        $stmt->bindValue(':customer_email',   $data['customer_email'],                PDO::PARAM_STR);
        $stmt->bindValue(':customer_phone',   $data['customer_phone'],                PDO::PARAM_STR);
        $stmt->bindValue(':shipping_address', $data['shipping_address'],              PDO::PARAM_STR);
        $stmt->bindValue(':total_amount',     $data['total_amount']);
        $stmt->bindValue(':status',           $data['status']           ?? 'pending', PDO::PARAM_STR);
        $stmt->bindValue(':notes',            $data['notes']            ?? null,      PDO::PARAM_STR);
        $stmt->bindValue(':payment_method',   $data['payment_method']   ?? 'cod',     PDO::PARAM_STR);
        $stmt->execute();
        return (int)$this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE orders SET
               customer_name = :customer_name, customer_email = :customer_email,
               customer_phone = :customer_phone, shipping_address = :shipping_address,
               total_amount = :total_amount, status = :status, notes = :notes,
               payment_method = :payment_method
             WHERE id = :id'
        );
        $stmt->bindValue(':customer_name',    $data['customer_name'],    PDO::PARAM_STR);
        $stmt->bindValue(':customer_email',   $data['customer_email'],   PDO::PARAM_STR);
        $stmt->bindValue(':customer_phone',   $data['customer_phone'],   PDO::PARAM_STR);
        $stmt->bindValue(':shipping_address', $data['shipping_address'], PDO::PARAM_STR);
        $stmt->bindValue(':total_amount',     $data['total_amount']);
        $stmt->bindValue(':status',           $data['status'],           PDO::PARAM_STR);
        $stmt->bindValue(':notes',            $data['notes'] ?? null,    PDO::PARAM_STR);
        $stmt->bindValue(':payment_method',   $data['payment_method']   ?? 'cod',  PDO::PARAM_STR);
        $stmt->bindValue(':id',               $id,                       PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function updateStatus(int $id, string $status): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE orders SET status = :status WHERE id = :id'
        );
        $stmt->bindValue(':status', $status, PDO::PARAM_STR);
        $stmt->bindValue(':id',     $id,     PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function getByUser(int $userId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM orders WHERE user_id = :user_id ORDER BY created_at DESC'
        );
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function findLatestCompletedProductOrder(int $userId, int $productId): array|false
    {
        $stmt = $this->pdo->prepare(
            "SELECT o.*, o.updated_at AS delivered_at
             FROM orders o
             INNER JOIN order_items oi ON oi.order_id = o.id
             WHERE o.user_id = :user_id AND oi.product_id = :product_id AND o.status = 'completed'
             ORDER BY o.updated_at DESC, o.id DESC
             LIMIT 1"
        );
        $stmt->execute([':user_id' => $userId, ':product_id' => $productId]);
        return $stmt->fetch();
    }

    public function findLatestActiveProductOrder(int $userId, int $productId): array|false
    {
        $stmt = $this->pdo->prepare(
            "SELECT o.*
             FROM orders o
             INNER JOIN order_items oi ON oi.order_id = o.id
             WHERE o.user_id = :user_id AND oi.product_id = :product_id
               AND o.status IN ('pending', 'processing', 'shipping')
             ORDER BY o.updated_at DESC, o.id DESC
             LIMIT 1"
        );
        $stmt->execute([':user_id' => $userId, ':product_id' => $productId]);
        return $stmt->fetch();
    }

    public function getStats(): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT
               COUNT(*) AS total_orders,
               SUM(CASE WHEN status = 'pending'    THEN 1 ELSE 0 END) AS pending,
               SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processing,
               SUM(CASE WHEN status = 'shipping'   THEN 1 ELSE 0 END) AS shipping,
               SUM(CASE WHEN status = 'completed'  THEN 1 ELSE 0 END) AS completed,
               SUM(CASE WHEN status = 'cancelled'  THEN 1 ELSE 0 END) AS cancelled,
               SUM(CASE WHEN status = 'completed'  THEN total_amount ELSE 0 END) AS total_revenue
             FROM orders"
        );
        $stmt->execute();
        return $stmt->fetch() ?: [];
    }
}
