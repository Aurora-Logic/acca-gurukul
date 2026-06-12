<?php

// Check method
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/auth.php';

$pagesConfig = [
    'home' => ['file' => '../../../home/index.html', 'label' => 'Home'],
    'booking' => ['file' => '../../../booking/index.html', 'label' => 'Book Appointment'],
    'contact' => ['file' => '../../../contact/index.html', 'label' => 'Contact'],
    'news' => ['file' => '../../../news/index.html', 'label' => 'News / Blog'],
    'privacy' => ['file' => '../../../privacy/index.html', 'label' => 'Privacy Policy'],
    'terms' => ['file' => '../../../terms/index.html', 'label' => 'Terms of Service'],
    'disclaimer' => ['file' => '../../../disclaimer/index.html', 'label' => 'Disclaimer'],
];

$result = [];

foreach ($pagesConfig as $id => $config) {
    $file = __DIR__ . '/' . $config['file'];
    $meta_title = '';
    $meta_description = '';
    $has_seo = false;
    $noindex = false;

    if (file_exists($file)) {
        $html = file_get_contents($file);
        
        if (preg_match('/<title>(.*?)<\/title>/is', $html, $titleMatches)) {
            $meta_title = $titleMatches[1] ?? '';
        }
        
        if (preg_match('/<meta[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']/is', $html, $descMatches)) {
            $meta_description = $descMatches[1] ?? '';
        }

        $has_seo = !empty($meta_title);
        $noindexMatch = preg_match('/<meta[^>]*name=["\']robots["\'][^>]*content=["\']noindex["\']/is', $html);
        $noindex = !empty($noindexMatch);
    }

    $result[] = [
        'identifier' => $id,
        'label' => $config['label'],
        'meta_title' => $meta_title,
        'meta_description' => $meta_description,
        'has_seo' => $has_seo,
        'noindex' => $noindex
    ];
}

header('Content-Type: application/json');
echo json_encode($result);