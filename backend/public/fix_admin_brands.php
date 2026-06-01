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
    
    $pdo->beginTransaction();
    
    // 1. Delete all unused placeholder brands (Rolex, Omega, Hublot, etc.) that don't belong to the active ones
    $pdo->exec("DELETE FROM brands WHERE LOWER(source_name) NOT IN ('carnival', 'casio', 'kemil')");
    
    // Helper to find or insert/update a brand with logo
    $ensureBrand = function($name, $slug, $sourceName, $logoUrl) use ($pdo) {
        $stmt = $pdo->prepare("SELECT id FROM brands WHERE LOWER(name) = :name1 OR LOWER(source_name) = :name2 OR LOWER(slug) = :slug LIMIT 1");
        $stmt->execute([
            ':name1' => strtolower($name),
            ':name2' => strtolower($sourceName),
            ':slug' => strtolower($slug)
        ]);
        $id = $stmt->fetchColumn();
        
        if ($id) {
            $id = (int)$id;
            // Update to ensure active and correct details
            $stmtUpdate = $pdo->prepare("UPDATE brands SET name = :name, slug = :slug, source_name = :source_name, logo_url = :logo_url, is_active = 1 WHERE id = :id");
            $stmtUpdate->execute([
                ':name' => $name,
                ':slug' => $slug,
                ':source_name' => $sourceName,
                ':logo_url' => $logoUrl,
                ':id' => $id
            ]);
            return $id;
        } else {
            // Insert new brand
            $stmtInsert = $pdo->prepare("INSERT INTO brands (name, slug, source_name, logo_url, is_active) VALUES (:name, :slug, :source_name, :logo_url, 1)");
            $stmtInsert->execute([
                ':name' => $name,
                ':slug' => $slug,
                ':source_name' => $sourceName,
                ':logo_url' => $logoUrl
            ]);
            return (int)$pdo->lastInsertId();
        }
    };
    
    // Logos in base64 SVG
    $casioLogo = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgNjAiIHdpZHRoPSIyMDAiIGhlaWdodD0iNjAiPgo8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjMGYxNzJhIiByeD0iOCIvPgo8dGV4dCB4PSI1MCUiIHk9IjM4IiBmb250LWZhbWlseT0iTW9udHNlcnJhdCwgQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSI5MDAiIGZvbnQtc2l6ZT0iMjgiIGZpbGw9IiNmZmZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGxldHRlci1zcGFjaW5nPSI0Ij5DQVNJTzwvdGV4dD4KPC9zdmc+';
    $carnivalLogo = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgNjAiIHdpZHRoPSIyMDAiIGhlaWdodD0iNjAiPgo8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjMGYxNzJhIiByeD0iOCIvPgo8cGF0aCBkPSJNMTAwIDEyIEwxMDYgMjAgTDExNCAxNSBMMTEwIDI1IEw5MCAyNSBMMDYgMTUgTDk0IDIwIFoiIGZpbGw9IiNDOUE4NEMiLz4KPHRleHQgeD0iNTAlIiB5PSI0NiIgZm9udC1mYW1pbHk9IidDb3Jtb3JhbnQgR2FyYW1vbmQnLCBHZW9yZ2lhLCBzZXJpZiIgZm9udC13ZWlnaHQ9IjcwMCIgZm9udC1zaXplPSIyMCIgZmlsbD0iI0M5QTg0QyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgbGV0dGVyLXNwYWNpbmc9IjMiPkNBUk5JVkFMPC90ZXh0Pgo8L3N2Zz4=';
    $kemilLogo = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgNjAiIHdpZHRoPSIyMDAiIGhlaWdodD0iNjAiPgo8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjMGYxNzJhIiByeD0iOCIvPgo8dGV4dCB4PSI1MCUiIHk9IjM4IiBmb250LWZhbWlseT0iJ01vbnRzZXJyYXQnLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iMzAwIiBmb250LXNpemU9IjI0IiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBsZXR0ZXItc3BhY2luZz0iNiI+S0VNSUw8L3RleHQ+Cjwvc3ZnPg==';

    // 2. Ensure Carnival, Casio, and Kemil exist and are active with logos
    $carnivalId = $ensureBrand('Carnival', 'carnival', 'Carnival', $carnivalLogo);
    $casioId    = $ensureBrand('Casio', 'casio', 'Casio', $casioLogo);
    $kemilId    = $ensureBrand('Kemil', 'kemil', 'Kemil', $kemilLogo);
    
    // 3. Update products table to link all products to the correct brand ID
    $stmtProductsCasio = $pdo->prepare("UPDATE products SET brand_id = :brand_id WHERE LOWER(brand) = 'casio'");
    $stmtProductsCasio->execute([':brand_id' => $casioId]);
    $casioCount = $stmtProductsCasio->rowCount();
    
    $stmtProductsCarnival = $pdo->prepare("UPDATE products SET brand_id = :brand_id WHERE LOWER(brand) = 'carnival'");
    $stmtProductsCarnival->execute([':brand_id' => $carnivalId]);
    $carnivalCount = $stmtProductsCarnival->rowCount();
    
    $stmtProductsKemil = $pdo->prepare("UPDATE products SET brand_id = :brand_id WHERE LOWER(brand) = 'kemil'");
    $stmtProductsKemil->execute([':brand_id' => $kemilId]);
    $kemilCount = $stmtProductsKemil->rowCount();
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Admin brands fixed successfully!',
        'brands' => [
            'Carnival' => ['id' => $carnivalId, 'linked_products' => $carnivalCount],
            'Casio' => ['id' => $casioId, 'linked_products' => $casioCount],
            'Kemil' => ['id' => $kemilId, 'linked_products' => $kemilCount]
        ]
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
