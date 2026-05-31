<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Config\Config;

class AuthMiddleware
{
    private static ?array $currentUser = null;
    private static ?string $lastValidationFailure = null;

    private static function maskSecret(?string $value): string
    {
        if ($value === null || $value === '') {
            return 'NOT SET';
        }
        return substr($value, 0, 30) . '...[redacted]';
    }

    /**
     * Decode a JWT token (HS256). Returns payload array or false.
     */
    public static function validateJWT(string $token): array|false
    {
        self::$lastValidationFailure = null;
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            self::$lastValidationFailure = 'Token structure invalid (must contain 3 parts).';
            return false;
        }

        [$headerB64, $payloadB64, $signatureB64] = $parts;

        $secret    = Config::get('JWT_SECRET', 'changeme');
        $expected  = hash_hmac(
            'sha256',
            "{$headerB64}.{$payloadB64}",
            $secret,
            true
        );
        $expectedB64 = rtrim(strtr(base64_encode($expected), '+/', '-_'), '=');

        if (!hash_equals($expectedB64, $signatureB64)) {
            self::$lastValidationFailure = 'Signature verification failed. Used Secret: ' . self::maskSecret($secret) . ', Expected Sig: ' . $expectedB64 . ', Got Sig: ' . $signatureB64;
            return false;
        }

        $payloadJson = base64_decode(strtr($payloadB64, '-_', '+/'));
        if ($payloadJson === false) {
            self::$lastValidationFailure = 'Base64 decode of payload failed.';
            return false;
        }

        $payload = json_decode($payloadJson, true);
        if (!is_array($payload)) {
            self::$lastValidationFailure = 'JSON decode of payload failed.';
            return false;
        }

        // Check expiry
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            self::$lastValidationFailure = 'Token has expired at ' . date('Y-m-d H:i:s', $payload['exp']) . '. Current time: ' . date('Y-m-d H:i:s');
            return false;
        }

        return $payload;
    }

    /**
     * Generate a HS256 JWT token.
     */
    public static function generateJWT(array $payload, int $ttl = 86400): string
    {
        $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $header = rtrim(strtr($header, '+/', '-_'), '=');

        $payload['iat'] = time();
        $payload['exp'] = time() + $ttl;

        $payloadB64 = base64_encode(json_encode($payload));
        $payloadB64 = rtrim(strtr($payloadB64, '+/', '-_'), '=');

        $secret    = Config::get('JWT_SECRET', 'changeme');
        $signature = hash_hmac('sha256', "{$header}.{$payloadB64}", $secret, true);
        $sigB64    = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');

        return "{$header}.{$payloadB64}.{$sigB64}";
    }

    /**
     * Extract token from Authorization header.
     */
    public static function getBearerToken(): ?string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        
        // Also check custom X-Authorization header to prevent Apache CGI stripping issues
        if (empty($header)) {
            $header = $_SERVER['HTTP_X_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_X_AUTHORIZATION'] ?? '';
        }

        if (empty($header) && function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            if (isset($headers['Authorization'])) {
                $header = $headers['Authorization'];
            } elseif (isset($headers['authorization'])) {
                $header = $headers['authorization'];
            } elseif (isset($headers['X-Authorization'])) {
                $header = $headers['X-Authorization'];
            } elseif (isset($headers['x-authorization'])) {
                $header = $headers['x-authorization'];
            }
        }

        if (str_starts_with($header, 'Bearer ')) {
            return substr($header, 7);
        }

        // Fallback to cookies for session preservation
        $uri = $_SERVER['REQUEST_URI'] ?? '';
        if (str_contains($uri, '/api/admin')) {
            if (isset($_COOKIE['dhat_auth_token'])) {
                return $_COOKIE['dhat_auth_token'];
            }
            if (isset($_COOKIE['venix_auth_token'])) {
                return $_COOKIE['venix_auth_token'];
            }
        }

        if (isset($_COOKIE['dhat_auth_token'])) {
            return $_COOKIE['dhat_auth_token'];
        }
        if (isset($_COOKIE['venix_auth_token'])) {
            return $_COOKIE['venix_auth_token'];
        }

        return null;
    }

    /**
     * Get the authenticated user from JWT. Caches result.
     */
    public static function getUser(): ?array
    {
        if (self::$currentUser !== null) {
            return self::$currentUser;
        }
        $token = self::getBearerToken();
        if (!$token) {
            return null;
        }
        $payload = self::validateJWT($token);
        if (!$payload) {
            return null;
        }
        self::$currentUser = $payload;
        return $payload;
    }

    /**
     * Require authentication; returns payload or sends 401.
     */
    public static function requireAuth(): array
    {
        $user = self::getUser();
        if (!$user) {
            $token = self::getBearerToken();
            $logMsg = date('[Y-m-d H:i:s] ') . $_SERVER['REQUEST_METHOD'] . ' ' . ($_SERVER['REQUEST_URI'] ?? '') . " -> AUTH FAILED (401)\n";
            $logMsg .= " - Token Extracted: " . self::maskSecret($token) . "\n";
            if (self::$lastValidationFailure) {
                $logMsg .= " - Failure Reason: " . self::$lastValidationFailure . "\n";
            }
            $logMsg .= " - Cookie dhat_auth_token: " . self::maskSecret($_COOKIE['dhat_auth_token'] ?? '') . "\n";
            $logMsg .= " - Cookie venix_auth_token: " . self::maskSecret($_COOKIE['venix_auth_token'] ?? '') . "\n";
            @file_put_contents(dirname(__DIR__, 2) . '/storage/auth_debug.log', $logMsg, FILE_APPEND);

            http_response_code(401);
            echo json_encode([
                'success' => false,
                'error'   => 'Yêu cầu xác thực tài khoản. Vui lòng đăng nhập lại.',
                'code'    => 401,
            ]);
            exit;
        }

        $logMsg = date('[Y-m-d H:i:s] ') . ($_SERVER['REQUEST_METHOD'] ?? 'CLI') . ' ' . ($_SERVER['REQUEST_URI'] ?? '') . " -> AUTH SUCCESS\n";
        $logMsg .= " - User ID: " . ($user['user_id'] ?? 'NULL') . ", Roles: " . implode(',', $user['roles'] ?? []) . "\n";
        @file_put_contents(dirname(__DIR__, 2) . '/storage/auth_debug.log', $logMsg, FILE_APPEND);

        return $user;
    }

    /**
     * Reset cached user (useful for tests).
     */
    public static function reset(): void
    {
        self::$currentUser = null;
    }
}
