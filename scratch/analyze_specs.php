<?php
require_once dirname(__DIR__) . '/backend/config/Config.php';
require_once dirname(__DIR__) . '/backend/config/Database.php';

use App\Config\Config;
use App\Config\Database;

try {
    Config::load(dirname(__DIR__) . '/backend/.env');
    $pdo = Database::getInstance();
    
    // Select all products with description
    $stmt = $pdo->query("SELECT id, name, slug, brand, description FROM products");
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $total = count($products);
    $withTable = 0;
    $hasLugHeight = [];
    $hasLugHeightBrands = [];
    
    foreach ($products as $p) {
        $desc = $p['description'] ?? '';
        
        $hasTable = (str_contains($desc, '<table') || str_contains($desc, 'woocommerce-product-attributes'));
        if ($hasTable) {
            $withTable++;
        }
        
        $matchedKey = null;
        $keywords = [
            'Chiều cao vỏ', 'Chiều cao vỏ', 
            'Chiều ngang vỏ', 'Chiều ngang vỏ', 
            'Chất liệu vỏ và vòng mặt số', 'Chất liệu vỏ và vòng mặt số',
            'Độ dày vỏ', 'Độ dày vỏ',
            'Thông tin pin', 'Thông tin pin'
        ];
        
        foreach ($keywords as $kw) {
            if (str_contains($desc, $kw)) {
                $matchedKey = $kw;
                break;
            }
        }
        
        if ($matchedKey) {
            $hasLugHeight[] = [
                'id' => $p['id'],
                'name' => $p['name'],
                'brand' => $p['brand'],
                'matched' => $matchedKey
            ];
            $brandName = $p['brand'] ?: 'Unknown';
            $hasLugHeightBrands[$brandName] = ($hasLugHeightBrands[$brandName] ?? 0) + 1;
        }
    }
    
    echo "=== DATABASE SPEC SCAN ===\n";
    echo "Total products: $total\n";
    echo "Products with HTML tables in description: $withTable\n";
    echo "Products containing screenshot-like specifications: " . count($hasLugHeight) . "\n";
    echo "Breakdown by brand:\n";
    foreach ($hasLugHeightBrands as $b => $c) {
        echo " - $b: $c\n";
    }
    
    echo "\nSample matching products:\n";
    for ($i = 0; $i < min(15, count($hasLugHeight)); $i++) {
        $item = $hasLugHeight[$i];
        echo " - ID: {$item['id']} | Brand: {$item['brand']} | Name: {$item['name']} | Matched: {$item['matched']}\n";
    }
    exit;
    
    foreach ($products as $p) {
        $specs = [];
        if (!empty($p['specs'])) {
            $specs = json_decode($p['specs'], true) ?: [];
        }
        
        if (!empty($specs)) {
            $withSpecs++;
        }
        
        $brand = strtolower($p['brand'] ?? '');
        if ($brand === 'casio') {
            $casioCount++;
        } elseif ($brand === 'carnival') {
            $carnivalCount++;
        } else {
            $otherCount++;
        }
        
        // Check for specific keys like "Chiều cao vỏ (bao gồm chấu)"
        foreach ($specs as $key => $val) {
            if (str_contains($key, 'Chiều cao vỏ') || str_contains($key, 'Chiều cao vỏ') || str_contains($key, 'Chiều ngang vỏ') || str_contains($key, 'Chất liệu vỏ và vòng mặt số')) {
                $hasLugHeight[] = [
                    'id' => $p['id'],
                    'name' => $p['name'],
                    'brand' => $p['brand'],
                    'key' => $key,
                    'val' => $val
                ];
                $hasLugHeightBrands[$p['brand']] = ($hasLugHeightBrands[$p['brand']] ?? 0) + 1;
                break;
            }
        }
    }
    
    echo "=== DATABASE ANALYSIS ===\n";
    echo "Total products: $total\n";
    echo "Products with custom specs JSON: $withSpecs\n";
    echo "Brands representation in DB:\n";
    echo " - Casio: $casioCount\n";
    echo " - Carnival: $carnivalCount\n";
    echo " - Others: $otherCount\n\n";
    
    echo "Products containing specifications from the screenshot (e.g. 'Chiều cao vỏ'): " . count($hasLugHeight) . "\n";
    echo "Breakdown by brand:\n";
    foreach ($hasLugHeightBrands as $b => $c) {
        echo " - $b: $c\n";
    }
    
    echo "\nSample matching products:\n";
    for ($i = 0; $i < min(10, count($hasLugHeight)); $i++) {
        $item = $hasLugHeight[$i];
        echo " - ID: {$item['id']} | Brand: {$item['brand']} | Name: {$item['name']} | Key: {$item['key']} | Value: {$item['val']}\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
