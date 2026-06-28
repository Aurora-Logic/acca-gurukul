<?php
// sitemap.php
require_once __DIR__ . '/api/config/bootstrap.php';
header("Content-Type: application/xml; charset=utf-8");

$host = "https://" . ($_SERVER['HTTP_HOST'] ?? 'accagurukul.com');

// Define static pages with their priority and change frequency
$staticPages = [
    '' => ['priority' => '1.0', 'changefreq' => 'daily'],
    'about-us/' => ['priority' => '0.8', 'changefreq' => 'monthly'],
    'acca-course/' => ['priority' => '0.9', 'changefreq' => 'weekly'],
    'fia/' => ['priority' => '0.8', 'changefreq' => 'monthly'],
    'locations/' => ['priority' => '0.8', 'changefreq' => 'monthly'],
    'student-zone/' => ['priority' => '0.8', 'changefreq' => 'weekly'],
    'privacy-policy/' => ['priority' => '0.3', 'changefreq' => 'monthly'],
    'terms-of-service/' => ['priority' => '0.3', 'changefreq' => 'monthly'],
    'disclaimer/' => ['priority' => '0.3', 'changefreq' => 'monthly'],
    'contact-us/' => ['priority' => '0.8', 'changefreq' => 'monthly'],
    'blogs/' => ['priority' => '0.9', 'changefreq' => 'daily']
];

// Fetch all published blogs
$blogs = [];
try {
    $stmt = db()->query('SELECT slug, updated_at FROM `blogs` WHERE is_published = 1 ORDER BY updated_at DESC');
    $blogs = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    error_log('Sitemap database error: ' . $e->getMessage());
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . PHP_EOL;
?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <?php foreach ($staticPages as $path => $meta): ?>
        <url>
            <loc><?php echo htmlspecialchars($host . '/' . $path); ?></loc>
            <changefreq><?php echo $meta['changefreq']; ?></changefreq>
            <priority><?php echo $meta['priority']; ?></priority>
        </url>
    <?php endforeach; ?>

    <?php foreach ($blogs as $blog): 
        $lastmod = !empty($blog['updated_at']) ? (new DateTime($blog['updated_at']))->format('Y-m-d') : date('Y-m-d');
        ?>
        <url>
            <loc><?php echo htmlspecialchars($host . '/blogs/' . $blog['slug'] . '/'); ?></loc>
            <lastmod><?php echo $lastmod; ?></lastmod>
            <changefreq>weekly</changefreq>
            <priority>0.7</priority>
        </url>
    <?php endforeach; ?>
</urlset>
