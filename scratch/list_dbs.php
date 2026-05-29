<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=watch2_web', 'root', '');
    $stmt = $pdo->query('SELECT COUNT(*) FROM products');
    echo "Total products in watch2_web: " . $stmt->fetchColumn() . "\n";

    $stmt = $pdo->prepare("SELECT id, name, slug, description FROM products WHERE name LIKE '%Carnival%' LIMIT 5");
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $row) {
        echo "ID: {$row['id']} - Name: {$row['name']} - Slug: {$row['slug']}\n";
        echo "Description: " . substr($row['description'] ?? '', 0, 100) . "...\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
