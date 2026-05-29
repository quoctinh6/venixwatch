<?php

declare(strict_types=1);

namespace App\Controllers\Auth;

use App\Services\Auth\AuthService;

class AuthController
{
    private AuthService $service;

    public function __construct()
    {
        $this->service = new AuthService();
    }

    /**
     * POST /api/auth/login
     */
    public function login(): void
    {
        $body = $this->getJsonBody();

        $result = $this->service->login(
            trim($body['email']    ?? ''),
            trim($body['password'] ?? '')
        );

        $this->respond($result);
    }

    /**
     * POST /api/auth/register
     */
    public function register(): void
    {
        $body   = $this->getJsonBody();
        $result = $this->service->register($body);
        $this->respond($result, 201);
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(): void
    {
        $result = $this->service->logout();
        $this->respond($result);
    }

    /**
     * POST /api/auth/refresh
     */
    public function refresh(): void
    {
        $body  = $this->getJsonBody();
        $token = $body['token'] ?? '';

        if (empty($token)) {
            $this->respond(['success' => false, 'error' => 'Token is required.', 'code' => 400]);
            return;
        }

        $result = $this->service->refreshToken($token);
        $this->respond($result);
    }

    private function getJsonBody(): array
    {
        $raw = file_get_contents('php://input');
        if (empty($raw)) {
            return [];
        }
        return json_decode($raw, true) ?? [];
    }

    private function respond(array $result, int $successCode = 200): void
    {
        if (!($result['success'] ?? false)) {
            http_response_code($result['code'] ?? 400);
            echo json_encode([
                'success' => false,
                'error'   => $result['error'] ?? 'Unknown error',
                'code'    => $result['code']  ?? 400,
            ]);
            return;
        }
        http_response_code($successCode);
        echo json_encode([
            'success' => true,
            'data'    => $result['data'] ?? null,
            'meta'    => $result['meta'] ?? null,
        ]);
    }
}
