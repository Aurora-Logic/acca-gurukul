<?php
/**
 * POST /api/auth/login.php
 *
 * Security:
 *  - POST only
 *  - Rate limited: 5 attempts per 15 min per IP
 *  - User enumeration defence: same error for "no such user" + "wrong password"
 *  - Timing attack defence: dummy password_verify on unknown emails
 *  - Inactive-admin check — returns distinct 403 (by design — legitimate user needs to know)
 *  - password_hash upgrade path (password_needs_rehash)
 *  - Session fixation prevention (regenerate_id after login)
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../config/auth.php';

// Rate limit
const RATE_WINDOW = 900;  // 15 minutes
const RATE_MAX    = 5;

$clientIp = getClientIp();
checkRateLimit($clientIp, 'login', RATE_WINDOW, RATE_MAX);

// Body
$raw = file_get_contents('php://input');
if (strlen($raw) > 4096) {
    jsonError('Request too large', 413);
}
$data = json_decode($raw, true);
if (!is_array($data)) {
    jsonError('Invalid request body', 400);
}

$email    = trim((string)($data['email']    ?? ''));
$password = (string)($data['password'] ?? '');
$remember = (bool)($data['remember'] ?? false);

if ($email === '' || $password === '') {
    jsonError('Email and password are required', 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonError('Invalid email address', 422);
}
if (strlen($password) > 200) {
    jsonError('Invalid credentials', 401);
}

// Lookup
try {
    $stmt = db()->prepare(
        'SELECT id, name, email, password, is_active FROM `admins` WHERE email = :email LIMIT 1'
    );
    $stmt->execute([':email' => $email]);
    $admin = $stmt->fetch();
} catch (PDOException $e) {
    error_log('Login query failed: ' . $e->getMessage());
    jsonError('Service temporarily unavailable', 500);
}

// Non-existent email — do a dummy password_verify to equalise timing
if (!$admin) {
    password_verify($password, '$2y$10$CwTycUXWue0Thq9StjUM0uJ8DpqY4PrkXuFBMyIBwqKZ7Rq7zWXGm');
    jsonError('Invalid email or password', 401);
}

// Inactive admin — deliberate distinct message (legitimate user should know why)
if ((int)$admin['is_active'] !== 1) {
    jsonError('Your account is inactive. Please contact an administrator.', 403);
}

// Password check
if (!password_verify($password, $admin['password'])) {
    jsonError('Invalid email or password', 401);
}

// Upgrade hash if algorithm default has changed
if (password_needs_rehash($admin['password'], PASSWORD_BCRYPT)) {
    try {
        $newHash = password_hash($password, PASSWORD_BCRYPT);
        db()->prepare('UPDATE `admins` SET password = :pw WHERE id = :id')
            ->execute([':pw' => $newHash, ':id' => $admin['id']]);
    } catch (PDOException $e) {
        // Non-fatal — just log
        error_log('Password rehash failed: ' . $e->getMessage());
    }
}

// Login
loginAdmin($admin, $remember);

jsonSuccess('Login successful', [
    'admin' => [
        'id'    => (int)$admin['id'],
        'name'  => $admin['name'],
        'email' => $admin['email'],
    ],
    'remember' => $remember,
]);
