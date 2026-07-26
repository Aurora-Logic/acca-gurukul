<?php
/**
 * Admin session + auth helpers.
 *
 * Uses PHP native sessions with strict cookie params:
 *  - HttpOnly (blocks JS access)
 *  - SameSite=Lax (CSRF defence)
 *  - Secure flag should be enabled in production (HTTPS)
 *  - Lifetime: 0 (browser session) OR 7 days if "remember me" is checked
 *
 * Functions:
 *  - startAuthSession($remember)  — configure + start session
 *  - loginAdmin($admin, $remember) — write auth state to session
 *  - logoutAdmin()                — destroy session + clear cookie
 *  - getCurrentAdmin()            — ?array — current authenticated admin or null
 *  - requireAuth()                — array — or emits 401 JSON and exits
 */

require_once __DIR__ . '/bootstrap.php';

const SESSION_COOKIE_NAME        = 'ADMIN_SESSID';
const SESSION_DEFAULT_LIFETIME   = 86400;     // 1 day default (prevents hard refresh session loss)
const SESSION_REMEMBER_LIFETIME  = 7 * 86400; // 7 days in seconds

function startAuthSession(bool $remember = false, bool $createIfMissing = false): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_name(SESSION_COOKIE_NAME);
    if (!$createIfMissing && empty($_COOKIE[SESSION_COOKIE_NAME])) {
        return;
    }

    $lifetime = ($remember || !empty($_SESSION['remember'])) ? SESSION_REMEMBER_LIFETIME : SESSION_DEFAULT_LIFETIME;
    $secure   = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';

    session_set_cookie_params([
        'lifetime' => $lifetime,
        'path'     => '/',
        'secure'   => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    session_start();

    // Extend cookie expiration on active session
    if (!empty($_SESSION['admin_id'])) {
        $exp = time() + (!empty($_SESSION['remember']) ? SESSION_REMEMBER_LIFETIME : SESSION_DEFAULT_LIFETIME);
        setcookie(SESSION_COOKIE_NAME, session_id(), [
            'expires'  => $exp,
            'path'     => '/',
            'secure'   => $secure,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }
}

function loginAdmin(array $admin, bool $remember = false): void
{
    startAuthSession($remember, true);

    // Prevent session fixation
    session_regenerate_id(true);

    $_SESSION['admin_id']    = (int) $admin['id'];
    $_SESSION['admin_name']  = $admin['name'];
    $_SESSION['admin_email'] = $admin['email'];
    $_SESSION['login_time']  = time();
    $_SESSION['remember']    = $remember;
    $_SESSION['ip']          = getClientIp();
    $_SESSION['user_agent']  = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 200);

    // Explicitly set the cookie with the chosen lifetime (regenerate_id uses
    // the current cookie params but we want 7-day expiry on "remember me")
    $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    setcookie(SESSION_COOKIE_NAME, session_id(), [
        'expires'  => $remember ? time() + SESSION_REMEMBER_LIFETIME : 0,
        'path'     => '/',
        'secure'   => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function logoutAdmin(): void
{
    startAuthSession();

    if (session_status() === PHP_SESSION_ACTIVE) {
        $_SESSION = [];
    }

    if (ini_get('session.use_cookies')) {
        $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
        setcookie(SESSION_COOKIE_NAME, '', [
            'expires'  => time() - 42000,
            'path'     => '/',
            'secure'   => $secure,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }

    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
}

function getCurrentAdmin(): ?array
{
    startAuthSession();

    // No session cookie → no session was started → visitor is anonymous.
    if (session_status() !== PHP_SESSION_ACTIVE) {
        return null;
    }

    if (empty($_SESSION['admin_id'])) {
        return null;
    }

    // User-agent binding — check main prefix to avoid session hijacking while allowing minor header variations on refresh
    $currentUa = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 50);
    $storedUa  = substr($_SESSION['user_agent'] ?? '', 0, 50);
    if (!empty($storedUa) && !empty($currentUa) && $storedUa !== $currentUa) {
        logoutAdmin();
        return null;
    }

    // Re-verify the admin still exists and is active on every request
    try {
        $stmt = db()->prepare('SELECT id, name, email, is_active FROM `admins` WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => (int) $_SESSION['admin_id']]);
        $row = $stmt->fetch();
    } catch (PDOException $e) {
        return null;
    }

    if (!$row || (int) $row['is_active'] !== 1) {
        logoutAdmin();
        return null;
    }

    return [
        'id'    => (int) $row['id'],
        'name'  => $row['name'],
        'email' => $row['email'],
    ];
}

function requireAuth(): array
{
    $admin = getCurrentAdmin();
    if (!$admin) {
        jsonError('Not authenticated', 401);
    }
    return $admin;
}