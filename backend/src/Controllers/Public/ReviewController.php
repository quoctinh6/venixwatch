<?php

declare(strict_types=1);

namespace App\Controllers\Public;

use App\Middleware\AuthMiddleware;
use App\Services\Public\ReviewService;

class ReviewController
{
    private ReviewService $service;

    public function __construct()
    {
        $this->service = new ReviewService();
    }

    public function index(int $productId): void
    {
        $viewer = AuthMiddleware::getUser();
        $this->respond($this->service->getReviews(
            $productId,
            max(1, (int)($_GET['page'] ?? 1)),
            (int)($_GET['rating'] ?? 0),
            (int)($_GET['has_photo'] ?? 0) === 1,
            (int)($viewer['user_id'] ?? 0)
        ));
    }

    public function store(int $productId): void
    {
        $user = AuthMiddleware::requireAuth();
        $result = $this->service->create($productId, (int)$user['user_id'], $this->body());
        $this->respond($result, 201);
    }

    public function canReview(int $productId): void
    {
        $user = AuthMiddleware::requireAuth();
        $this->respond(['success' => true, 'data' => $this->service->canReview((int)$user['user_id'], $productId)]);
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
            echo json_encode(['success' => false, 'error' => $result['error'] ?? 'Error', 'code' => $result['code'] ?? 400, 'meta' => $result['meta'] ?? null]);
            return;
        }
        http_response_code($successCode);
        echo json_encode(['success' => true, 'data' => $result['data'] ?? null, 'meta' => $result['meta'] ?? null]);
    }
}
