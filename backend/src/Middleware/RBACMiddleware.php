<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Config\Database;
use App\Models\Role;

class RBACMiddleware
{
    /**
     * Require authenticated user to have the given permission.
     * Exits with 403 JSON if check fails.
     */
    public static function require(string $permission): array
    {
        // First ensure user is authenticated
        $user = AuthMiddleware::requireAuth();

        $userId = (int)($user['user_id'] ?? 0);
        if ($userId === 0) {
            self::forbidden('Payload của token không hợp lệ.');
        }

        if (!self::userHasPermission($userId, $permission)) {
            self::forbidden("Không có quyền truy cập. Yêu cầu quyền: {$permission}");
        }

        return $user;
    }

    /**
     * Require authenticated user to have ANY of the given permissions.
     */
    public static function requireAny(array $permissions): array
    {
        $user   = AuthMiddleware::requireAuth();
        $userId = (int)($user['user_id'] ?? 0);

        if ($userId === 0) {
            self::forbidden('Payload của token không hợp lệ.');
        }

        $userPermissions = self::getUserPermissions($userId);

        foreach ($permissions as $perm) {
            if (in_array($perm, $userPermissions, true)) {
                return $user;
            }
        }

        self::forbidden('Không có quyền truy cập. Yêu cầu một trong các quyền: ' . implode(', ', $permissions));
        return $user; // unreachable, satisfies static analysis
    }

    /**
     * Check if user has a specific permission without exiting.
     */
    public static function userHasPermission(int $userId, string $permission): bool
    {
        $permissions = self::getUserPermissions($userId);
        return in_array($permission, $permissions, true);
    }

    /**
     * Get all permissions for a user (via their roles).
     */
    public static function getUserPermissions(int $userId): array
    {
        $pdo  = Database::getInstance();
        $role = new Role($pdo);
        return $role->getUserPermissions($userId);
    }

    /**
     * Send 403 JSON and exit.
     */
    private static function forbidden(string $message): never
    {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error'   => $message,
            'code'    => 403,
        ]);
        exit;
    }
}
