<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

class Review
{
    public function __construct(private PDO $pdo)
    {
        $this->migrate();
    }

    public function getSummary(int $productId): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT COUNT(*) AS total, COALESCE(AVG(rating), 0) AS avg_rating,
                    SUM(rating = 5) AS five_star, SUM(rating = 4) AS four_star,
                    SUM(rating = 3) AS three_star, SUM(rating = 2) AS two_star,
                    SUM(rating = 1) AS one_star
             FROM reviews
             WHERE product_id = :product_id AND status = 'approved'"
        );
        $stmt->execute([':product_id' => $productId]);
        return $stmt->fetch() ?: [];
    }

    public function paginate(int $productId, int $page, int $limit, int $rating, bool $hasPhoto, int $viewerId = 0): array
    {
        $where = ["r.product_id = :product_id"];
        $params = [':product_id' => $productId];
        $where[] = $viewerId > 0
            ? "(r.status = 'approved' OR (r.user_id = :viewer_id AND r.status = 'pending'))"
            : "r.status = 'approved'";

        if ($viewerId > 0) {
            $params[':viewer_id'] = $viewerId;
        }
        if ($rating >= 1 && $rating <= 5) {
            $where[] = 'r.rating = :rating';
            $params[':rating'] = $rating;
        }
        if ($hasPhoto) {
            $where[] = 'EXISTS (SELECT 1 FROM review_photos rp WHERE rp.review_id = r.id)';
        }

        $whereSql = implode(' AND ', $where);
        $count = $this->pdo->prepare("SELECT COUNT(*) FROM reviews r WHERE {$whereSql}");
        foreach ($params as $key => $value) {
            $count->bindValue($key, $value, PDO::PARAM_INT);
        }
        $count->execute();
        $total = (int)$count->fetchColumn();

        $offset = max(0, ($page - 1) * $limit);
        $stmt = $this->pdo->prepare(
            "SELECT r.id, r.user_id, r.rating, r.title, r.comment, r.helpful_count, r.shop_reply,
                    r.status, r.is_anonymous, r.created_at,
                    COALESCE(u.full_name, r.user_name, 'Khách hàng') AS user_name,
                    (SELECT JSON_ARRAYAGG(photo_url) FROM review_photos rp WHERE rp.review_id = r.id) AS photos_json
             FROM reviews r
             LEFT JOIN users u ON u.id = r.user_id
             WHERE {$whereSql}
             ORDER BY CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END, r.created_at DESC
             LIMIT :limit OFFSET :offset"
        );
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value, PDO::PARAM_INT);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['photos'] = $row['photos_json'] ? json_decode((string)$row['photos_json'], true) : [];
            unset($row['photos_json']);
        }

        return ['data' => $rows, 'total' => $total, 'page' => $page, 'limit' => $limit];
    }

    public function findByUserAndProduct(int $userId, int $productId): array|false
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM reviews WHERE user_id = :user_id AND product_id = :product_id LIMIT 1'
        );
        $stmt->execute([':user_id' => $userId, ':product_id' => $productId]);
        return $stmt->fetch();
    }

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare(
            "INSERT INTO reviews
                (product_id, user_id, order_id, rating, title, comment, is_anonymous, status)
             VALUES
                (:product_id, :user_id, :order_id, :rating, :title, :comment, :is_anonymous, :status)"
        );
        $stmt->execute([
            ':product_id' => $data['product_id'],
            ':user_id' => $data['user_id'],
            ':order_id' => $data['order_id'],
            ':rating' => $data['rating'],
            ':title' => $data['title'] ?: null,
            ':comment' => $data['comment'],
            ':is_anonymous' => (int)$data['is_anonymous'],
            ':status' => $data['status'] ?? 'pending',
        ]);
        return (int)$this->pdo->lastInsertId();
    }

    private function migrate(): void
    {
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS reviews (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            product_id INT UNSIGNED NOT NULL,
            user_id INT UNSIGNED NULL,
            user_name VARCHAR(120) NULL,
            order_id INT UNSIGNED NULL,
            rating TINYINT UNSIGNED NOT NULL,
            title VARCHAR(255) NULL,
            comment TEXT NOT NULL,
            is_anonymous TINYINT(1) NOT NULL DEFAULT 0,
            status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
            reject_reason VARCHAR(255) NULL,
            shop_reply TEXT NULL,
            shop_reply_by INT UNSIGNED NULL,
            shop_reply_at TIMESTAMP NULL,
            helpful_count INT UNSIGNED NOT NULL DEFAULT 0,
            is_edited TINYINT(1) NOT NULL DEFAULT 0,
            edited_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uk_reviews_user_product (user_id, product_id),
            INDEX idx_reviews_product_status (product_id, status, created_at),
            INDEX idx_reviews_rating (product_id, rating)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        $cols = [
            'user_id' => 'INT UNSIGNED NULL AFTER product_id',
            'user_name' => 'VARCHAR(120) NULL AFTER user_id',
            'order_id' => 'INT UNSIGNED NULL AFTER user_name',
            'is_anonymous' => 'TINYINT(1) NOT NULL DEFAULT 0 AFTER comment',
            'reject_reason' => 'VARCHAR(255) NULL AFTER status',
            'shop_reply_by' => 'INT UNSIGNED NULL AFTER shop_reply',
            'shop_reply_at' => 'TIMESTAMP NULL AFTER shop_reply_by',
            'is_edited' => 'TINYINT(1) NOT NULL DEFAULT 0 AFTER helpful_count',
            'edited_at' => 'TIMESTAMP NULL AFTER is_edited',
            'updated_at' => 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at'
        ];

        foreach ($cols as $col => $definition) {
            try {
                $check = $this->pdo->query("SHOW COLUMNS FROM reviews LIKE '{$col}'");
                if ($check->rowCount() === 0) {
                    $this->pdo->exec("ALTER TABLE reviews ADD COLUMN {$col} {$definition}");
                }
            } catch (\Exception $e) {
                // Ignore errors if check fails
            }
        }

        $this->pdo->exec("CREATE TABLE IF NOT EXISTS review_photos (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            review_id BIGINT UNSIGNED NOT NULL,
            photo_url VARCHAR(500) NOT NULL,
            sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_review_photos_review (review_id, sort_order)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        $this->pdo->exec("CREATE TABLE IF NOT EXISTS review_votes (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            review_id BIGINT UNSIGNED NOT NULL,
            user_id INT UNSIGNED NOT NULL,
            vote_type ENUM('helpful','not_helpful') NOT NULL DEFAULT 'helpful',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uk_review_votes_unique (review_id, user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    }
}
