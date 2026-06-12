<?php
/**
 * iRUS — Booking API
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
    jsonSuccess('Booking received', ['booking_ref' => 'IRUS-000000']);
}

// ─── Required fields ───
$required = [
    'firstName', 'lastName', 'age', 'phone', 'email',
    'consultType', 'diagnosed', 'mode',
    'date', 'time'
];
$missing = validateRequired($data, $required);
if (!empty($missing)) {
    jsonError('Missing required fields', 422, ['missing' => $missing]);
}

// ─── Sanitize ───
$firstName   = sanitize($data['firstName']   ?? '');
$lastName    = sanitize($data['lastName']    ?? '');
$age         = (int)($data['age']            ?? 0);
$gender      = sanitize($data['gender']      ?? 'Male');
$phone       = sanitize($data['phone']       ?? '');
$email       = sanitize($data['email']       ?? '');
$country     = sanitize($data['country']     ?? '');
$city        = sanitize($data['city']        ?? '');
$consultType = sanitize($data['consultType'] ?? 'General consultation');
$diagnosed   = sanitize($data['diagnosed']   ?? 'No');
$mode        = sanitize($data['mode']        ?? 'In person');
$concern     = sanitize($data['concern']     ?? '');
$date        = sanitize($data['date']        ?? '');
$time        = sanitize($data['time']        ?? '');

// ─── Validation Rules ───

// Names: 1-30 chars, letters/spaces/hyphens/apostrophes only
foreach (['First name' => $firstName, 'Last name' => $lastName] as $label => $val) {
    if (strlen($val) < 1 || strlen($val) > 30) {
        jsonError("{$label} must be between 1 and 30 characters", 422);
    }
    if (!preg_match('/^[\p{L}\s\'\-]+$/u', $val)) {
        jsonError("{$label} contains invalid characters", 422);
    }
}

// Age
if ($age < 1 || $age > 120) {
    jsonError('Age must be between 1 and 120', 422);
}

// Gender whitelist
$allowedGenders = ['Male', 'Female', 'Other'];
if (!in_array($gender, $allowedGenders, true)) {
    jsonError('Invalid gender', 422);
}

// Phone — international format after intl-tel-input normalisation
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

// Country / city — lightly validated (too many valid values to whitelist)
if ($country !== '' && strlen($country) > 100) {
    jsonError('Country too long', 422);
}
if ($city !== '' && strlen($city) > 100) {
    jsonError('City too long', 422);
}
// Strip anything that isn't letters, spaces, hyphens, apostrophes, commas, or dots
if ($country !== '' && !preg_match('/^[\p{L}\s\'\-\.\,]+$/u', $country)) {
    jsonError('Country contains invalid characters', 422);
}
if ($city !== '' && !preg_match('/^[\p{L}\s\'\-\.\,]+$/u', $city)) {
    jsonError('City contains invalid characters', 422);
}

// Consult type whitelist
$allowedConsultTypes = [
    'General consultation',
    'Robotic prostatectomy',
    'Kidney cancer surgery',
    'Bladder cancer treatment',
    'MRI fusion biopsy',
    'HIFU focal therapy',
    'Second opinion',
    'Something else',
];
if (!in_array($consultType, $allowedConsultTypes, true)) {
    $consultType = 'General consultation';
}

// Diagnosed whitelist
$allowedDiagnosed = ['Yes', 'No', 'Not sure'];
if (!in_array($diagnosed, $allowedDiagnosed, true)) {
    jsonError('Invalid "diagnosed" value', 422);
}

// Mode whitelist
$allowedModes = ['In person', 'Video call'];
if (!in_array($mode, $allowedModes, true)) {
    jsonError('Invalid consultation mode', 422);
}

// Concern
if (strlen($concern) > 1000) {
    jsonError('Concern must be under 1000 characters', 422);
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

// Time — must match one of the allowed slots
$allowedSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
    '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM',
];
if (!in_array($time, $allowedSlots, true)) {
    jsonError('Invalid time slot', 422);
}

// ─── Generate unique booking reference ───
$bookingRef = generateBookingRef();

// ─── Insert ───
try {
    $stmt = db()->prepare('
        INSERT INTO `bookings` (
            `first_name`, `last_name`, `age`, `gender`,
            `phone`, `email`, `country`, `city`,
            `consult_type`, `diagnosed`, `mode`, `concern`,
            `appointment_date`, `appointment_time`,
            `booking_ref`, `ip_address`, `created_at`
        ) VALUES (
            :first_name, :last_name, :age, :gender,
            :phone, :email, :country, :city,
            :consult_type, :diagnosed, :mode, :concern,
            :appointment_date, :appointment_time,
            :booking_ref, :ip_address, NOW()
        )
    ');

    $stmt->execute([
        ':first_name'       => $firstName,
        ':last_name'        => $lastName,
        ':age'              => $age,
        ':gender'           => $gender,
        ':phone'            => $phoneClean,
        ':email'            => $email,
        ':country'          => $country ?: null,
        ':city'             => $city ?: null,
        ':consult_type'     => $consultType,
        ':diagnosed'        => $diagnosed,
        ':mode'             => $mode,
        ':concern'          => $concern ?: null,
        ':appointment_date' => $appointmentDate->format('Y-m-d'),
        ':appointment_time' => $time,
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
 * Generate a unique booking reference like IRUS-482174.
 * Retries up to 10 times on UNIQUE constraint collision.
 */
function generateBookingRef(): string
{
    $pdo = db();
    for ($i = 0; $i < 10; $i++) {
        $ref = 'IRUS-' . str_pad((string)random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        $stmt = $pdo->prepare('SELECT 1 FROM `bookings` WHERE `booking_ref` = :ref LIMIT 1');
        $stmt->execute([':ref' => $ref]);
        if (!$stmt->fetchColumn()) {
            return $ref;
        }
    }
    // Fallback — extremely unlikely: add an extra digit
    return 'IRUS-' . random_int(1000000, 9999999);
}

