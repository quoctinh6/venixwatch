<?php

declare(strict_types=1);

namespace App\Modules\Admin\Analytics;

use App\Config\Database;
use App\Models\VisitorLog;
use App\Models\PageViewEvent;
use App\Models\PageSession;
use App\Models\Order;
use App\Models\Product;
use PDO;

class AnalyticsService
{
    private VisitorLog $visitorModel;
    private PageViewEvent $pageViewModel;
    private PageSession $sessionModel;
    private Order $orderModel;
    private Product $productModel;

    public function __construct()
    {
        $pdo = Database::getInstance();
        $this->visitorModel = new VisitorLog($pdo);
        $this->pageViewModel = new PageViewEvent($pdo);
        $this->sessionModel = new PageSession($pdo);
        $this->orderModel = new Order($pdo);
        $this->productModel = new Product($pdo);
    }

    private function getDateRangeFilters(array $params, string $tableAlias = ''): array
    {
        $prefix = $tableAlias ? $tableAlias . '.' : '';
        $days = (int)($params['days'] ?? 30);
        $startDate = $params['start_date'] ?? null;
        $endDate = $params['end_date'] ?? null;

        if ($startDate && $endDate) {
            return [
                'sql' => "{$prefix}created_at BETWEEN :start_date AND :end_date",
                'params' => [
                    ':start_date' => $startDate . ' 00:00:00',
                    ':end_date' => $endDate . ' 23:59:59',
                ]
            ];
        } else {
            return [
                'sql' => "{$prefix}created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)",
                'params' => [
                    ':days' => $days
                ]
            ];
        }
    }

    public function getDashboardStats(): array
    {
        $pdo = Database::getInstance();
        $today = $this->visitorModel->getToday();
        $orderStats = $this->orderModel->getStats();
        $activeUsers = $this->sessionModel->getActiveCount(5);
        $lowStock = $this->productModel->getLowStock(5);

        // --- Orders TODAY ---
        $stmtToday = $pdo->prepare(
            "SELECT COUNT(*) AS orders_today,
                    SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) AS revenue_today
             FROM orders
             WHERE DATE(created_at) = CURDATE()"
        );
        $stmtToday->execute();
        $orderToday = $stmtToday->fetch() ?: ['orders_today' => 0, 'revenue_today' => 0];

