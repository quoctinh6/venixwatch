<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Models\ProductQuestion;

class RateLimitMiddleware
{
    public static function checkQuestionLimit(ProductQuestion $questions, int $userId, int $productId, int $limit): ?array
    {
        if ($questions->countTodayByUser($userId, $productId) < $limit) {
            return null;
        }

        return [
            'success' => false,
            'error' => 'Bạn đã gửi quá số câu hỏi cho sản phẩm này trong hôm nay.',
            'code' => 429,
        ];
    }
}
