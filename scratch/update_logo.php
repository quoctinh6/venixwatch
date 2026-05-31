<?php
declare(strict_types=1);

define('BASE_DIR', dirname(__DIR__) . '/backend');

// Manual autoload implementation matching index.php
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

Config::load(BASE_DIR . '/.env');

try {
    $pdo = Database::getInstance();
    
    // Check current settings
    $stmt = $pdo->query("SELECT * FROM settings");
    $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Current settings in DB:\n";
    print_r($settings);
    
    // Update logo_url to /image/settings/logo_icon.png
    $stmtUpdate = $pdo->prepare("
        INSERT INTO settings (`key`, `value`) VALUES ('logo_url', '/image/settings/logo_icon.png')
        ON DUPLICATE KEY UPDATE `value` = '/image/settings/logo_icon.png'
    ");
    $stmtUpdate->execute();
    echo "\nUpdated logo_url to /image/settings/logo_icon.png in database!\n";
    
    // Log history
    $stmtHist = $pdo->prepare("
        INSERT INTO settings_history (`action`, `details`, `changed_by`) 
        VALUES ('Thay đổi Logo', 'Cập nhật logo mới từ logo trích xuất trong suốt', 'System Agent')
    ");
    $stmtHist->execute();
    echo "Inserted change history record.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
