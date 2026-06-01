<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

define('BASE_DIR', dirname(__DIR__, 2));

spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';
    $base   = BASE_DIR . '/backend/src/';
    if (!str_starts_with($class, $prefix)) return;
    $relative = substr($class, strlen($prefix));
    $file     = $base . str_replace('\\', '/', $relative) . '.php';
    if (file_exists($file)) require_once $file;
});

spl_autoload_register(function (string $class): void {
    $prefix = 'App\\Config\\';
    $base   = BASE_DIR . '/backend/config/';
    if (!str_starts_with($class, $prefix)) return;
    $relative = substr($class, strlen($prefix));
    $file     = $base . $relative . '.php';
    if (file_exists($file)) require_once $file;
});

use App\Config\Config;
use App\Config\Database;

try {
    Config::load(BASE_DIR . '/backend/.env');
    $pdo = Database::getInstance();
    
    // 1. Fetch unique brand values from products table (since some products might have text brands)
    $stmt1 = $pdo->prepare("SELECT brand, COUNT(*) as count FROM products GROUP BY brand");
    $stmt1->execute();
    $productsBrands = $stmt1->fetchAll(PDO::FETCH_ASSOC);
    
    // 2. Fetch all brands in the brands table
    $stmt2 = $pdo->prepare("SELECT id, name, slug, source_name, is_active FROM brands");
    $stmt2->execute();
    $brandsTable = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'products_brands' => $productsBrands,
        'brands_table' => $brandsTable
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
