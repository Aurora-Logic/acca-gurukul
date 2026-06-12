<?php

// Handles POST to update an active HTML file with specific META tags easily
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/auth.php';

$data = $_POST;
$id = $data['page_identifier'] ?? '';

$pages = [
    'home' => '../../../home/index.html',
    'booking' => '../../../booking/index.html',
    'contact' => '../../../contact/index.html',
    'news' => '../../../news/index.html',
    'privacy' => '../../../privacy/index.html',
    'terms' => '../../../terms/index.html',
    'disclaimer' => '../../../disclaimer/index.html',
];

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

function updateMetaTag($html, $type, $name, $content) {
    if (!$content) {
        return preg_replace('/<meta[^>]*'.$type.'=["\']'.$name.'["\'][^>]*>/is', '', $html);
    }
    
    $tag = '<meta '.$type.'="'.$name.'" content="'.htmlspecialchars($content).'">';
    
    // If it exists, replace it
    if (preg_match('/<meta[^>]*'.$type.'=["\']'.$name.'["\'][^>]*>/is', $html)) {
        return preg_replace('/<meta[^>]*'.$type.'=["\']'.$name.'["\'][^>]*>/is', "\n" . $tag, $html);
    } 
    
    // Otherwise add it just after closing title
    if (preg_match('/<\/title>/is', $html)) {
        return preg_replace('/(<\/title>)/is', "$1\n".$tag, $html);
    }
    
    // Fallback just before closing head
    return str_replace('</head>', "    $tag\n</head>", $html);
}

function updateTitle($html, $content) {
    if (!$content) return $html;
    $tag = '<title>'.htmlspecialchars($content).'</title>';
    if (preg_match('/<title>(.*?)<\/title>/is', $html)) {
        return preg_replace('/<title>(.*?)<\/title>/is', $tag, $html);
    }
    return str_replace('</head>', "    $tag\n</head>", $html);
}

function updateLinkTag($html, $rel, $href) {
    if (!$href) {
        return preg_replace('/<link[^>]*rel=["\']'.$rel.'["\'][^>]*>/is', '', $html);
    }
    
    $tag = '<link rel="'.$rel.'" href="'.htmlspecialchars($href).'">';
    
    // If it exists, replace it
    if (preg_match('/<link[^>]*rel=["\']'.$rel.'["\'][^>]*>/is', $html)) {
        return preg_replace('/<link[^>]*rel=["\']'.$rel.'["\'][^>]*>/is', $tag, $html);
    } 
    
    // Otherwise add it just after closing title
    if (preg_match('/<\/title>/is', $html)) {
        return preg_replace('/(<\/title>)/is', "$1\n".$tag, $html);
    }
    
    // Fallback just before closing head
    return str_replace('</head>', "    $tag\n</head>", $html);
}

function updateStructuredData($html, $content) {
    // Remove existing structured data
    $html = preg_replace('/<script[^>]*type=["\']application\/ld\+json["\'][^>]*>.*?<\/script>/is', '', $html);
    
    if (!$content) {
        return $html;
    }
    
    $tag = '<script type="application/ld+json">' . "\n" . $content . "\n" . '</script>';
    
    // Add it just after closing title
    if (preg_match('/<\/title>/is', $html)) {
        return preg_replace('/(<\/title>)/is', "$1\n".$tag, $html);
    }
    
    // Fallback just before closing head
    return str_replace('</head>', "    $tag\n</head>", $html);
}

// Update components based on data
if (isset($data['meta_title'])) $html = updateTitle($html, $data['meta_title']);
if (isset($data['meta_description'])) $html = updateMetaTag($html, 'name', 'description', $data['meta_description']);
if (isset($data['meta_keywords'])) $html = updateMetaTag($html, 'name', 'keywords', $data['meta_keywords']);
if (isset($data['og_title'])) $html = updateMetaTag($html, 'property', 'og:title', $data['og_title']);
if (isset($data['og_description'])) $html = updateMetaTag($html, 'property', 'og:description', $data['og_description']);
if (isset($data['canonical_url'])) $html = updateLinkTag($html, 'canonical', $data['canonical_url']);
if (isset($data['structured_data'])) $html = updateStructuredData($html, $data['structured_data']);

