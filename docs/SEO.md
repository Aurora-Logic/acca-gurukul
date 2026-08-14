# SEO

All SEO for the public site is stored in the database and rendered by
`components/seo.php`. Nothing is hardcoded in the page templates, and nothing is
written to disk, so an editor's work survives every deploy.

## How a page gets its tags

Each public page calls one function as the first thing inside `<head>`:

```php
<head>
<?php
require_once __DIR__ . '/../components/seo.php';
seo_head('about-us');   // matches page_seo.page_key
?>
```

That emits the title, meta description, canonical, robots directives, Open
Graph and Twitter tags, and the JSON-LD graph. Pages supply runtime extras via
the second argument — `blogs/index.php` uses it to pass per-article values and
a `BlogPosting` node.

## Tables

| Table | Purpose |
| --- | --- |
| `page_seo` | One row per public page: title, description, canonical, social, robots, sitemap settings, optional JSON-LD |
| `seo_settings` | Single row: organisation identity, social profiles, verification tokens, `robots.txt` body |

Run `api/sql/seo.sql` once to create and seed both.

## Admin screens

| Screen | Path |
| --- | --- |
| Page list with a health score per page | `/admin/seo` |
| Per-page editor with a live Google preview | `/admin/seo/<page_key>/edit` |
| Organisation identity, socials, verification, robots.txt | `/admin/seo/settings` |
| Sitemap preview and inclusion reasons | `/admin/sitemap` |

## Generated endpoints

- `/sitemap.xml` — built on request from `page_seo` plus published blogs.
  Pages set to `noindex` or `in_sitemap = 0` are left out.
- `/robots.txt` — the body from `seo_settings.robots_txt`, with a `Sitemap:`
  line appended automatically if it is missing.

Both are dynamic. Do not commit a static `sitemap.xml` into the web root — the
rewrite rule only falls through to `sitemap.php` when no real file exists, so a
stale file would shadow the live one permanently.

## Structured data

Every page carries a shared graph: `EducationalOrganization` + `LocalBusiness`,
`WebSite`, `WebPage`, and a `BreadcrumbList` on everything below the homepage.
On top of that:

- Homepage — `FAQPage`, built from the active rows in `faqs`
- `/acca-course/` and `/fia/` — `Course`, editable in the page's Advanced tab
- Blog articles — `BlogPosting`, plus `FAQPage` when the post defines FAQs

Admin-authored JSON is parsed and re-encoded before output, never concatenated
into the page, and all JSON-LD is encoded with `JSON_HEX_TAG`. A `</script>` in
the input cannot break out of the block.

## Before go-live

These need doing on the live host — they cannot be done from the codebase:

1. **Turn on the canonical redirects.** `.htaccess` has the HTTPS and
   www-to-apex 301s commented out at the top. Uncomment both once the TLS
   certificate is installed. Until then the site answers on up to four URLs and
   splits its own ranking signals.
2. **Verify the domain in Google Search Console**, paste the token into
   `/admin/seo/settings` → Verification, then submit `https://accagurukul.com/sitemap.xml`.
3. **Set the real address and coordinates** in `/admin/seo/settings` →
   Organisation. Local results for "ACCA coaching near me" depend on it.
4. **Add the social profile URLs** in the same screen so Google can connect
   them to the organisation.
5. **Request indexing** for the homepage in Search Console. The site previously
   served a meta-refresh stub at `/`, so Google needs to recrawl the root.

## Known trade-offs

- `unpkg.com/lucide@latest` is loaded from a third-party CDN on every page and
  is unpinned, so an upstream change ships straight to production. Self-hosting
  a pinned copy would remove both the render dependency and the supply-chain
  risk.
- Some images are hotlinked from `plus.unsplash.com` and `upload.wikimedia.org`.
  They cost an extra DNS lookup and TLS handshake on the critical path and can
  disappear without notice. Serving them from `/assets/` would be faster and
  safer.
