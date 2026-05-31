import ftplib
import urllib.request
import json

FTP_HOST = "203.171.31.7"
FTP_USER = "u9837c42a"
FTP_PASS = "wvXgFAlpdzkNPUA@1"

def main():
    ftp = ftplib.FTP()
    ftp.connect(FTP_HOST, 21)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.encoding = "utf-8"
    
    # 1. Create a temporary PHP script to alter settings_history table on the server
    php_content = """<?php
    declare(strict_types=1);
    define('BASE_DIR', dirname(__DIR__));
    spl_autoload_register(function (string $class): void {
        $prefix = 'App\\\\';
        $base   = BASE_DIR . '/src/';
        if (!str_starts_with($class, $prefix)) return;
        $relative = substr($class, strlen($prefix));
        $file     = $base . str_replace('\\\\', '/', $relative) . '.php';
        if (file_exists($file)) require_once $file;
    });
    spl_autoload_register(function (string $class): void {
        $prefix = 'App\\\\Config\\\\';
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
    """
    
    local_php_temp = r"c:\laragon\www\venixwatch\scratch\alter_db_temp.php"
    with open(local_php_temp, "w", encoding="utf-8") as f:
        f.write(php_content)
        
    remote_php_path = "/httpdocs/backend/public/alter_db.php"
    print(f"Uploading alter PHP script to {remote_php_path}...")
    with open(local_php_temp, "rb") as f:
        ftp.storbinary(f"STOR {remote_php_path}", f)
        
    ftp.quit()
    
    # Call the PHP script via HTTP
    direct_url = "https://venixwatchvn464.mbws.vn/backend/public/alter_db.php"
    print(f"Calling alter script via HTTP: {direct_url}")
    try:
        req = urllib.request.Request(direct_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            print("Response from server:")
            print(res_body)
    except Exception as e:
        print("Error calling URL:", e)
        
    # Clean up
    print("Cleaning up temporary script from FTP...")
    ftp = ftplib.FTP()
    ftp.connect(FTP_HOST, 21)
    ftp.login(FTP_USER, FTP_PASS)
    try:
        ftp.delete(remote_php_path)
        print("Deleted alter script from remote FTP.")
    except Exception as e:
        print("Failed to delete remote script:", e)
    ftp.quit()

if __name__ == "__main__":
    main()
