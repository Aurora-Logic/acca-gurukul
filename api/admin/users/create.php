<?php
/**
 * POST /api/admin/users/create.php
 * Body: { name, email, password, is_active }
 * Auth required.
 *
 * Security:
 *  - Passwords hashed with password_hash() (bcrypt)
 *  - Email uniqueness enforced (DB unique index + pre-check)
 *  - Email / name / password validated against strict rules
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/auth.php';
requireAuth();

$data = getJsonBody();

$name     = sanitize((string)($data['name']     ?? ''));
$email    = trim(strtolower((string)($data['email'] ?? '')));
$password = (string)($data['password']  ?? '');
$isActive = isset($data['is_active']) ? (int)(bool)$data['is_active'] : 1;

// ─── Validate name ───
if (strlen($name) < 2 || strlen($name) > 60) {
    jsonError('Name must be 2–60 characters', 422);
}

// ─── Validate email ───
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonError('Invalid email address', 422);
}
if (strlen($email) > 100) {
    jsonError('Email must be under 100 characters', 422);
}

// ─── Validate password ───
if (strlen($password) < 8) {
    jsonError('Password must be at least 8 characters', 422);
}
if (strlen($password) > 200) {
    jsonError('Password too long', 422);
}

try {
    // Uniqueness pre-check (nicer error message than catching duplicate key)
    $chk = db()->prepare('SELECT 1 FROM `admins` WHERE email = :em LIMIT 1');
    $chk->execute([':em' => $email]);
    if ($chk->fetchColumn()) {
        jsonError('An admin with that email already exists', 409);
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);

    $stmt = db()->prepare('
        INSERT INTO `admins` (name, email, password, is_active)
        VALUES (:name, :email, :password, :is_active)
    ');
    $stmt->execute([
        ':name'      => $name,
        ':email'     => $email,
        ':password'  => $hash,
        ':is_active' => $isActive,
    ]);

    $newId = (int) db()->lastInsertId();

    jsonSuccess('Admin created', [
        'user' => [
            'id'        => $newId,
            'name'      => $name,
            'email'     => $email,
            'is_active' => (bool) $isActive,
        ],
    ], 201);

} catch (PDOException $e) {
    // 23000 = integrity constraint (duplicate key)
    if ($e->getCode() === '23000') {
        jsonError('An admin with that email already exists', 409);
    }
    error_log('users/create error: ' . $e->getMessage());
    jsonError('Failed to create admin', 500);
}
