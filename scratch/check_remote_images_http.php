<?php
function checkUrlStatus($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_NOBODY, true); // HEAD request
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 3);
    curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return $code;
}

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
    
    $products = $data['data'] ?? $data['products'] ?? [];
    echo "Fetched " . count($products) . " products.\n";
    
    $checkedCount = 0;
    $missingCount = 0;
    $missingList = [];
    
    foreach ($products as $p) {
        $slug = $p['slug'];
        $detailUrl = "https://venixwatchvn464.mbws.vn/backend/public/api/products/" . urlencode($slug);
        $detailJson = fetchUrl($detailUrl);
        $detailData = json_decode($detailJson, true);
        $prod = $detailData['data'] ?? null;
        
        if (!$prod) continue;
        
        $images = $prod['images'] ?? [];
        if (!is_array($images)) {
            $images = [$images];
        }
        
        foreach ($images as $imgUrl) {
            if (!$imgUrl) continue;
            
            // Build full URL if relative
            $fullUrl = $imgUrl;
            if (strpos($imgUrl, 'http') !== 0) {
                $fullUrl = 'https://venixwatchvn464.mbws.vn' . '/' . ltrim($imgUrl, '/');
            }
            
            $checkedCount++;
            $status = checkUrlStatus($fullUrl);
            
            if ($status !== 200) {
                $missingCount++;
                echo "MISSING [HTTP $status]: $fullUrl (Product: {$prod['name']})\n";
                if (count($missingList) < 50) {
                    $missingList[] = [
                        'url' => $fullUrl,
                        'status' => $status,
                        'product_name' => $prod['name']
                    ];
                }
            }
        }
    }
    
    echo "\n=== SUMMARY ===\n";
    echo "Total images checked: $checkedCount\n";
    echo "Total missing images (HTTP status != 200): $missingCount\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
