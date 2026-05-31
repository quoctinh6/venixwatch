CREATE TABLE IF NOT EXISTS `news_articles` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
