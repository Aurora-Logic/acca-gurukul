<?php
/**
 * POST /api/admin/blogs/create.php
 * Handles multipart/form-data for blog creation with an image
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/auth.php';
require_once __DIR__ . '/../../config/uploads.php';
requireAuth();

// For multipart/form-data, we use $_POST and $_FILES directly instead of getJsonBody()

$title            = sanitize((string)($_POST['title'] ?? ''));
$slug             = trim((string)($_POST['slug'] ?? ''));
$slug             = html_entity_decode($slug, ENT_QUOTES, 'UTF-8');
$excerpt          = sanitize((string)($_POST['excerpt'] ?? ''));
$content          = trim((string)($_POST['content'] ?? ''));
$category         = sanitize((string)($_POST['category'] ?? ''));
$tags             = sanitize((string)($_POST['tags'] ?? ''));
$meta_title       = sanitize((string)($_POST['meta_title'] ?? ''));
$meta_description = sanitize((string)($_POST['meta_description'] ?? ''));
$author           = sanitize((string)($_POST['author'] ?? ''));
$read_time        = (int)($_POST['read_time'] ?? 0);
$is_published     = isset($_POST['is_published']) && max(0, min(1, (int)$_POST['is_published']));
$is_featured      = isset($_POST['is_featured'])  && (int)$_POST['is_featured'] === 1 ? 1 : 0;

$og_title           = sanitize((string)($_POST['og_title'] ?? ''));
$og_description     = sanitize((string)($_POST['og_description'] ?? ''));
$featured_image_alt = sanitize((string)($_POST['featured_image_alt'] ?? ''));
$show_toc           = isset($_POST['show_toc']) && (int)$_POST['show_toc'] === 1 ? 1 : 0;
$faqs               = trim((string)($_POST['faqs'] ?? ''));

if ($faqs) {
    $decoded = json_decode($faqs, true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
        jsonError('Invalid FAQs format', 422);
    }
} else {
    $faqs = null;
}

// Validate basic fields
if (strlen($title) < 2) {
    jsonError('Title is required and must be at least 2 characters', 422);
}
if (!$slug) {
    // Generate a simple slug if empty
    $rawTitle = html_entity_decode($title, ENT_QUOTES, 'UTF-8');
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-\']+/', '-', $rawTitle), '-'));
}

if (!$content) {
    jsonError('Content is required', 422);
}

// Handle File Upload
$featuredImage = null;
if (isset($_FILES['featured_image']) && $_FILES['featured_image']['error'] !== UPLOAD_ERR_NO_FILE) {
    try {
        $featuredImage = storeUploadedImage(
            $_FILES['featured_image'],
            __DIR__ . '/../../../uploads/blogs',
            '/uploads/blogs'
        );
    } catch (RuntimeException $e) {
        jsonError($e->getMessage(), 422);
    }
}

try {
    // Uniqueness check for slug
    $chk = db()->prepare('SELECT 1 FROM `blogs` WHERE slug = :slug LIMIT 1');
    $chk->execute([':slug' => $slug]);
    if ($chk->fetchColumn()) {
        jsonError('A blog post with this slug already exists', 409);
    }

    $pdo = db();
    $pdo->beginTransaction();

    if ($is_featured) {
        $pdo->exec('UPDATE `blogs` SET is_featured = 0 WHERE is_featured = 1');
    }

    $stmt = $pdo->prepare('
        INSERT INTO `blogs` (
            title, slug, excerpt, content, featured_image, featured_image_alt, category,
            tags, meta_title, meta_description, og_title, og_description, author, read_time, 
            is_published, is_featured, show_toc, faqs
        ) VALUES (
            :title, :slug, :excerpt, :content, :featured_image, :featured_image_alt, :category,
            :tags, :meta_title, :meta_description, :og_title, :og_description, :author, :read_time, 
            :is_published, :is_featured, :show_toc, :faqs
        )
    ');

    $stmt->execute([
        ':title'              => $title,
        ':slug'               => $slug,
        ':excerpt'            => $excerpt,
        ':content'            => $content,
        ':featured_image'     => $featuredImage,
        ':featured_image_alt' => $featured_image_alt ?: null,
        ':category'           => $category,
        ':tags'               => $tags,
        ':meta_title'         => $meta_title,
        ':meta_description'   => $meta_description,
        ':og_title'           => $og_title ?: null,
        ':og_description'     => $og_description ?: null,
        ':author'             => $author ?: null,
        ':read_time'          => $read_time,
        ':is_published'       => $is_published,
        ':is_featured'        => $is_featured,
        ':show_toc'           => $show_toc,
        ':faqs'               => $faqs,
    ]);

    $newId = (int) $pdo->lastInsertId();
    $pdo->commit();

    jsonSuccess('Blog post created successfully', [
        'blog' => [
            'id'   => $newId,
            'slug' => $slug,
        ],
    ], 201);

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    if ($e->getCode() === '23000') {
        jsonError('A blog post with this slug already exists', 409);
    }
    error_log('blogs/create error: ' . $e->getMessage());
    jsonError('Failed to create blog post', 500);
}
