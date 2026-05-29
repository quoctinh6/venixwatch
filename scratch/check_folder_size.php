<?php
function getDirInfo($dir) {
    $size = 0;
    $count = 0;
    $items = scandir($dir);
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') continue;
        $path = $dir . '/' . $item;
        if (is_dir($path)) {
            $info = getDirInfo($path);
            $size += $info['size'];
            $count += $info['count'];
        } elseif (is_file($path)) {
            $size += filesize($path);
            $count++;
        }
    }
    return ['size' => $size, 'count' => $count];
}

$info = getDirInfo('H:/venixwatch/backend/public/image/product');
echo "Total files: {$info['count']}\n";
echo "Total size: " . round($info['size'] / 1024 / 1024, 2) . " MB\n";
