<?php
require_once dirname(__DIR__) . '/backend/config/Config.php';
require_once dirname(__DIR__) . '/backend/config/Database.php';

use App\Config\Config;
use App\Config\Database;

try {
    Config::load(dirname(__DIR__) . '/backend/.env');
    $pdo = Database::getInstance();
    
    $stmt = $pdo->prepare("SELECT * FROM products WHERE brand = 'Carnival' OR name LIKE '%Carnival%'");
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($products, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
