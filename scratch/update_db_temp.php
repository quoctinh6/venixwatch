<?php
    declare(strict_types=1);
    define('BASE_DIR', dirname(__DIR__));
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
    
    header('Content-Type: application/json');
    try {
        $pdo = Database::getInstance();
        
        // 1. Get current settings
        $stmt = $pdo->query("SELECT * FROM settings");
        $old_settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // 2. Update logo_url in DB
        $stmtUpdate = $pdo->prepare("
            INSERT INTO settings (`key`, `value`) VALUES ('logo_url', '/backend/public/image/settings/logo_icon.png')
            ON DUPLICATE KEY UPDATE `value` = '/backend/public/image/settings/logo_icon.png'
        ");
        $stmtUpdate->execute();
        
        // 3. Add to settings history
        $stmtHist = $pdo->prepare("
            INSERT INTO settings_history (`action`, `details`, `changed_by`) 
            VALUES ('Thay đổi Logo', 'Cập nhật logo mới từ logo trích xuất trong suốt bởi Agent', 'System Agent')
        ");
        $stmtHist->execute();
        
        echo json_encode([
            'success' => true,
            'message' => 'Successfully updated database logo_url on live server!',
            'old_settings' => $old_settings
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
    