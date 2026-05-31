<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=db_4ed5c239', 'root', '');
    $stmt = $pdo->query("SELECT brand, COUNT(*) as count FROM products GROUP BY brand");
    echo "=== LOCAL PRODUCTS BY BRAND ===\n";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo " - Brand: {$row['brand']} | Count: {$row['count']}\n";
    }
    
    echo "\n=== SAMPLE PRODUCTS ===\n";
    $stmt = $pdo->query("SELECT id, name, brand, slug, description FROM products LIMIT 10");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo " - ID: {$row['id']} | Brand: {$row['brand']} | Name: {$row['name']} | Slug: {$row['slug']}\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
