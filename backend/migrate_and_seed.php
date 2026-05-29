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
    echo "Connected to database successfully.\n";

    // Helper to check if a column exists
    function columnExists($pdo, $table, $column) {
        $stmt = $pdo->query("SHOW COLUMNS FROM `{$table}` LIKE '{$column}'");
        return $stmt->rowCount() > 0;
    }

    // 1. Programmatically alter products table to add missing columns safely
    echo "Altering products table...\n";
    $columnsToAdd = [
        'short_description' => "ALTER TABLE products ADD COLUMN short_description TEXT NULL AFTER description",
        'long_description'  => "ALTER TABLE products ADD COLUMN long_description LONGTEXT NULL AFTER short_description",
        'ref_number'        => "ALTER TABLE products ADD COLUMN ref_number VARCHAR(50) NULL AFTER sku",
        'status'            => "ALTER TABLE products ADD COLUMN status ENUM('active','out_of_stock','pre_order','draft') NOT NULL DEFAULT 'active' AFTER stock",
        'view_count'        => "ALTER TABLE products ADD COLUMN view_count INT NOT NULL DEFAULT 0 AFTER badge",
        'sold_count'        => "ALTER TABLE products ADD COLUMN sold_count INT NOT NULL DEFAULT 0 AFTER view_count",
        'rating_avg'        => "ALTER TABLE products ADD COLUMN rating_avg DECIMAL(3,2) NOT NULL DEFAULT 0 AFTER sold_count",
        'rating_count'      => "ALTER TABLE products ADD COLUMN rating_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER rating_avg"
    ];

    foreach ($columnsToAdd as $col => $sql) {
        if (!columnExists($pdo, 'products', $col)) {
            $pdo->exec($sql);
            echo "Added column '{$col}' to products table.\n";
        } else {
            echo "Column '{$col}' already exists in products table.\n";
        }
    }

    // 2. Safely recreate reviews and product Q&A tables to match types
    echo "Recreating review & Q&A tables to ensure compatible foreign keys...\n";
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $pdo->exec("DROP TABLE IF EXISTS review_photos;");
    $pdo->exec("DROP TABLE IF EXISTS review_votes;");
    $pdo->exec("DROP TABLE IF EXISTS reviews;");
    $pdo->exec("DROP TABLE IF EXISTS product_questions;");
    $pdo->exec("DROP TABLE IF EXISTS bad_words;");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    // Recreate Reviews table with matching INT UNSIGNED product_id
    $pdo->exec("
        CREATE TABLE reviews (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            product_id INT UNSIGNED NOT NULL,
            user_id INT UNSIGNED NOT NULL,
            user_name VARCHAR(120) NULL,
            order_id INT UNSIGNED NOT NULL,
            rating TINYINT UNSIGNED NOT NULL,
            title VARCHAR(255) NULL,
            comment TEXT NOT NULL,
            is_anonymous TINYINT(1) NOT NULL DEFAULT 0,
            status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
            reject_reason VARCHAR(255) NULL,
            shop_reply TEXT NULL,
            shop_reply_by INT UNSIGNED NULL,
            shop_reply_at TIMESTAMP NULL,
            helpful_count INT UNSIGNED NOT NULL DEFAULT 0,
            is_edited TINYINT(1) NOT NULL DEFAULT 0,
            edited_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY uk_reviews_user_product (user_id, product_id),
            INDEX idx_reviews_product_status (product_id, status, created_at),
            INDEX idx_reviews_rating (product_id, rating)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "Created table 'reviews'.\n";

    // Recreate Review Photos
    $pdo->exec("
        CREATE TABLE review_photos (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            review_id BIGINT UNSIGNED NOT NULL,
            photo_url VARCHAR(500) NOT NULL,
            sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_review_photos_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
            INDEX idx_review_photos_review (review_id, sort_order)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "Created table 'review_photos'.\n";

    // Recreate Review Votes
    $pdo->exec("
        CREATE TABLE review_votes (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            review_id BIGINT UNSIGNED NOT NULL,
            user_id INT UNSIGNED NOT NULL,
            vote_type ENUM('helpful','not_helpful') NOT NULL DEFAULT 'helpful',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_review_votes_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
            CONSTRAINT fk_review_votes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY uk_review_votes_unique (review_id, user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "Created table 'review_votes'.\n";

    // Recreate Product Questions
    $pdo->exec("
        CREATE TABLE product_questions (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            product_id INT UNSIGNED NOT NULL,
            user_id INT UNSIGNED NOT NULL,
            question TEXT NOT NULL,
            answer TEXT NULL,
            status ENUM('pending','answered','hidden') NOT NULL DEFAULT 'pending',
            answered_by INT UNSIGNED NULL,
            answered_at TIMESTAMP NULL,
            notify_email TINYINT(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_product_questions_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            CONSTRAINT fk_product_questions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_product_questions_status (product_id, status, created_at),
            INDEX idx_product_questions_user_day (user_id, product_id, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "Created table 'product_questions'.\n";

    // Recreate Bad Words
    $pdo->exec("
        CREATE TABLE bad_words (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            word VARCHAR(100) NOT NULL UNIQUE,
            severity ENUM('low','medium','high') NOT NULL DEFAULT 'medium'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "Created table 'bad_words'.\n";

    // 3. Clear and seed users & orders
    echo "Seeding completed orders & users to satisfy review constraints...\n";
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $pdo->exec("TRUNCATE TABLE order_items;");
    $pdo->exec("TRUNCATE TABLE orders;");
    $pdo->exec("TRUNCATE TABLE users;");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    // Fetch products
    $products = $pdo->query("SELECT id, name, slug FROM products")->fetchAll();
    if (empty($products)) {
        echo "No products found in the database. Seed products first.\n";
        exit(1);
    }

    // Ensure roles and permissions exist
    echo "Ensuring user_page_editor role and products:quick_edit permission exist...\n";
    $pdo->exec("INSERT IGNORE INTO permissions (name, group_name) VALUES ('products:quick_edit', 'products')");
    $pdo->exec("INSERT IGNORE INTO roles (name, display_name) VALUES ('user_page_editor', 'User Page Editor')");
    
    // Assign products:quick_edit to super_admin
    $pdo->exec("INSERT IGNORE INTO role_permissions (role_id, permission_id)
                SELECT r.id, p.id FROM roles r, permissions p 
                WHERE r.name = 'super_admin' AND p.name = 'products:quick_edit'
                ON DUPLICATE KEY UPDATE role_id = role_id");

    // Assign products:read, products:write, products:quick_edit to user_page_editor
    $pdo->exec("INSERT IGNORE INTO role_permissions (role_id, permission_id)
                SELECT r.id, p.id FROM roles r, permissions p 
                WHERE r.name = 'user_page_editor' 
                  AND p.name IN ('products:read', 'products:write', 'products:quick_edit')
                ON DUPLICATE KEY UPDATE role_id = role_id");

    // Seed 8 distinct users to match our reviews per product and tests
    $usersList = [
        ['id' => 1, 'email' => 'admin@donghoatuan.vn', 'name' => 'Admin Venix Watch'],
        ['id' => 2, 'email' => 'an@gmail.com', 'name' => 'Nguyễn Minh An'],
        ['id' => 3, 'email' => 'binh@gmail.com', 'name' => 'Trần Thu Bình'],
        ['id' => 4, 'email' => 'cuong@gmail.com', 'name' => 'Lê Quốc Cường'],
        ['id' => 5, 'email' => 'danh@gmail.com', 'name' => 'Phạm Hoàng Danh'],
        ['id' => 6, 'email' => 'tuan@gmail.com', 'name' => 'Đỗ Minh Tuấn'],
        ['id' => 7, 'email' => 'khanh@gmail.com', 'name' => 'Ngô Quốc Khánh'],
        ['id' => 8, 'email' => 'editor@donghoatuan.vn', 'name' => 'Editor Venix Watch']
    ];

    $hash = '$2y$12$yTibnFj9PLg/b9sBNCFxK.dfBuUgDeJgC5jqdUMKmuG1OjXA.GK.a';
    $stmtUser = $pdo->prepare("INSERT INTO users (id, email, password_hash, full_name, phone, is_active) VALUES (:id, :email, :password_hash, :name, '0901234567', 1)");
    foreach ($usersList as $u) {
        $stmtUser->execute([
            ':id' => $u['id'],
            ':email' => $u['email'],
            ':password_hash' => $hash,
            ':name' => $u['name']
        ]);
    }
    echo "Distinct users seeded.\n";

    // Assign roles to seeded users
    $stmtUserRole = $pdo->prepare("
        INSERT IGNORE INTO user_roles (user_id, role_id) 
        SELECT :user_id, id FROM roles WHERE name = :role_name
    ");
    // Assign super_admin to Admin (ID 1)
    $stmtUserRole->execute([':user_id' => 1, ':role_name' => 'super_admin']);
    // Assign user_page_editor to Editor (ID 8)
    $stmtUserRole->execute([':user_id' => 8, ':role_name' => 'user_page_editor']);
    echo "User roles assigned (Admin -> super_admin, Editor -> user_page_editor).\n";

    $stmtOrder = $pdo->prepare("INSERT INTO orders (id, user_id, customer_name, customer_email, customer_phone, shipping_address, total_amount, status) VALUES (:id, :user_id, :name, :email, :phone, :address, :total, 'completed')");
    $stmtOrderItem = $pdo->prepare("INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity) VALUES (:order_id, :product_id, :product_name, :price, 1)");

    $orderId = 100;
    $pOrders = [];
    foreach ($products as $p) {
        // Create completed orders for each user so they can review
        foreach ($usersList as $u) {
            $stmtOrder->execute([
                ':id' => $orderId,
                ':user_id' => $u['id'],
                ':name' => $u['name'],
                ':email' => $u['email'],
                ':phone' => '0987654321',
                ':address' => '123 Đường Láng, Hà Nội',
                ':total' => 5000000
            ]);
            
            $stmtOrderItem->execute([
                ':order_id' => $orderId,
                ':product_id' => $p['id'],
                ':product_name' => $p['name'],
                ':price' => 5000000
            ]);
            
            $pOrders[$p['id']][$u['id']] = $orderId;
            $orderId++;
        }
    }
    echo "Dummy completed orders seeded.\n";

    // 4. Seed reviews with multiple stars (1, 2, 3, 4, 5)
    $reviewsData = [
        [
            'rating' => 5,
            'title' => 'Tuyệt tác thời gian, hoàn thiện cực kỳ sắc nét!',
            'comment' => 'Tôi rất hài lòng với chất lượng hoàn thiện của mẫu đồng hồ này. Kim và cọc số sáng bóng dưới ánh sáng, dây đeo ôm tay thoải mái. Hộp đựng sang trọng phù hợp làm quà tặng. Dịch vụ tư vấn của shop cực kỳ chu đáo, giao hàng nhanh.',
            'user_name' => 'Nguyễn Minh An',
            'user_id' => 2,
            'is_anonymous' => 0,
            'photos' => ['https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg', 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg'],
            'shop_reply' => 'Cảm ơn anh An đã tin tưởng mua sắm và dành lời khen tốt đẹp cho Venix Watch!'
        ],
        [
            'rating' => 5,
            'title' => 'Đẹp hơn cả trong hình, máy chạy êm và chuẩn giờ',
            'comment' => 'Sau một tuần đeo thử thấy máy chạy vô cùng ổn định, sai số rất ít. Mặt kính sapphire chống trầy tốt, tôi vô tình va quẹt nhẹ vài lần nhưng không một vết xước. Sẽ tiếp tục ủng hộ shop các mẫu tiếp theo.',
            'user_name' => 'Trần Thu Bình',
            'user_id' => 3,
            'is_anonymous' => 0,
            'photos' => ['https://images.pexels.com/photos/364822/pexels-photo-364822.jpeg'],
            'shop_reply' => 'Venix Watch rất hân hạnh được phục vụ chị Bình. Chúc chị luôn có những trải nghiệm tuyệt vời cùng sản phẩm!'
        ],
        [
            'rating' => 4,
            'title' => 'Đồng hồ rất đẹp, phong cách lịch lãm cổ điển',
            'comment' => 'Sản phẩm đúng như mô tả, đóng gói rất cẩn thận bằng nhiều lớp chống sốc. Hộp và thẻ bảo hành đầy đủ. Chỉ có một điểm nhỏ là dây da ban đầu hơi cứng một chút, đeo khoảng 3 ngày thì mềm ra ôm khít tay.',
            'user_name' => 'Lê Quốc Cường',
            'user_id' => 4,
            'is_anonymous' => 0,
            'photos' => [],
            'shop_reply' => 'Cảm ơn anh Cường đã đóng góp ý kiến. Dây da tự nhiên cao cấp thường sẽ mềm mại và ôm tay hơn sau vài ngày sử dụng ạ!'
        ],
        [
            'rating' => 3,
            'title' => 'Sản phẩm tạm ổn, giao hàng hơi lâu',
            'comment' => 'Thiết kế đẹp, chất lượng gia công ở mức khá tốt so với tầm giá. Tuy nhiên đơn hàng của mình bị trễ mất 2 ngày so với dự kiến ban đầu làm nhỡ mất dịp tặng sinh nhật bạn bè. Shop cần cải thiện khâu vận chuyển.',
            'user_name' => 'Phạm Hoàng Danh',
            'user_id' => 5,
            'is_anonymous' => 1,
            'photos' => [],
            'shop_reply' => 'Venix Watch thành thật xin lỗi anh Danh vì sự cố giao hàng chậm trễ của bên đối tác vận chuyển. Shop sẽ làm việc lại để đẩy nhanh tốc độ giao hàng ạ!'
        ],
        [
            'rating' => 2,
            'title' => 'Kích thước hơi to so với mô tả, đeo không vừa lắm',
            'comment' => 'Chất lượng đồng hồ thì ổn nhưng size mặt kính và độ dày hơi to so với tay mình. Lúc đặt hàng cứ nghĩ đeo vừa, khi nhận đeo thử thấy nặng tay và vướng víu. Hy vọng shop hỗ trợ đổi sang size nhỏ hơn.',
            'user_name' => 'Đỗ Minh Tuấn',
            'user_id' => 6,
            'is_anonymous' => 0,
            'photos' => [],
            'shop_reply' => 'Dạ Venix Watch có chính sách đổi trả trong vòng 30 ngày đối với sản phẩm còn nguyên tem mác và chưa qua sử dụng ạ. Nhân viên shop sẽ liên hệ ngay để hỗ trợ anh Tuấn đổi mẫu phù hợp hơn nhé!'
        ],
        [
            'rating' => 1,
            'title' => 'Nhận hàng bị xước nhẹ ở mặt đáy',
            'comment' => 'Khá thất vọng vì khi bóc seal ra kiểm tra thấy phần nắp đáy sau có một vết xước mảnh. Mặc dù đeo vào không nhìn thấy nhưng cảm giác nhận sản phẩm mới không được trọn vẹn. Mong shop kiểm tra kỹ hơn trước khi gửi.',
            'user_name' => 'Ngô Quốc Khánh',
            'user_id' => 7,
            'is_anonymous' => 0,
            'photos' => [],
            'shop_reply' => 'Thành thật xin lỗi anh Khánh vì trải nghiệm chưa trọn vẹn này. Venix Watch cam kết đổi mới 100% sản phẩm khác cho anh ngay lập tức. Nhân viên hỗ trợ sẽ liên hệ xử lý ngay ạ!'
        ]
    ];

    $stmtReview = $pdo->prepare("INSERT INTO reviews (product_id, user_id, user_name, order_id, rating, title, comment, is_anonymous, status, shop_reply, shop_reply_at) VALUES (:product_id, :user_id, :user_name, :order_id, :rating, :title, :comment, :is_anonymous, 'approved', :shop_reply, :shop_reply_at)");
    $stmtPhoto = $pdo->prepare("INSERT INTO review_photos (review_id, photo_url, sort_order) VALUES (:review_id, :photo_url, :sort_order)");

    foreach ($products as $p) {
        $pId = $p['id'];
        
        echo "Seeding reviews for: " . $p['name'] . "\n";
        foreach ($reviewsData as $r) {
            $uId = $r['user_id'];
            $oId = $pOrders[$pId][$uId];
            
            $stmtReview->execute([
                ':product_id' => $pId,
                ':user_id' => $uId,
                ':user_name' => $r['user_name'],
                ':order_id' => $oId,
                ':rating' => $r['rating'],
                ':title' => $r['title'],
                ':comment' => $r['comment'],
                ':is_anonymous' => $r['is_anonymous'],
                ':shop_reply' => $r['shop_reply'],
                ':shop_reply_at' => $r['shop_reply'] ? date('Y-m-d H:i:s', strtotime('-1 day')) : null
            ]);
            
            $reviewId = $pdo->lastInsertId();
            
            if (!empty($r['photos'])) {
                foreach ($r['photos'] as $idx => $photoUrl) {
                    $stmtPhoto->execute([
                        ':review_id' => $reviewId,
                        ':photo_url' => $photoUrl,
                        ':sort_order' => $idx
                    ]);
                }
            }
        }

        // QAs
        $qas = [
            [
                'question' => 'Mẫu đồng hồ này có hỗ trợ trả góp qua thẻ tín dụng 0% lãi suất không shop?',
                'answer' => 'Chào bạn, Venix Watch có hỗ trợ trả góp 0% qua thẻ tín dụng của hơn 25 ngân hàng liên kết, thủ tục nhanh chóng trong 3 phút tại cửa hàng hoặc làm online cực kỳ tiện lợi ạ!',
                'status' => 'answered'
            ],
            [
                'question' => 'Đường kính mặt 40mm thì cổ tay khoảng bao nhiêu đeo đẹp nhất ạ?',
                'answer' => 'Chào bạn, đường kính 40mm lý tưởng nhất cho cổ tay từ 15cm đến 17cm đeo sẽ rất thanh lịch và ôm tay. Bạn có thể ghé trực tiếp shop để thử lên tay nhé!',
                'status' => 'answered'
            ],
            [
                'question' => 'Chính sách bảo hành của máy automatic như thế nào vậy shop?',
                'status' => 'pending'
            ]
        ];

        $stmtQA = $pdo->prepare("INSERT INTO product_questions (product_id, user_id, question, answer, status, answered_by, answered_at) VALUES (:product_id, :user_id, :question, :answer, :status, :answered_by, :answered_at)");
        foreach ($qas as $q) {
            $stmtQA->execute([
                ':product_id' => $pId,
                ':user_id' => 1, // Admin answered
                ':question' => $q['question'],
                ':answer' => $q['answer'] ?? null,
                ':status' => $q['status'],
                ':answered_by' => $q['status'] === 'answered' ? 1 : null,
                ':answered_at' => $q['status'] === 'answered' ? date('Y-m-d H:i:s') : null
            ]);
        }
    }

    // 5. Recalculate rating_avg and rating_count
    echo "Recalculating rating averages and counts...\n";
    $productRatings = $pdo->query("
        SELECT product_id, COUNT(*) as count, AVG(rating) as avg 
        FROM reviews 
        WHERE status = 'approved' 
        GROUP BY product_id
    ")->fetchAll();

    $stmtUpdateProduct = $pdo->prepare("UPDATE products SET rating_avg = :avg, rating_count = :count WHERE id = :id");
    foreach ($productRatings as $pr) {
        $stmtUpdateProduct->execute([
            ':avg' => round($pr['avg'], 2),
            ':count' => $pr['count'],
            ':id' => $pr['product_id']
        ]);
        echo "Product ID {$pr['product_id']}: avg = " . round($pr['avg'], 2) . ", count = {$pr['count']}\n";
    }

    echo "\nDatabase migration and seeding completed successfully!\n";

} catch (Exception $e) {
    echo "\nError occurred: " . $e->getMessage() . "\n";
    exit(1);
}
