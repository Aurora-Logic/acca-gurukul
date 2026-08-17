<?php
/**
 * Serves the IndexNow verification key for search engine validation.
 *
 * Bing and IndexNow verify domain ownership by requesting https://<domain>/<key>.txt
 */

require_once __DIR__ . '/components/indexnow.php';

header('Content-Type: text/plain; charset=utf-8');
header('X-Robots-Tag: noindex');

echo indexnow_get_key() . PHP_EOL;
