<?php
/**
 * POST /api/auth/logout.php
 * Destroys the current admin session and clears the cookie.
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../config/auth.php';

logoutAdmin();
jsonSuccess('Logged out');
