<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/config/Config.php';
require_once dirname(__DIR__) . '/config/Database.php';

use App\Config\Config;
use App\Config\Database;

header('Content-Type: text/plain; charset=utf-8');

try {
    Config::load(dirname(__DIR__) . '/.env');
    $pdo = Database::getInstance();

    $uploadDir = dirname(__DIR__) . '/public/image/product/';
    if (!is_dir($uploadDir)) {
        echo "Error: Upload directory does not exist: $uploadDir\n";
        exit(1);
    }

    echo "Scanning upload directory: $uploadDir\n";

    // Recursively scan files
    function scanFiles(string $dir, string $baseDir): array
    {
        $files = [];
        $items = scandir($dir);
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') continue;
            $path = $dir . '/' . $item;
            if (is_dir($path)) {
                $files = array_merge($files, scanFiles($path, $baseDir));
            } elseif (is_file($path)) {
                $relative = str_replace($baseDir, '', $path);
                $relative = ltrim(str_replace('\\', '/', $relative), '/');
                $files[] = [
                    'absolute' => $path,
                    'relative' => $relative
                ];
            }
        }
        return $files;
    }

    $allFiles = scanFiles($uploadDir, $uploadDir);
    echo "Found " . count($allFiles) . " total files.\n";

    $movedFiles = []; // Map old_relative_path => new_relative_path

    foreach ($allFiles as $fileInfo) {
        $absPath = $fileInfo['absolute'];
        $relPath = $fileInfo['relative'];

        // Check if the file is already inside a YYYY/MM structure.
        // A valid YYYY/MM folder matches e.g. "2026/05" or "casio/2026/05"
        // Let's check using regex: has "202x/xx" in the path
        if (preg_match('/\b20\d{2}\/\d{2}\b/', $relPath)) {
            // Already organized, skip it
            continue;
        }

        // Determine year/month based on file modified time
        $mtime = filemtime($absPath);
        $year = date('Y', $mtime);
        $month = date('m', $mtime);
        $yearMonth = "$year/$month";

        // Determine new relative path. We keep the custom subdirectories if any:
        // e.g. "casio/img_xxx.jpg" -> "casio/2026/05/img_xxx.jpg"
        // e.g. "img_xxx.jpg" -> "2026/05/img_xxx.jpg"
        $parts = explode('/', $relPath);
        $filename = array_pop($parts); // the filename
        $folder = implode('/', $parts); // e.g. "casio" or ""
        
        $newRelPath = ($folder !== '' ? $folder . '/' : '') . $yearMonth . '/' . $filename;
        $newAbsPath = $uploadDir . $newRelPath;

        // Ensure target directory exists
        $newDir = dirname($newAbsPath);
        if (!is_dir($newDir)) {
            mkdir($newDir, 0755, true);
        }

        echo "Moving: $relPath -> $newRelPath\n";
        if (rename($absPath, $newAbsPath)) {
            $movedFiles[$relPath] = $newRelPath;
        } else {
            echo "Failed to move $relPath\n";
        }
    }

    echo "\nMoved " . count($movedFiles) . " files.\n";

    if (count($movedFiles) > 0) {
        echo "\nUpdating database image links...\n";

        // 1. Update products table images (JSON) and og_image (VARCHAR)
        $products = $pdo->query("SELECT id, images, og_image FROM products")->fetchAll();
        $stmtUpdateProduct = $pdo->prepare("UPDATE products SET images = :images, og_image = :og_image WHERE id = :id");
        
        foreach ($products as $p) {
            $changed = false;
            
            // Handle images JSON array
            $imagesJson = $p['images'];
            $images = [];
            if ($imagesJson) {
                $images = json_decode($imagesJson, true);
            }
            if (is_array($images)) {
                foreach ($images as $idx => $imgUrl) {
                    // Check if it matches any of the moved files
                    foreach ($movedFiles as $oldRel => $newRel) {
                        // The database stores full URLs or absolute paths:
                        // e.g. "/image/product/img_xxx.jpg" or "https://domain.com/image/product/img_xxx.jpg"
                        $oldPattern = '/image/product/' . $oldRel;
                        $newPattern = '/image/product/' . $newRel;
                        if (strpos($imgUrl, $oldPattern) !== false) {
                            $images[$idx] = str_replace($oldPattern, $newPattern, $imgUrl);
                            $changed = true;
                        }
                    }
                }
            }

            // Handle og_image column
            $ogImage = $p['og_image'] ?? '';
            if ($ogImage) {
                foreach ($movedFiles as $oldRel => $newRel) {
                    $oldPattern = '/image/product/' . $oldRel;
                    $newPattern = '/image/product/' . $newRel;
                    if (strpos($ogImage, $oldPattern) !== false) {
                        $ogImage = str_replace($oldPattern, $newPattern, $ogImage);
                        $changed = true;
                    }
                }
            }

            if ($changed) {
                $stmtUpdateProduct->execute([
                    ':images' => json_encode($images),
                    ':og_image' => $ogImage ?: null,
                    ':id' => $p['id']
                ]);
                echo "Product ID {$p['id']} updated.\n";
            }
        }

        // 2. Update categories table image_url column
        $categories = $pdo->query("SELECT id, image_url FROM categories")->fetchAll();
        $stmtUpdateCategory = $pdo->prepare("UPDATE categories SET image_url = :image_url WHERE id = :id");
        foreach ($categories as $c) {
            $imageUrl = $c['image_url'] ?? '';
            if ($imageUrl) {
                $changed = false;
                foreach ($movedFiles as $oldRel => $newRel) {
                    $oldPattern = '/image/product/' . $oldRel;
                    $newPattern = '/image/product/' . $newRel;
                    if (strpos($imageUrl, $oldPattern) !== false) {
                        $imageUrl = str_replace($oldPattern, $newPattern, $imageUrl);
                        $changed = true;
                    }
                }
                if ($changed) {
                    $stmtUpdateCategory->execute([
                        ':image_url' => $imageUrl,
                        ':id' => $c['id']
                    ]);
                    echo "Category ID {$c['id']} updated.\n";
                }
            }
        }

        // 3. Update brands table logo_url column
        $brands = $pdo->query("SELECT id, logo_url FROM brands")->fetchAll();
        $stmtUpdateBrand = $pdo->prepare("UPDATE brands SET logo_url = :logo_url WHERE id = :id");
        foreach ($brands as $b) {
            $logoUrl = $b['logo_url'] ?? '';
            if ($logoUrl) {
                $changed = false;
                foreach ($movedFiles as $oldRel => $newRel) {
                    $oldPattern = '/image/product/' . $oldRel;
                    $newPattern = '/image/product/' . $newRel;
                    if (strpos($logoUrl, $oldPattern) !== false) {
                        $logoUrl = str_replace($oldPattern, $newPattern, $logoUrl);
                        $changed = true;
                    }
                }
                if ($changed) {
                    $stmtUpdateBrand->execute([
                        ':logo_url' => $logoUrl,
                        ':id' => $b['id']
                    ]);
                    echo "Brand ID {$b['id']} updated.\n";
                }
            }
        }

        echo "Database image links update completed.\n";
    }

    echo "\nSUCCESS: Image reorganization finished!\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
