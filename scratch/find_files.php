<?php
function findFile($dir, $pattern) {
    $items = scandir($dir);
    $found = [];
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') continue;
        $path = $dir . '/' . $item;
        if (is_dir($path)) {
            $found = array_merge($found, findFile($path, $pattern));
        } elseif (is_file($path)) {
            if (strpos(strtolower($item), strtolower($pattern)) !== false) {
                $found[] = $path;
            }
        }
    }
    return $found;
}

echo "=== FINDING 8127G ===\n";
$res = findFile('H:/venixwatch', '8127g');
foreach ($res as $r) {
    echo "$r\n";
}
