<?php
/**
 * Image upload validation.
 *
 * The previous per-endpoint checks trusted the client-supplied filename
 * extension and nothing else — no size cap, no MIME sniff, no proof the bytes
 * were actually an image. This centralises the rules so every upload path gets
 * the same treatment.
 *
 * SVG is deliberately not allowed: it is an XML document that can carry
 * <script>, so serving user-supplied SVG from our own origin would be stored XSS.
 */

require_once __DIR__ . '/bootstrap.php';

const UPLOAD_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/** MIME type => canonical extension. The MIME is authoritative, not the filename. */
const UPLOAD_ALLOWED_TYPES = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif',
];

/**
 * Validate an entry from $_FILES and move it into $destDir.
 *
 * @return string public URL path of the stored file
 * @throws RuntimeException with a human-readable reason on any failure
 */
function storeUploadedImage(array $file, string $destDir, string $publicPrefix, string $prefix = ''): string
{
    if (!isset($file['error']) || is_array($file['error'])) {
        throw new RuntimeException('Malformed upload');
    }

    switch ($file['error']) {
        case UPLOAD_ERR_OK:
            break;
        case UPLOAD_ERR_INI_SIZE:
        case UPLOAD_ERR_FORM_SIZE:
            throw new RuntimeException('Image is larger than the server allows');
        case UPLOAD_ERR_NO_FILE:
            throw new RuntimeException('No image was uploaded');
        default:
            throw new RuntimeException('Upload failed (code ' . $file['error'] . ')');
    }

    if (($file['size'] ?? 0) > UPLOAD_MAX_BYTES) {
        throw new RuntimeException('Image must be 5 MB or smaller');
    }

    // Guards against a plain POST field being passed off as an upload.
    if (!is_uploaded_file($file['tmp_name'])) {
        throw new RuntimeException('Invalid upload');
    }

    // Sniff the real type from the bytes rather than trusting the filename.
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime  = $finfo->file($file['tmp_name']) ?: '';
    if (!isset(UPLOAD_ALLOWED_TYPES[$mime])) {
        throw new RuntimeException('Unsupported image type. Allowed: JPG, PNG, WebP, GIF');
    }

    // A file can sniff as image/* and still not be a decodable image.
    $dimensions = @getimagesize($file['tmp_name']);
    if ($dimensions === false || empty($dimensions[0]) || empty($dimensions[1])) {
        throw new RuntimeException('File is not a readable image');
    }
    if ($dimensions[0] > 10000 || $dimensions[1] > 10000) {
        throw new RuntimeException('Image dimensions are too large (max 10000px)');
    }

    $ext = UPLOAD_ALLOWED_TYPES[$mime];

    // getimagesize() is NOT enough on its own: "GIF89a" followed by arbitrary
    // bytes still reports valid dimensions, so a polyglot carrying a PHP
    // payload passes every header check. Re-encoding through GD is what
    // actually removes it — the output is rebuilt from decoded pixels, so
    // anything appended to the original file simply is not carried over.
    // It also strips EXIF, which is a privacy win on user-supplied photos.
    if (!is_dir($destDir) && !mkdir($destDir, 0755, true) && !is_dir($destDir)) {
        throw new RuntimeException('Upload directory could not be created');
    }

    // Name is generated, never derived from user input, so path traversal and
    // double-extension tricks have nothing to act on.
    $filename = ($prefix !== '' ? $prefix . '-' : '') . bin2hex(random_bytes(16)) . '.' . $ext;
    $target   = rtrim($destDir, '/') . '/' . $filename;

    if (extension_loaded('gd')) {
        // GD keeps only the first frame, so silently re-encoding an animated
        // GIF would quietly destroy the animation. Say so instead.
        if ($mime === 'image/gif' && isAnimatedGif($file['tmp_name'])) {
            throw new RuntimeException('Animated GIFs are not supported — upload a static image or a video');
        }

        $image = @imagecreatefromstring(file_get_contents($file['tmp_name']));
        if ($image === false) {
            throw new RuntimeException('Image could not be decoded');
        }

        imagealphablending($image, false);
        imagesavealpha($image, true);

        $written = match ($ext) {
            'jpg'  => imagejpeg($image, $target, 88),
            'png'  => imagepng($image, $target, 6),
            'webp' => imagewebp($image, $target, 88),
            'gif'  => imagegif($image, $target),
        };
        imagedestroy($image);

        if (!$written) {
            throw new RuntimeException('Failed to save the uploaded image');
        }
    } elseif (!move_uploaded_file($file['tmp_name'], $target)) {
        // Without GD the bytes are stored as-is. uploads/.htaccess is what
        // keeps that from being executable.
        throw new RuntimeException('Failed to save the uploaded image');
    }

    @chmod($target, 0644);

    return rtrim($publicPrefix, '/') . '/' . $filename;
}

/** More than one Graphic Control Extension block means multiple frames. */
function isAnimatedGif(string $path): bool
{
    $contents = file_get_contents($path);
    return $contents !== false && substr_count($contents, "\x00\x21\xF9\x04") > 1;
}
