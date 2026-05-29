<?php

declare(strict_types=1);

namespace App\Controllers\Analytics;

use App\Config\Database;
use App\Models\VisitorLog;
use App\Models\PageViewEvent;
use App\Models\PageSession;
use App\Modules\Admin\Analytics\AnalyticsService;

class AnalyticsController
{
    private VisitorLog      $visitorModel;
    private PageViewEvent   $pageModel;
    private PageSession     $sessionModel;
    private AnalyticsService $analyticsService;

    public function __construct()
    {
        $pdo                    = Database::getInstance();
        $this->visitorModel     = new VisitorLog($pdo);
        $this->pageModel        = new PageViewEvent($pdo);
        $this->sessionModel     = new PageSession($pdo);
        $this->analyticsService = new AnalyticsService();
    }

    /**
     * POST /api/analytics/visit
     * Records a new visitor session + page view.
     */
    public function visit(): void
    {
        $data      = $this->body();
        $sessionId = $data['session_id'] ?? $this->generateSessionId();
        $ip        = $this->getClientIp();
        $ua        = $_SERVER['HTTP_USER_AGENT'] ?? '';

        // Only log new sessions
        if (!$this->visitorModel->sessionExists($sessionId)) {
            $geo = $this->analyticsService->resolveCountry($ip);
            $this->visitorModel->create([
                'session_id'   => $sessionId,
                'ip_address'   => $ip,
                'country_code' => $geo['country_code'],
                'country_name' => $geo['country_name'],
                'city'         => $geo['city'],
                'device_type'  => $this->analyticsService->detectDevice($ua),
                'browser'      => $this->analyticsService->detectBrowser($ua),
                'referrer'     => $data['referrer']     ?? null,
                'landing_page' => $data['page_url']     ?? null,
            ]);
        }

        // Always record page view
        $viewId = $this->pageModel->create([
            'session_id'   => $sessionId,
            'page_url'     => $data['page_url']   ?? '/',
            'page_title'   => $data['page_title'] ?? null,
            'time_on_page' => 0,
            'scroll_depth' => 0,
        ]);

        // Upsert active session
        $this->sessionModel->upsert($sessionId, $data['page_url'] ?? '/');

        $this->respond([
            'success' => true,
            'data'    => ['session_id' => $sessionId, 'view_id' => $viewId],
        ]);
    }

    /**
     * POST /api/analytics/ping
     * Heartbeat to keep session alive & update current page.
     */
    public function ping(): void
    {
        $data      = $this->body();
        $sessionId = $data['session_id'] ?? '';
        $page      = $data['page_url']   ?? '';

        if (empty($sessionId)) {
            $this->respond(['success' => false, 'error' => 'session_id required.', 'code' => 400]);
            return;
        }

        $this->sessionModel->upsert($sessionId, $page);
        $this->respond(['success' => true, 'data' => ['ok' => true]]);
    }

    /**
     * POST /api/analytics/exit
     * Called when user leaves a page (beforeunload / visibilitychange).
     */
    public function exit(): void
    {
        $data        = $this->body();
        $viewId      = (int)($data['view_id']      ?? 0);
        $timeOnPage  = (int)($data['time_on_page'] ?? 0);
        $scrollDepth = (int)($data['scroll_depth'] ?? 0);

        if ($viewId > 0) {
            $this->pageModel->updateOnExit($viewId, $timeOnPage, $scrollDepth);
        }

        $this->respond(['success' => true, 'data' => ['ok' => true]]);
    }

    /**
     * GET /api/analytics/active
     * Returns count of active users (no auth — public endpoint).
     */
    public function active(): void
    {
        $minutes = (int)($_GET['minutes'] ?? 5);
        $count   = $this->sessionModel->getActiveCount($minutes);
        $this->respond(['success' => true, 'data' => ['active_users' => $count]]);
    }

    private function generateSessionId(): string
    {
        return bin2hex(random_bytes(16));
    }

    private function getClientIp(): string
    {
        $headers = [
            'HTTP_CF_CONNECTING_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'REMOTE_ADDR',
        ];
        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = explode(',', $_SERVER[$header])[0];
                return trim($ip);
            }
        }
        return '0.0.0.0';
    }

    private function body(): array
    {
        $raw = file_get_contents('php://input');
        return $raw ? (json_decode($raw, true) ?? []) : [];
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
