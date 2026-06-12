import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
    useCallback,
} from 'react';
import { setUnauthorizedHandler } from '@/lib/api';

export interface Admin {
    id: number;
    name: string;
    email: string;
}

interface AuthContextValue {
    admin: Admin | null;
    loading: boolean;
    login: (email: string, password: string, remember: boolean) => Promise<LoginResult>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
}

export type LoginResult =
    | { ok: true }
    | { ok: false; status: number; message: string };

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Lightweight fetch wrapper that:
 *  - Always sends cookies (credentials: 'include')
 *  - Always requests JSON
 *  - Parses JSON and throws on non-2xx with structured info
 */
async function api<T = unknown>(
    path: string,
    options: RequestInit = {}
): Promise<{ status: number; data: T }> {
    const res = await fetch(path, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(options.headers || {}),
        },
        ...options,
    });

    let data: unknown = null;
    try {
        data = await res.json();
    } catch {
        /* non-JSON response — leave as null */
    }

    return { status: res.status, data: data as T };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [admin, setAdmin] = useState<Admin | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const { status, data } = await api<{ admin?: Admin }>('/api/auth/me.php', {
                method: 'GET',
            });
            if (status === 200 && data && 'admin' in data && data.admin) {
                setAdmin(data.admin);
            } else {
                setAdmin(null);
            }
        } catch {
            setAdmin(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // When any API call returns 401 (session expired / admin revoked),
    // clear the client-side auth state. ProtectedRoute will then redirect
    // the user to /login on the next render.
    useEffect(() => {
        setUnauthorizedHandler(() => setAdmin(null));
        return () => setUnauthorizedHandler(null);
    }, []);

    const login = useCallback(
        async (email: string, password: string, remember: boolean): Promise<LoginResult> => {
            const { status, data } = await api<{
                admin?: Admin;
                error?: boolean;
                message?: string;
            }>('/api/auth/login.php', {
                method: 'POST',
                body: JSON.stringify({ email, password, remember }),
            });

            if (status === 200 && data?.admin) {
                setAdmin(data.admin);
                return { ok: true };
            }

            return {
                ok: false,
                status,
                message:
                    data?.message ||
                    (status === 429
                        ? 'Too many attempts. Please wait a few minutes and try again.'
                        : 'Login failed. Please try again.'),
            };
        },
        []
    );

    const logout = useCallback(async () => {
        try {
            await api('/api/auth/logout.php', { method: 'POST' });
        } catch {
            /* ignore */
        }
        setAdmin(null);
    }, []);

    return (
        <AuthContext.Provider value={{ admin, loading, login, logout, refresh }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used inside <AuthProvider>');
    }
    return ctx;
}
