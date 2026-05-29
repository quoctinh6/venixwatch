<?php

declare(strict_types=1);

namespace App\Modules\Admin\Settings;

use App\Config\Database;
use PDO;
use Exception;

class SettingService
{
    private PDO $pdo;
    private string $uploadDir;

    public function __construct()
    {
        $this->pdo = Database::getInstance();
        $baseDir = defined('BASE_DIR') ? BASE_DIR : dirname(__DIR__, 4);
        $this->uploadDir = rtrim($baseDir, '/') . '/public/image/settings/';
    }

    public function getAllSettings(): array
    {
        $stmt = $this->pdo->prepare("SELECT `key`, `value` FROM settings");
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $settings = [];
        foreach ($rows as $row) {
            $key = $row['key'];
            $val = $row['value'];
            
            // Decrypt JSON structures dynamically
            if (str_starts_with($val, '[') || str_starts_with($val, '{')) {
                $decoded = json_decode($val, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $settings[$key] = $decoded;
                    continue;
                }
            }
            $settings[$key] = $val;
        }

        // Return fallbacks if database is unseeded
        if (empty($settings)) {
            $settings = [
                'brand_name' => 'Venix Watch',
                'logo_url' => '',
                'hero_banners' => [],
                'theme_colors' => [],
                'navigation_menu' => [],
                'home_sections' => []
            ];
        }

        return $settings;
    }

    public function saveSettings(array $newSettings, string $changedBy): array
    {
        try {
            $oldSettings = $this->getAllSettings();
            $logs = [];

            $this->pdo->beginTransaction();

            // 1. Compare brand_name
            if (isset($newSettings['brand_name']) && $newSettings['brand_name'] !== ($oldSettings['brand_name'] ?? '')) {
                $oldVal = $oldSettings['brand_name'] ?? 'Chưa thiết lập';
                $newVal = $newSettings['brand_name'];
                $logs[] = [
                    'action' => 'Thay đổi Tên thương hiệu',
                    'details' => "Thay đổi tên thương hiệu từ '{$oldVal}' thành '{$newVal}'"
                ];
                $this->updateSetting('brand_name', $newVal);
            }

            // 2. Compare logo_url
            if (isset($newSettings['logo_url']) && $newSettings['logo_url'] !== ($oldSettings['logo_url'] ?? '')) {
                $oldVal = $oldSettings['logo_url'] ?? '';
                $newVal = $newSettings['logo_url'];
                $details = empty($newVal) ? "Xóa logo thương hiệu" : "Cập nhật ảnh logo thương hiệu mới";
                $logs[] = [
                    'action' => 'Thay đổi Logo',
                    'details' => $details
                ];
                $this->updateSetting('logo_url', $newVal);
            }

            // 3. Compare hero_banners
            if (isset($newSettings['hero_banners'])) {
                $oldVal = json_encode($oldSettings['hero_banners'] ?? []);
                $newVal = json_encode($newSettings['hero_banners']);
                if ($oldVal !== $newVal) {
                    $logs[] = [
                        'action' => 'Cập nhật Banner trang chủ',
                        'details' => "Thay đổi nội dung danh sách banner sliders trang chủ"
                    ];
                    $this->updateSetting('hero_banners', $newVal);
                }
            }

            // 4. Compare theme_colors
            if (isset($newSettings['theme_colors']) && is_array($newSettings['theme_colors'])) {
                $oldColors = $oldSettings['theme_colors'] ?? [];
                $newColors = $newSettings['theme_colors'];
                $changedColors = [];

                foreach ($newColors as $colKey => $colVal) {
                    $oldColVal = $oldColors[$colKey] ?? '';
                    if ($colVal !== $oldColVal) {
                        $changedColors[] = "{$colKey} ({$oldColVal} -> {$colVal})";
                    }
                }

                if (!empty($changedColors)) {
                    $logs[] = [
                        'action' => 'Thay đổi Màu sắc giao diện',
                        'details' => "Thay đổi các biến màu sắc: " . implode(', ', $changedColors)
                    ];
                    $this->updateSetting('theme_colors', json_encode($newColors));
                }
            }

            // 5. Compare navigation_menu
            if (isset($newSettings['navigation_menu'])) {
                $oldVal = json_encode($oldSettings['navigation_menu'] ?? [], JSON_UNESCAPED_UNICODE);
                $newVal = json_encode($newSettings['navigation_menu'], JSON_UNESCAPED_UNICODE);
                if ($oldVal !== $newVal) {
                    $logs[] = [
                        'action' => 'Cập nhật Menu điều hướng',
                        'details' => "Thay đổi cấu trúc danh mục và liên kết của thanh điều hướng"
                    ];
                    $this->updateSetting('navigation_menu', $newVal);
                }
            }

            // 6. Compare home_sections
            if (isset($newSettings['home_sections'])) {
                $oldVal = json_encode($oldSettings['home_sections'] ?? [], JSON_UNESCAPED_UNICODE);
                $newVal = json_encode($newSettings['home_sections'], JSON_UNESCAPED_UNICODE);
                if ($oldVal !== $newVal) {
                    $logs[] = [
                        'action' => 'Cập nhật Bố cục trang chủ',
                        'details' => "Thay đổi nội dung, hình ảnh hoặc nút bấm của các section trang chủ"
                    ];
                    $this->updateSetting('home_sections', $newVal);
                }
            }

            // Log changes to settings_history with snapshot of new state
            $newSnapshot = json_encode($this->getAllSettings(), JSON_UNESCAPED_UNICODE);
            foreach ($logs as $log) {
                $stmt = $this->pdo->prepare(
                    "INSERT INTO settings_history (`action`, `details`, `changed_by`, `settings_snapshot`) 
                     VALUES (:action, :details, :changed_by, :settings_snapshot)"
                );
                $stmt->execute([
                    ':action' => $log['action'],
                    ':details' => $log['details'],
                    ':changed_by' => $changedBy,
                    ':settings_snapshot' => $newSnapshot
                ]);
            }

            $this->pdo->commit();
            return ['success' => true, 'message' => 'Lưu cấu hình hệ thống thành công.'];

        } catch (Exception $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            return ['success' => false, 'error' => $e->getMessage(), 'code' => 500];
        }
    }

