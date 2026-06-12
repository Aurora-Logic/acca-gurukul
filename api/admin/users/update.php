<?php
/**
 * POST /api/admin/users/update.php
 * Body: { id, name, email, is_active, password? }
 * Auth required.
 *
 * Rules:
 *  - You cannot deactivate yourself (prevents accidental self-lockout)
 *  - Password is optional — omit/empty to keep current
 *  - Email uniqueness enforced (excluding self)
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/auth.php';
$currentAdmin = requireAuth();

$data = getJsonBody();

$id       = (int)($data['id'] ?? 0);
$name     = sanitize((string)($data['name']  ?? ''));
$email    = trim(strtolower((string)($data['email'] ?? '')));
$password = (string)($data['password'] ?? '');
$isActive = isset($data['is_active']) ? (int)(bool)$data['is_active'] : 1;

if ($id <= 0) {
    jsonError('Invalid id', 422);
}

// ─── Validate ───
if (strlen($name) < 2 || strlen($name) > 60) {
    jsonError('Name must be 2–60 characters', 422);
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonError('Invalid email address', 422);
}
if (strlen($email) > 100) {
    jsonError('Email must be under 100 characters', 422);
}
if ($password !== '' && (strlen($password) < 8 || strlen($password) > 200)) {
    jsonError('Password must be 8–200 characters', 422);
}

// ─── Self-protection: can't deactivate own account ───
if ($id === (int) $currentAdmin['id'] && $isActive === 0) {
    jsonError('You cannot deactivate your own account', 403);
}

try {
    // Does the target admin exist?
    $chk = db()->prepare('SELECT id FROM `admins` WHERE id = :id LIMIT 1');
    $chk->execute([':id' => $id]);
    if (!$chk->fetchColumn()) {
        jsonError('User not found', 404);
    }

    // Email uniqueness (excluding self)
    $u = db()->prepare('SELECT 1 FROM `admins` WHERE email = :em AND id <> :id LIMIT 1');
    $u->execute([':em' => $email, ':id' => $id]);
    if ($u->fetchColumn()) {
        jsonError('An admin with that email already exists', 409);
    }

    if ($password !== '') {
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = db()->prepare('
            UPDATE `admins`
            SET name = :name, email = :email, password = :password, is_active = :is_active
            WHERE id = :id
        ');
        $stmt->execute([
            ':name'      => $name,
            ':email'     => $email,
            ':password'  => $hash,
            ':is_active' => $isActive,
            ':id'        => $id,
        ]);
    } else {
        $stmt = db()->prepare('
            UPDATE `admins`
            SET name = :name, email = :email, is_active = :is_active
            WHERE id = :id
        ');
        $stmt->execute([
            ':name'      => $name,
            ':email'     => $email,
            ':is_active' => $isActive,
            ':id'        => $id,
        ]);
    }

    jsonSuccess('Admin updated', [
        'user' => [
            'id'        => $id,
            'name'      => $name,
            'email'     => $email,
            'is_active' => (bool) $isActive,
        ],
    ]);

} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        jsonError('An admin with that email already exists', 409);
    }
    error_log('users/update error: ' . $e->getMessage());
    jsonError('Failed to update admin', 500);
}
