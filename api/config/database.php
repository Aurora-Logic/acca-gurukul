<?php
/**
 * Database connection (MySQL via PDO)
 * Returns a singleton PDO instance configured from .env values.
 */

require_once __DIR__ . '/env.php';

class Database
{
    private static ?PDO $instance = null;

    public static function connect(): PDO
    {
        if (self::$instance !== null) {
            return self::$instance;
        }

        $host = env('DB_HOST');
        $port = env('DB_PORT');
        $db   = env('DB_DATABASE');
        $user = env('DB_USERNAME');
        $pass = env('DB_PASSWORD');

        $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";

        // Also set PHP's internal timezone so date()/time() match MySQL
        date_default_timezone_set(env('APP_TIMEZONE'));

        // Convert named timezone to numeric offset for MySQL (avoids needing
        // mysql_tzinfo_to_sql on XAMPP/WAMP installations)
        $offset = (new DateTime('now', new DateTimeZone(env('APP_TIMEZONE'))))->format('P'); // e.g. "+05:30"

        try {
            self::$instance = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET time_zone = '{$offset}'"
            ]);
        } catch (PDOException $e) {
            if (env('APP_ENV') === 'development') {
                http_response_code(500);
                echo json_encode(['error' => 'Database connection failed', 'detail' => $e->getMessage()]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Service temporarily unavailable']);
            }
            exit;
        }

        return self::$instance;
    }
}
