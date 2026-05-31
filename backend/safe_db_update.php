<?php
define('BASE_DIR', __DIR__);

spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';
    $base   = BASE_DIR . '/src/';
    if (!str_starts_with($class, $prefix)) return;
    $relative = substr($class, strlen($prefix));
    $file     = $base . str_replace('\\', '/', $relative) . '.php';
    if (file_exists($file)) require_once $file;
});

spl_autoload_register(function (string $class): void {
    $prefix = 'App\\Config\\';
    $base   = BASE_DIR . '/config/';
    if (!str_starts_with($class, $prefix)) return;
    $relative = substr($class, strlen($prefix));
    $file     = $base . $relative . '.php';
    if (file_exists($file)) require_once $file;
});

use App\Config\Config;
use App\Config\Database;

try {
    Config::load(BASE_DIR . '/.env');
    $pdo = Database::getInstance();
    echo "Kết nối CSDL thành công.\n";

    // Kiểm tra xem cột is_active đã có trong bảng flash_sales chưa
    $stmt = $pdo->query("SHOW COLUMNS FROM `flash_sales` LIKE 'is_active'");
    $columnExists = $stmt->rowCount() > 0;

    if (!$columnExists) {
        // Chỉ chạy duy nhất câu lệnh thêm cột, không đụng vào dữ liệu
        $pdo->exec("ALTER TABLE flash_sales ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1");
        echo "[THÀNH CÔNG] Đã thêm cột 'is_active' vào bảng 'flash_sales' an toàn.\n";
    } else {
        echo "[THÔNG TIN] Cột 'is_active' đã tồn tại trong bảng 'flash_sales'. Không cần thay đổi.\n";
    }

} catch (Exception $e) {
    echo "[LỖI] " . $e->getMessage() . "\n";
}
