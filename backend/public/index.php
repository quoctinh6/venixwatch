<?php

declare(strict_types=1);

// ============================================================
// Bootstrap
// ============================================================

define('BASE_DIR', dirname(__DIR__));

// Autoload (Composer PSR-4 or manual fallback)
$autoload = BASE_DIR . '/vendor/autoload.php';
if (file_exists($autoload)) {
    require_once $autoload;
} else {
    // Manual PSR-4 fallback (no Composer installed yet)
    spl_autoload_register(function (string $class): void {
        $prefix = 'App\\';
        $base   = BASE_DIR . '/src/';
        if (!str_starts_with($class, $prefix)) return;
        $relative = substr($class, strlen($prefix));
        $file     = $base . str_replace('\\', '/', $relative) . '.php';
        if (file_exists($file)) require_once $file;
    });

    // Also load config classes
    spl_autoload_register(function (string $class): void {
        $prefix = 'App\\Config\\';
        $base   = BASE_DIR . '/config/';
        if (!str_starts_with($class, $prefix)) return;
        $relative = substr($class, strlen($prefix));
        $file     = $base . $relative . '.php';
        if (file_exists($file)) require_once $file;
    });
}

use App\Config\Config;

Config::load(BASE_DIR . '/.env');

// ============================================================
// CORS Headers
// ============================================================

$origin  = Config::get('CORS_ORIGIN', '*');
$appEnv  = Config::get('APP_ENV', 'development');

header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: {$origin}");
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Cart-Session');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ============================================================
// Error Handling — always JSON
// ============================================================

set_exception_handler(function (Throwable $e) use ($appEnv): void {
    $code = (int)$e->getCode();
    if ($code < 100 || $code > 599) $code = 500;
    http_response_code($code ?: 500);
    $body = ['success' => false, 'error' => 'Internal server error.', 'code' => $code ?: 500];
    if ($appEnv === 'development') {
        $body['debug'] = ['message' => $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine()];
    }
    echo json_encode($body);
});

set_error_handler(function (int $errno, string $errstr, string $errfile, int $errline): bool {
    throw new \ErrorException($errstr, 500, $errno, $errfile, $errline);
});

// ============================================================
// Router
// ============================================================

$method = $_SERVER['REQUEST_METHOD'];
$path   = $_SERVER['PATH_INFO'] ?? parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path   = rtrim($path, '/') ?: '/';

// Support running in subdirectory (e.g. /dong-ho-a-tuan/backend/public)
$scriptDir = dirname($_SERVER['SCRIPT_NAME']);
$scriptDir = str_replace('\\', '/', $scriptDir);
$scriptDir = rtrim($scriptDir, '/');
if (!empty($scriptDir) && str_starts_with($path, $scriptDir)) {
    $path = substr($path, strlen($scriptDir)) ?: '/';
}

// Strip /api prefix if routed with it
if (str_starts_with($path, '/api')) {
    $path = substr($path, 4) ?: '/';
}

/**
 * Route matching helper.
 * Returns ['matched' => true, 'params' => [...]] or ['matched' => false]
 */
function matchRoute(string $pattern, string $path): array
{
    $regex = preg_replace('/\{([a-z_]+)\}/', '([^/]+)', $pattern);
    $regex = '#^' . $regex . '$#';
    if (preg_match($regex, $path, $matches)) {
        array_shift($matches);
        return ['matched' => true, 'params' => $matches];
    }
    return ['matched' => false, 'params' => []];
}

