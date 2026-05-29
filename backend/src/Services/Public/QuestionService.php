<?php

declare(strict_types=1);

namespace App\Services\Public;

use App\Config\Database;
use App\Middleware\RateLimitMiddleware;
use App\Models\Product;
use App\Models\ProductQuestion;

class QuestionService
{
    private Product $products;
    private ProductQuestion $questions;
    private BadWordFilterService $badWords;

    public function __construct()
    {
        $pdo = Database::getInstance();
        $this->products = new Product($pdo);
        $this->questions = new ProductQuestion($pdo);
        $this->badWords = new BadWordFilterService();
    }

    public function getQuestions(int $productId, int $page, int $viewerId = 0): array
    {
        if (!$this->products->findById($productId)) {
            return ['success' => false, 'error' => 'Product not found.', 'code' => 404];
        }

        $result = $this->questions->paginate($productId, $page, 10, $viewerId);
        return ['success' => true, 'data' => $result['data'], 'meta' => [
            'total' => $result['total'],
            'page' => $result['page'],
            'limit' => $result['limit'],
            'total_pages' => (int)ceil($result['total'] / max(1, $result['limit'])),
        ]];
    }

    public function create(int $productId, int $userId, array $payload): array
    {
        if (!$this->products->findById($productId)) {
            return ['success' => false, 'error' => 'Product not found.', 'code' => 404];
        }

        if ($limitError = RateLimitMiddleware::checkQuestionLimit($this->questions, $userId, $productId, 3)) {
            return $limitError;
        }

        $question = trim((string)($payload['question'] ?? ''));
        if (mb_strlen($question) < 10 || mb_strlen($question) > 300) {
            return ['success' => false, 'error' => 'Question must be 10-300 characters.', 'code' => 422];
        }

        $id = $this->questions->create([
            'product_id' => $productId,
            'user_id' => $userId,
            'question' => $this->badWords->clean($question),
            'notify_email' => array_key_exists('notify_email', $payload) ? (bool)$payload['notify_email'] : true,
            'status' => 'pending',
        ]);

        return ['success' => true, 'data' => [
            'id' => $id,
            'status' => 'pending',
            'message' => 'Câu hỏi đã gửi! Chúng tôi sẽ trả lời trong vòng 24 giờ.',
        ]];
    }
}
