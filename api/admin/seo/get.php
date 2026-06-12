<?php

// Check method
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/auth.php';
// requireAuth(); // Keep this simple or enable if needed

$pages = [
    'home' => '../../../home/index.html',
    'booking' => '../../../booking/index.html',
    'contact' => '../../../contact/index.html',
    'news' => '../../../news/index.html',
    'privacy' => '../../../privacy/index.html',
    'terms' => '../../../terms/index.html',
    'disclaimer' => '../../../disclaimer/index.html',
];

$id = $_GET['id'] ?? '';

if (!$id || !isset($pages[$id])) {
    http_response_code(400);
    echo json_encode(['error' => true, 'message' => 'Invalid page ' . $id]);
    exit;
}

$file = __DIR__ . '/' . $pages[$id];
if (!file_exists($file)) {
    http_response_code(404);
    echo json_encode(['error' => true, 'message' => 'File not found']);
    exit;
}

$html = file_get_contents($file);

// Extract title
preg_match('/<title>(.*?)<\/title>/is', $html, $titleMatches);
$title = $titleMatches[1] ?? '';

// Extract meta description
preg_match('/<meta[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']/is', $html, $descMatches);
$description = $descMatches[1] ?? '';

// Extract keywords
preg_match('/<meta[^>]*name=["\']keywords["\'][^>]*content=["\'](.*?)["\']/is', $html, $kwMatches);
$keywords = $kwMatches[1] ?? '';

// Extract og:title
preg_match('/<meta[^>]*property=["\']og:title["\'][^>]*content=["\'](.*?)["\']/is', $html, $ogTitleMatches);
$og_title = $ogTitleMatches[1] ?? '';

// Extract og:description
preg_match('/<meta[^>]*property=["\']og:description["\'][^>]*content=["\'](.*?)["\']/is', $html, $ogDescMatches);
$og_description = $ogDescMatches[1] ?? '';

// Extract og:image and normalize relative path to server-absolute for admin preview
preg_match('/<meta[^>]*property=["\']og:image["\'][^>]*content=["\'](.*?)["\']/is', $html, $ogImageMatches);
$og_image = $ogImageMatches[1] ?? '';
if ($og_image && strpos($og_image, '../') === 0) {
    $og_image = '/' . ltrim(substr($og_image, 3), '/');
}

// Extract canonical
preg_match('/<link[^>]*rel=["\']canonical["\'][^>]*href=["\'](.*?)["\']/is', $html, $canMatches);
$canonical = $canMatches[1] ?? '';

// Extract noindex
preg_match('/<meta[^>]*name=["\']robots["\'][^>]*content=["\']noindex["\']/is', $html, $robotsMatches);
$noindex = !empty($robotsMatches) ? true : false;

// Extract structured data
preg_match('/<script[^>]*type=["\']application\/ld\+json["\'][^>]*>(.*?)<\/script>/is', $html, $sdMatches);
$structured_data = isset($sdMatches[1]) ? trim($sdMatches[1]) : '';

header('Content-Type: application/json');
echo json_encode([
    'page_identifier' => $id,
    'meta_title' => $title,
    'meta_description' => $description,
    'meta_keywords' => $keywords,
    'og_title' => $og_title,
    'og_description' => $og_description,
    'og_image' => $og_image,
    'canonical_url' => $canonical,
    'noindex' => $noindex,
    'structured_data' => $structured_data,
]);