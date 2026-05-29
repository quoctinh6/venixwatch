<?php

declare(strict_types=1);

namespace App\Modules\Admin\Settings;

use App\Middleware\AuthMiddleware;
use App\Middleware\RBACMiddleware;
use App\Modules\Admin\Settings\SettingService;
use Exception;

class SettingController
{
    private SettingService $service;

    public function __construct()
    {
        $this->service = new SettingService();
    }

    /**
     * GET /api/settings (Public)
     */
    public function index(): void
    {
        $settings = $this->service->getAllSettings();
        $this->respond(['success' => true, 'data' => $settings]);
    }

    /**
     * GET /api/admin/settings/history (Protected)
     */
    public function history(): void
    {
        RBACMiddleware::require('settings:read');
        $history = $this->service->getHistory();
        $this->respond(['success' => true, 'data' => $history]);
    }

    /**
     * PUT /api/admin/settings (Protected)
     */
    public function update(): void
    {
        $user = RBACMiddleware::require('settings:write');
        $changedBy = $user['email'] ?? $user['name'] ?? 'Admin';

        $input = json_decode(file_get_contents('php://input'), true);
        if ($input === null) {
            $this->respond(['success' => false, 'error' => 'Dữ liệu đầu vào không hợp lệ.', 'code' => 400]);
            return;
        }

        $result = $this->service->saveSettings($input, $changedBy);
        $this->respond($result);
    }

    /**
     * POST /api/admin/settings/upload-logo (Protected)
     */
    public function uploadLogo(): void
    {
        $user = RBACMiddleware::require('settings:write');
        $changedBy = $user['email'] ?? $user['name'] ?? 'Admin';

        if (!isset($_FILES['logo'])) {
            $this->respond(['success' => false, 'error' => 'Không tìm thấy file tải lên.', 'code' => 400]);
            return;
        }

        $result = $this->service->uploadSettingImage($_FILES['logo'], 'logo');
        if ($result['success']) {
            $logoUrl = $result['data']['url'];
            
            // Save settings key logo_url immediately and write history
            $saveRes = $this->service->saveSettings(['logo_url' => $logoUrl], $changedBy);
            if (!$saveRes['success']) {
                $this->respond($saveRes);
                return;
            }
        }
        $this->respond($result);
    }

    /**
     * POST /api/admin/settings/upload-banner (Protected)
     * Uploads temporary banner image for hero slider
     */
    public function uploadBanner(): void
    {
        RBACMiddleware::require('settings:write');

        if (!isset($_FILES['banner'])) {
            $this->respond(['success' => false, 'error' => 'Không tìm thấy file tải lên.', 'code' => 400]);
            return;
        }

        $result = $this->service->uploadSettingImage($_FILES['banner'], 'banner');
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
            'message' => $result['message'] ?? null,
        ]);
    }
}
