<?php
function fetchUrl($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $res = curl_exec($ch);
    curl_close($ch);
    return $res;
}

try {
    $listUrl = "https://venixwatchvn464.mbws.vn/backend/public/api/products?limit=300";
    echo "Fetching products from $listUrl ...\n";
    $json = fetchUrl($listUrl);
    $data = json_decode($json, true);
    
    if (!$data || (!isset($data['data']) && !isset($data['products']))) {
        echo "Failed to fetch products.\n";
        exit;
    }
    
    $products = $data['data'] ?? $data['products'] ?? [];
    echo "Fetched " . count($products) . " products.\n\n";
    
    $missingCount = 0;
    $totalCount = 0;
    $missingSamples = [];
    
    $publicDir = 'H:/venixwatch/backend/public';
    
    foreach ($products as $p) {
        // Fetch detailed product info to get all images
        $detailUrl = "https://venixwatchvn464.mbws.vn/backend/public/api/products/" . urlencode($p['slug']);
        $detailJson = fetchUrl($detailUrl);
        $detailData = json_decode($detailJson, true);
        $prod = $detailData['data'] ?? null;
        
        if (!$prod) {
            continue;
        }
        
        $images = $prod['images'] ?? [];
        if (!is_array($images)) {
            $images = [$images];
        }
        
        foreach ($images as $imgUrl) {
            if (!$imgUrl) continue;
            $totalCount++;
            
            $parsed = parse_url($imgUrl);
            $path = urldecode($parsed['path'] ?? '');
            $relPath = ltrim($path, '/');
            
            // Strip project subfolder if present
            $cleanRelPath = str_replace('dong-ho-a-tuan/backend/public/', '', $relPath);
            $cleanRelPath = str_replace('backend/public/', '', $cleanRelPath);
            
            $localFile = $publicDir . '/' . ltrim($cleanRelPath, '/');
            $exists = file_exists($localFile);
            
            if (!$exists) {
                $missingCount++;
                if (count($missingSamples) < 50) {
                    $missingSamples[] = [
                        'id' => $prod['id'],
                        'name' => $prod['name'],
                        'url' => $imgUrl,
                        'checked_file' => $localFile
                    ];
                }
            }
        }
    }
    
    echo "Total image references checked: $totalCount\n";
    echo "Total missing images: $missingCount\n\n";
    
    if ($missingCount > 0) {
        echo "=== MISSING IMAGE SAMPLES (First 50) ===\n";
        foreach ($missingSamples as $s) {
            echo "Product ID: {$s['id']} | Name: {$s['name']}\n";
            echo "  URL: {$s['url']}\n";
            echo "  Checked Path: {$s['checked_file']}\n";
        }
    } else {
        echo "All checked images exist locally!\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