if (isset($data['noindex'])) {
    if ($data['noindex'] === 'true' || $data['noindex'] == 1) {
         $html = updateMetaTag($html, 'name', 'robots', 'noindex');
    } else {
         $html = preg_replace('/<meta[^>]*name=["\']robots["\'][^>]*>/is', '', $html);
    }
}

// Handle OG image upload
if (isset($_FILES['og_image']) && $_FILES['og_image']['error'] === UPLOAD_ERR_OK) {
    // Generate a clean filename or keep original. Let's just create a timestamped name.
    $uploadDir = __DIR__ . '/../../../assets/seo/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    $ext = pathinfo($_FILES['og_image']['name'], PATHINFO_EXTENSION);
    $filename = $id . '_og_' . time() . '.' . $ext;
    $targetPath = $uploadDir . $filename;
    
    if (move_uploaded_file($_FILES['og_image']['tmp_name'], $targetPath)) {
        // Build the public URL (assuming it's running via root or we simply do /assets/seo/)
        // Typically it might be /assets/seo/... or ../assets/seo/... 
        // For static files at root, assets is in the same folder as home, so /assets/
        $publicUrl = '../assets/seo/' . $filename;
        $html = updateMetaTag($html, 'property', 'og:image', $publicUrl);
    }
}

// Reorder all SEO tags into a consistent block right after </title>
function reorderSeoBlock($html) {
    $tags = [];

    $patterns = [
        'description'    => ['/<meta[^>]*name=["\']description["\'][^>]*>/is', null],
        'keywords'       => ['/<meta[^>]*name=["\']keywords["\'][^>]*>/is', null],
        'robots'         => ['/<meta[^>]*name=["\']robots["\'][^>]*>/is', null],
        'canonical'      => ['/<link[^>]*rel=["\']canonical["\'][^>]*>/is', null],
        'og_title'       => ['/<meta[^>]*property=["\']og:title["\'][^>]*>/is', null],
        'og_description' => ['/<meta[^>]*property=["\']og:description["\'][^>]*>/is', null],
        'og_image'       => ['/<meta[^>]*property=["\']og:image["\'][^>]*>/is', null],
    ];

    foreach ($patterns as $key => [$pattern]) {
        if (preg_match($pattern, $html, $m)) {
            $tags[$key] = $m[0];
            $html = preg_replace($pattern, '', $html);
        }
    }

    // Structured data (multiline)
    if (preg_match('/<script[^>]*type=["\']application\/ld\+json["\'][^>]*>.*?<\/script>/is', $html, $m)) {
        $tags['structured_data'] = $m[0];
        $html = preg_replace('/<script[^>]*type=["\']application\/ld\+json["\'][^>]*>.*?<\/script>/is', '', $html);
    }

    $order = ['description', 'keywords', 'robots', 'canonical', 'og_title', 'og_description', 'og_image', 'structured_data'];
    $block = '';
    foreach ($order as $key) {
        if (!empty($tags[$key])) {
            $block .= "\n" . $tags[$key];
        }
    }

    if ($block && preg_match('/<\/title>/is', $html)) {
        $html = preg_replace('/(<\/title>)/is', "$1" . $block, $html);
    }

    // Collapse runs of blank lines left by removals
    $html = preg_replace('/\n{3,}/', "\n\n", $html);

    return $html;
}

$html = reorderSeoBlock($html);

$tmp = $file . '.tmp';
if (file_put_contents($tmp, $html) === false) {
    http_response_code(500);
    echo json_encode(['error' => true, 'message' => 'Failed to write file']);
    exit;
}
rename($tmp, $file);

header('Content-Type: application/json');
echo json_encode(['success' => true, 'message' => 'SEO elements saved properly!']);
