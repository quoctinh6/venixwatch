<?php

declare(strict_types=1);

namespace App\Services\Public;

use App\Config\Database;
use PDO;

class BadWordFilterService
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::getInstance();
        $this->pdo->exec(
            "CREATE TABLE IF NOT EXISTS bad_words (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                word VARCHAR(100) NOT NULL UNIQUE,
                severity ENUM('low','medium','high') NOT NULL DEFAULT 'medium'
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
    }

    public function sanitize(?string $value): string
    {
        $clean = trim(strip_tags((string)$value));
        return preg_replace('/\s+/u', ' ', $clean) ?? '';
    }

    public function clean(?string $value): string
    {
        $text = $this->sanitize($value);
        foreach ($this->words() as $word) {
            $pattern = '/\b' . preg_quote($word, '/') . '\b/iu';
            $text = preg_replace($pattern, str_repeat('*', mb_strlen($word)), $text) ?? $text;
        }
        return $text;
    }

    private function words(): array
    {
        $stmt = $this->pdo->query('SELECT word FROM bad_words ORDER BY CHAR_LENGTH(word) DESC');
        return array_map('strval', $stmt->fetchAll(PDO::FETCH_COLUMN) ?: []);
    }
}
