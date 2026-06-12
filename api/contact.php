<?php
/**
 * iRUS — Contact Form API
 * POST /api/contact.php
 *
 * Security:
 *  - CSRF-safe (stateless JSON API, no cookies)
 *  - SQL injection: PDO prepared statements only
 *  - XSS: all inputs sanitized + htmlspecialchars on output
 *  - Rate limiting: IP-based, configurable window + max hits
 *  - Input validation: type checks, length caps, email regex, phone regex
 *  - Honeypot field: hidden field that bots fill, humans don't
 *  - Request size limit: rejects oversized payloads
 */

// Only POST allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/config/bootstrap.php';

// ─── Rate Limiting (IP-based, stored in DB) ───
$RATE_WINDOW  = 3600; // 1 hour window
$RATE_MAX     = 5;    // max 5 submissions per window per IP

$clientIp = getClientIp();

// Check rate limit
checkRateLimit($clientIp, 'contact', $RATE_WINDOW, $RATE_MAX);

// ─── Parse & Validate Input ───
$raw = file_get_contents('php://input');

// Reject oversized payloads (max 8KB for a contact form)
if (strlen($raw) > 8192) {
    jsonError('Request too large', 413);
}

$data = json_decode($raw, true);

if (!is_array($data)) {
    jsonError('Invalid JSON body', 400);
}

// Honeypot check — if 'website' field has a value, it's a bot
if (!empty($data['website'] ?? '')) {
    // Silently accept but don't store — bot thinks it succeeded
    jsonSuccess('Message sent successfully');
}

// Required fields
$required = ['name', 'phone', 'email'];
$missing  = validateRequired($data, $required);
if (!empty($missing)) {
    jsonError('Missing required fields', 422, ['missing' => $missing]);
}

// Sanitize all inputs
$name    = sanitize($data['name']    ?? '');
$phone   = sanitize($data['phone']   ?? '');
$email   = sanitize($data['email']   ?? '');
$topic   = sanitize($data['topic']   ?? 'General consultation');
$message = sanitize($data['message'] ?? '');

// ─── Validation Rules ───

// Name: 1-60 chars, letters/spaces/hyphens/apostrophes only
if (strlen($name) < 1 || strlen($name) > 60) {
    jsonError('Name must be between 1 and 60 characters', 422);
}
if (!preg_match('/^[\p{L}\s\'\-]+$/u', $name)) {
    jsonError('Name contains invalid characters', 422);
}

// Phone: 7-20 digits, optional leading + and spaces/dashes
$phoneClean = preg_replace('/[\s\-\(\)]/', '', $phone);
if (!preg_match('/^\+?[0-9]{7,20}$/', $phoneClean)) {
    jsonError('Invalid phone number', 422);
}

// Email: valid format, max 100 chars
if (strlen($email) > 100) {
    jsonError('Email must be under 100 characters', 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonError('Invalid email address', 422);
}
// Extra DNS check — does the domain have MX records?
$emailDomain = substr($email, strpos($email, '@') + 1);
if (!checkdnsrr($emailDomain, 'MX') && !checkdnsrr($emailDomain, 'A')) {
    jsonError('Email domain appears invalid', 422);
}

// Topic: must be one of the allowed values
$allowedTopics = [
    'General consultation',
    'Robotic prostatectomy',
    'Kidney cancer surgery',
    'Bladder cancer treatment',
    'MRI fusion biopsy',
    'HIFU focal therapy',
    'Second opinion',
    'Something else',
];
if (!in_array($topic, $allowedTopics, true)) {
    $topic = 'General consultation'; // silently default
}

// Message: max 1000 chars
if (strlen($message) > 1000) {
    jsonError('Message must be under 1000 characters', 422);
}

// ─── Insert into DB ───
try {
    $stmt = db()->prepare(
        'INSERT INTO `contacts` (`name`, `phone`, `email`, `topic`, `message`, `ip_address`, `created_at`)
         VALUES (:name, :phone, :email, :topic, :message, :ip, NOW())'
    );

    $stmt->execute([
        ':name'    => $name,
        ':phone'   => $phoneClean,
        ':email'   => $email,
        ':topic'   => $topic,
        ':message' => $message,
        ':ip'      => $clientIp,
    ]);

    $id = db()->lastInsertId();

    jsonSuccess('Message sent successfully', ['id' => (int) $id], 201);

} catch (PDOException $e) {
    error_log('Contact API error: ' . $e->getMessage());
    jsonError('Failed to save your message. Please try again.', 500);
}

