<?php
/**
 * GET  /api/admin/seo/settings.php — sitewide SEO + organisation identity
 * POST /api/admin/seo/settings.php — save it
 *
 * These values drive the Organization/LocalBusiness JSON-LD graph on every
 * page, the search-console verification tags, and the body of /robots.txt.
 */

require_once __DIR__ . '/../../config/auth.php';
requireAuth();

const SEO_SETTING_FIELDS = [
    'site_name'           => 120,
    'site_url'            => 191,
    'default_og_image'    => 255,
    'title_separator'     => 10,
    'title_suffix'        => 120,
    'org_legal_name'      => 191,
    'org_logo'            => 255,
    'org_description'     => 500,
    'org_phone'           => 40,
    'org_email'           => 120,
    'org_street'          => 191,
    'org_locality'        => 120,
    'org_region'          => 120,
    'org_postal_code'     => 20,
    'org_country'         => 10,
    'org_latitude'        => 30,
    'org_longitude'       => 30,
    'org_founding_date'   => 20,
    'org_price_range'     => 20,
    'org_opening_hours'   => 255,
    'social_facebook'     => 255,
    'social_instagram'    => 255,
    'social_linkedin'     => 255,
    'social_youtube'      => 255,
    'social_twitter'      => 255,
    'twitter_handle'      => 60,
    'google_verification' => 191,
    'bing_verification'   => 191,
];

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $row = db()->query('SELECT * FROM `seo_settings` WHERE id = 1 LIMIT 1')->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log('seo/settings GET error: ' . $e->getMessage());
        jsonError('Failed to load SEO settings', 500);
    }

    if (!$row) {
        jsonError('SEO settings row missing — run api/sql/seo.sql', 500);
    }

    $settings = ['robots_txt' => (string) ($row['robots_txt'] ?? '')];
    foreach (array_keys(SEO_SETTING_FIELDS) as $field) {
        $settings[$field] = (string) ($row[$field] ?? '');
    }
    $settings['updated_at'] = $row['updated_at'];

    jsonResponse(['error' => false, 'settings' => $settings]);
}

if ($method !== 'POST') {
    http_response_code(405);
    header('Allow: GET, POST');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

$data = getJsonBody();

$siteUrl = trim((string) ($data['site_url'] ?? ''));
if ($siteUrl !== '' && !filter_var($siteUrl, FILTER_VALIDATE_URL)) {
    jsonError('Site URL must be a full absolute URL (https://…)', 422, ['site_url' => 'Invalid URL']);
}
// Canonicals are built by concatenating this with a path, so a trailing slash
// here would produce "https://site.com//about-us/".
$siteUrl = rtrim($siteUrl, '/');

$email = trim((string) ($data['org_email'] ?? ''));
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonError('Organisation email is not a valid address', 422, ['org_email' => 'Invalid email']);
}

$assignments = [];
$params      = [];
foreach (SEO_SETTING_FIELDS as $field => $max) {
    $value = $field === 'site_url' ? $siteUrl : trim((string) ($data[$field] ?? ''));
    $assignments[]      = "`$field` = :$field";
    $params[":$field"]  = $value === '' ? null : mb_substr($value, 0, $max);
}

$robots = (string) ($data['robots_txt'] ?? '');
// Normalise line endings so the served file is byte-clean for crawlers.
$robots = str_replace(["\r\n", "\r"], "\n", $robots);
$assignments[]            = '`robots_txt` = :robots_txt';
$params[':robots_txt']    = $robots === '' ? null : mb_substr($robots, 0, 20000);

try {
    db()->prepare('UPDATE `seo_settings` SET ' . implode(', ', $assignments) . ' WHERE id = 1')
        ->execute($params);
} catch (PDOException $e) {
    error_log('seo/settings POST error: ' . $e->getMessage());
    jsonError('Failed to save SEO settings', 500);
}

jsonSuccess('SEO settings saved');
