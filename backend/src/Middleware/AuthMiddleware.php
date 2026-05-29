<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Config\Config;

class AuthMiddleware
{
    private static ?array $currentUser = null;

    /**
     * Decode a JWT token (HS256). Returns payload array or false.
     */
    public static function validateJWT(string $token): array|false
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
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
            return false;
        }

        $payloadJson = base64_decode(strtr($payloadB64, '-_', '+/'));
        if ($payloadJson === false) {
            return false;
        }

        $payload = json_decode($payloadJson, true);
        if (!is_array($payload)) {
            return false;
        }

        // Check expiry
        if (isset($payload['exp']) && $payload['exp'] < time()) {
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
        if (empty($header) && function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            if (isset($headers['Authorization'])) {
                $header = $headers['Authorization'];
            } elseif (isset($headers['authorization'])) {
                $header = $headers['authorization'];
            }
        }
        if (str_starts_with($header, 'Bearer ')) {
            return substr($header, 7);
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
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'error'   => 'Unauthorized. Valid Bearer token required.',
                'code'    => 401,
            ]);
            exit;
        }
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
