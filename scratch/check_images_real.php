<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=watch2_web', 'root', '');
    $stmt = $pdo->query("SHOW COLUMNS FROM products");
    echo "=== COLUMNS OF products IN watch2_web ===\n";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "Field: {$row['Field']} | Type: {$row['Type']}\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
