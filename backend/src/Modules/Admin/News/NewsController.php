<?php

declare(strict_types=1);

namespace App\Modules\Admin\News;

use App\Middleware\RBACMiddleware;
use App\Modules\Admin\News\NewsService;
use Exception;

class NewsController
{
    private NewsService $service;

    public function __construct()
    {
        $this->service = new NewsService();
    }

    /**
     * GET /api/news (Public)
     */
    public function index(): void
    {
        $this->respond([
            'success' => true,
            'data' => $this->service->getAllNews('published')
        ]);
    }

    /**
     * GET /api/news/{slug} (Public)
     */
    public function show(string $slug): void
    {
        $news = $this->service->getNewsBySlug($slug);
        if (!$news) {
            $this->respond([
                'success' => false,
                'error' => 'Không tìm thấy bài viết.',
                'code' => 404
            ]);
            return;
        }
        $this->respond([
            'success' => true,
            'data' => $news
        ]);
    }

    /**
     * GET /api/admin/news (Protected)
     */
    public function adminIndex(): void
    {
        RBACMiddleware::require('settings:read');
        $this->respond([
            'success' => true,
            'data' => $this->service->getAllNews()
        ]);
    }

    /**
     * GET /api/admin/news/{id} (Protected)
     */
    public function adminShow(int $id): void
    {
        RBACMiddleware::require('settings:read');
        $news = $this->service->getNewsById($id);
        if (!$news) {
            $this->respond([
                'success' => false,
                'error' => 'Không tìm thấy bài viết.',
                'code' => 404
            ]);
            return;
        }
        $this->respond([
            'success' => true,
            'data' => $news
        ]);
    }

    /**
     * POST /api/admin/news (Protected)
     */
    public function store(): void
    {
        $user = RBACMiddleware::require('settings:write');
        $changedBy = $user['email'] ?? $user['name'] ?? 'Admin';
        
        $body = $this->body();
        $body['author'] = $changedBy;

        $this->respond($this->service->createNews($body), 201);
    }

    /**
     * PUT /api/admin/news/{id} (Protected)
     */
    public function update(int $id): void
    {
        RBACMiddleware::require('settings:write');
        $this->respond($this->service->updateNews($id, $this->body()));
    }

    /**
     * DELETE /api/admin/news/{id} (Protected)
     */
    public function destroy(int $id): void
    {
        RBACMiddleware::require('settings:write');
        $this->respond($this->service->deleteNews($id));
    }

    /**
     * POST /api/admin/news/upload-image (Protected)
     */
    public function uploadImage(): void
    {
        RBACMiddleware::require('settings:write');

        $fileKey = isset($_FILES['image']) ? 'image' : (isset($_FILES['thumbnail']) ? 'thumbnail' : null);
        if ($fileKey === null) {
            $this->respond([
                'success' => false,
                'error' => 'Không tìm thấy file ảnh tải lên.',
                'code' => 400
            ]);
            return;
        }

        $this->respond($this->service->uploadImage($_FILES[$fileKey]));
    }

    private function body(): array
    {
        $raw = file_get_contents('php://input');
        return $raw ? (json_decode($raw, true) ?? []) : [];
    }

    private function respond(array $result, int $successCode = 200): void
    {
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Cache-Control: post-check=0, pre-check=0', false);
        header('Pragma: no-cache');

        if (!($result['success'] ?? false)) {
            http_response_code($result['code'] ?? 400);
            echo json_encode([
                'success' => false,
                'error' => $result['error'] ?? 'Error',
                'code' => $result['code'] ?? 400
            ]);
            return;
        }
        http_response_code($successCode);
        echo json_encode([
            'success' => true,
            'data' => $result['data'] ?? null,
            'message' => $result['message'] ?? null
        ]);
    }
}
