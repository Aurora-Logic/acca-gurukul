<?php
/**
 * POST /api/admin/blogs/update.php
 * Handles multipart/form-data for updating an existing blog post
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/auth.php';
requireAuth();

// Since updating might include form-data (files), use $_POST and $_FILES
$id = (int)($_POST['id'] ?? 0);
if ($id <= 0) {
    jsonError('Invalid blog ID', 422);
}

$title            = sanitize((string)($_POST['title'] ?? ''));
$slug             = sanitize((string)($_POST['slug'] ?? ''));
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
$remove_image     = isset($_POST['remove_image']) && max(0, min(1, (int)$_POST['remove_image']));

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

// Validations
if (strlen($title) < 2) {
    jsonError('Title is required and must be at least 2 characters', 422);
}
if (!$slug) {
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $title), '-'));
}
if (!$content) {
    jsonError('Content is required', 422);
}

// Fetch existing blog to get the current featured_image
try {
    $stmt = db()->prepare('SELECT featured_image FROM `blogs` WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $current = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$current) {
        jsonError('Blog post not found', 404);
    }
} catch (PDOException $e) {
    error_log('blogs/update fetch error: ' . $e->getMessage());
    jsonError('Failed to fetch existing post', 500);
}

$featuredImage = $current['featured_image'];

if ($remove_image) {
    $featuredImage = null;
} elseif (isset($_FILES['featured_image']) && $_FILES['featured_image']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = __DIR__ . '/../../../uploads/blogs/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $file = $_FILES['featured_image'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    
    if (in_array($ext, $allowed)) {
        $filename = uniqid() . '-' . time() . '.' . $ext;
        if (move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
            $featuredImage = '/uploads/blogs/' . $filename;
        }
    } else {
        jsonError('Invalid image format', 422);
    }
}

try {
    // Uniqueness check for slug excluding current record
    $chk = db()->prepare('SELECT 1 FROM `blogs` WHERE slug = :slug AND id != :id LIMIT 1');
    $chk->execute([':slug' => $slug, ':id' => $id]);
    if ($chk->fetchColumn()) {
        jsonError('A different blog post with this slug already exists', 409);
    }

    $pdo = db();
    $pdo->beginTransaction();

    if ($is_featured) {
        $unset = $pdo->prepare('UPDATE `blogs` SET is_featured = 0 WHERE is_featured = 1 AND id != :id');
        $unset->execute([':id' => $id]);
    }

    $stmt = $pdo->prepare('
        UPDATE `blogs` SET
            title = :title,
            slug = :slug,
            excerpt = :excerpt,
            content = :content,
            featured_image = :featured_image,
            featured_image_alt = :featured_image_alt,
            category = :category,
            tags = :tags,
            meta_title = :meta_title,
            meta_description = :meta_description,
            og_title = :og_title,
            og_description = :og_description,
            author = :author,
            read_time = :read_time,
            is_published = :is_published,
            is_featured = :is_featured,
            show_toc = :show_toc,
            faqs = :faqs
        WHERE id = :id
    ');

    $stmt->execute([
        ':id'                 => $id,
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

    $pdo->commit();

    jsonSuccess('Blog post updated successfully', [
        'blog' => [
            'id'             => $id,
            'slug'           => $slug,
            'featured_image' => $featuredImage,
        ],
    ]);

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    if ($e->getCode() === '23000') {
        jsonError('A different blog post with this slug already exists', 409);
    }
    error_log('blogs/update error: ' . $e->getMessage());
    jsonError('Failed to update blog post', 500);
}
