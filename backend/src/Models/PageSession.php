<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

class PageSession
{
    public function __construct(private PDO $pdo) {}

    public function upsert(string $sessionId, string $currentPage = ''): bool
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO page_sessions (session_id, current_page, last_ping)
             VALUES (:session_id, :current_page, NOW())
             ON DUPLICATE KEY UPDATE
               current_page = :current_page_dup,
               last_ping    = NOW()'
        );
        $stmt->bindValue(':session_id',       $sessionId,   PDO::PARAM_STR);
        $stmt->bindValue(':current_page',     $currentPage, PDO::PARAM_STR);
        $stmt->bindValue(':current_page_dup', $currentPage, PDO::PARAM_STR);
        return $stmt->execute();
    }

    public function getActive(int $minutes = 5): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT * FROM page_sessions
             WHERE last_ping >= DATE_SUB(NOW(), INTERVAL :minutes MINUTE)
             ORDER BY last_ping DESC"
        );
        $stmt->bindValue(':minutes', $minutes, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getActiveCount(int $minutes = 5): int
    {
        $stmt = $this->pdo->prepare(
            "SELECT COUNT(*) FROM page_sessions
             WHERE last_ping >= DATE_SUB(NOW(), INTERVAL :minutes MINUTE)"
        );
        $stmt->bindValue(':minutes', $minutes, PDO::PARAM_INT);
        $stmt->execute();
        return (int)$stmt->fetchColumn();
    }

    public function cleanup(int $hours = 24): int
    {
        $stmt = $this->pdo->prepare(
            "DELETE FROM page_sessions
             WHERE last_ping < DATE_SUB(NOW(), INTERVAL :hours HOUR)"
        );
        $stmt->bindValue(':hours', $hours, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->rowCount();
    }

    public function findBySession(string $sessionId): array|false
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM page_sessions WHERE session_id = :session_id LIMIT 1'
        );
        $stmt->bindValue(':session_id', $sessionId, PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->fetch();
    }
}
