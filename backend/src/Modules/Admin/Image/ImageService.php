<?php

declare(strict_types=1);

namespace App\Modules\Admin\Image;

class ImageService
{
    private string $uploadDir;

    public function __construct()
    {
        $baseDir = defined('BASE_DIR') ? BASE_DIR : dirname(__DIR__, 4);
        $this->uploadDir = rtrim($baseDir, '/') . '/public/image/product/';
    }

    public function getUploadDir(): string
    {
        return $this->uploadDir;
    }

    public function buildUrl(string $filename): string
    {
        $script     = $_SERVER['SCRIPT_NAME'] ?? '/index.php';
        $publicBase = rtrim(dirname($script), '/');
        $base       = '/' . ltrim($publicBase, '/');
        if ($base === '/') {
            return '/image/product/' . $filename;
        }
        return rtrim($base, '/') . '/image/product/' . $filename;
    }

    public function getFilesRecursive(string $dir): array
    {
        $files = [];
        if (!is_dir($dir)) return $files;
        $items = scandir($dir);
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') continue;
            $path = $dir . '/' . $item;
            if (is_dir($path)) {
                $files = array_merge($files, $this->getFilesRecursive($path));
            } elseif (is_file($path)) {
                $relative = str_replace($this->uploadDir, '', $path);
                $relative = ltrim(str_replace('\\', '/', $relative), '/');
                $files[] = [
                    'path' => $path,
                    'relative' => $relative
                ];
            }
        }
        return $files;
    }

    public function upload(array $file, string $folder = ''): array
    {
        $allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        $finfo   = new \finfo(FILEINFO_MIME_TYPE);
        $mime    = $finfo->file($file['tmp_name']);

        if (!in_array($mime, $allowed, true)) {
            return ['success' => false, 'error' => 'Chỉ hỗ trợ JPG, PNG, WEBP, GIF.', 'code' => 400];
        }

        if ($file['size'] > 5 * 1024 * 1024) {
            return ['success' => false, 'error' => 'File quá lớn (tối đa 5MB).', 'code' => 400];
        }

        $yearMonth = date('Y/m');
        $subFolder = ($folder !== '' ? $folder . '/' : '') . $yearMonth;
        $targetDir = $this->uploadDir . $subFolder . '/';

        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        $ext      = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION)) ?: 'jpg';
        $uniqName = 'img_' . uniqid() . '.' . $ext;
        $filename = $subFolder . '/' . $uniqName;
        $dest     = $this->uploadDir . $filename;

        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            return ['success' => false, 'error' => 'Không thể lưu file.', 'code' => 500];
        }

        return [
            'success' => true,
            'data' => [
                'url'      => $this->buildUrl($filename),
                'filename' => $filename,
            ]
        ];
    }

    public function listImages(): array
    {
        $images = [];
        if (is_dir($this->uploadDir)) {
            $files = $this->getFilesRecursive($this->uploadDir);
            $allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
            foreach ($files as $fileInfo) {
                $filePath = $fileInfo['path'];
                $relative = $fileInfo['relative'];
                $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
                if (in_array($ext, $allowedExts, true)) {
                    $images[] = [
                        'filename' => $relative,
                        'url'      => $this->buildUrl($relative),
                        'size'     => filesize($filePath),
                        'modified' => filemtime($filePath),
                       ];
                }
            }
            usort($images, fn($a, $b) => $b['modified'] - $a['modified']);
        }
        return ['success' => true, 'data' => $images];
    }

    public function deleteImage(string $filename): array
    {
        // Prevent path traversal
        $realUploadDir = realpath($this->uploadDir);
        $targetFile = realpath($this->uploadDir . '/' . $filename);

        if ($targetFile === false || strpos($targetFile, $realUploadDir) !== 0) {
            return ['success' => false, 'error' => 'Không có quyền truy cập file này.', 'code' => 403];
        }

        if (!file_exists($targetFile)) {
            return ['success' => false, 'error' => 'File không tồn tại.', 'code' => 404];
        }

        unlink($targetFile);
        return ['success' => true, 'data' => ['message' => 'Đã xóa.']];
    }
}
