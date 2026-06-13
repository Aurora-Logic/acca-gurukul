<?php
/**
 * GET /api/admin/bookings/show.php?id=123
 * Returns a single booking. Auth required.
 */

if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'HEAD'], true)) {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/auth.php';
requireAuth();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonError('Invalid id', 422);
}

try {
    $stmt = db()->prepare('
        SELECT
            id, name, phone, email,
            course, qualification, year_of_passing, location,
            appointment_date, appointment_time,
            source, message, booking_ref, status, ip_address,
            created_at, updated_at
        FROM `bookings`
        WHERE id = :id
        LIMIT 1
    ');
    $stmt->execute([':id' => $id]);
    $r = $stmt->fetch();

    if (!$r) {
        jsonError('Booking not found', 404);
    }

    jsonSuccess('OK', [
        'booking' => [
            'id'               => (int) $r['id'],
            'name'             => $r['name'],
            'full_name'        => $r['name'], // fallback/alias for backward compatibility
            'phone'            => $r['phone'],
            'email'            => $r['email'],
            'course'           => $r['course'],
            'qualification'    => $r['qualification'],
            'year_of_passing'  => $r['year_of_passing'],
            'location'         => $r['location'],
            'appointment_date' => $r['appointment_date'],
            'appointment_time' => $r['appointment_time'],
            'source'           => $r['source'],
            'message'          => $r['message'],
            'booking_ref'      => $r['booking_ref'],
            'status'           => $r['status'],
            'ip_address'       => $r['ip_address'],
            'created_at'       => $r['created_at'],
            'updated_at'       => $r['updated_at'],
        ],
    ]);

} catch (PDOException $e) {
    error_log('bookings/show error: ' . $e->getMessage());
    jsonError('Failed to load booking', 500);
}
