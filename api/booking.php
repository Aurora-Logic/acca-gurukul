<?php
/**
 * Booking API
 * POST /api/booking.php
 *
 * Security:
 *  - Method lock (POST only)
 *  - Payload size cap (rejects > 16KB bodies)
 *  - Honeypot bot trap (hidden `website` field)
 *  - IP-based rate limiting (3 submissions / 1h / IP)
 *  - SQL injection: PDO prepared statements only
 *  - XSS: htmlspecialchars on every stored string
 *  - Strict input validation per field + whitelists for enums
 *  - Date sanity checks (no past, no Sunday, ≤ 3 months ahead)
 *  - Unique booking_ref with collision-safe retry
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/config/bootstrap.php';

// ─── Rate Limiting ───
const RATE_WINDOW = 3600;  // 1 hour
const RATE_MAX    = 3;     // max 3 bookings per IP per hour

$clientIp = getClientIp();
checkRateLimit($clientIp, 'booking', RATE_WINDOW, RATE_MAX);

// ─── Parse body ───
$raw = file_get_contents('php://input');

if (strlen($raw) > 16384) {
    jsonError('Request too large', 413);
}

$data = json_decode($raw, true);
if (!is_array($data)) {
    jsonError('Invalid JSON body', 400);
}

// Honeypot
if (!empty($data['website'] ?? '')) {
    jsonSuccess('Booking received', ['booking_ref' => 'ACCA-000000']);
}

// Map camelCase keys from HTML/JS form to snake_case keys if present
if (isset($data['counsellingName'])) {
    $data['name'] = $data['counsellingName'];
}
if (isset($data['counsellingPhone'])) {
    $data['phone'] = $data['counsellingPhone'];
}
if (isset($data['counsellingEmail'])) {
    $data['email'] = $data['counsellingEmail'];
}
if (isset($data['counsellingCourse'])) {
    $data['course'] = $data['counsellingCourse'];
}
if (isset($data['counsellingQual'])) {
    $data['qualification'] = $data['counsellingQual'];
}
if (isset($data['counsellingYear'])) {
    $data['year_of_passing'] = $data['counsellingYear'];
}
if (isset($data['counsellingLocation'])) {
    $data['location'] = $data['counsellingLocation'];
}
if (isset($data['counsellingDate'])) {
    $data['date'] = $data['counsellingDate'];
}
if (isset($data['counsellingTime'])) {
    $data['time'] = $data['counsellingTime'];
}
if (isset($data['counsellingSource'])) {
    $data['source'] = $data['counsellingSource'];
}
if (isset($data['counsellingMsg'])) {
    $data['message'] = $data['counsellingMsg'];
}

// ─── Required fields ───
$required = [
    'name', 'phone', 'email', 'course', 'qualification', 'location', 'date', 'time'
];
$missing = validateRequired($data, $required);
if (!empty($missing)) {
    jsonError('Missing required fields', 422, ['missing' => $missing]);
}

// ─── Sanitize ───
$name           = sanitize($data['name']            ?? '');
$phone          = sanitize($data['phone']           ?? '');
$email          = sanitize($data['email']           ?? '');
$course         = sanitize($data['course']          ?? '');
$qualification  = sanitize($data['qualification']   ?? '');
$yearOfPassing  = sanitize($data['year_of_passing']  ?? '');
$location       = sanitize($data['location']        ?? '');
$date           = sanitize($data['date']            ?? '');
$time           = sanitize($data['time']            ?? '');
$source         = sanitize($data['source']          ?? '');
$message        = sanitize($data['message']         ?? '');

// ─── Validation Rules ───

// Name: 1-100 chars, letters/spaces/hyphens/apostrophes only
if (strlen($name) < 1 || strlen($name) > 100) {
    jsonError("Name must be between 1 and 100 characters", 422);
}
if (!preg_match('/^[\p{L}\s\'\-]+$/u', $name)) {
    jsonError("Name contains invalid characters", 422);
}

// Phone — international format after normalization
$phoneClean = preg_replace('/[\s\-\(\)]/', '', $phone);
if (!preg_match('/^\+?[0-9]{7,20}$/', $phoneClean)) {
    jsonError('Invalid phone number', 422);
}

// Email
if (strlen($email) > 100) {
    jsonError('Email must be under 100 characters', 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonError('Invalid email address', 422);
}
$emailDomain = substr($email, strpos($email, '@') + 1);
if (!checkdnsrr($emailDomain, 'MX') && !checkdnsrr($emailDomain, 'A')) {
    jsonError('Email domain appears invalid', 422);
}

// Course whitelist
$allowedCourses = [
    'acca-knowledge',
    'acca-skills',
    'acca-professional',
    'acca-diploma',
];
if (!in_array($course, $allowedCourses, true)) {
    jsonError('Invalid course level', 422);
}

// Qualification whitelist
$allowedQualifications = [
    'undergraduate',
    'graduate',
    'postgraduate',
    'ca-ipcc',
    'ca-final',
    'working-professional',
];
if (!in_array($qualification, $allowedQualifications, true)) {
    jsonError('Invalid qualification selected', 422);
}

// Year of passing whitelist (optional field)
if ($yearOfPassing !== '') {
    $allowedYears = ['2026', '2025', '2024', '2023', 'before-2023'];
    if (!in_array($yearOfPassing, $allowedYears, true)) {
        jsonError('Invalid year of passing', 422);
    }
}

// Location whitelist
$allowedLocations = [
    'online',
    'mumbai',
    'pune',
    'delhi',
    'bengaluru',
];
if (!in_array($location, $allowedLocations, true)) {
    jsonError('Invalid preferred location', 422);
}

// Source whitelist (optional field)
if ($source !== '') {
    $allowedSources = ['google', 'social-media', 'friend-referral', 'newspaper'];
    if (!in_array($source, $allowedSources, true)) {
        jsonError('Invalid source type', 422);
    }
}

// Message/Concern limit
if (strlen($message) > 1000) {
    jsonError('Message must be under 1000 characters', 422);
}

// Date — must be YYYY-MM-DD, not in the past, not Sunday, not > 3 months ahead
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    jsonError('Invalid date format', 422);
}

try {
    $appointmentDate = new DateTime($date);
    $today           = new DateTime('today');
    $maxDate         = (new DateTime('today'))->modify('+3 months');
} catch (Exception $e) {
    jsonError('Invalid date', 422);
}

if ($appointmentDate < $today) {
    jsonError('Appointment date cannot be in the past', 422);
}
if ($appointmentDate > $maxDate) {
    jsonError('Appointment date cannot be more than 3 months ahead', 422);
}
if ((int)$appointmentDate->format('w') === 0) {
    jsonError('We are closed on Sundays. Please choose another date.', 422);
}

// Time — must match one of the allowed slots (morning, afternoon, evening)
$allowedSlots = ['morning', 'afternoon', 'evening'];
if (!in_array($time, $allowedSlots, true)) {
    jsonError('Invalid time slot', 422);
}

// ─── Generate unique booking reference ───
$bookingRef = generateBookingRef();

// ─── Insert ───
try {
    $stmt = db()->prepare('
        INSERT INTO `bookings` (
            `name`, `phone`, `email`,
            `course`, `qualification`, `year_of_passing`, `location`,
            `appointment_date`, `appointment_time`,
            `source`, `message`,
            `booking_ref`, `ip_address`, `created_at`
        ) VALUES (
            :name, :phone, :email,
            :course, :qualification, :year_of_passing, :location,
            :appointment_date, :appointment_time,
            :source, :message,
            :booking_ref, :ip_address, NOW()
        )
    ');

    $stmt->execute([
        ':name'             => $name,
        ':phone'            => $phoneClean,
        ':email'            => $email,
        ':course'           => $course,
        ':qualification'    => $qualification,
        ':year_of_passing'  => $yearOfPassing ?: null,
        ':location'         => $location,
        ':appointment_date' => $appointmentDate->format('Y-m-d'),
        ':appointment_time' => $time,
        ':source'           => $source ?: null,
        ':message'          => $message ?: null,
        ':booking_ref'      => $bookingRef,
        ':ip_address'       => $clientIp,
    ]);

    $id = db()->lastInsertId();

    jsonSuccess('Booking received', [
        'id'               => (int)$id,
        'booking_ref'      => $bookingRef,
        'appointment_date' => $appointmentDate->format('Y-m-d'),
        'appointment_time' => $time,
    ], 201);

} catch (PDOException $e) {
    error_log('Booking API error: ' . $e->getMessage());
    jsonError('Failed to save your booking. Please try again.', 500);
}

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

/**
 * Generate a unique booking reference like ACCA-482174.
 * Retries up to 10 times on UNIQUE constraint collision.
 */
function generateBookingRef(): string
{
    $pdo = db();
    for ($i = 0; $i < 10; $i++) {
        $ref = 'ACCA-' . str_pad((string)random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        $stmt = $pdo->prepare('SELECT 1 FROM `bookings` WHERE `booking_ref` = :ref LIMIT 1');
        $stmt->execute([':ref' => $ref]);
        if (!$stmt->fetchColumn()) {
            return $ref;
        }
    }
    // Fallback — extremely unlikely: add an extra digit
    return 'ACCA-' . random_int(1000000, 9999999);
}