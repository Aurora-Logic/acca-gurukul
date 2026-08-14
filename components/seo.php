<?php
/**
 * Sitewide SEO head renderer.
 *
 * Every public page calls seo_head('<page_key>') as the first thing inside
 * <head>. Titles, descriptions, canonicals, social cards and JSON-LD all come
 * from the `page_seo` / `seo_settings` tables, so the admin panel is the single
 * source of truth and a deploy can never overwrite an editor's work.
 *
 * Escaping rules that must not be relaxed:
 *  - every attribute value goes through seo_e() (htmlspecialchars, ENT_QUOTES)
 *  - every JSON-LD block goes through seo_json(), which sets JSON_HEX_TAG so
 *    "<" and ">" become < / >. That makes a "</script>" breakout
 *    impossible even when an admin pastes hostile JSON into the editor.
 */

require_once __DIR__ . '/../api/config/database.php';

function seo_e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

/**
 * Encode a PHP value as JSON safe to embed inside <script>.
 * JSON_HEX_TAG is what prevents tag-breakout; do not remove it.
 */
function seo_json(mixed $value): string
{
    return (string) json_encode(
        $value,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_PRETTY_PRINT
    );
}

function seo_settings(): array
{
    static $cache = null;
    if ($cache !== null) {
        return $cache;
    }

    $defaults = [
        'site_name'       => 'ACCA Gurukul',
        'site_url'        => 'https://accagurukul.com',
        'title_separator' => '|',
        'title_suffix'    => 'ACCA Gurukul',
        'org_country'     => 'IN',
    ];

    try {
        $row = db()->query('SELECT * FROM `seo_settings` WHERE `id` = 1 LIMIT 1')->fetch(PDO::FETCH_ASSOC);
        $cache = is_array($row) ? array_merge($defaults, array_filter($row, fn($v) => $v !== null && $v !== '')) : $defaults;
    } catch (PDOException $e) {
        error_log('seo_settings load failed: ' . $e->getMessage());
        $cache = $defaults;
    }

    return $cache;
}

