<?php

declare(strict_types=1);

// Set header to JSON for API response
header('Content-Type: application/json; charset=utf-8');

define('BASE_DIR', dirname(__DIR__, 2));

// Autoload manual fallback or Composer
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
    // Load config
    Config::load(BASE_DIR . '/backend/.env');
    $pdo = Database::getInstance();
    
    // Check if JSON file exists
    $jsonPath = BASE_DIR . '/kemil_products.json';
    if (!file_exists($jsonPath)) {
        echo json_encode([
            'success' => false,
            'error' => "File not found: {$jsonPath}"
        ]);
        exit;
    }
    
    $jsonData = file_get_contents($jsonPath);
    $products = json_decode($jsonData, true);
    
    if (!is_array($products)) {
        echo json_encode([
            'success' => false,
            'error' => 'Invalid JSON data in kemil_products.json'
        ]);
        exit;
    }
    
    $pdo->beginTransaction();
    
    // 1. Ensure Brand 'Kemil' exists
    $stmtBrand = $pdo->prepare("SELECT id FROM brands WHERE LOWER(name) = 'kemil' LIMIT 1");
    $stmtBrand->execute();
    $brandId = $stmtBrand->fetchColumn();
    
    if (!$brandId) {
        $stmtInsertBrand = $pdo->prepare("INSERT INTO brands (name, slug, source_name, is_active) VALUES ('Kemil', 'kemil', 'Kemil', 1)");
        $stmtInsertBrand->execute();
        $brandId = (int)$pdo->lastInsertId();
    } else {
        $brandId = (int)$brandId;
    }
    
    // 2. Fetch category_id for "Đồng Hồ Nữ"
    $stmtCat = $pdo->prepare("SELECT id FROM categories WHERE slug = 'nu' OR LOWER(name) LIKE '%nữ%' LIMIT 1");
    $stmtCat->execute();
    $categoryId = $stmtCat->fetchColumn();
    if (!$categoryId) {
        $categoryId = 2; // Fallback
    } else {
        $categoryId = (int)$categoryId;
    }
    
    // 3. Fetch subcategories for "nu-thoi-trang" and "nu-co"
    $stmtSub = $pdo->prepare("SELECT id FROM subcategories WHERE slug = 'nu-thoi-trang' LIMIT 1");
    $stmtSub->execute();
    $subPinId = $stmtSub->fetchColumn();
    if ($subPinId) $subPinId = (int)$subPinId;
    
    $stmtSubCo = $pdo->prepare("SELECT id FROM subcategories WHERE slug = 'nu-co' LIMIT 1");
    $stmtSubCo->execute();
    $subCoId = $stmtSubCo->fetchColumn();
    if ($subCoId) $subCoId = (int)$subCoId;
    
    $insertedCount = 0;
    $updatedCount = 0;
    
    // 4. Insert or Update Products
    foreach ($products as $p) {
        $sku = $p['sku'];
        $name = $p['name'];
        $slug = $p['slug'];
        $price = (float)$p['price'];
        $salePrice = isset($p['sale_price']) && $p['sale_price'] !== '' ? (float)$p['sale_price'] : null;
        $description = $p['description_html'];
        $movementType = strtolower($p['movement_type'] ?? 'quartz');
        $waterResistance = $p['water_resistance'] ?? '30m (3 ATM)';
        $caseMaterial = $p['case_material'] ?? 'Thép không gỉ 316L';
        $caseSize = $p['case_size'] ?? '32mm';
        
        // Resolve subcategory_id
        $subId = ($movementType === 'automatic') ? $subCoId : $subPinId;
        
        // Build specs JSON object
        $specsObj = [];
        if (isset($p['case_material'])) $specsObj['Chất liệu vỏ'] = $p['case_material'];
        if (isset($p['case_size'])) $specsObj['Đường kính mặt'] = $p['case_size'];
        if (isset($p['movement_type'])) $specsObj['Loại máy'] = strtoupper($p['movement_type']);
        if (isset($p['water_resistance'])) $specsObj['Chống nước'] = $p['water_resistance'];
        if (isset($p['origin'])) $specsObj['Xuất xứ thương hiệu'] = $p['origin'];
        
        // Add extra specs from attributes
        $specsObj['Giới tính'] = 'Nữ';
        $specsObj['Thương hiệu'] = 'Kemil';
        
        $imagesJson = json_encode($p['images'] ?? []);
        $specsJson = json_encode($specsObj, JSON_UNESCAPED_UNICODE);
        
        // Check if SKU exists
        $stmtCheck = $pdo->prepare("SELECT id FROM products WHERE sku = :sku LIMIT 1");
        $stmtCheck->execute([':sku' => $sku]);
        $prodId = $stmtCheck->fetchColumn();
        
        if ($prodId) {
            // Update
            $stmtUpdate = $pdo->prepare("
                UPDATE products SET 
                    category_id = :category_id,
                    subcategory_id = :subcategory_id,
                    brand_id = :brand_id,
                    name = :name,
                    slug = :slug,
                    description = :description,
                    price = :price,
                    sale_price = :sale_price,
                    stock = :stock,
                    brand = :brand,
                    case_material = :case_material,
                    case_size = :case_size,
                    movement_type = :movement_type,
                    water_resistance = :water_resistance,
                    images = :images,
                    is_active = 1,
                    specs = :specs,
                    rating_avg = :rating_avg,
                    rating_count = :rating_count
                WHERE id = :id
            ");
            $stmtUpdate->execute([
                ':category_id' => $categoryId,
                ':subcategory_id' => $subId,
                ':brand_id' => $brandId,
                ':name' => $name,
                ':slug' => $slug,
                ':description' => $description,
                ':price' => $price,
                ':sale_price' => $salePrice,
                ':stock' => 10,
                ':brand' => 'Kemil',
                ':case_material' => $caseMaterial,
                ':case_size' => $caseSize,
                ':movement_type' => $movementType,
                ':water_resistance' => $waterResistance,
                ':images' => $imagesJson,
                ':specs' => $specsJson,
                ':rating_avg' => $p['rating_avg'] ?? 5.0,
                ':rating_count' => $p['rating_count'] ?? 0,
                ':id' => (int)$prodId
            ]);
            $updatedCount++;
        } else {
            // Insert
            $stmtInsert = $pdo->prepare("
                INSERT INTO products (
                    category_id, subcategory_id, brand_id, name, slug, description,
                    price, sale_price, stock, sku, brand, case_material, case_size,
                    movement_type, water_resistance, images, is_active, specs,
                    rating_avg, rating_count
                ) VALUES (
                    :category_id, :subcategory_id, :brand_id, :name, :slug, :description,
                    :price, :sale_price, 10, :sku, 'Kemil', :case_material, :case_size,
                    :movement_type, :water_resistance, :images, 1, :specs,
                    :rating_avg, :rating_count
                )
            ");
            $stmtInsert->execute([
                ':category_id' => $categoryId,
                ':subcategory_id' => $subId,
                ':brand_id' => $brandId,
                ':name' => $name,
                ':slug' => $slug,
                ':description' => $description,
                ':price' => $price,
                ':sale_price' => $salePrice,
                ':sku' => $sku,
                ':case_material' => $caseMaterial,
                ':case_size' => $caseSize,
                ':movement_type' => $movementType,
                ':water_resistance' => $waterResistance,
                ':images' => $imagesJson,
                ':specs' => $specsJson,
                ':rating_avg' => $p['rating_avg'] ?? 5.0,
                ':rating_count' => $p['rating_count'] ?? 0
            ]);
            $insertedCount++;
        }
    }
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => "Kemil seeding completed successfully! Inserted: {$insertedCount}, Updated: {$updatedCount}"
    ]);
    
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
