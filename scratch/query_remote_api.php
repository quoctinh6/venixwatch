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
    $listUrl = "https://venixwatchvn464.mbws.vn/backend/public/api/products?limit=150";
    echo "Fetching product list from $listUrl ...\n";
    $listJson = fetchUrl($listUrl);
    $listData = json_decode($listJson, true);
    
    if (!$listData || !isset($listData['data'])) {
        echo "Failed to fetch list\n";
        exit;
    }
    
    $products = $listData['data'];
    $total = count($products);
    echo "Total products fetched: $total\n";
    
    $casioWithTable = 0;
    $casioWithoutTable = 0;
    
    $carnivalWithTable = 0;
    $carnivalWithoutTable = 0;
    
    $otherWithTable = 0;
    $otherWithoutTable = 0;
    
    $matchedList = [];
    
    foreach ($products as $p) {
        $slug = $p['slug'];
        $brand = $p['brand'] ?? '';
        $brandLower = strtolower($brand);
        
        $detailUrl = "https://venixwatchvn464.mbws.vn/backend/public/api/products/" . urlencode($slug);
        $detailJson = fetchUrl($detailUrl);
        $detailData = json_decode($detailJson, true);
        $prod = $detailData['data'] ?? null;
        
        if ($prod) {
            $desc = $prod['description'] ?? '';
            
            // Check for HTML table or Casio-style spec keywords in description
            $hasTable = (str_contains($desc, '<table') || str_contains($desc, 'Chiều cao vỏ') || str_contains($desc, 'Chiều cao vỏ'));
            
            if ($brandLower === 'casio') {
                if ($hasTable) {
                    $casioWithTable++;
                    $matchedList[] = [
                        'id' => $prod['id'],
                        'name' => $prod['name'],
                        'brand' => 'Casio',
                        'slug' => $slug
                    ];
                } else {
                    $casioWithoutTable++;
                }
            } elseif ($brandLower === 'carnival') {
                if ($hasTable) {
                    $carnivalWithTable++;
                } else {
                    $carnivalWithoutTable++;
                }
            } else {
                if ($hasTable) {
                    $otherWithTable++;
                } else {
                    $otherWithoutTable++;
                }
            }
        }
    }
    
    echo "\n=== ANALYSIS RESULTS ===\n";
    echo "Total analyzed: $total\n";
    echo "\n1. CASIO Products:\n";
    echo " - With Casio-style HTML Specs table: $casioWithTable\n";
    echo " - Without HTML Specs table: $casioWithoutTable\n";
    
    echo "\n2. CARNIVAL Products:\n";
    echo " - With HTML Specs table (which gets parsed and styled on frontend): $carnivalWithTable\n";
    echo " - Without HTML Specs table: $carnivalWithoutTable\n";
    
    echo "\n3. OTHER Brands Products:\n";
    echo " - With HTML Specs table: $otherWithTable\n";
    echo " - Without HTML Specs table: $otherWithoutTable\n";
    
    echo "\nList of Casio products containing this layout:\n";
    foreach ($matchedList as $m) {
        echo " - ID: {$m['id']} | {$m['name']} (Slug: {$m['slug']})\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
