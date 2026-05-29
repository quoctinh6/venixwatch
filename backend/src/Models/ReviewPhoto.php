<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

class ReviewPhoto
{
    public function __construct(private PDO $pdo)
    {
        $this->pdo->exec(
            "CREATE TABLE IF NOT EXISTS review_photos (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                review_id BIGINT UNSIGNED NOT NULL,
                photo_url VARCHAR(500) NOT NULL,
                sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_review_photos_review (review_id, sort_order)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
    }

    public function createMany(int $reviewId, array $photos): void
    {
        if ($photos === []) {
            return;
        }

        $stmt = $this->pdo->prepare(
            'INSERT INTO review_photos (review_id, photo_url, sort_order)
             VALUES (:review_id, :photo_url, :sort_order)'
        );

        foreach (array_slice(array_values($photos), 0, 5) as $index => $photoUrl) {
            $stmt->execute([
                ':review_id' => $reviewId,
                ':photo_url' => (string)$photoUrl,
                ':sort_order' => $index,
            ]);
        }
    }
}
