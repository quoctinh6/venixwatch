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
    
    # Create the php code
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
    """
    
    # Upload temporary PHP script to /httpdocs/backend/public/update_db.php
    local_php_temp = r"c:\laragon\www\venixwatch\scratch\update_db_temp.php"
    with open(local_php_temp, "w", encoding="utf-8") as f:
        f.write(php_content)
        
    remote_php_path = "/httpdocs/backend/public/update_db.php"
    print(f"Uploading temp PHP script to {remote_php_path}...")
    with open(local_php_temp, "rb") as f:
        ftp.storbinary(f"STOR {remote_php_path}", f)
        
    ftp.quit()
    
    # Call the PHP script via HTTP
    direct_url = "https://venixwatchvn464.mbws.vn/backend/public/update_db.php"
    print(f"Calling script via HTTP: {direct_url}")
    try:
        req = urllib.request.Request(direct_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            with open("scratch/db_update_response.json", "w", encoding="utf-8") as out:
                out.write(res_body)
            print("Response saved to scratch/db_update_response.json")
    except Exception as e:
        print("Error calling URL:", e)
        
    # Delete the temporary files from FTP and locally
    print("Cleaning up temporary script from FTP...")
    ftp = ftplib.FTP()
    ftp.connect(FTP_HOST, 21)
    ftp.login(FTP_USER, FTP_PASS)
    try:
        ftp.delete(remote_php_path)
        print("Deleted temporary script from remote FTP.")
    except Exception as e:
        print("Failed to delete remote script:", e)
    ftp.quit()

if __name__ == "__main__":
    main()
