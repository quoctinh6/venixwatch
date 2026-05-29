<?php

declare(strict_types=1);

namespace App\Controllers\Public;

use App\Config\Database;
use App\Models\Category;

class CategoryController
{
    private Category $model;

    public function __construct()
    {
        $this->model = new Category(Database::getInstance());
    }

    /** GET /api/categories */
    public function index(): void
    {
        $tree       = filter_var($_GET['tree'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $categories = $tree ? $this->model->getTree() : $this->model->getActive();
        $this->respond(['success' => true, 'data' => $categories]);
    }

    /** GET /api/categories/{slug} */
    public function show(string $slug): void
    {
        $cat = $this->model->findBySlug($slug);
        if (!$cat || !$cat['is_active']) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Category not found.', 'code' => 404]);
            return;
        }
        $this->respond(['success' => true, 'data' => $cat]);
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
