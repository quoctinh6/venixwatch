<?php

declare(strict_types=1);

namespace App\Modules\Admin\Analytics;

use App\Middleware\RBACMiddleware;

class AnalyticsController
{
    private AnalyticsService $service;

    public function __construct()
    {
        $this->service = new AnalyticsService();
    }

    public function index(): void
    {
        RBACMiddleware::require('analytics:read');
        
        $days = max(1, min(365, (int)($_GET['days'] ?? 30)));
        $startDate = !empty($_GET['start_date']) ? (string)$_GET['start_date'] : null;
        $endDate = !empty($_GET['end_date']) ? (string)$_GET['end_date'] : null;

        $params = [
            'days' => $days,
            'start_date' => $startDate,
            'end_date' => $endDate,
        ];

        $daily = $this->service->getVisitorsChart($params)['data'] ?? [];
        $countries = $this->service->getCountryStats(8, $params)['data'] ?? [];
        $cities = $this->service->getCityStats(8, $params)['data'] ?? [];
        $devices = $this->service->getDeviceStats($params)['data'] ?? [];
        $sources = $this->service->getSourceStats(8, $params)['data'] ?? [];
        $topPages = $this->service->getTopPages(10, $params)['data'] ?? [];
        $summary = $this->service->getSummary($params)['data'] ?? [];
        
        // Advanced business and custom charts data
        $business = $this->service->getBusinessStats($params);
        $topProducts = $this->service->getTopViewedProducts(8, $params);
        $topCategories = $this->service->getTopViewedCategories($params);
        $topSearches = $this->service->getTopSearchKeywords(10, $params);

        $this->respond([
            'success' => true,
            'data' => [
                'summary' => [
                    'total_visits' => (int)($summary['total_visits'] ?? 0),
                    'unique_visitors' => (int)($summary['unique_visitors'] ?? 0),
                    'page_views' => (int)($summary['page_views'] ?? 0),
                    'avg_time_on_page' => (float)($summary['avg_time_on_page'] ?? 0),
                    'avg_scroll_depth' => (float)($summary['avg_scroll_depth'] ?? 0),
                    'active_users' => (int)($summary['active_users'] ?? 0),
                    'total_orders' => (int)($business['total_orders'] ?? 0),
                    'total_revenue' => (float)($business['total_revenue'] ?? 0),
                    'aov' => (float)($business['aov'] ?? 0),
                ],
                'daily_visitors' => array_map(fn($row) => [
                    'date' => $row['date'],
                    'count' => (int)($row['unique_visitors'] ?? $row['total_visits'] ?? 0),
                ], $daily),
                'countries' => array_map(fn($row) => [
                    'name' => $row['country_name'] ?: 'Khác',
                    'count' => (int)($row['unique_visitors'] ?? 0),
                ], $countries),
                'cities' => array_map(fn($row) => [
                    'name' => trim(($row['city'] ?? '') . (($row['country_name'] ?? '') ? ', ' . $row['country_name'] : ''), ', '),
                    'count' => (int)($row['unique_visitors'] ?? 0),
                ], $cities),
                'devices' => $this->formatDevices($devices),
                'sources' => array_map(fn($row) => [
                    'name' => $row['source'] ?? 'Direct',
                    'count' => (int)($row['unique_visitors'] ?? 0),
                ], $sources),
                'top_pages' => array_map(fn($row) => [
                    'page' => $row['page_url'] ?? '/',
                    'views' => (int)($row['views'] ?? 0),
                    'users' => (int)($row['unique_views'] ?? 0),
                    'avg_time' => (int)($row['avg_time'] ?? 0),
                    'avg_scroll' => (int)($row['avg_scroll'] ?? 0),
                ], $topPages),
                'top_products' => $topProducts,
                'top_categories' => $topCategories,
                'top_searches' => $topSearches,
            ],
            'meta' => [
                'is_hourly' => ($startDate && $endDate && $startDate === $endDate)
            ]
        ]);
    }

    private function formatDevices(array $rows): array
    {
        $devices = ['desktop' => 0, 'mobile' => 0, 'tablet' => 0];
        foreach ($rows as $row) {
            $type = $row['device_type'] ?? '';
            if (isset($devices[$type])) {
                $devices[$type] = (int)($row['unique_visitors'] ?? 0);
            }
        }
        return $devices;
    }

    private function respond(array $result, int $successCode = 200): void
    {
        if (!($result['success'] ?? false)) {
            http_response_code($result['code'] ?? 400);
            echo json_encode(['success' => false, 'error' => $result['error'] ?? 'Error', 'code' => $result['code'] ?? 400]);
            return;
        }
        http_response_code($successCode);
        echo json_encode(['success' => true, 'data' => $result['data'] ?? null, 'meta' => $result['meta'] ?? null]);
    }
}
