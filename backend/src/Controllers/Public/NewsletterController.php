<?php

declare(strict_types=1);

namespace App\Controllers\Public;

class NewsletterController
{
    /** POST /api/newsletter/subscribe */
    public function subscribe(): void
    {
        $body = $this->body();
        $email = trim((string)($body['email'] ?? ''));

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->respond(['success' => false, 'error' => 'Invalid email address.', 'code' => 400]);
            return;
        }

        $this->respond([
            'success' => true,
            'data' => [
                'email' => $email,
                'subscribed' => true,
            ],
        ], 201);
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
        echo json_encode(['success' => true, 'data' => $result['data'] ?? null]);
    }
}
