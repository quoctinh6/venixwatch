<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

class PageViewEvent
{
    public function __construct(private PDO $pdo) {}

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO page_view_events
               (session_id, page_url, page_title, time_on_page, scroll_depth)
             VALUES
               (:session_id, :page_url, :page_title, :time_on_page, :scroll_depth)'
        );
        $stmt->bindValue(':session_id',   $data['session_id'],              PDO::PARAM_STR);
        $stmt->bindValue(':page_url',     $data['page_url'],                PDO::PARAM_STR);
        $stmt->bindValue(':page_title',   $data['page_title'] ?? null,      PDO::PARAM_STR);
        $stmt->bindValue(':time_on_page', $data['time_on_page'] ?? 0,       PDO::PARAM_INT);
        $stmt->bindValue(':scroll_depth', $data['scroll_depth'] ?? 0,       PDO::PARAM_INT);
        $stmt->execute();
        return (int)$this->pdo->lastInsertId();
    }

    public function updateOnExit(int $id, int $timeOnPage, int $scrollDepth): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE page_view_events SET
               time_on_page = :time_on_page,
               scroll_depth = :scroll_depth,
               exited_at    = NOW()
             WHERE id = :id'
        );
        $stmt->bindValue(':time_on_page', $timeOnPage,  PDO::PARAM_INT);
        $stmt->bindValue(':scroll_depth', $scrollDepth, PDO::PARAM_INT);
        $stmt->bindValue(':id',           $id,          PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function getTopPages(int $limit = 10, int $days = 30): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT page_url, page_title,
                    COUNT(*) AS views,
                    COUNT(DISTINCT session_id) AS unique_views,
                    ROUND(AVG(time_on_page)) AS avg_time,
                    ROUND(AVG(scroll_depth)) AS avg_scroll
             FROM page_view_events
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
             GROUP BY page_url, page_title
             ORDER BY views DESC
             LIMIT :limit"
        );
        $stmt->bindValue(':days',  $days,  PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getAvgTimeOnPage(int $days = 30): float
    {
        $stmt = $this->pdo->prepare(
            "SELECT AVG(time_on_page)
             FROM page_view_events
             WHERE exited_at IS NOT NULL
               AND created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)"
        );
        $stmt->bindValue(':days', $days, PDO::PARAM_INT);
        $stmt->execute();
        return round((float)$stmt->fetchColumn(), 2);
    }

    public function getAvgScrollDepth(int $days = 30): float
    {
        $stmt = $this->pdo->prepare(
            "SELECT AVG(scroll_depth)
             FROM page_view_events
             WHERE exited_at IS NOT NULL
               AND created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)"
        );
        $stmt->bindValue(':days', $days, PDO::PARAM_INT);
        $stmt->execute();
        return round((float)$stmt->fetchColumn(), 2);
    }

    public function getTotalViews(int $days = 30): int
    {
        $stmt = $this->pdo->prepare(
            "SELECT COUNT(*)
             FROM page_view_events
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)"
        );
        $stmt->bindValue(':days', $days, PDO::PARAM_INT);
        $stmt->execute();
        return (int)$stmt->fetchColumn();
    }

    public function getBySession(string $sessionId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM page_view_events
             WHERE session_id = :session_id
             ORDER BY created_at DESC'
        );
        $stmt->bindValue(':session_id', $sessionId, PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
