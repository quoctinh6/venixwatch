<?php
try {
    $pdo2 = new PDO('mysql:host=127.0.0.1;port=3306;dbname=dong_ho_a_tuan', 'root', '');
    $slugs = ['carnival-8127g-vt-dcs-d2', 'carnival-8128g1-vt-dd-d', 'carnival-8127g-vt-dd-d'];
    
    echo "\n=== dong_ho_a_tuan specific products ===\n";
    foreach ($slugs as $slug) {
        $stmt = $pdo2->prepare("SELECT id, name, slug, images FROM products WHERE slug = :slug OR name LIKE :pattern");
        $pattern = '%' . str_replace('-', ' ', $slug) . '%';
        $stmt->execute([':slug' => $slug, ':pattern' => $pattern]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $row) {
            echo "ID: {$row['id']} | Name: {$row['name']} | Slug: {$row['slug']}\n";
            echo "  images: {$row['images']}\n";
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
