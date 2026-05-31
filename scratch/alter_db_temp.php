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
        
        // Check if settings_snapshot column exists
        $q = $pdo->query("SHOW COLUMNS FROM settings_history LIKE 'settings_snapshot'");
        $col = $q->fetch(PDO::FETCH_ASSOC);
        
        if (!$col) {
            // Alter settings_history to add settings_snapshot column
            $pdo->exec("ALTER TABLE settings_history ADD COLUMN settings_snapshot LONGTEXT DEFAULT NULL");
            $message = "Column settings_snapshot added successfully!";
        } else {
            $message = "Column settings_snapshot already exists.";
        }
        
        echo json_encode([
            'success' => true,
            'message' => $message
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
    