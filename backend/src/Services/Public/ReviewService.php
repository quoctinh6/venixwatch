<?php

declare(strict_types=1);

namespace App\Services\Public;

use App\Config\Database;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\ReviewPhoto;

class ReviewService
{
    private Product $products;
    private Review $reviews;
    private ReviewPhoto $photos;
    private Order $orders;
    private BadWordFilterService $badWords;

    public function __construct()
    {
        $pdo = Database::getInstance();
        $this->products = new Product($pdo);
        $this->reviews = new Review($pdo);
        $this->photos = new ReviewPhoto($pdo);
        $this->orders = new Order($pdo);
        $this->badWords = new BadWordFilterService();
    }

    public function getReviews(int $productId, int $page, int $rating, bool $hasPhoto, int $viewerId = 0): array
    {
        if (!$this->products->findById($productId)) {
            return ['success' => false, 'error' => 'Product not found.', 'code' => 404];
        }

        $result = $this->reviews->paginate($productId, $page, 5, $rating, $hasPhoto, $viewerId);
        return ['success' => true, 'data' => $result['data'], 'meta' => [
            'total' => $result['total'],
            'page' => $result['page'],
            'limit' => $result['limit'],
            'total_pages' => (int)ceil($result['total'] / max(1, $result['limit'])),
            'summary' => $this->reviews->getSummary($productId),
        ]];
    }

    public function canReview(int $userId, int $productId): array
    {
        $existing = $this->reviews->findByUserAndProduct($userId, $productId);
        if ($existing) {
            $days = (time() - strtotime((string)$existing['created_at'])) / 86400;
            return ['can_review' => false, 'reason' => 'already_reviewed', 'can_edit' => $days <= 30, 'review_id' => (int)$existing['id']];
        }

        $completed = $this->orders->findLatestCompletedProductOrder($userId, $productId);
        if (!$completed) {
            $active = $this->orders->findLatestActiveProductOrder($userId, $productId);
            if ($active) {
                return ['can_review' => false, 'reason' => 'order_not_delivered', 'order_id' => (int)$active['id'], 'order_code' => $this->formatOrderCode($active)];
            }
            return ['can_review' => false, 'reason' => 'not_purchased'];
        }

        $deliveredAt = (string)($completed['delivered_at'] ?? $completed['updated_at'] ?? $completed['created_at']);
        $days = (time() - strtotime($deliveredAt)) / 86400;
        if ($days > 90) {
            return ['can_review' => false, 'reason' => 'review_period_expired', 'delivered_at' => $deliveredAt];
        }

        return [
            'can_review' => true,
            'reason' => 'eligible',
            'order_id' => (int)$completed['id'],
            'order_code' => $this->formatOrderCode($completed),
            'delivered_at' => $deliveredAt,
        ];
    }

    public function create(int $productId, int $userId, array $payload): array
    {
        if (!$this->products->findById($productId)) {
            return ['success' => false, 'error' => 'Product not found.', 'code' => 404];
        }

        $eligibility = $this->canReview($userId, $productId);
        if (!($eligibility['can_review'] ?? false)) {
            return ['success' => false, 'error' => 'Review is not allowed for this product.', 'code' => 422, 'meta' => $eligibility];
        }

        $rating = (int)($payload['rating'] ?? 0);
        $title = trim((string)($payload['title'] ?? ''));
        $comment = trim((string)($payload['comment'] ?? ''));
        $photos = array_values(array_filter($payload['photos'] ?? [], fn($v) => is_string($v) && trim($v) !== ''));
        if ($rating < 1 || $rating > 5) return ['success' => false, 'error' => 'Rating must be between 1 and 5.', 'code' => 422];
        if (mb_strlen($title) > 255) return ['success' => false, 'error' => 'Title is too long.', 'code' => 422];
        if (mb_strlen($comment) < 20 || mb_strlen($comment) > 500) return ['success' => false, 'error' => 'Comment must be 20-500 characters.', 'code' => 422];
        if (count($photos) > 5) return ['success' => false, 'error' => 'Maximum 5 photos allowed.', 'code' => 422];

        $reviewId = $this->reviews->create([
            'product_id' => $productId,
            'user_id' => $userId,
            'order_id' => $eligibility['order_id'],
            'rating' => $rating,
            'title' => $this->badWords->sanitize($title),
            'comment' => $this->badWords->clean($comment),
            'is_anonymous' => !empty($payload['is_anonymous']),
            'status' => 'pending',
        ]);

        $this->photos->createMany($reviewId, $photos);

        return [
            'success' => true,
            'data' => ['id' => $reviewId, 'status' => 'pending', 'message' => 'Cảm ơn bạn đã đánh giá! Review sẽ được hiển thị sau khi được duyệt.'],
        ];
    }

    private function formatOrderCode(array $order): string
    {
        $date = isset($order['created_at']) ? date('Y', strtotime((string)$order['created_at'])) : date('Y');
        return sprintf('DH-%s-%04d', $date, (int)$order['id']);
    }
}
