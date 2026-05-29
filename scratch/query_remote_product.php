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

$slugs = ['carnival-8127g-vt-dcs-d2', 'carnival-8128g1-vt-dd-d', 'carnival-8127g-vt-dd-d'];

foreach ($slugs as $slug) {
    $url = "https://venixwatchvn464.mbws.vn/backend/public/api/products/" . urlencode($slug);
    echo "Querying: $url ...\n";
    $json = fetchUrl($url);
    $data = json_decode($json, true);
    if (isset($data['data'])) {
        $p = $data['data'];
        echo "Name: {$p['name']}\n";
        echo "Images: " . json_encode($p['images']) . "\n";
    } else {
        echo "Not found or error: " . $json . "\n";
    }
    echo "\n";
}
