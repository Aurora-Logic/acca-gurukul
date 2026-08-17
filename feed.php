<?php
/**
 * Dynamic RSS 2.0 Feed for ACCA Gurukul.
 *
 * Served at /feed/, /feed, /rss.xml, and /blogs/feed/ via .htaccess.
 * Automatically outputs all published blog articles in standard RSS 2.0 XML
 * format with Atom namespace, categories, enclosures, and content blocks.
 */

require_once __DIR__ . '/components/seo.php';

header('Content-Type: application/rss+xml; charset=utf-8');
header('X-Robots-Tag: noindex, follow');

$settings = seo_settings();
$siteUrl  = rtrim($settings['site_url'] ?? 'https://accagurukul.com', '/');
$siteName = $settings['site_name'] ?? 'ACCA Gurukul';
$siteDesc = $settings['org_description'] ?? 'ACCA & FIA coaching, exam guides, career insights, and syllabus updates.';

try {
    $stmt = db()->query('
        SELECT id, title, slug, excerpt, content, featured_image, featured_image_alt,
               category, tags, author, created_at, updated_at
        FROM `blogs`
        WHERE is_published = 1
        ORDER BY created_at DESC
        LIMIT 50
    ');
    $blogs = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    error_log('feed.php query failed: ' . $e->getMessage());
    $blogs = [];
}

$lastBuildDate = !empty($blogs)
    ? (new DateTime($blogs[0]['updated_at'] ?: $blogs[0]['created_at']))->format(DateTime::RSS)
    : (new DateTime())->format(DateTime::RSS);

echo '<?xml version="1.0" encoding="UTF-8"?>' . PHP_EOL;
?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title><?php echo seo_e($siteName); ?> | Insights &amp; Articles</title>
    <link><?php echo seo_e($siteUrl . '/blogs/'); ?></link>
    <description><?php echo seo_e($siteDesc); ?></description>
    <language>en-IN</language>
    <lastBuildDate><?php echo $lastBuildDate; ?></lastBuildDate>
    <atom:link href="<?php echo seo_e(seo_url('/feed/')); ?>" rel="self" type="application/rss+xml" />
    <generator>ACCA Gurukul Custom Engine</generator>
    <image>
      <url><?php echo seo_e(seo_url('/logo.png')); ?></url>
      <title><?php echo seo_e($siteName); ?></title>
      <link><?php echo seo_e($siteUrl); ?></link>
    </image>
<?php foreach ($blogs as $b):
    $blogUrl   = seo_url('/blogs/' . rawurlencode($b['slug']) . '/');
    $pubDate   = (new DateTime($b['created_at']))->format(DateTime::RSS);
    $author    = !empty($b['author']) ? $b['author'] : $siteName;
    $excerpt   = !empty($b['excerpt']) ? $b['excerpt'] : strip_tags(mb_substr($b['content'], 0, 280)) . '...';
    $imagePath = $b['featured_image'] ? seo_url($b['featured_image']) : null;
?>
    <item>
      <title><?php echo seo_e($b['title']); ?></title>
      <link><?php echo seo_e($blogUrl); ?></link>
      <guid isPermaLink="true"><?php echo seo_e($blogUrl); ?></guid>
      <pubDate><?php echo $pubDate; ?></pubDate>
      <dc:creator><![CDATA[<?php echo $author; ?>]]></dc:creator>
<?php if (!empty($b['category'])): ?>
      <category><![CDATA[<?php echo $b['category']; ?>]]></category>
<?php endif; ?>
      <description><![CDATA[<?php echo $excerpt; ?>]]></description>
      <content:encoded><![CDATA[<?php echo $b['content']; ?>]]></content:encoded>
<?php if ($imagePath): ?>
      <media:content url="<?php echo seo_e($imagePath); ?>" medium="image" />
      <enclosure url="<?php echo seo_e($imagePath); ?>" type="image/jpeg" length="0" />
<?php endif; ?>
    </item>
<?php endforeach; ?>
  </channel>
</rss>
