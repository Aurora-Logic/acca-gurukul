import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

/**
 * Wrap any admin route: redirects to /login if not authenticated.
 * Persists the attempted URL so we can redirect back after login.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const { admin, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="text-sm">Checking session…</span>
            </div>
        );
    }

    if (!admin) {
        return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
    }

    return <>{children}</>;
}

/**
 * Inverse: redirects away from /login if already authenticated.
 */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
    const { admin, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="text-sm">Loading…</span>
            </div>
        );
    }

    if (admin) {
        return <Navigate to="/admin" replace />;
    }

    return <>{children}</>;
}
