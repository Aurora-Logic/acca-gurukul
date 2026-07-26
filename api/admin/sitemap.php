<?php
/**
 * GET/POST /api/admin/sitemap.php
 * Admin API to preview, regenerate, and inspect sitemap.xml
 * Auth required.
 */

require_once __DIR__ . '/../config/auth.php';
requireAuth();

$pdo = db();

function generateSitemapData(PDO $pdo): array
{
    $host = 'https://' . ($_SERVER['HTTP_HOST'] ?? 'accagurukul.com');

    $staticPages = [
        '' => ['priority' => '1.0', 'changefreq' => 'daily', 'name' => 'Home Page'],
        'about-us/' => ['priority' => '0.8', 'changefreq' => 'monthly', 'name' => 'About Us'],
        'acca-course/' => ['priority' => '0.9', 'changefreq' => 'weekly', 'name' => 'ACCA Course'],
        'fia/' => ['priority' => '0.8', 'changefreq' => 'monthly', 'name' => 'FIA Route'],
        'locations/' => ['priority' => '0.8', 'changefreq' => 'monthly', 'name' => 'Our Locations'],
        'student-zone/' => ['priority' => '0.8', 'changefreq' => 'weekly', 'name' => 'Student Zone'],
        'resources/' => ['priority' => '0.8', 'changefreq' => 'weekly', 'name' => 'Study Resources'],
        'privacy-policy/' => ['priority' => '0.3', 'changefreq' => 'monthly', 'name' => 'Privacy Policy'],
        'terms-of-service/' => ['priority' => '0.3', 'changefreq' => 'monthly', 'name' => 'Terms of Service'],
        'disclaimer/' => ['priority' => '0.3', 'changefreq' => 'monthly', 'name' => 'Disclaimer'],
        'contact-us/' => ['priority' => '0.8', 'changefreq' => 'monthly', 'name' => 'Contact Us'],
        'blogs/' => ['priority' => '0.9', 'changefreq' => 'daily', 'name' => 'Gurukul Blogs'],
    ];

    $blogs = [];
    try {
        $stmt = $pdo->query('SELECT slug, title, updated_at, created_at FROM `blogs` WHERE is_published = 1 ORDER BY updated_at DESC');
        $blogs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log('Sitemap API DB error: ' . $e->getMessage());
    }

    $urlList = [];

    // Add static pages
    foreach ($staticPages as $path => $meta) {
        $urlList[] = [
            'type' => 'Static Page',
            'name' => $meta['name'],
            'url' => $host . '/' . $path,
            'loc' => '/' . $path,
            'priority' => $meta['priority'],
            'changefreq' => $meta['changefreq'],
            'lastmod' => date('Y-m-d'),
        ];
    }

    // Add blogs
    foreach ($blogs as $b) {
        $lastmod = !empty($b['updated_at']) ? (new DateTime($b['updated_at']))->format('Y-m-d') : date('Y-m-d');
        $urlList[] = [
            'type' => 'Blog Article',
            'name' => $b['title'] ?: $b['slug'],
            'url' => $host . '/blogs/' . $b['slug'] . '/',
            'loc' => '/blogs/' . $b['slug'] . '/',
            'priority' => '0.7',
            'changefreq' => 'weekly',
            'lastmod' => $lastmod,
        ];
    }

    // Build raw XML string
    $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

    foreach ($urlList as $item) {
        $xml .= "    <url>\n";
        $xml .= "        <loc>" . htmlspecialchars($item['url']) . "</loc>\n";
        if (!empty($item['lastmod'])) {
            $xml .= "        <lastmod>" . $item['lastmod'] . "</lastmod>\n";
        }
        $xml .= "        <changefreq>" . $item['changefreq'] . "</changefreq>\n";
        $xml .= "        <priority>" . $item['priority'] . "</priority>\n";
        $xml .= "    </url>\n";
    }

    $xml .= '</urlset>';

    return [
        'host' => $host,
        'sitemap_url' => $host . '/sitemap.xml',
        'total_urls' => count($urlList),
        'static_count' => count($staticPages),
        'blog_count' => count($blogs),
        'xml_content' => $xml,
        'urls' => $urlList,
    ];
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $data = generateSitemapData($pdo);
    
    // Check if physical sitemap.xml exists in root
    $rootSitemapFile = __DIR__ . '/../../sitemap.xml';
    $fileLastMod = file_exists($rootSitemapFile) ? date('Y-m-d H:i:s', filemtime($rootSitemapFile)) : date('Y-m-d H:i:s');
    
    $data['last_generated'] = $fileLastMod;
    jsonResponse(['error' => false, 'sitemap' => $data]);
} elseif ($method === 'POST') {
    $data = generateSitemapData($pdo);
    
    // Write physical file to site root if possible
    $rootSitemapFile = __DIR__ . '/../../sitemap.xml';
    @file_put_contents($rootSitemapFile, $data['xml_content']);
    
    $data['last_generated'] = date('Y-m-d H:i:s');
    jsonSuccess('Sitemap regenerated successfully', ['sitemap' => $data]);
} else {
    http_response_code(405);
    header('Allow: GET, POST');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}
