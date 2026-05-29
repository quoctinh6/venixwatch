<?php

declare(strict_types=1);

namespace App\Controllers\Public;

use App\Middleware\AuthMiddleware;
use App\Services\Public\QuestionService;

class QuestionController
{
    private QuestionService $service;

    public function __construct()
    {
        $this->service = new QuestionService();
    }

    public function index(int $productId): void
    {
        $viewer = AuthMiddleware::getUser();
        $this->respond($this->service->getQuestions(
            $productId,
            max(1, (int)($_GET['page'] ?? 1)),
            (int)($viewer['user_id'] ?? 0)
        ));
    }

    public function store(int $productId): void
    {
        $user = AuthMiddleware::requireAuth();
        $this->respond($this->service->create($productId, (int)$user['user_id'], $this->body()), 201);
    }

    private function body(): array
    {
        $raw = file_get_contents('php://input');
        return $raw ? (json_decode($raw, true) ?? []) : [];
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
