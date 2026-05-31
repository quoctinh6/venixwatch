<?php

declare(strict_types=1);

namespace App\Modules\Admin\News;

use App\Config\Database;
use PDO;
use Exception;

class NewsService
{
    private PDO $pdo;
    private string $uploadDir;

    public function __construct()
    {
        $this->pdo = Database::getInstance();
        $baseDir = defined('BASE_DIR') ? BASE_DIR : dirname(__DIR__, 4);
        $this->uploadDir = rtrim($baseDir, '/') . '/public/image/news/';
    }

    public function getAllNews(?string $status = null): array
    {
        if ($status !== null) {
            $stmt = $this->pdo->prepare("SELECT * FROM news_articles WHERE status = :status ORDER BY created_at DESC");
            $stmt->execute([':status' => $status]);
        } else {
            $stmt = $this->pdo->prepare("SELECT * FROM news_articles ORDER BY created_at DESC");
            $stmt->execute();
        }
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getNewsBySlug(string $slug): ?array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM news_articles WHERE slug = :slug");
        $stmt->execute([':slug' => $slug]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function getNewsById(int $id): ?array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM news_articles WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function createNews(array $data): array
    {
        try {
            $title = trim($data['title'] ?? '');
            $content = trim($data['content'] ?? '');
            if (empty($title)) {
                return ['success' => false, 'error' => 'Tiêu đề không được để trống.', 'code' => 400];
            }
            if (empty($content)) {
                return ['success' => false, 'error' => 'Nội dung không được để trống.', 'code' => 400];
            }

            $slug = trim($data['slug'] ?? '');
            if (empty($slug)) {
                $slug = $this->slugify($title);
            } else {
                $slug = $this->slugify($slug);
            }

            // Ensure unique slug
            $slug = $this->makeUniqueSlug($slug);

            $thumbnailUrl = $data['thumbnail_url'] ?? null;
            $summary = $data['summary'] ?? null;
            $author = $data['author'] ?? 'Admin';
            $status = $data['status'] ?? 'draft';

            $stmt = $this->pdo->prepare(
                "INSERT INTO news_articles (title, slug, thumbnail_url, summary, content, author, status) 
                 VALUES (:title, :slug, :thumbnail_url, :summary, :content, :author, :status)"
            );
            $stmt->execute([
                ':title' => $title,
                ':slug' => $slug,
                ':thumbnail_url' => $thumbnailUrl,
                ':summary' => $summary,
                ':content' => $content,
                ':author' => $author,
                ':status' => $status
            ]);

            return ['success' => true, 'message' => 'Tạo bài viết thành công!', 'id' => $this->pdo->lastInsertId()];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage(), 'code' => 500];
        }
    }

    public function updateNews(int $id, array $data): array
    {
        try {
            $existing = $this->getNewsById($id);
            if (!$existing) {
                return ['success' => false, 'error' => 'Không tìm thấy bài viết.', 'code' => 404];
            }

            $title = isset($data['title']) ? trim($data['title']) : $existing['title'];
            $content = isset($data['content']) ? trim($data['content']) : $existing['content'];
            
            if (empty($title)) {
                return ['success' => false, 'error' => 'Tiêu đề không được để trống.', 'code' => 400];
            }
            if (empty($content)) {
                return ['success' => false, 'error' => 'Nội dung không được để trống.', 'code' => 400];
            }

            $slug = isset($data['slug']) ? trim($data['slug']) : $existing['slug'];
            $slug = $this->slugify($slug);
            if ($slug !== $existing['slug']) {
                $slug = $this->makeUniqueSlug($slug, $id);
            }

            $thumbnailUrl = array_key_exists('thumbnail_url', $data) ? $data['thumbnail_url'] : $existing['thumbnail_url'];
            $summary = array_key_exists('summary', $data) ? $data['summary'] : $existing['summary'];
            $author = isset($data['author']) ? trim($data['author']) : $existing['author'];
            $status = isset($data['status']) ? $data['status'] : $existing['status'];

            $stmt = $this->pdo->prepare(
                "UPDATE news_articles 
                 SET title = :title, slug = :slug, thumbnail_url = :thumbnail_url, 
                     summary = :summary, content = :content, author = :author, status = :status 
                 WHERE id = :id"
            );
            $stmt->execute([
                ':title' => $title,
                ':slug' => $slug,
                ':thumbnail_url' => $thumbnailUrl,
                ':summary' => $summary,
                ':content' => $content,
                ':author' => $author,
                ':status' => $status,
                ':id' => $id
            ]);

            return ['success' => true, 'message' => 'Cập nhật bài viết thành công!'];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage(), 'code' => 500];
        }
    }

    public function deleteNews(int $id): array
    {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM news_articles WHERE id = :id");
            $stmt->execute([':id' => $id]);
            if ($stmt->rowCount() === 0) {
                return ['success' => false, 'error' => 'Không tìm thấy bài viết.', 'code' => 404];
            }
            return ['success' => true, 'message' => 'Xóa bài viết thành công!'];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage(), 'code' => 500];
        }
    }

    public function uploadImage(array $file): array
    {
        $allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        $finfo   = new \finfo(FILEINFO_MIME_TYPE);
        $mime    = $finfo->file($file['tmp_name']);

        if (!in_array($mime, $allowed, true)) {
            return ['success' => false, 'error' => 'Chỉ hỗ trợ ảnh JPG, PNG, WEBP, GIF.', 'code' => 400];
        }

        if ($file['size'] > 5 * 1024 * 1024) {
            return ['success' => false, 'error' => 'Kích thước file tối đa 5MB.', 'code' => 400];
        }

        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0755, true);
        }

        $ext      = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION)) ?: 'png';
        $uniqName = 'news_' . uniqid() . '.' . $ext;
        $dest     = $this->uploadDir . $uniqName;

        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            return ['success' => false, 'error' => 'Không thể lưu file trên máy chủ.', 'code' => 500];
        }

        $url = $this->buildUrl($uniqName);

        return [
            'success' => true,
            'data' => [
                'url'      => $url,
                'filename' => $uniqName,
            ]
        ];
    }

    private function slugify(string $text): string
    {
        $text = preg_replace('~[^\pL\d]+~u', '-', $text);
        $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
        $text = preg_replace('~[^-\w]+~', '', $text);
        $text = trim($text, '-');
        $text = preg_replace('~-+~', '-', $text);
        $text = strtolower($text);
        return empty($text) ? 'n-a' : $text;
    }

    private function makeUniqueSlug(string $slug, ?int $excludeId = null): string
    {
        $original = $slug;
        $count = 1;
        while (true) {
            if ($excludeId !== null) {
                $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM news_articles WHERE slug = :slug AND id != :id");
                $stmt->execute([':slug' => $slug, ':id' => $excludeId]);
            } else {
                $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM news_articles WHERE slug = :slug");
                $stmt->execute([':slug' => $slug]);
            }
            if ($stmt->fetchColumn() == 0) {
                return $slug;
            }
            $slug = $original . '-' . $count;
            $count++;
        }
    }

    private function buildUrl(string $filename): string
    {
        $script     = $_SERVER['SCRIPT_NAME'] ?? '/index.php';
        $publicBase = rtrim(dirname($script), '/');
        $base       = '/' . ltrim($publicBase, '/');
        if ($base === '/') {
            return '/image/news/' . $filename;
        }
        return rtrim($base, '/') . '/image/news/' . $filename;
    }
}