        // --- Orders YESTERDAY (for trend) ---
        $stmtYesterday = $pdo->prepare(
            "SELECT COUNT(*) AS orders_yesterday,
                    SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) AS revenue_yesterday
             FROM orders
             WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)"
        );
        $stmtYesterday->execute();
        $orderYesterday = $stmtYesterday->fetch() ?: ['orders_yesterday' => 0, 'revenue_yesterday' => 0];

        // --- Visitors YESTERDAY (for trend) ---
        $stmtVisYesterday = $pdo->prepare(
            "SELECT COUNT(DISTINCT session_id) AS unique_visitors,
                    COUNT(*) AS total_visits
             FROM visitor_logs
             WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)"
        );
        $stmtVisYesterday->execute();
        $yesterday = $stmtVisYesterday->fetch() ?: ['unique_visitors' => 0, 'total_visits' => 0];

        // --- Hourly views today ---
        $stmtHourly = $pdo->prepare(
            "SELECT HOUR(created_at) AS hour, COUNT(*) AS views
             FROM page_view_events
             WHERE DATE(created_at) = CURDATE()
             GROUP BY HOUR(created_at)
             ORDER BY hour ASC"
        );
        $stmtHourly->execute();
        $hourlyRaw = $stmtHourly->fetchAll();
        $hourlyViews = array_fill(0, 24, 0);
        foreach ($hourlyRaw as $row) {
            $hourlyViews[(int)$row['hour']] = (int)$row['views'];
        }

        // --- Countries (top 10, last 30 days) ---
        $countries = $this->visitorModel->getByCountry(10, 30);
        $countriesFormatted = array_map(fn($row) => [
            'code' => $row['country_code'] ?? '',
            'name' => $row['country_name'] ?: 'Khác',
            'count' => (int)($row['unique_visitors'] ?? 0),
        ], $countries);

        // --- Traffic sources ---
        $sources = $this->visitorModel->getSourceSplit(6, 1);
        $trafficSources = ['direct' => 0, 'google' => 0, 'facebook' => 0, 'other' => 0];
        foreach ($sources as $row) {
            $key = strtolower($row['source'] ?? '');
            if ($key === 'direct') $trafficSources['direct'] = (int)($row['unique_visitors'] ?? 0);
            elseif ($key === 'google') $trafficSources['google'] = (int)($row['unique_visitors'] ?? 0);
            elseif ($key === 'facebook') $trafficSources['facebook'] = (int)($row['unique_visitors'] ?? 0);
            else $trafficSources['other'] += (int)($row['unique_visitors'] ?? 0);
        }

        // --- Devices ---
        $deviceRows = $this->visitorModel->getDeviceSplit(1);
        $devices = ['desktop' => 0, 'mobile' => 0, 'tablet' => 0];
        foreach ($deviceRows as $row) {
            $type = $row['device_type'] ?? '';
            if (isset($devices[$type])) {
                $devices[$type] = (int)($row['unique_visitors'] ?? 0);
            }
        }

        // --- Top pages today ---
        $topPages = $this->pageViewModel->getTopPages(10, 1);
        $topPagesFormatted = array_map(fn($row) => [
            'page' => $row['page_url'] ?? '/',
            'views' => (int)($row['views'] ?? 0),
            'avg_time' => (int)($row['avg_time'] ?? 0),
            'scroll_depth' => (int)($row['avg_scroll'] ?? 0),
        ], $topPages);

        // --- Calculate trends ---
        $calcTrend = function($current, $previous) {
            if ($previous == 0) return $current > 0 ? 100.0 : 0.0;
            return round(($current - $previous) / $previous * 100, 1);
        };

        $visitorsToday = (int)($today['unique_visitors'] ?? 0);
        $visitorsYesterday = (int)($yesterday['unique_visitors'] ?? 0);
        $viewsToday = (int)($today['total_visits'] ?? 0);
        $viewsYesterday = (int)($yesterday['total_visits'] ?? 0);
        $ordersToday = (int)($orderToday['orders_today'] ?? 0);
        $ordersYesterday = (int)($orderYesterday['orders_yesterday'] ?? 0);
        $revenueToday = (float)($orderToday['revenue_today'] ?? 0);
        $revenueYesterday = (float)($orderYesterday['revenue_yesterday'] ?? 0);

        return [
            'success' => true,
            'data' => [
                'online_users' => $activeUsers,
                'online_users_trend' => null,
                'visitors_today' => $visitorsToday,
                'visitors_today_trend' => $calcTrend($visitorsToday, $visitorsYesterday),
                'views_today' => $viewsToday,
                'views_today_trend' => $calcTrend($viewsToday, $viewsYesterday),
                'orders_today' => $ordersToday,
                'orders_today_trend' => $calcTrend($ordersToday, $ordersYesterday),
                'revenue_today' => $revenueToday,
                'revenue_today_trend' => $calcTrend($revenueToday, $revenueYesterday),
                'pending_orders' => (int)($orderStats['pending'] ?? 0),
                'low_stock_count' => count($lowStock),
                'hourly_views' => $hourlyViews,
                'countries' => $countriesFormatted,
                'traffic_sources' => $trafficSources,
                'devices' => $devices,
                'top_pages' => $topPagesFormatted,
            ],
        ];
    }

    public function getHourlyVisitors(string $day): array
    {
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare(
            "SELECT HOUR(created_at) AS hour,
                    COUNT(DISTINCT session_id) AS unique_visitors,
                    COUNT(*) AS total_visits
             FROM visitor_logs
             WHERE DATE(created_at) = :day
             GROUP BY HOUR(created_at)
             ORDER BY hour ASC"
        );
        $stmt->bindValue(':day', $day, PDO::PARAM_STR);
        $stmt->execute();
        $raw = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        $hourlyData = [];
        for ($h = 0; $h < 24; $h++) {
            $hourlyData[$h] = [
                'date' => sprintf('%02d:00', $h),
                'unique_visitors' => 0,
                'total_visits' => 0
            ];
        }

        foreach ($raw as $row) {
            $h = (int)$row['hour'];
            $hourlyData[$h] = [
                'date' => sprintf('%02d:00', $h),
                'unique_visitors' => (int)$row['unique_visitors'],
                'total_visits' => (int)$row['total_visits']
            ];
        }

        return array_values($hourlyData);
    }

    public function getVisitorsChart(array $params = []): array
    {
        $startDate = $params['start_date'] ?? null;
        $endDate = $params['end_date'] ?? null;
        $days = (int)($params['days'] ?? 30);

        if ($startDate && $endDate) {
            if ($startDate === $endDate) {
                $data = $this->getHourlyVisitors($startDate);
                return ['success' => true, 'data' => $data];
            }
            $from = $startDate;
            $to = $endDate;
        } else {
            $to = date('Y-m-d');
            $from = date('Y-m-d', strtotime("-{$days} days"));
        }
        $data = $this->visitorModel->getByDateRange($from, $to);

        return ['success' => true, 'data' => $data];
    }

    public function getTopPages(int $limit = 10, array $params = []): array
    {
        $pdo = Database::getInstance();
        $dateInfo = $this->getDateRangeFilters($params);

        $sql = "SELECT page_url, page_title,
                       COUNT(*) AS views,
                       COUNT(DISTINCT session_id) AS unique_views,
                       ROUND(AVG(time_on_page)) AS avg_time,
                       ROUND(AVG(scroll_depth)) AS avg_scroll
                FROM page_view_events
                WHERE {$dateInfo['sql']}
                GROUP BY page_url, page_title
                ORDER BY views DESC
                LIMIT :limit";

        $stmt = $pdo->prepare($sql);
        foreach ($dateInfo['params'] as $key => $val) {
            $stmt->bindValue($key, $val, is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return [
            'success' => true,
            'data' => $stmt->fetchAll() ?: []
        ];
    }

    public function getActiveUsers(int $minutes = 5): array
    {
        $sessions = $this->sessionModel->getActive($minutes);
        return [
            'success' => true,
            'data' => [
                'count' => count($sessions),
                'sessions' => $sessions,
            ],
        ];
    }

    public function getCountryStats(int $limit = 10, array $params = []): array
    {
        $pdo = Database::getInstance();
        $dateInfo = $this->getDateRangeFilters($params);

        $sql = "SELECT country_code, country_name,
                       COUNT(DISTINCT session_id) AS unique_visitors
                FROM visitor_logs
                WHERE country_code IS NOT NULL
                  AND {$dateInfo['sql']}
                GROUP BY country_code, country_name
                ORDER BY unique_visitors DESC
                LIMIT :limit";

        $stmt = $pdo->prepare($sql);
        foreach ($dateInfo['params'] as $key => $val) {
            $stmt->bindValue($key, $val, is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return [
            'success' => true,
            'data' => $stmt->fetchAll() ?: []
        ];
    }

    public function getCityStats(int $limit = 10, array $params = []): array
    {
        $pdo = Database::getInstance();
        $dateInfo = $this->getDateRangeFilters($params);

        $sql = "SELECT city, country_name,
                       COUNT(DISTINCT session_id) AS unique_visitors
                FROM visitor_logs
                WHERE city IS NOT NULL
                  AND city <> ''
                  AND {$dateInfo['sql']}
                GROUP BY city, country_name
                ORDER BY unique_visitors DESC
                LIMIT :limit";

        $stmt = $pdo->prepare($sql);
        foreach ($dateInfo['params'] as $key => $val) {
            $stmt->bindValue($key, $val, is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return [
            'success' => true,
            'data' => $stmt->fetchAll() ?: []
        ];
    }

    public function getDeviceStats(array $params = []): array
    {
        $pdo = Database::getInstance();
        $dateInfo = $this->getDateRangeFilters($params);

        $sql = "SELECT device_type,
                       COUNT(DISTINCT session_id) AS unique_visitors
                FROM visitor_logs
                WHERE {$dateInfo['sql']}
                GROUP BY device_type
                ORDER BY unique_visitors DESC";

        $stmt = $pdo->prepare($sql);
        foreach ($dateInfo['params'] as $key => $val) {
            $stmt->bindValue($key, $val, is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->execute();
        return [
            'success' => true,
            'data' => $stmt->fetchAll() ?: []
        ];
    }

    public function getSourceStats(int $limit = 10, array $params = []): array
    {
        $pdo = Database::getInstance();
        $dateInfo = $this->getDateRangeFilters($params);

        $sql = "SELECT
                    CASE
                        WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
                        WHEN referrer LIKE '%google.%' THEN 'Google'
                        WHEN referrer LIKE '%facebook.%' OR referrer LIKE '%fb.%' THEN 'Facebook'
                        WHEN referrer LIKE '%zalo.%' THEN 'Zalo'
                        WHEN referrer LIKE '%instagram.%' THEN 'Instagram'
                        WHEN referrer LIKE '%tiktok.%' THEN 'TikTok'
                        WHEN referrer LIKE '%youtube.%' THEN 'YouTube'
                        ELSE 'Referral'
                    END AS source,
                    COUNT(DISTINCT session_id) AS unique_visitors
                FROM visitor_logs
                WHERE {$dateInfo['sql']}
                GROUP BY source
                ORDER BY unique_visitors DESC
                LIMIT :limit";

        $stmt = $pdo->prepare($sql);
        foreach ($dateInfo['params'] as $key => $val) {
            $stmt->bindValue($key, $val, is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return [
            'success' => true,
            'data' => $stmt->fetchAll() ?: []
        ];
    }

    public function getSummary(array $params = []): array
    {
        $pdo = Database::getInstance();
        $dateInfo = $this->getDateRangeFilters($params);

        // 1. Total visits and unique visitors
        $sqlVis = "SELECT COUNT(*) AS total_visits,
                          COUNT(DISTINCT session_id) AS unique_visitors
                   FROM visitor_logs
                   WHERE {$dateInfo['sql']}";
        $stmtVis = $pdo->prepare($sqlVis);
        foreach ($dateInfo['params'] as $key => $val) {
            $stmtVis->bindValue($key, $val, is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmtVis->execute();
        $visitors = $stmtVis->fetch() ?: ['total_visits' => 0, 'unique_visitors' => 0];

        // 2. Page views
        $sqlViews = "SELECT COUNT(*) FROM page_view_events WHERE {$dateInfo['sql']}";
        $stmtViews = $pdo->prepare($sqlViews);
        foreach ($dateInfo['params'] as $key => $val) {
            $stmtViews->bindValue($key, $val, is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmtViews->execute();
        $pageViews = (int)$stmtViews->fetchColumn();

        // 3. Avg time on page
        $sqlTime = "SELECT AVG(time_on_page) FROM page_view_events WHERE exited_at IS NOT NULL AND {$dateInfo['sql']}";
        $stmtTime = $pdo->prepare($sqlTime);
        foreach ($dateInfo['params'] as $key => $val) {
            $stmtTime->bindValue($key, $val, is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmtTime->execute();
        $avgTime = round((float)$stmtTime->fetchColumn(), 2);

        // 4. Avg scroll depth
        $sqlScroll = "SELECT AVG(scroll_depth) FROM page_view_events WHERE exited_at IS NOT NULL AND {$dateInfo['sql']}";
        $stmtScroll = $pdo->prepare($sqlScroll);
        foreach ($dateInfo['params'] as $key => $val) {
            $stmtScroll->bindValue($key, $val, is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmtScroll->execute();
        $avgScroll = round((float)$stmtScroll->fetchColumn(), 2);

        $activeUsers = $this->sessionModel->getActiveCount(5);

        return [
            'success' => true,
            'data' => [
                'total_visits' => (int)($visitors['total_visits'] ?? 0),
                'unique_visitors' => (int)($visitors['unique_visitors'] ?? 0),
                'page_views' => $pageViews,
                'avg_time_on_page' => $avgTime,
                'avg_scroll_depth' => $avgScroll,
                'active_users' => $activeUsers,
            ],
        ];
    }

    public function getBusinessStats(array $params = []): array
    {
        $pdo = Database::getInstance();
        $dateInfo = $this->getDateRangeFilters($params);

        $sql = "SELECT COUNT(*) AS total_orders,
                       SUM(CASE WHEN status IN ('completed', 'processing', 'shipping') THEN total_amount ELSE 0 END) AS total_revenue
                FROM orders
                WHERE {$dateInfo['sql']}";

        $stmt = $pdo->prepare($sql);
        foreach ($dateInfo['params'] as $key => $val) {
            $stmt->bindValue($key, $val, is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->execute();
        $res = $stmt->fetch() ?: ['total_orders' => 0, 'total_revenue' => 0];

        $totalOrders = (int)$res['total_orders'];
        $totalRevenue = (float)$res['total_revenue'];
        $aov = $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0;

        return [
            'total_orders' => $totalOrders,
            'total_revenue' => $totalRevenue,
            'aov' => $aov
        ];
    }

    public function getTopViewedProducts(int $limit = 5, array $params = []): array
    {
        $pdo = Database::getInstance();
        $dateInfo = $this->getDateRangeFilters($params, 'pve');

        $sql = "SELECT p.id, p.name, p.slug, p.price, p.sale_price, p.images, p.sku,
                       COUNT(*) AS views,
                       COUNT(DISTINCT pve.session_id) AS unique_views
                FROM page_view_events pve
                INNER JOIN products p ON pve.page_url = CONCAT('/san-pham/', p.slug)
                WHERE {$dateInfo['sql']}
                GROUP BY p.id, p.name, p.slug, p.price, p.sale_price, p.images, p.sku
                ORDER BY views DESC
                LIMIT :limit";

        $stmt = $pdo->prepare($sql);
        foreach ($dateInfo['params'] as $key => $val) {
            $stmt->bindValue($key, $val, is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll() ?: [];

        foreach ($rows as &$row) {
            $row['images'] = $row['images'] ? json_decode($row['images'], true) : [];
        }
        return $rows;
    }

    public function getTopViewedCategories(array $params = []): array
    {
        $pdo = Database::getInstance();
        $dateInfo = $this->getDateRangeFilters($params);

        $sql = "SELECT 
                    CASE 
                        WHEN page_url LIKE '/nam%' THEN 'Nam'
                        WHEN page_url LIKE '/nu%' THEN 'Nữ'
                        WHEN page_url LIKE '/phu-kien%' THEN 'Phụ kiện'
                        WHEN page_url LIKE '/sale%' THEN 'Khuyến mãi'
                        ELSE 'Khác'
                    END AS name,
                    COUNT(*) AS count
                FROM page_view_events
                WHERE (page_url LIKE '/nam%' OR page_url LIKE '/nu%' OR page_url LIKE '/phu-kien%' OR page_url LIKE '/sale%')
                  AND {$dateInfo['sql']}
                GROUP BY name
                ORDER BY count DESC";

        $stmt = $pdo->prepare($sql);
        foreach ($dateInfo['params'] as $key => $val) {
            $stmt->bindValue($key, $val, is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->execute();
        return $stmt->fetchAll() ?: [];
    }

    public function getTopSearchKeywords(int $limit = 10, array $params = []): array
    {
        $pdo = Database::getInstance();
        $dateInfo = $this->getDateRangeFilters($params);

        $sql = "SELECT page_url
                FROM page_view_events
                WHERE page_url LIKE '%search=%'
                  AND {$dateInfo['sql']}";

        $stmt = $pdo->prepare($sql);
        foreach ($dateInfo['params'] as $key => $val) {
            $stmt->bindValue($key, $val, is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_COLUMN) ?: [];

        $keywords = [];
        foreach ($rows as $url) {
            $parsed = parse_url($url);
            if (!empty($parsed['query'])) {
                parse_str($parsed['query'], $queryParts);
                $q = trim($queryParts['search'] ?? '');
                if ($q !== '') {
                    $qLower = mb_strtolower($q, 'UTF-8');
                    if (!isset($keywords[$qLower])) {
                        $keywords[$qLower] = [
                            'name' => $q,
                            'count' => 0
                        ];
                    }
                    $keywords[$qLower]['count']++;
                }
            }
        }

        uasort($keywords, fn($a, $b) => $b['count'] <=> $a['count']);

        return array_slice(array_values($keywords), 0, $limit);
    }

    public function resolveCountry(string $ip): array
    {
        if ($ip === '127.0.0.1' || str_starts_with($ip, '192.168.') || str_starts_with($ip, '10.')) {
            return ['country_code' => 'VN', 'country_name' => 'Vietnam', 'city' => 'Local'];
        }

        $url = "http://ip-api.com/json/{$ip}?fields=status,country,countryCode,city";
        $ctx = stream_context_create(['http' => ['timeout' => 2]]);
        $response = @file_get_contents($url, false, $ctx);

        if ($response === false) {
            return ['country_code' => null, 'country_name' => null, 'city' => null];
        }

        $data = json_decode($response, true);
        if (!is_array($data) || ($data['status'] ?? '') !== 'success') {
            return ['country_code' => null, 'country_name' => null, 'city' => null];
        }

        return [
            'country_code' => $data['countryCode'] ?? null,
            'country_name' => $data['country'] ?? null,
            'city' => $data['city'] ?? null,
        ];
    }

    public function detectDevice(string $userAgent): string
    {
        $ua = strtolower($userAgent);
        if (preg_match('/tablet|ipad|playbook|silk/i', $ua)) {
            return 'tablet';
        }
        if (preg_match('/mobile|iphone|ipod|android|blackberry|windows phone/i', $ua)) {
            return 'mobile';
        }
        return 'desktop';
    }

    public function detectBrowser(string $userAgent): string
    {
        if (str_contains($userAgent, 'Firefox')) return 'Firefox';
        if (str_contains($userAgent, 'Edg')) return 'Edge';
        if (str_contains($userAgent, 'Chrome')) return 'Chrome';
        if (str_contains($userAgent, 'Safari')) return 'Safari';
        if (str_contains($userAgent, 'Opera')) return 'Opera';
        return 'Other';
    }
}
