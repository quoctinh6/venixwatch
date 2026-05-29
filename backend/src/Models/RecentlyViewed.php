<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

class RecentlyViewed
{
    public function __construct(private PDO $pdo)
    {
        $this->pdo->exec(
            "CREATE TABLE IF NOT EXISTS recently_viewed (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                session_id VARCHAR(120) NOT NULL,
                product_id INT UNSIGNED NOT NULL,
                viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_recently_viewed_session (session_id, viewed_at),
                INDEX idx_recently_viewed_product (product_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
    }

    public function track(int $productId, string $sessionId): void
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO recently_viewed (session_id, product_id, viewed_at)
             VALUES (:session_id, :product_id, NOW())'
        );
        $stmt->execute([':session_id' => $sessionId, ':product_id' => $productId]);
    }

    public function getBySession(string $sessionId, int $limit = 8): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT p.id, p.name, p.slug, p.price, p.sale_price, p.images, c.name AS category_name
             FROM recently_viewed rv
             INNER JOIN products p ON p.id = rv.product_id
             LEFT JOIN categories c ON c.id = p.category_id
             WHERE rv.session_id = :session_id AND p.is_active = 1
             GROUP BY p.id, p.name, p.slug, p.price, p.sale_price, p.images, c.name
             ORDER BY MAX(rv.viewed_at) DESC
             LIMIT :limit'
        );
        $stmt->bindValue(':session_id', $sessionId, PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['images'] = $row['images'] ? json_decode((string)$row['images'], true) : [];
        }
        return $rows;
    }
}
