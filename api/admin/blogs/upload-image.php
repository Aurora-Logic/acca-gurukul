<?php
/**
 * POST /api/admin/blogs/upload-image.php
 * Handles image upload from the editor
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/auth.php';
requireAuth();

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    jsonError('No image uploaded or upload error occurred', 422);
}

$file = $_FILES['image'];
$uploadDir = __DIR__ . '/../../../uploads/blogs/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

if (!in_array($ext, $allowed, true)) {
    jsonError('Invalid image format. Allowed formats: jpg, jpeg, png, webp, gif', 422);
}

$filename = uniqid('inline-', true) . '-' . time() . '.' . $ext;

if (move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
    $imageUrl = '/uploads/blogs/' . $filename;
    jsonSuccess('Image uploaded successfully', ['url' => $imageUrl]);
} else {
    jsonError('Failed to save uploaded image', 500);
}
