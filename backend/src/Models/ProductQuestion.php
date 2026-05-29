<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

class ProductQuestion
{
    public function __construct(private PDO $pdo)
    {
        $this->migrate();
    }

    public function paginate(int $productId, int $page, int $limit, int $viewerId = 0): array
    {
        $where = ["q.product_id = :product_id"];
        $params = [':product_id' => $productId];
        $where[] = $viewerId > 0
            ? "(q.status = 'answered' OR (q.user_id = :viewer_id AND q.status = 'pending'))"
            : "q.status = 'answered'";

        if ($viewerId > 0) {
            $params[':viewer_id'] = $viewerId;
        }

        $whereSql = implode(' AND ', $where);
        $count = $this->pdo->prepare("SELECT COUNT(*) FROM product_questions q WHERE {$whereSql}");
        foreach ($params as $key => $value) {
            $count->bindValue($key, $value, PDO::PARAM_INT);
        }
        $count->execute();
        $total = (int)$count->fetchColumn();

        $offset = max(0, ($page - 1) * $limit);
        $stmt = $this->pdo->prepare(
            "SELECT q.id, q.user_id, q.question, q.answer, q.status, q.notify_email, q.created_at, q.answered_at,
                    COALESCE(u.full_name, q.user_name, 'Khách hàng') AS user_name
             FROM product_questions q
             LEFT JOIN users u ON u.id = q.user_id
             WHERE {$whereSql}
             ORDER BY CASE WHEN q.status = 'pending' THEN 0 ELSE 1 END, q.created_at DESC
             LIMIT :limit OFFSET :offset"
        );
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value, PDO::PARAM_INT);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return ['data' => $stmt->fetchAll(), 'total' => $total, 'page' => $page, 'limit' => $limit];
    }

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare(
            "INSERT INTO product_questions
                (product_id, user_id, question, status, notify_email)
             VALUES
                (:product_id, :user_id, :question, :status, :notify_email)"
        );
        $stmt->execute([
            ':product_id' => $data['product_id'],
            ':user_id' => $data['user_id'],
            ':question' => $data['question'],
            ':status' => $data['status'] ?? 'pending',
            ':notify_email' => (int)$data['notify_email'],
        ]);
        return (int)$this->pdo->lastInsertId();
    }

    public function countTodayByUser(int $userId, int $productId): int
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM product_questions
             WHERE user_id = :user_id AND product_id = :product_id AND DATE(created_at) = CURRENT_DATE()'
        );
        $stmt->execute([':user_id' => $userId, ':product_id' => $productId]);
        return (int)$stmt->fetchColumn();
    }

    private function migrate(): void
    {
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS product_questions (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            product_id INT UNSIGNED NOT NULL,
            user_id INT UNSIGNED NULL,
            user_name VARCHAR(120) NULL,
            question TEXT NOT NULL,
            answer TEXT NULL,
            status ENUM('pending','answered','hidden') NOT NULL DEFAULT 'pending',
            answered_by INT UNSIGNED NULL,
            answered_at TIMESTAMP NULL,
            notify_email TINYINT(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_product_questions_status (product_id, status, created_at),
            INDEX idx_product_questions_user_day (user_id, product_id, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        $cols = [
            'user_id' => 'INT UNSIGNED NULL AFTER product_id',
            'user_name' => 'VARCHAR(120) NULL AFTER user_id',
            'status' => "ENUM('pending','answered','hidden') NOT NULL DEFAULT 'pending' AFTER answer",
            'answered_by' => 'INT UNSIGNED NULL AFTER status',
            'notify_email' => 'TINYINT(1) NOT NULL DEFAULT 1 AFTER answered_at',
            'updated_at' => 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at'
        ];

        foreach ($cols as $col => $definition) {
            try {
                $check = $this->pdo->query("SHOW COLUMNS FROM product_questions LIKE '{$col}'");
                if ($check->rowCount() === 0) {
                    $this->pdo->exec("ALTER TABLE product_questions ADD COLUMN {$col} {$definition}");
                }
            } catch (\Exception $e) {
                // Ignore errors if check fails
            }
        }
    }
}
