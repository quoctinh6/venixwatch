<?php

declare(strict_types=1);

namespace App\Modules\Admin\Image;

use App\Middleware\RBACMiddleware;

class ImageController
{
    private ImageService $service;

    public function __construct()
    {
        $this->service = new ImageService();
    }

    /** POST /api/admin/images/upload */
    public function upload(): void
    {
        RBACMiddleware::require('products:write');

        if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Không có file được tải lên.']);
            return;
        }

        $folder = isset($_GET['folder']) ? trim($_GET['folder']) : (isset($_POST['folder']) ? trim($_POST['folder']) : '');
        $folder = preg_replace('/[^a-zA-Z0-9_-]/', '', $folder);

        $result = $this->service->upload($_FILES['file'], $folder);
        $this->respond($result);
    }

    /** GET /api/admin/images */
    public function index(): void
    {
        RBACMiddleware::require('products:read');
        $result = $this->service->listImages();
        $this->respond($result);
    }

    /** DELETE /api/admin/images/{filename} */
    public function destroy(string $filename = ''): void
    {
        RBACMiddleware::require('products:delete');

        if (isset($_GET['filename']) && $_GET['filename'] !== '') {
            $filename = $_GET['filename'];
        }

        if (empty($filename)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Thiếu tên file.']);
            return;
        }

        $result = $this->service->deleteImage($filename);
        $this->respond($result);
    }

    private function respond(array $result, int $successCode = 200): void
    {
        if (!($result['success'] ?? false)) {
            http_response_code($result['code'] ?? 400);
            echo json_encode(['success' => false, 'error' => $result['error'] ?? 'Error', 'code' => $result['code'] ?? 400]);
            return;
        }
        http_response_code($successCode);
        echo json_encode(['success' => true, 'data' => $result['data'] ?? null, 'meta' => $result['meta'] ?? null]);
    }
}
