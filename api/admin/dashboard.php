<?php
/**
 * GET /api/admin/dashboard.php
 * Aggregated dashboard statistics for the admin panel.
 * Auth required.
 *
 * Optional query params:
 *   date_from  (YYYY-MM-DD)  – start of trend window (default: 30 days ago)
 *   date_to    (YYYY-MM-DD)  – end of trend window   (default: today)
 */

if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'HEAD'], true)) {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['error' => true, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../config/auth.php';
requireAuth();

try {
    $pdo = db();

    // ── Date range for trends ──
    $dateTo   = isset($_GET['date_to'])   && preg_match('/^\d{4}-\d{2}-\d{2}$/', $_GET['date_to'])
                ? $_GET['date_to']
                : date('Y-m-d');
    $dateFrom = isset($_GET['date_from']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $_GET['date_from'])
                ? $_GET['date_from']
                : date('Y-m-d', strtotime('-29 days', strtotime($dateTo)));

    // ═══════════════════════════════════════
    // 1. Stat Cards
    // ═══════════════════════════════════════

    // Bookings
    $bookingStats = $pdo->query("
        SELECT
            COUNT(*)                                        AS total_appointments,
            SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS new_appointments
        FROM `bookings`
    ")->fetch(PDO::FETCH_ASSOC);

    // Contacts
    $contactStats = $pdo->query("
        SELECT
            COUNT(*)                                        AS total_contacts,
            SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END)   AS unread_contacts
        FROM `contacts`
    ")->fetch(PDO::FETCH_ASSOC);

    // Blogs
    $blogStats = $pdo->query("
        SELECT
            COUNT(*)                                              AS total_posts,
            SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END)    AS published_posts,
            COALESCE(SUM(views), 0)                               AS total_blog_views
        FROM `blogs`
    ")->fetch(PDO::FETCH_ASSOC);

    $stats = [
        'total_appointments' => (int) $bookingStats['total_appointments'],
        'new_appointments'   => (int) $bookingStats['new_appointments'],
        'total_contacts'     => (int) $contactStats['total_contacts'],
        'unread_contacts'    => (int) $contactStats['unread_contacts'],
        'total_posts'        => (int) $blogStats['total_posts'],
        'published_posts'    => (int) $blogStats['published_posts'],
        'total_blog_views'   => (int) $blogStats['total_blog_views'],
    ];

    // ═══════════════════════════════════════
    // 2. Appointments by Status
    // ═══════════════════════════════════════

    $stRows = $pdo->query("
        SELECT status, COUNT(*) AS cnt
        FROM `bookings`
        GROUP BY status
    ")->fetchAll(PDO::FETCH_ASSOC);

    $appointmentsByStatus = [];
    foreach ($stRows as $r) {
        $appointmentsByStatus[$r['status']] = (int) $r['cnt'];
    }

    // ═══════════════════════════════════════
    // 3. Trend: Appointments per day
    // ═══════════════════════════════════════

    $stmt = $pdo->prepare("
        SELECT DATE(created_at) AS d, COUNT(*) AS cnt
        FROM `bookings`
        WHERE DATE(created_at) BETWEEN :from AND :to
        GROUP BY DATE(created_at)
        ORDER BY d
    ");
    $stmt->execute([':from' => $dateFrom, ':to' => $dateTo]);
    $aptTrendRaw = $stmt->fetchAll(PDO::FETCH_KEY_PAIR); // d => cnt

    // ═══════════════════════════════════════
    // 4. Trend: Blog views per day
    // ═══════════════════════════════════════

    $stmt = $pdo->prepare("
        SELECT DATE(viewed_at) AS d, COUNT(*) AS cnt
        FROM `blog_views`
        WHERE DATE(viewed_at) BETWEEN :from AND :to
        GROUP BY DATE(viewed_at)
        ORDER BY d
    ");
    $stmt->execute([':from' => $dateFrom, ':to' => $dateTo]);
    $blogViewsTrendRaw = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

    // ═══════════════════════════════════════
    // 5. Trend: Contacts per day
    // ═══════════════════════════════════════

    $stmt = $pdo->prepare("
        SELECT DATE(created_at) AS d, COUNT(*) AS cnt
        FROM `contacts`
        WHERE DATE(created_at) BETWEEN :from AND :to
        GROUP BY DATE(created_at)
        ORDER BY d
    ");
    $stmt->execute([':from' => $dateFrom, ':to' => $dateTo]);
    $contactsTrendRaw = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

    // ── Fill gaps so every day in range has a data point ──
    function fillTrend(array $raw, string $from, string $to): array
    {
        $result  = [];
        $current = new DateTime($from);
        $end     = new DateTime($to);

        while ($current <= $end) {
            $d = $current->format('Y-m-d');
            $result[] = ['date' => $d, 'count' => (int) ($raw[$d] ?? 0)];
            $current->modify('+1 day');
        }
        return $result;
    }

    $appointmentsTrend = fillTrend($aptTrendRaw,       $dateFrom, $dateTo);
    $blogViewsTrend    = fillTrend($blogViewsTrendRaw,  $dateFrom, $dateTo);
    $contactsTrend     = fillTrend($contactsTrendRaw,   $dateFrom, $dateTo);

    // ═══════════════════════════════════════
    // 6. Recent 5 Appointments
    // ═══════════════════════════════════════

    $recentApts = $pdo->query("
        SELECT
            id,
            name AS patient_name,
            phone,
            email,
            appointment_date AS preferred_date,
            appointment_time AS preferred_time,
            status,
            created_at
        FROM `bookings`
        ORDER BY created_at DESC
        LIMIT 5
    ")->fetchAll(PDO::FETCH_ASSOC);

    $recentAppointments = array_map(function ($r) {
        return [
            'id'             => (int) $r['id'],
            'patient_name'   => $r['patient_name'],
            'phone'          => $r['phone'],
            'email'          => $r['email'],
            'preferred_date' => $r['preferred_date'],
            'preferred_time' => $r['preferred_time'],
            'status'         => $r['status'],
            'created_at'     => $r['created_at'],
        ];
    }, $recentApts);

    // ═══════════════════════════════════════
    // 7. Recent 5 Blog Posts (by views desc)
    // ═══════════════════════════════════════

    $topBlogs = $pdo->query("
        SELECT id, title, views, created_at
        FROM `blogs`
        WHERE is_published = 1
        ORDER BY created_at DESC
        LIMIT 5
    ")->fetchAll(PDO::FETCH_ASSOC);

    $recentBlogs = array_map(function ($r) {
        return [
            'id'         => (int) $r['id'],
            'title'      => $r['title'],
            'views'      => (int) $r['views'],
            'created_at' => $r['created_at'],
        ];
    }, $topBlogs);

    // ═══════════════════════════════════════
    // Response
    // ═══════════════════════════════════════

    jsonSuccess('OK', [
        'stats'                => $stats,
        'appointments_by_status' => $appointmentsByStatus,
        'appointments_trend'   => $appointmentsTrend,
        'blog_views_trend'     => $blogViewsTrend,
        'contacts_trend'       => $contactsTrend,
        'recent_appointments'  => $recentAppointments,
        'recent_blogs'         => $recentBlogs,
    ]);

} catch (PDOException $e) {
    error_log('dashboard error: ' . $e->getMessage());
    jsonError('Failed to load dashboard data: ' . $e->getMessage(), 500);
}