    public function getHistory(): array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM settings_history ORDER BY id DESC");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function uploadSettingImage(array $file, string $type): array
    {
        $allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
        $finfo   = new \finfo(FILEINFO_MIME_TYPE);
        $mime    = $finfo->file($file['tmp_name']);

        if (!in_array($mime, $allowed, true)) {
            return ['success' => false, 'error' => 'Chỉ hỗ trợ ảnh JPG, PNG, WEBP, GIF, SVG.', 'code' => 400];
        }

        if ($file['size'] > 3 * 1024 * 1024) {
            return ['success' => false, 'error' => 'Kích thước file tối đa 3MB.', 'code' => 400];
        }

        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0755, true);
        }

        $ext      = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION)) ?: 'png';
        $uniqName = $type . '_' . uniqid() . '.' . $ext;
        $dest     = $this->uploadDir . $uniqName;

        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            return ['success' => false, 'error' => 'Không thể lưu file trên máy chủ.', 'code' => 500];
        }

        $url = $this->buildUrl($uniqName);

        return [
            'success' => true,
            'data' => [
                'url'      => $url,
                'filename' => $uniqName,
            ]
        ];
    }

    private function updateSetting(string $key, string $value): void
    {
        $stmt = $this->pdo->prepare(
            "INSERT INTO settings (`key`, `value`) VALUES (:key, :value)
             ON DUPLICATE KEY UPDATE `value` = :value2"
        );
        $stmt->execute([
            ':key' => $key,
            ':value' => $value,
            ':value2' => $value
        ]);
    }

    private function buildUrl(string $filename): string
    {
        $script     = $_SERVER['SCRIPT_NAME'] ?? '/index.php';
        $publicBase = rtrim(dirname($script), '/');
        $base       = '/' . ltrim($publicBase, '/');
        if ($base === '/') {
            return '/image/settings/' . $filename;
        }
        return rtrim($base, '/') . '/image/settings/' . $filename;
    }

    public function rollbackTo(int $historyId, string $changedBy): array
    {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM settings_history WHERE id = :id");
            $stmt->execute([':id' => $historyId]);
            $history = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$history) {
                return ['success' => false, 'error' => 'Không tìm thấy bản ghi lịch sử.', 'code' => 404];
            }

            $snapshotStr = $history['settings_snapshot'] ?? '';
            if (empty($snapshotStr)) {
                return ['success' => false, 'error' => 'Bản ghi lịch sử này không chứa ảnh chụp cấu hình (được tạo trước khi có tính năng hoàn tác).', 'code' => 400];
            }

            $snapshot = json_decode($snapshotStr, true);
            if (!is_array($snapshot)) {
                return ['success' => false, 'error' => 'Ảnh chụp cấu hình không hợp lệ.', 'code' => 400];
            }

            $this->pdo->beginTransaction();

            foreach ($snapshot as $key => $value) {
                $valStr = is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE) : (string)$value;
                $this->updateSetting($key, $valStr);
            }

            $details = "Khôi phục cấu hình hệ thống về phiên bản ngày " . date('d/m/Y H:i:s', strtotime($history['created_at'])) . " (Thao tác bởi " . $history['changed_by'] . ")";
            $newSnapshot = json_encode($this->getAllSettings(), JSON_UNESCAPED_UNICODE);
            
            $stmtHist = $this->pdo->prepare(
                "INSERT INTO settings_history (`action`, `details`, `changed_by`, `settings_snapshot`) 
                 VALUES ('Hoàn tác cấu hình', :details, :changed_by, :settings_snapshot)"
            );
            $stmtHist->execute([
                ':details' => $details,
                ':changed_by' => $changedBy,
                ':settings_snapshot' => $newSnapshot
            ]);

            $this->pdo->commit();
            return ['success' => true, 'message' => 'Hoàn tác cấu hình thành công!'];

        } catch (Exception $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            return ['success' => false, 'error' => $e->getMessage(), 'code' => 500];
        }
    }
}

