<?php
/**
 * IndexNow Search Engine Instant Indexing Protocol.
 *
 * Automatically notifies Microsoft Bing, Yandex, Seznam, Naver, and search
 * engine partners instantly whenever blog articles are published or updated.
 *
 * Specification: https://www.indexnow.org/documentation
 */

require_once __DIR__ . '/seo.php';

/**
 * Get or generate the persistent IndexNow verification key.
 */
function indexnow_get_key(): string
{
    static $key = null;
    if ($key !== null) {
        return $key;
    }

    $keyFile = __DIR__ . '/../indexnow_key.txt';

    if (file_exists($keyFile)) {
        $saved = trim((string) file_get_contents($keyFile));
        if (preg_match('/^[a-f0-9]{32,64}$/i', $saved)) {
            return $key = $saved;
        }
    }

    // Generate a fixed 32-character hex key if none exists
    $newKey = bin2hex(random_bytes(16));
    @file_put_contents($keyFile, $newKey);

    return $key = $newKey;
}

/**
 * Submit an array of absolute URLs to IndexNow search engines.
 *
 * @param string[] $urls List of full URLs to submit
 * @return array{success: bool, status_code: int, message: string, engines: array}
 */
function indexnow_submit_urls(array $urls): array
{
    $urls = array_values(array_unique(array_filter($urls, fn($u) => !empty($u) && filter_var($u, FILTER_VALIDATE_URL))));
    if (empty($urls)) {
        return ['success' => false, 'status_code' => 400, 'message' => 'No valid URLs provided', 'engines' => []];
    }

    $settings = seo_settings();
    $siteUrl  = rtrim($settings['site_url'] ?? 'https://accagurukul.com', '/');
    $parsed   = parse_url($siteUrl);
    $host     = $parsed['host'] ?? 'accagurukul.com';
    $key      = indexnow_get_key();
    $keyUrl   = $siteUrl . '/' . $key . '.txt';

    $payload = [
        'host'        => $host,
        'key'         => $key,
        'keyLocation' => $keyUrl,
        'urlList'     => $urls,
    ];

    $jsonPayload = json_encode($payload, JSON_UNESCAPED_SLASHES);

    $endpoints = [
        'indexnow' => 'https://api.indexnow.org/indexnow',
        'bing'     => 'https://www.bing.com/indexnow',
    ];

    $results = [];
    $allOk   = true;

    foreach ($endpoints as $name => $endpoint) {
        $ch = curl_init($endpoint);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $jsonPayload,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json; charset=utf-8',
                'User-Agent: ACCA-Gurukul-IndexNow/1.0',
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 5,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $response   = curl_exec($ch);
        $statusCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error      = curl_error($ch);

        $isSuccess = ($statusCode >= 200 && $statusCode < 300);
        if (!$isSuccess) {
            $allOk = false;
        }

        $results[$name] = [
            'status'   => $statusCode,
            'success'  => $isSuccess,
            'error'    => $error ?: null,
            'response' => $response,
        ];
    }

    return [
        'success'     => $allOk,
        'status_code' => $allOk ? 200 : 207,
        'message'     => $allOk ? 'Successfully notified IndexNow search partners (Bing, Yandex, Seznam, Naver)' : 'Submitted with some warnings',
        'urls_count'  => count($urls),
        'engines'     => $results,
    ];
}

/**
 * Submit a single blog post by its slug.
 */
function indexnow_submit_blog(string $slug): array
{
    $url = seo_url('/blogs/' . rawurlencode($slug) . '/');
    return indexnow_submit_urls([$url, seo_url('/blogs/'), seo_url('/sitemap.xml')]);
}

/**
 * Submit all published blogs currently in the database.
 */
function indexnow_submit_all_published_blogs(): array
{
    $urls = [
        seo_url('/'),
        seo_url('/blogs/'),
        seo_url('/sitemap.xml'),
    ];

    try {
        $stmt = db()->query('SELECT slug FROM `blogs` WHERE is_published = 1 ORDER BY updated_at DESC');
        $blogs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($blogs as $b) {
            $urls[] = seo_url('/blogs/' . rawurlencode($b['slug']) . '/');
        }
    } catch (PDOException $e) {
        error_log('indexnow_submit_all query failed: ' . $e->getMessage());
    }

    return indexnow_submit_urls($urls);
}
