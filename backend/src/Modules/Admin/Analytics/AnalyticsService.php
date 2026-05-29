<?php

declare(strict_types=1);

namespace App\Modules\Admin\Analytics;

use App\Config\Database;
use App\Models\VisitorLog;
use App\Models\PageViewEvent;
use App\Models\PageSession;
use App\Models\Order;
use App\Models\Product;

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

    public function getVisitorsChart(int $days = 30): array
    {
        $to = date('Y-m-d');
        $from = date('Y-m-d', strtotime("-{$days} days"));
        $data = $this->visitorModel->getByDateRange($from, $to);

        return ['success' => true, 'data' => $data];
    }

    public function getTopPages(int $limit = 10, int $days = 30): array
    {
        return [
            'success' => true,
            'data' => $this->pageViewModel->getTopPages($limit, $days),
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

    public function getCountryStats(int $limit = 10, int $days = 30): array
    {
        return [
            'success' => true,
            'data' => $this->visitorModel->getByCountry($limit, $days),
        ];
    }

    public function getCityStats(int $limit = 10, int $days = 30): array
    {
        return [
            'success' => true,
            'data' => $this->visitorModel->getByCity($limit, $days),
        ];
    }

    public function getDeviceStats(int $days = 30): array
    {
        return [
            'success' => true,
            'data' => $this->visitorModel->getDeviceSplit($days),
        ];
    }

    public function getSourceStats(int $limit = 10, int $days = 30): array
    {
        return [
            'success' => true,
            'data' => $this->visitorModel->getSourceSplit($limit, $days),
        ];
    }

    public function getSummary(int $days = 30): array
    {
        $visitors = $this->visitorModel->getSummary($days);
        $activeUsers = $this->sessionModel->getActiveCount(5);

        return [
            'success' => true,
            'data' => [
                'total_visits' => (int)($visitors['total_visits'] ?? 0),
                'unique_visitors' => (int)($visitors['unique_visitors'] ?? 0),
                'page_views' => $this->pageViewModel->getTotalViews($days),
                'avg_time_on_page' => $this->pageViewModel->getAvgTimeOnPage($days),
                'avg_scroll_depth' => $this->pageViewModel->getAvgScrollDepth($days),
                'active_users' => $activeUsers,
            ],
        ];
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
