<?php
/**
 * .env loader
 * Reads the project root .env file and populates $_ENV + putenv().
 * Call env('KEY', 'default') anywhere after this file is included.
 */

function loadEnv(string $path): void
{
    if (!file_exists($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    foreach ($lines as $line) {
        // Skip comments
        $line = trim($line);
        if ($line === '' || $line[0] === '#') {
            continue;
        }

        // Split on first '='
        $pos = strpos($line, '=');
        if ($pos === false) {
            continue;
        }

        $key   = trim(substr($line, 0, $pos));
        $value = trim(substr($line, $pos + 1));

        // Strip surrounding quotes if present
        if (
            (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
            (str_starts_with($value, "'") && str_ends_with($value, "'"))
        ) {
            $value = substr($value, 1, -1);
        }

        $_ENV[$key] = $value;
        putenv("$key=$value");
    }
}

/**
 * Get an environment variable with an optional default.
 */
function env(string $key, mixed $default = null): mixed
{
    return $_ENV[$key] ?? getenv($key) ?: $default;
}

// Auto-load .env from project root
loadEnv(__DIR__ . '/../../.env');
