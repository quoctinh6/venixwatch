<?php
declare(strict_types=1);
define('BASE_DIR', dirname(__DIR__));
spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';
    $base   = BASE_DIR . '/src/';
    if (!str_starts_with($class, $prefix)) return;
    $relative = substr($class, strlen($prefix));
    $file     = $base . str_replace('\\', '/', $relative) . '.php';
    if (file_exists($file)) require_once $file;
});
spl_autoload_register(function (string $class): void {
    $prefix = 'App\\Config\\';
    $base   = BASE_DIR . '/config/';
    if (!str_starts_with($class, $prefix)) return;
    $relative = substr($class, strlen($prefix));
    $file     = $base . $relative . '.php';
    if (file_exists($file)) require_once $file;
});

use App\Config\Config;
use App\Config\Database;

Config::load(BASE_DIR . '/.env');

header('Content-Type: application/json');
try {
    $pdo = Database::getInstance();
    
    // 1. Clear current brands
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    $pdo->exec("TRUNCATE TABLE brands");
    
    // 2. Insert new brands matching storefront user side
    $stmt = $pdo->prepare("
        INSERT INTO brands (name, slug, source_name, is_active, sort_order) 
        VALUES (:name, :slug, :source_name, :is_active, :sort_order)
    ");
    
    $new_brands = [
        ['name' => 'Rolex Premium', 'slug' => 'rolex', 'source_name' => 'Rolex', 'is_active' => 1, 'sort_order' => 1],
        ['name' => 'Omega Switzerland', 'slug' => 'omega', 'source_name' => 'Omega', 'is_active' => 1, 'sort_order' => 2],
        ['name' => 'Hublot Modern', 'slug' => 'hublot', 'source_name' => 'Hublot', 'is_active' => 1, 'sort_order' => 3],
        ['name' => 'Tissot Luxury', 'slug' => 'tissot', 'source_name' => 'Tissot', 'is_active' => 1, 'sort_order' => 4],
        ['name' => 'Longines Classic', 'slug' => 'longines', 'source_name' => 'Longines', 'is_active' => 1, 'sort_order' => 5],
        ['name' => 'Patek Philippe', 'slug' => 'patek', 'source_name' => 'Patek', 'is_active' => 1, 'sort_order' => 6],
        ['name' => 'Audemars Piguet', 'slug' => 'audemars', 'source_name' => 'Audemars', 'is_active' => 1, 'sort_order' => 7]
    ];
    
    foreach ($new_brands as $b) {
        $stmt->execute([
            ':name' => $b['name'],
            ':slug' => $b['slug'],
            ':source_name' => $b['source_name'],
            ':is_active' => $b['is_active'],
            ':sort_order' => $b['sort_order']
        ]);
    }
    
    // 3. Remap brand_id in products table by matching brand text
    $pdo->exec("
        UPDATE products p
        JOIN brands b ON LOWER(b.name) = LOWER(p.brand) OR LOWER(b.source_name) = LOWER(p.brand)
        SET p.brand_id = b.id
    ");
    
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    
    // Fetch new brands list to verify
    $brands = $pdo->query("SELECT * FROM brands ORDER BY sort_order ASC")->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'message' => 'Successfully updated database brands on live server to match frontend display!',
        'brands' => $brands
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}