function dispatch(string $method, string $path): void
{
    $routes = [
        // ---- AUTH ----
        ['POST', '/auth/login',    'App\Controllers\Auth\AuthController',    'login'],
        ['POST', '/auth/register', 'App\Controllers\Auth\AuthController',    'register'],
        ['POST', '/auth/logout',   'App\Controllers\Auth\AuthController',    'logout'],
        ['POST', '/auth/refresh',  'App\Controllers\Auth\AuthController',    'refresh'],

        // ---- ANALYTICS (public) ----
        ['POST', '/analytics/visit',  'App\Controllers\Analytics\AnalyticsController', 'visit'],
        ['POST', '/analytics/ping',   'App\Controllers\Analytics\AnalyticsController', 'ping'],
        ['POST', '/analytics/exit',   'App\Controllers\Analytics\AnalyticsController', 'exit'],
        ['GET',  '/analytics/active', 'App\Controllers\Analytics\AnalyticsController', 'active'],
        ['POST', '/newsletter/subscribe', 'App\Controllers\Public\NewsletterController', 'subscribe'],

        // ---- PUBLIC PRODUCTS ----
        ['GET', '/products/featured',       'App\Controllers\Public\ProductController', 'featured'],
        ['GET', '/products/{id}/images',    'App\Controllers\Public\ProductController', 'images'],
        ['GET', '/products/{id}/specs',     'App\Controllers\Public\ProductController', 'specs'],
        ['GET', '/products/{id}/reviews',   'App\Controllers\Public\ReviewController', 'index'],
        ['POST', '/products/{id}/reviews',  'App\Controllers\Public\ReviewController', 'store'],
        ['GET', '/reviews/{id}/can-review', 'App\Controllers\Public\ReviewController', 'canReview'],
        ['GET', '/products/{id}/questions', 'App\Controllers\Public\QuestionController', 'index'],
        ['POST', '/products/{id}/questions','App\Controllers\Public\QuestionController', 'store'],
        ['GET', '/products/{id}/related',   'App\Controllers\Public\ProductController', 'related'],
        ['GET', '/products/{id}/cross-sell','App\Controllers\Public\ProductController', 'crossSell'],
        ['POST', '/products/{id}/view',     'App\Controllers\Public\ProductController', 'trackView'],
        ['GET', '/products/{slug}',         'App\Controllers\Public\ProductController', 'show'],
        ['GET', '/products',                'App\Controllers\Public\ProductController', 'index'],
        ['GET', '/recently-viewed',         'App\Controllers\Public\ProductController', 'recentlyViewed'],

        // ---- PUBLIC BRANDS ----
        ['GET', '/brands/top',           'App\Controllers\Public\BrandController', 'top'],

        // ---- PUBLIC CATEGORIES ----
        ['GET', '/categories/{slug}',    'App\Controllers\Public\CategoryController', 'show'],
        ['GET', '/categories',           'App\Controllers\Public\CategoryController', 'index'],

        // ---- PUBLIC CART ----
        ['GET',    '/cart',             'App\Controllers\Public\CartController', 'index'],
        ['POST',   '/cart',             'App\Controllers\Public\CartController', 'store'],
        ['PUT',    '/cart/{id}',        'App\Controllers\Public\CartController', 'update'],
        ['DELETE', '/cart/clear',       'App\Controllers\Public\CartController', 'clear'],
        ['DELETE', '/cart/{id}',        'App\Controllers\Public\CartController', 'destroy'],

        // ---- PUBLIC ORDERS ----
        ['GET', '/orders',  'App\Controllers\Public\OrderController', 'index'],
        ['POST', '/orders', 'App\Controllers\Public\OrderController', 'store'],

        // ---- ADMIN DASHBOARD ----
        ['GET', '/admin/dashboard/stats', 'App\Modules\Admin\Dashboard\DashboardController', 'stats'],
        ['GET', '/admin/visitors',        'App\Modules\Admin\Analytics\AnalyticsController', 'index'],

        // ---- ADMIN USERS ----
        ['GET',    '/admin/users',                    'App\Modules\Admin\User\UserController', 'index'],
        ['POST',   '/admin/users',                    'App\Modules\Admin\User\UserController', 'store'],
        ['GET',    '/admin/users/{id}',               'App\Modules\Admin\User\UserController', 'show'],
        ['PUT',    '/admin/users/{id}',               'App\Modules\Admin\User\UserController', 'update'],
        ['DELETE', '/admin/users/{id}',               'App\Modules\Admin\User\UserController', 'destroy'],
        ['GET',    '/admin/users/{id}/roles',         'App\Modules\Admin\User\UserController', 'getRoles'],
        ['POST',   '/admin/users/{id}/roles',         'App\Modules\Admin\User\UserController', 'assignRole'],
        ['DELETE', '/admin/users/{id}/roles/{roleId}','App\Modules\Admin\User\UserController', 'removeRole'],

        // ---- ADMIN IMAGES ----
        ['POST',   '/admin/images/upload',    'App\Modules\Admin\Image\ImageController', 'upload'],
        ['GET',    '/admin/images',           'App\Modules\Admin\Image\ImageController', 'index'],
        ['DELETE', '/admin/images/{filename}','App\Modules\Admin\Image\ImageController', 'destroy'],

        // ---- ADMIN PRODUCTS ----
        ['GET',    '/admin/products/low-stock',        'App\Modules\Admin\Product\ProductController', 'lowStock'],
        ['POST',   '/admin/products/compute-badges',   'App\Modules\Admin\Product\ProductController', 'computeBadges'],
        ['GET',    '/admin/products',                  'App\Modules\Admin\Product\ProductController', 'index'],
        ['POST',   '/admin/products',                  'App\Modules\Admin\Product\ProductController', 'store'],
        ['GET',    '/admin/products/{id}',             'App\Modules\Admin\Product\ProductController', 'show'],
        ['PUT',    '/admin/products/{id}',             'App\Modules\Admin\Product\ProductController', 'update'],
        ['DELETE', '/admin/products/{id}',             'App\Modules\Admin\Product\ProductController', 'destroy'],
        ['PATCH',  '/admin/products/{id}/toggle',      'App\Modules\Admin\Product\ProductController', 'toggle'],

        // ---- ADMIN CATEGORIES ----
        ['GET',    '/admin/categories',      'App\Modules\Admin\Category\CategoryController', 'index'],
        ['POST',   '/admin/categories',      'App\Modules\Admin\Category\CategoryController', 'store'],
        ['GET',    '/admin/categories/{id}', 'App\Modules\Admin\Category\CategoryController', 'show'],
        ['PUT',    '/admin/categories/{id}', 'App\Modules\Admin\Category\CategoryController', 'update'],
        ['DELETE', '/admin/categories/{id}', 'App\Modules\Admin\Category\CategoryController', 'destroy'],

        // ---- ADMIN SUBCATEGORIES ----
        ['GET',    '/admin/subcategories',      'App\Modules\Admin\Subcategory\SubcategoryController', 'index'],
        ['POST',   '/admin/subcategories',      'App\Modules\Admin\Subcategory\SubcategoryController', 'store'],
        ['GET',    '/admin/subcategories/{id}', 'App\Modules\Admin\Subcategory\SubcategoryController', 'show'],
        ['PUT',    '/admin/subcategories/{id}', 'App\Modules\Admin\Subcategory\SubcategoryController', 'update'],
        ['DELETE', '/admin/subcategories/{id}', 'App\Modules\Admin\Subcategory\SubcategoryController', 'destroy'],

        // ---- ADMIN BRANDS ----
        ['GET',    '/admin/brands',      'App\Modules\Admin\Brand\BrandController', 'index'],
        ['POST',   '/admin/brands',      'App\Modules\Admin\Brand\BrandController', 'store'],
        ['GET',    '/admin/brands/{id}', 'App\Modules\Admin\Brand\BrandController', 'show'],
        ['PUT',    '/admin/brands/{id}', 'App\Modules\Admin\Brand\BrandController', 'update'],
        ['DELETE', '/admin/brands/{id}', 'App\Modules\Admin\Brand\BrandController', 'destroy'],

        // ---- ADMIN ORDERS ----
        ['GET', '/admin/orders/stats',       'App\Modules\Admin\Order\OrderController', 'stats'],
        ['GET', '/admin/orders',             'App\Modules\Admin\Order\OrderController', 'index'],
        ['GET', '/admin/orders/{id}',        'App\Modules\Admin\Order\OrderController', 'show'],
        ['PUT', '/admin/orders/{id}/status', 'App\Modules\Admin\Order\OrderController', 'updateStatus'],

        // ---- ADMIN WARRANTIES ----
        ['GET',  '/admin/warranties',      'App\Modules\Admin\Warranty\WarrantyController', 'index'],
        ['POST', '/admin/warranties',      'App\Modules\Admin\Warranty\WarrantyController', 'store'],
        ['GET',  '/admin/warranties/{id}', 'App\Modules\Admin\Warranty\WarrantyController', 'show'],
        ['PUT',  '/admin/warranties/{id}', 'App\Modules\Admin\Warranty\WarrantyController', 'update'],
        ['DELETE', '/admin/warranties/{id}', 'App\Modules\Admin\Warranty\WarrantyController', 'destroy'],

        // ---- ADMIN FLASH SALES ----
        ['GET',    '/admin/flash-sales',      'App\Modules\Admin\FlashSale\FlashSaleController', 'index'],
        ['POST',   '/admin/flash-sales',      'App\Modules\Admin\FlashSale\FlashSaleController', 'store'],
        ['GET',    '/admin/flash-sales/{id}', 'App\Modules\Admin\FlashSale\FlashSaleController', 'show'],
        ['PUT',    '/admin/flash-sales/{id}', 'App\Modules\Admin\FlashSale\FlashSaleController', 'update'],
        ['DELETE', '/admin/flash-sales/{id}', 'App\Modules\Admin\FlashSale\FlashSaleController', 'destroy'],

        // ---- ADMIN ROLES ----
        ['GET',    '/admin/roles',                        'App\Modules\Admin\Role\RoleController', 'index'],
        ['POST',   '/admin/roles',                        'App\Modules\Admin\Role\RoleController', 'store'],
        ['GET',    '/admin/roles/{id}',                   'App\Modules\Admin\Role\RoleController', 'show'],
        ['PUT',    '/admin/roles/{id}',                   'App\Modules\Admin\Role\RoleController', 'update'],
        ['DELETE', '/admin/roles/{id}',                   'App\Modules\Admin\Role\RoleController', 'destroy'],
        ['POST',   '/admin/roles/{id}/permissions',       'App\Modules\Admin\Role\RoleController', 'assignPermission'],
        ['PUT',    '/admin/roles/{id}/permissions',       'App\Modules\Admin\Role\RoleController', 'syncPermissions'],
        ['DELETE', '/admin/roles/{id}/permissions/{pid}', 'App\Modules\Admin\Role\RoleController', 'removePermission'],
        ['GET',    '/admin/permissions',                  'App\Modules\Admin\Role\RoleController', 'permissions'],

        // ---- SYSTEM SETTINGS ----
        ['GET',    '/settings',                           'App\Modules\Admin\Settings\SettingController', 'index'],
        ['GET',    '/admin/settings/history',             'App\Modules\Admin\Settings\SettingController', 'history'],
        ['PUT',    '/admin/settings',                     'App\Modules\Admin\Settings\SettingController', 'update'],
        ['POST',   '/admin/settings/upload-logo',         'App\Modules\Admin\Settings\SettingController', 'uploadLogo'],
        ['POST',   '/admin/settings/upload-banner',       'App\Modules\Admin\Settings\SettingController', 'uploadBanner'],
    ];

    $methodMatches = false;

    foreach ($routes as [$routeMethod, $pattern, $class, $action]) {
        $match = matchRoute($pattern, $path);
        if (!$match['matched']) continue;

        $methodMatches = true;

        if ($method !== $routeMethod) continue;

        // Instantiate and call
        $controller = new $class();
        $params     = $match['params'];

        // Cast numeric params
        $params = array_map(fn($p) => ctype_digit($p) ? (int)$p : $p, $params);

        $controller->$action(...$params);
        return;
    }

    if ($methodMatches) {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed.', 'code' => 405]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Endpoint not found.', 'code' => 404]);
    }
}

dispatch($method, $path);
