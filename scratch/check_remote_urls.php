<?php
$urls = [
    'https://venixwatchvn464.mbws.vn/backend/public/image/product/carnival/2026/05/carnival-8127g-vt-dcs-d2.png',
    'https://venixwatchvn464.mbws.vn/backend/public/image/product/carnival/2026/05/carnival-8128g1-vt-dd-d.jpg',
    'https://venixwatchvn464.mbws.vn/backend/public/image/product/carnival/2026/05/carnival-8127g-vt-dd-d.jpg'
];

foreach ($urls as $url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    echo $url . ' => ' . $code . "\n";
    curl_close($ch);
}
