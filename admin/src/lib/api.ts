/**
 * Tiny typed fetch wrapper for the admin panel.
 *  - Always sends cookies (credentials: 'include')
 *  - Always JSON request + response
 *  - Normalises errors so callers can `throw api(...)` and get a message
 *  - Emits an "unauthorized" hook on 401 so the AuthProvider can clear state
 */

export interface ApiError {
    status: number;
    message: string;
    errors?: Record<string, unknown>;
}

// ─── Unauthorized handler registry ───
// AuthProvider registers a callback here at mount time. When any request
// comes back 401, we fire it, which clears `admin` in context and lets the
// ProtectedRoute redirect to /login.
let unauthorizedHandler: ((path: string) => void) | null = null;

export function setUnauthorizedHandler(fn: ((path: string) => void) | null) {
    unauthorizedHandler = fn;
}

export async function api<T = unknown>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const res = await fetch(path, {
        credentials: 'include',
        headers: {
            ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
            'X-Requested-With': 'XMLHttpRequest',
            ...(options.headers || {}),
        },
        ...options,
    });

    let body: unknown = null;
    try {
        body = await res.json();
    } catch {
        /* no JSON body */
    }

    if (!res.ok) {
        // 401 anywhere → session is dead / admin revoked → global logout
        // Exempt /api/auth/me.php + /api/auth/login.php so we don't infinite-loop
        // on the initial session probe or failed login attempts.
        if (
            res.status === 401 &&
            unauthorizedHandler &&
            !path.includes('/api/auth/me.php') &&
            !path.includes('/api/auth/login.php')
        ) {
            try { unauthorizedHandler(path); } catch { /* ignore */ }
        }

        const err: ApiError = {
            status: res.status,
            message:
                (body as { message?: string } | null)?.message ||
                (res.status === 401
                    ? 'Not authenticated'
                    : res.status === 429
                    ? 'Too many requests. Please try again later.'
                    : 'Request failed'),
            errors: (body as { errors?: Record<string, unknown> } | null)?.errors,
        };
        throw err;
    }

    return body as T;
}
