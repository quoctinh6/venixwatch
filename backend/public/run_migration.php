<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/config/Config.php';
require_once dirname(__DIR__) . '/config/Database.php';

use App\Config\Config;
use App\Config\Database;

header('Content-Type: text/plain; charset=utf-8');

try {
    Config::load(dirname(__DIR__) . '/.env');
    $pdo = Database::getInstance();

    // Check if specs column exists in products table
    $stmt = $pdo->query("SHOW COLUMNS FROM `products` LIKE 'specs'");
    if ($stmt->rowCount() === 0) {
        $pdo->exec("ALTER TABLE `products` ADD COLUMN `specs` JSON NULL AFTER `og_image`");
        echo "SUCCESS: Column 'specs' added successfully to products table.\n";
    } else {
        echo "INFO: Column 'specs' already exists in products table.\n";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
