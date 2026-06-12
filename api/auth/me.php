<?php
/**
 * GET /api/auth/me.php
 * Returns the currently-authenticated admin, or 401 if unauthenticated.
 * Used by the React admin panel on initial load and protected routes.
 */

if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'HEAD'], true)) {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../config/auth.php';

$admin = getCurrentAdmin();
if (!$admin) {
    jsonError('Not authenticated', 401);
}

jsonSuccess('OK', ['admin' => $admin]);
