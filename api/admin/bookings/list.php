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
            name,
            phone,
            email,
            course,
            qualification,
            year_of_passing,
            location,
            appointment_date,
            appointment_time,
            source,
            message,
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
    jsonError('Failed to load bookings: ' . $e->getMessage(), 500);
}