function seo_page(string $pageKey): array
{
    static $cache = [];
    if (isset($cache[$pageKey])) {
        return $cache[$pageKey];
    }

    try {
        $stmt = db()->prepare('SELECT * FROM `page_seo` WHERE `page_key` = :k LIMIT 1');
        $stmt->execute([':k' => $pageKey]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log('seo_page load failed: ' . $e->getMessage());
        $row = null;
    }

    return $cache[$pageKey] = is_array($row) ? $row : [];
}

/** Absolute URL for a site-relative path. */
function seo_url(string $path = '/'): string
{
    $base = rtrim(seo_settings()['site_url'], '/');
    if (preg_match('#^https?://#i', $path)) {
        return $path;
    }
    return $base . '/' . ltrim($path, '/');
}

/**
 * The sitewide identity graph: who this organisation is, where it operates and
 * which social profiles belong to it. Google uses this for the knowledge panel
 * and for entity resolution in AI Overviews.
 */
function seo_organization_graph(): array
{
    $s      = seo_settings();
    $orgId  = seo_url('/') . '#organization';
    $siteId = seo_url('/') . '#website';

    $sameAs = array_values(array_filter([
        $s['social_facebook']  ?? null,
        $s['social_instagram'] ?? null,
        $s['social_linkedin']  ?? null,
        $s['social_youtube']   ?? null,
        $s['social_twitter']   ?? null,
    ]));

    $org = [
        '@type' => ['EducationalOrganization', 'LocalBusiness'],
        '@id'   => $orgId,
        'name'  => $s['site_name'],
        'url'   => seo_url('/'),
    ];

    if (!empty($s['org_legal_name']))    $org['legalName']    = $s['org_legal_name'];
    if (!empty($s['org_description']))   $org['description']  = $s['org_description'];
    if (!empty($s['org_founding_date'])) $org['foundingDate'] = $s['org_founding_date'];
    if (!empty($s['org_price_range']))   $org['priceRange']   = $s['org_price_range'];
    if (!empty($s['org_email']))         $org['email']        = $s['org_email'];
    if (!empty($s['org_phone']))         $org['telephone']    = $s['org_phone'];
    if ($sameAs)                         $org['sameAs']       = $sameAs;

    if (!empty($s['org_logo'])) {
        $org['logo'] = [
            '@type' => 'ImageObject',
            '@id'   => seo_url('/') . '#logo',
            'url'   => seo_url($s['org_logo']),
        ];
        $org['image'] = ['@id' => seo_url('/') . '#logo'];
    }

    $address = array_filter([
        'streetAddress'   => $s['org_street']      ?? null,
        'addressLocality' => $s['org_locality']    ?? null,
        'addressRegion'   => $s['org_region']      ?? null,
        'postalCode'      => $s['org_postal_code'] ?? null,
        'addressCountry'  => $s['org_country']     ?? null,
    ]);
    if ($address) {
        $org['address'] = array_merge(['@type' => 'PostalAddress'], $address);
    }

    if (!empty($s['org_latitude']) && !empty($s['org_longitude'])) {
        $org['geo'] = [
            '@type'     => 'GeoCoordinates',
            'latitude'  => $s['org_latitude'],
            'longitude' => $s['org_longitude'],
        ];
    }

    if (!empty($s['org_opening_hours'])) {
        $org['openingHours'] = $s['org_opening_hours'];
    }

    if (!empty($s['org_phone'])) {
        $org['contactPoint'] = [[
            '@type'             => 'ContactPoint',
            'telephone'         => $s['org_phone'],
            'contactType'       => 'admissions',
            'areaServed'        => $s['org_country'] ?? 'IN',
            'availableLanguage' => ['en', 'hi'],
        ]];
    }

    $website = [
        '@type'     => 'WebSite',
        '@id'       => $siteId,
        'url'       => seo_url('/'),
        'name'      => $s['site_name'],
        'publisher' => ['@id' => $orgId],
        'inLanguage' => 'en-IN',
    ];

    return [$org, $website];
}

/**
 * Breadcrumbs derived from the URL path. Emitted on every page except home so
 * Google can render the breadcrumb trail in place of a raw URL.
 */
function seo_breadcrumbs(string $path, string $label): ?array
{
    $path = trim($path, '/');
    if ($path === '') {
        return null;
    }

    return [
        '@type'           => 'BreadcrumbList',
        '@id'             => seo_url($path . '/') . '#breadcrumb',
        'itemListElement' => [
            ['@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => seo_url('/')],
            ['@type' => 'ListItem', 'position' => 2, 'name' => $label, 'item' => seo_url($path . '/')],
        ],
    ];
}

/**
 * Render the full SEO head block.
 *
 * @param string $pageKey   row in `page_seo`
 * @param array  $overrides runtime values that win over the stored row
 *                          (used by blogs/index.php for per-article meta)
 */
function seo_head(string $pageKey, array $overrides = []): void
{
    $s    = seo_settings();
    $page = array_merge(seo_page($pageKey), array_filter($overrides, fn($v) => $v !== null && $v !== ''));

    $path      = $page['path']  ?? '/';
    $label     = $page['label'] ?? $s['site_name'];
    $title     = $page['meta_title'] ?: ($label . ' ' . $s['title_separator'] . ' ' . $s['title_suffix']);
    $desc      = $page['meta_description'] ?? '';
    $canonical = !empty($page['canonical_url']) ? $page['canonical_url'] : seo_url($path);

    $ogTitle = $page['og_title']       ?: $title;
    $ogDesc  = $page['og_description'] ?: $desc;
    $ogImage = $page['og_image']       ?: ($s['default_og_image'] ?? '');
    $ogType  = $page['og_type']        ?: 'website';
    $card    = $page['twitter_card']   ?: 'summary_large_image';

    $robots = [];
    $robots[] = !empty($page['robots_noindex'])  ? 'noindex'  : 'index';
    $robots[] = !empty($page['robots_nofollow']) ? 'nofollow' : 'follow';
    if (empty($page['robots_noindex'])) {
        // Allow full rich previews in search results and AI surfaces.
        $robots[] = 'max-snippet:-1';
        $robots[] = 'max-image-preview:large';
        $robots[] = 'max-video-preview:-1';
    }

    echo '    <meta charset="UTF-8" />' . PHP_EOL;
    echo '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />' . PHP_EOL;
    echo '    <title>' . seo_e($title) . '</title>' . PHP_EOL;

    if ($desc !== '') {
        echo '    <meta name="description" content="' . seo_e($desc) . '" />' . PHP_EOL;
    }
    if (!empty($page['meta_keywords'])) {
        echo '    <meta name="keywords" content="' . seo_e($page['meta_keywords']) . '" />' . PHP_EOL;
    }

    echo '    <meta name="robots" content="' . seo_e(implode(', ', $robots)) . '" />' . PHP_EOL;
    echo '    <link rel="canonical" href="' . seo_e($canonical) . '" />' . PHP_EOL;

    // Open Graph
    echo '    <meta property="og:site_name" content="' . seo_e($s['site_name']) . '" />' . PHP_EOL;
    echo '    <meta property="og:locale" content="en_IN" />' . PHP_EOL;
    echo '    <meta property="og:type" content="' . seo_e($ogType) . '" />' . PHP_EOL;
    echo '    <meta property="og:title" content="' . seo_e($ogTitle) . '" />' . PHP_EOL;
    if ($ogDesc !== '') {
        echo '    <meta property="og:description" content="' . seo_e($ogDesc) . '" />' . PHP_EOL;
    }
    echo '    <meta property="og:url" content="' . seo_e($canonical) . '" />' . PHP_EOL;
    if ($ogImage !== '') {
        echo '    <meta property="og:image" content="' . seo_e(seo_url($ogImage)) . '" />' . PHP_EOL;
        echo '    <meta property="og:image:width" content="1200" />' . PHP_EOL;
        echo '    <meta property="og:image:height" content="630" />' . PHP_EOL;
        if (!empty($overrides['og_image_alt'])) {
            echo '    <meta property="og:image:alt" content="' . seo_e($overrides['og_image_alt']) . '" />' . PHP_EOL;
        }
    }

    // Twitter / X
    echo '    <meta name="twitter:card" content="' . seo_e($card) . '" />' . PHP_EOL;
    echo '    <meta name="twitter:title" content="' . seo_e($ogTitle) . '" />' . PHP_EOL;
    if ($ogDesc !== '') {
        echo '    <meta name="twitter:description" content="' . seo_e($ogDesc) . '" />' . PHP_EOL;
    }
    if ($ogImage !== '') {
        echo '    <meta name="twitter:image" content="' . seo_e(seo_url($ogImage)) . '" />' . PHP_EOL;
    }
    if (!empty($s['twitter_handle'])) {
        echo '    <meta name="twitter:site" content="' . seo_e($s['twitter_handle']) . '" />' . PHP_EOL;
    }

    // Search console verification
    if (!empty($s['google_verification'])) {
        echo '    <meta name="google-site-verification" content="' . seo_e($s['google_verification']) . '" />' . PHP_EOL;
    }
    if (!empty($s['bing_verification'])) {
        echo '    <meta name="msvalidate.01" content="' . seo_e($s['bing_verification']) . '" />' . PHP_EOL;
    }

    // ─── JSON-LD ───
    $graph = seo_organization_graph();

    $extraNodes = $overrides['schema'] ?? [];

    $webPage = [
        '@type'      => 'WebPage',
        '@id'        => $canonical . '#webpage',
        'url'        => $canonical,
        'name'       => $title,
        'isPartOf'   => ['@id' => seo_url('/') . '#website'],
        'about'      => ['@id' => seo_url('/') . '#organization'],
        'inLanguage' => 'en-IN',
    ];
    if ($desc !== '') {
        $webPage['description'] = $desc;
    }

    // A caller that supplies its own trail (blog articles need the extra
    // "Blog" level) wins; emitting both would put two BreadcrumbLists on the
    // page and Google picks one arbitrarily.
    $callerCrumbs = null;
    foreach ($extraNodes as $node) {
        if (($node['@type'] ?? '') === 'BreadcrumbList') {
            $callerCrumbs = $node;
            break;
        }
    }
    $crumbs = $callerCrumbs ?? seo_breadcrumbs($path, $label);

    if ($crumbs) {
        $webPage['breadcrumb'] = ['@id' => $crumbs['@id']];
        if (!$callerCrumbs) {
            $extraNodes[] = $crumbs;
        }
    }

    // Appended only once fully built — PHP copies arrays by value, so mutating
    // $webPage after pushing it would silently drop the change.
    $graph[] = $webPage;

    // Extra graph nodes supplied at runtime (Article, Course, FAQPage …)
    foreach ($extraNodes as $node) {
        $graph[] = $node;
    }

    echo '    <script type="application/ld+json">' . PHP_EOL;
    echo seo_json(['@context' => 'https://schema.org', '@graph' => $graph]) . PHP_EOL;
    echo '    </script>' . PHP_EOL;

    // Admin-authored JSON-LD. Parsed and re-encoded rather than echoed, so
    // malformed or hostile input can never reach the page as raw markup.
    if (!empty($page['structured_data'])) {
        $decoded = json_decode((string) $page['structured_data'], true);
        if (is_array($decoded)) {
            echo '    <script type="application/ld+json">' . PHP_EOL;
            echo seo_json($decoded) . PHP_EOL;
            echo '    </script>' . PHP_EOL;
        } else {
            error_log("page_seo.structured_data for '{$pageKey}' is not valid JSON — skipped");
        }
    }
}
