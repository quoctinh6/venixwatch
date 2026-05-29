<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

class CartItem
{
    public function __construct(private PDO $pdo) {}

    public function getBySession(string $sessionId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT ci.*, p.name, p.price, p.sale_price, p.images,
                    p.slug, p.stock, p.is_active
             FROM cart_items ci
             INNER JOIN products p ON p.id = ci.product_id
             WHERE ci.session_id = :session_id
             ORDER BY ci.created_at ASC'
        );
        $stmt->bindValue(':session_id', $sessionId, PDO::PARAM_STR);
        $stmt->execute();
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['images'] = $row['images'] ? json_decode($row['images'], true) : [];
        }
        return $rows;
    }

    public function addItem(string $sessionId, int $productId, int $quantity = 1): bool
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO cart_items (session_id, product_id, quantity)
             VALUES (:session_id, :product_id, :quantity)
             ON DUPLICATE KEY UPDATE quantity = quantity + :quantity_dup'
        );
        $stmt->bindValue(':session_id',   $sessionId, PDO::PARAM_STR);
        $stmt->bindValue(':product_id',   $productId, PDO::PARAM_INT);
        $stmt->bindValue(':quantity',     $quantity,  PDO::PARAM_INT);
        $stmt->bindValue(':quantity_dup', $quantity,  PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function updateQuantity(string $sessionId, int $productId, int $quantity): bool
    {
        if ($quantity <= 0) {
            return $this->removeItem($sessionId, $productId);
        }
        $stmt = $this->pdo->prepare(
            'UPDATE cart_items SET quantity = :quantity
             WHERE session_id = :session_id AND product_id = :product_id'
        );
        $stmt->bindValue(':quantity',   $quantity,  PDO::PARAM_INT);
        $stmt->bindValue(':session_id', $sessionId, PDO::PARAM_STR);
        $stmt->bindValue(':product_id', $productId, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function removeItem(string $sessionId, int $productId): bool
    {
        $stmt = $this->pdo->prepare(
            'DELETE FROM cart_items
             WHERE session_id = :session_id AND product_id = :product_id'
        );
        $stmt->bindValue(':session_id', $sessionId, PDO::PARAM_STR);
        $stmt->bindValue(':product_id', $productId, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function clearSession(string $sessionId): bool
    {
        $stmt = $this->pdo->prepare(
            'DELETE FROM cart_items WHERE session_id = :session_id'
        );
        $stmt->bindValue(':session_id', $sessionId, PDO::PARAM_STR);
        return $stmt->execute();
    }

    public function getItemCount(string $sessionId): int
    {
        $stmt = $this->pdo->prepare(
            'SELECT COALESCE(SUM(quantity), 0)
             FROM cart_items WHERE session_id = :session_id'
        );
        $stmt->bindValue(':session_id', $sessionId, PDO::PARAM_STR);
        $stmt->execute();
        return (int)$stmt->fetchColumn();
    }
}
