<?php
/**
 * API bootstrap
 * - Sets JSON content type
 * - Handles CORS (with credentials for cross-origin admin panel)
 * - Provides response helpers, DB shortcut, IP detection, rate limiting
 */

require_once __DIR__ . '/database.php';

// ─── CORS ───
// Credentials (cookies) require an exact origin — cannot use *.
// Allow dev + a configurable production origin.
$allowedOrigins = [
    'http://localhost:5173',  // Vite dev server
    'http://localhost:3000',  // alt local port
    'http://localhost',       // same-origin via FlyEnv
    'http://127.0.0.1',
    'http://127.0.0.1:5173',
];

// In production the admin panel is served from the same origin as the API, so
// this only matters if APP_URL is ever set to a different host. Comma-separated
// values are supported for apex + www.
foreach (explode(',', (string) env('APP_URL', '')) as $configuredOrigin) {
    $configuredOrigin = rtrim(trim($configuredOrigin), '/');
    if ($configuredOrigin !== '') {
        $allowedOrigins[] = $configuredOrigin;
    }
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ─── Response helpers ───

function jsonResponse(mixed $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function jsonError(string $message, int $status = 400, array $errors = []): void
{
    $response = ['error' => true, 'message' => $message];
    if (!empty($errors)) {
        $response['errors'] = $errors;
    }
    jsonResponse($response, $status);
}

function jsonSuccess(string $message, array $data = [], int $status = 200): void
{
    $response = ['error' => false, 'message' => $message];
    if (!empty($data)) {
        $response = array_merge($response, $data);
    }
    jsonResponse($response, $status);
}

function getJsonBody(): array
{
    $raw  = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function validateRequired(array $data, array $fields): array
{
    $missing = [];
    foreach ($fields as $field) {
        if (!isset($data[$field]) || trim((string)$data[$field]) === '') {
            $missing[] = $field;
        }
    }
    return $missing;
}

function sanitize(string $value): string
{
    return htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
}

// db() is defined in database.php, which is required at the top of this file.

// ─── Client IP (proxy-aware) ───

function getClientIp(): string
{
    $headers = [
        'HTTP_CF_CONNECTING_IP',
        'HTTP_X_FORWARDED_FOR',
        'HTTP_X_REAL_IP',
        'REMOTE_ADDR',
    ];
    foreach ($headers as $header) {
        if (!empty($_SERVER[$header])) {
            $ip = trim(explode(',', $_SERVER[$header])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
    }
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

// ─── Rate limiter (IP-based, DB-backed) ───

function checkRateLimit(string $ip, string $endpoint, int $window, int $max): void
{
    $pdo = db();

    $pdo->exec('
        CREATE TABLE IF NOT EXISTS `rate_limits` (
            `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `ip_address` VARCHAR(45)  NOT NULL,
            `endpoint`   VARCHAR(50)  NOT NULL,
            `hit_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            INDEX `idx_ip_endpoint_time` (`ip_address`, `endpoint`, `hit_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ');

    // Purge expired
    $pdo->prepare(
        'DELETE FROM `rate_limits` WHERE `endpoint` = :ep AND `hit_at` < DATE_SUB(NOW(), INTERVAL :win SECOND)'
    )->execute([':ep' => $endpoint, ':win' => $window]);

    // Count current hits
    $stmt = $pdo->prepare('
        SELECT COUNT(*) AS cnt FROM `rate_limits`
        WHERE `ip_address` = :ip AND `endpoint` = :ep
          AND `hit_at` > DATE_SUB(NOW(), INTERVAL :win SECOND)
    ');
    $stmt->execute([':ip' => $ip, ':ep' => $endpoint, ':win' => $window]);
    $count = (int)$stmt->fetch()['cnt'];

    if ($count >= $max) {
        header('Retry-After: ' . $window);
        jsonError('Too many requests. Please try again later.', 429);
    }

    $pdo->prepare(
        'INSERT INTO `rate_limits` (`ip_address`, `endpoint`) VALUES (:ip, :ep)'
    )->execute([':ip' => $ip, ':ep' => $endpoint]);
}
