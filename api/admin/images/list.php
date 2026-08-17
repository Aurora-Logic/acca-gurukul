<?php
/**
 * GET /api/admin/images/list.php
 * Every managed template image with its current alt text and any problems.
 */

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/auth.php';
requireAuth();

try {
    $rows = db()->query('
        SELECT id, image_key, alt_text, default_alt, location, is_decorative, updated_at
        FROM `image_alt`
        ORDER BY location ASC, image_key ASC
    ')->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    error_log('images/list error: ' . $e->getMessage());
    jsonError('Failed to load images', 500);
}

/**
 * Alt text earns its keep by describing the image to someone who cannot see it.
 * These are the failures that actually cost accessibility and image-search
 * traffic, rather than a generic "is it filled in" check.
 */
function altIssues(array $r): array
{
    $issues = [];

    if ((int) $r['is_decorative'] === 1) {
        return $issues; // empty alt is correct here, by choice
    }

    $alt = trim((string) ($r['alt_text'] ?: $r['default_alt'] ?: ''));

    if ($alt === '') {
        $issues[] = 'Missing alt text';
        return $issues;
    }
    if (mb_strlen($alt) > 125) {
        $issues[] = 'Longer than 125 characters';
    }
    if (preg_match('/^(image|img|photo|picture|graphic|icon|banner)\b/i', $alt)) {
        $issues[] = 'Starts with a redundant word like "image" or "photo"';
    }
    if (preg_match('/\.(webp|png|jpe?g|gif|svg)$/i', $alt)) {
        $issues[] = 'Looks like a filename rather than a description';
    }
    // A basename match means the alt is just the file's own name.
    $base = pathinfo((string) $r['image_key'], PATHINFO_FILENAME);
    if ($base !== '' && strcasecmp(str_replace(['_', '-'], ' ', $base), $alt) === 0) {
        $issues[] = 'Same as the filename';
    }

    return $issues;
}

$images = array_map(function (array $r) {
    $issues = altIssues($r);
    $effective = (int) $r['is_decorative'] === 1
        ? ''
        : (string) ($r['alt_text'] ?: $r['default_alt'] ?: '');

    return [
        'id'            => (int) $r['id'],
        'image_key'     => $r['image_key'],
        'alt_text'      => (string) ($r['alt_text'] ?? ''),
        'default_alt'   => (string) ($r['default_alt'] ?? ''),
        'effective_alt' => $effective,
        'alt_length'    => mb_strlen($effective),
        'location'      => $r['location'],
        'is_decorative' => (bool) $r['is_decorative'],
        'issues'        => $issues,
        'updated_at'    => $r['updated_at'],
    ];
}, $rows);

$locations = [];
foreach ($images as $image) {
    $locations[$image['location']] = ($locations[$image['location']] ?? 0) + 1;
}

jsonResponse([
    'error'      => false,
    'images'     => $images,
    'locations'  => $locations,
    'total'      => count($images),
    'with_issues' => count(array_filter($images, fn($i) => $i['issues'] !== [])),
]);
