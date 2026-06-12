<?php
/**
 * GET /api/admin/bookings/list.php
 * Returns all bookings ordered by created_at DESC. Auth required.
 */

if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'HEAD'], true)) {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/auth.php';
requireAuth();

try {
    $stmt = db()->query('
        SELECT
            id,
            first_name,
            last_name,
            age,
            gender,
            phone,
            email,
            country,
            city,
            consult_type,
            diagnosed,
            mode,
            concern,
            appointment_date,
            appointment_time,
            booking_ref,
            status,
            created_at,
            updated_at
        FROM `bookings`
        ORDER BY created_at DESC
    ');
    $rows = $stmt->fetchAll();

    $bookings = array_map(function ($r) {
        return [
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
            'created_at'       => $r['created_at'],
            'updated_at'       => $r['updated_at'],
        ];
    }, $rows);

    // Compute counts per status
    $counts = ['total' => count($bookings), 'new' => 0, 'confirmed' => 0, 'cancelled' => 0, 'completed' => 0];
    foreach ($bookings as $b) {
        if (isset($counts[$b['status']])) {
            $counts[$b['status']]++;
        }
    }

    jsonSuccess('OK', [
        'bookings' => $bookings,
        'counts'   => $counts,
    ]);

} catch (PDOException $e) {
    error_log('bookings/list error: ' . $e->getMessage());
    jsonError('Failed to load bookings', 500);
}
