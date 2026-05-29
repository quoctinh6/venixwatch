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
    
    // 1. Create table news_articles
    $sql = "CREATE TABLE IF NOT EXISTS `news_articles` (
      `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
      `title` VARCHAR(250) NOT NULL,
      `slug` VARCHAR(260) NOT NULL,
      `thumbnail_url` VARCHAR(500) DEFAULT NULL,
      `summary` TEXT DEFAULT NULL,
      `content` LONGTEXT NOT NULL,
      `author` VARCHAR(100) DEFAULT 'Admin',
      `status` ENUM('draft', 'published') DEFAULT 'draft',
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      UNIQUE KEY `idx_slug` (`slug`),
      KEY `idx_status` (`status`),
      KEY `idx_created_at` (`created_at`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    $pdo->exec($sql);
    
    // 2. Insert navigation_menu default if not exists
    $stmtMenu = $pdo->prepare("SELECT COUNT(*) FROM settings WHERE `key` = 'navigation_menu'");
    $stmtMenu->execute();
    if ($stmtMenu->fetchColumn() == 0) {
        $defaultMenu = [
            [
                "label" => "ĐỒNG HỒ NAM",
                "href" => "/nam",
                "children" => [
                    ["label" => "Đồng Hồ Nam Cổ", "href" => "/nam?category=nam-co"],
                    ["label" => "Đồng Hồ Nam Điện Tử", "href" => "/nam?category=nam-dien-tu"],
                    ["label" => "Đồng Hồ Thể Thao Nam", "href" => "/nam?category=nam-the-thao"],
                    ["label" => "Đồng Hồ Luxury Nam", "href" => "/nam?category=nam-luxury"]
                ]
            ],
            [
                "label" => "ĐỒNG HỒ NỮ",
                "href" => "/nu",
                "children" => [
                    ["label" => "Đồng Hồ Nữ Thời Trang", "href" => "/nu?category=nu-thoi-trang"],
                    ["label" => "Đồng Hồ Nữ Cổ", "href" => "/nu?category=nu-co"],
                    ["label" => "Đồng Hồ Nữ Dây Da", "href" => "/nu?category=nu-day-da"],
                    ["label" => "Đồng Hồ Luxury Nữ", "href" => "/nu?category=nu-luxury"]
                ]
            ],
            [
                "label" => "PHỤ KIỆN",
                "href" => "/phu-kien",
                "children" => []
            ],
            [
                "label" => "SALE",
                "href" => "/sale",
                "children" => [],
                "badge" => "HOT"
            ]
        ];
        $stmtInsert = $pdo->prepare("INSERT INTO settings (`key`, `value`) VALUES ('navigation_menu', :val)");
        $stmtInsert->execute([':val' => json_encode($defaultMenu, JSON_UNESCAPED_UNICODE)]);
    }
    
    // 3. Insert home_sections default if not exists
    $stmtSec = $pdo->prepare("SELECT COUNT(*) FROM settings WHERE `key` = 'home_sections'");
    $stmtSec->execute();
    if ($stmtSec->fetchColumn() == 0) {
        $defaultSections = [
            "announcement_bar" => [
                "messages" => [
                    "Miễn phí vận chuyển đơn hàng trên 500.000đ",
                    "Đổi trả trong 30 ngày - Bảo hành 2 năm chính hãng",
                    "Dùng code WELCOME10 giảm 10% đơn hàng đầu tiên"
                ]
            ],
            "promo_banner" => [
                "title" => "Mua 1 Tặng 1 — Ưu đãi 50%",
                "code" => "BOGOSO",
                "buttons" => [
                    ["label" => "Shop Nam", "href" => "/nam"],
                    ["label" => "Shop Nữ", "href" => "/nu"]
                ]
            ],
            "brand_story" => [
                "title" => "DONG HO ANH TUAN",
                "subtitle" => "Kể từ năm 2012",
                "description" => "Chúng tôi tự hào là đơn vị cung cấp các mẫu đồng hồ Casio, Seiko, Orient chính hãng uy tín hàng đầu Việt Nam. Mỗi chiếc đồng hồ trao đi là một lời cam kết về chất lượng và chế độ bảo hành hậu mãi tận tâm nhất.",
                "button_label" => "Tìm hiểu thêm",
                "button_href" => "/lien-he",
                "image_url" => "https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg"
            ],
            "newsletter" => [
                "title" => "Đăng ký nhận ưu đãi",
                "description" => "Nhận ngay mã giảm giá 10% và cập nhật các thông tin khuyến mãi mới nhất từ Venix Watch.",
                "button_label" => "Đăng ký"
            ]
        ];
        $stmtInsert = $pdo->prepare("INSERT INTO settings (`key`, `value`) VALUES ('home_sections', :val)");
        $stmtInsert->execute([':val' => json_encode($defaultSections, JSON_UNESCAPED_UNICODE)]);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Database migration and seeding completed successfully!'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
