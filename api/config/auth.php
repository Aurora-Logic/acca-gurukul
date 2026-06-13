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
const SESSION_REMEMBER_LIFETIME  = 7 * 86400; // 7 days in seconds

function startAuthSession(bool $remember = false, bool $createIfMissing = false): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    // Don't allocate a session for anonymous visitors. Without this guard,
    // PHP's session_start() auto-issues ADMIN_SESSID to every caller of
    // /auth/me.php (and every /admin/* endpoint that 401s), which means a
    // logged-out browser picks up a session cookie just by loading the login
    // page. Only resume an existing session, or create one for login.
    session_name(SESSION_COOKIE_NAME);
    if (!$createIfMissing && empty($_COOKIE[SESSION_COOKIE_NAME])) {
        return;
    }

    $lifetime = $remember ? SESSION_REMEMBER_LIFETIME : 0;
    $secure   = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';

    session_set_cookie_params([
        'lifetime' => $lifetime,
        'path'     => '/',
        'domain'   => '',
        'secure'   => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    session_start();

    // If a "remember" flag is stored from a prior login, keep extending the cookie
    // so the 7-day window slides forward with activity.
    if (!empty($_SESSION['remember'])) {
        setcookie(SESSION_COOKIE_NAME, session_id(), [
            'expires'  => time() + SESSION_REMEMBER_LIFETIME,
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

    // User-agent binding — if UA has changed dramatically, invalidate the session
    $currentUa = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 200);
    if (!empty($_SESSION['user_agent']) && $_SESSION['user_agent'] !== $currentUa) {
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