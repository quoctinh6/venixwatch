<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=db_4ed5c239', 'root', '');
    $stmt = $pdo->query("SELECT id, name, images FROM products");
    
    $totalProducts = 0;
    $missingCount = 0;
    $productsWithMissing = 0;
    $samples = [];
    
    $publicDir = 'H:/venixwatch/backend/public';

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $totalProducts++;
        $imagesJson = $row['images'];
        if (!$imagesJson) {
            continue;
        }
        $images = json_decode($imagesJson, true);
        if (!is_array($images)) {
            continue;
        }
        
        $hasMissing = false;
        foreach ($images as $imgUrl) {
            // Extract the path from URL. e.g. http://localhost:8000/image/product/... or /image/product/...
            $parsedUrl = parse_url($imgUrl);
            $path = $parsedUrl['path'] ?? '';
            
            // The path starts with /image/product/...
            // The actual file should be at H:/venixwatch/backend/public/image/product/...
            // Let's decode URL encoding
            $path = urldecode($path);
            
            // Strip leading slash if any
            $relPath = ltrim($path, '/'); // e.g. "image/product/..." or "dong-ho-a-tuan/frontend/..."
            
            // Check if it starts with image/product/
            $fileToCheck = $publicDir . '/' . $relPath;
            
            if (!file_exists($fileToCheck)) {
                $hasMissing = true;
                $missingCount++;
                if (count($samples) < 50) {
                    $samples[] = [
                        'product_id' => $row['id'],
                        'name' => $row['name'],
                        'url' => $imgUrl,
                        'checked_file' => $fileToCheck
                    ];
                }
            }
        }
        if ($hasMissing) {
            $productsWithMissing++;
        }
    }
    
    echo "Total products checked: $totalProducts\n";
    echo "Products with missing images: $productsWithMissing\n";
    echo "Total missing image references: $missingCount\n\n";
    
    echo "=== MISSING IMAGE SAMPLES (First 50) ===\n";
    foreach ($samples as $s) {
        echo "Product ID: {$s['product_id']} | {$s['name']}\n";
        echo "  URL: {$s['url']}\n";
        echo "  Checked path: {$s['checked_file']}\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
