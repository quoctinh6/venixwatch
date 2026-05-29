<?php

declare(strict_types=1);

namespace App\Modules\Admin\Dashboard;

use App\Middleware\RBACMiddleware;
use App\Modules\Admin\Analytics\AnalyticsService;

class DashboardController
{
    private AnalyticsService $service;

    public function __construct()
    {
        $this->service = new AnalyticsService();
    }

    /**
     * GET /api/admin/dashboard/stats
     */
    public function stats(): void
    {
        RBACMiddleware::require('analytics:read');
        $result = $this->service->getDashboardStats();
        $this->respond($result);
    }

    private function respond(array $result, int $successCode = 200): void
    {
        if (!($result['success'] ?? false)) {
            http_response_code($result['code'] ?? 400);
            echo json_encode([
                'success' => false,
                'error'   => $result['error'] ?? 'Error',
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
