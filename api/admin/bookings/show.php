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
            id, first_name, last_name, age, gender,
            phone, email, country, city,
            consult_type, diagnosed, mode, concern,
            appointment_date, appointment_time,
            booking_ref, status, ip_address,
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
            'first_name'       => $r['first_name'],
            'last_name'        => $r['last_name'],
            'full_name'        => trim($r['first_name'] . ' ' . $r['last_name']),
            'age'              => (int) $r['age'],
            'gender'           => $r['gender'],
            'phone'            => $r['phone'],
            'email'            => $r['email'],
            'country'          => $r['country'],
            'city'             => $r['city'],
            'consult_type'     => $r['consult_type'],
            'diagnosed'        => $r['diagnosed'],
            'mode'             => $r['mode'],
            'concern'          => $r['concern'],
            'appointment_date' => $r['appointment_date'],
            'appointment_time' => $r['appointment_time'],
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
