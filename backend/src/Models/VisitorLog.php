<?php

declare(strict_types=1);

namespace App\Models;

use PDO;

class VisitorLog
{
    public function __construct(private PDO $pdo) {}

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO visitor_logs
               (session_id, ip_address, country_code, country_name, city,
                device_type, browser, referrer, landing_page)
             VALUES
               (:session_id, :ip_address, :country_code, :country_name, :city,
                :device_type, :browser, :referrer, :landing_page)'
        );
        $stmt->bindValue(':session_id',   $data['session_id'],                PDO::PARAM_STR);
        $stmt->bindValue(':ip_address',   $data['ip_address'],                PDO::PARAM_STR);
        $stmt->bindValue(':country_code', $data['country_code'] ?? null,      PDO::PARAM_STR);
        $stmt->bindValue(':country_name', $data['country_name'] ?? null,      PDO::PARAM_STR);
        $stmt->bindValue(':city',         $data['city'] ?? null,              PDO::PARAM_STR);
        $stmt->bindValue(':device_type',  $data['device_type'] ?? 'desktop',  PDO::PARAM_STR);
        $stmt->bindValue(':browser',      $data['browser'] ?? null,           PDO::PARAM_STR);
        $stmt->bindValue(':referrer',     $data['referrer'] ?? null,          PDO::PARAM_STR);
        $stmt->bindValue(':landing_page', $data['landing_page'] ?? null,      PDO::PARAM_STR);
        $stmt->execute();
        return (int)$this->pdo->lastInsertId();
    }

    public function getToday(): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT COUNT(DISTINCT session_id) AS unique_visitors,
                    COUNT(*) AS total_visits
             FROM visitor_logs
             WHERE DATE(created_at) = CURDATE()"
        );
        $stmt->execute();
        return $stmt->fetch() ?: ['unique_visitors' => 0, 'total_visits' => 0];
    }

    public function getByDateRange(string $from, string $to): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT DATE(created_at) AS date,
                    COUNT(DISTINCT session_id) AS unique_visitors,
                    COUNT(*) AS total_visits
             FROM visitor_logs
             WHERE DATE(created_at) BETWEEN :from AND :to
             GROUP BY DATE(created_at)
             ORDER BY date ASC"
        );
        $stmt->bindValue(':from', $from, PDO::PARAM_STR);
        $stmt->bindValue(':to',   $to,   PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getByCountry(int $limit = 10, int $days = 30): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT country_code, country_name,
                    COUNT(DISTINCT session_id) AS unique_visitors
             FROM visitor_logs
             WHERE country_code IS NOT NULL
               AND created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
             GROUP BY country_code, country_name
             ORDER BY unique_visitors DESC
             LIMIT :limit"
        );
        $stmt->bindValue(':days', $days, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getByCity(int $limit = 10, int $days = 30): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT city, country_name,
                    COUNT(DISTINCT session_id) AS unique_visitors
             FROM visitor_logs
             WHERE city IS NOT NULL
               AND city <> ''
               AND created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
             GROUP BY city, country_name
             ORDER BY unique_visitors DESC
             LIMIT :limit"
        );
        $stmt->bindValue(':days', $days, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getDeviceSplit(int $days = 30): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT device_type,
                    COUNT(DISTINCT session_id) AS unique_visitors
             FROM visitor_logs
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
             GROUP BY device_type
             ORDER BY unique_visitors DESC"
        );
        $stmt->bindValue(':days', $days, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getSourceSplit(int $limit = 10, int $days = 30): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT
                CASE
                    WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
                    WHEN referrer LIKE '%google.%' THEN 'Google'
                    WHEN referrer LIKE '%facebook.%' OR referrer LIKE '%fb.%' THEN 'Facebook'
                    WHEN referrer LIKE '%zalo.%' THEN 'Zalo'
                    WHEN referrer LIKE '%instagram.%' THEN 'Instagram'
                    WHEN referrer LIKE '%tiktok.%' THEN 'TikTok'
                    WHEN referrer LIKE '%youtube.%' THEN 'YouTube'
                    ELSE 'Referral'
                END AS source,
                COUNT(DISTINCT session_id) AS unique_visitors
             FROM visitor_logs
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
             GROUP BY source
             ORDER BY unique_visitors DESC
             LIMIT :limit"
        );
        $stmt->bindValue(':days', $days, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getSummary(int $days = 30): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT COUNT(*) AS total_visits,
                    COUNT(DISTINCT session_id) AS unique_visitors
             FROM visitor_logs
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)"
        );
        $stmt->bindValue(':days', $days, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch() ?: ['total_visits' => 0, 'unique_visitors' => 0];
    }

    public function sessionExists(string $sessionId): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM visitor_logs WHERE session_id = :session_id LIMIT 1'
        );
        $stmt->bindValue(':session_id', $sessionId, PDO::PARAM_STR);
        $stmt->execute();
        return (bool)$stmt->fetchColumn();
    }
}
