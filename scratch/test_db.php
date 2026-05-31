<?php
require_once dirname(__DIR__) . '/backend/config/Config.php';
require_once dirname(__DIR__) . '/backend/config/Database.php';

use App\Config\Config;
use App\Config\Database;

try {
    Config::load(dirname(__DIR__) . '/backend/.env');
    $pdo = Database::getInstance();
    
    // Count total products
    $count = $pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();
    echo "Total products: " . $count . "\n";
    
    // Query a product like Carnival
    $stmt = $pdo->prepare("SELECT id, name, slug, description FROM products LIMIT 5");
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $row) {
        echo "ID: {$row['id']} - Name: {$row['name']} - Slug: {$row['slug']}\n";
        echo "Description length: " . strlen($row['description'] ?? '') . "\n";
    }

    $stmt = $pdo->prepare("SELECT id, name, slug, description FROM products WHERE name LIKE '%Carnival%' LIMIT 1");
    $stmt->execute();
    $carnival = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($carnival) {
        echo "\nFound Carnival:\n";
        echo "ID: {$carnival['id']} - Name: {$carnival['name']}\n";
        echo "Description:\n" . substr($carnival['description'], 0, 500) . "...\n";
    } else {
        echo "\nNo Carnival found by name LIKE '%Carnival%'. Let's search all:\n";
        $all = $pdo->query("SELECT id, name FROM products")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($all as $p) {
            echo " - {$p['name']}\n";
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
