import { useState, useEffect, FormEvent } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface EditFormData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    is_active: boolean;
}

interface AdminUser {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export default function UserEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { admin: current } = useAuth();

    const [data, setData] = useState<EditFormData>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        is_active: true,
    });
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof EditFormData, string>>>({});
    const [showPw, setShowPw] = useState(false);
    const [showPw2, setShowPw2] = useState(false);
    const [targetId, setTargetId] = useState<number | null>(null);

    const set = <K extends keyof EditFormData>(key: K, val: EditFormData[K]) => {
        setData((prev) => ({ ...prev, [key]: val }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const isSelf = current?.id !== undefined && current.id === targetId;

    // ─── Fetch target admin ───
    useEffect(() => {
        let cancelled = false;
        if (!id) {
            setNotFound(true);
            setLoading(false);
            return;
        }
        (async () => {
            try {
                const res = await api<{ user: AdminUser }>(
                    `/api/admin/users/show.php?id=${encodeURIComponent(id)}`
                );
                if (cancelled) return;
                setTargetId(res.user.id);
                setData({
                    name: res.user.name,
                    email: res.user.email,
                    password: '',
                    password_confirmation: '',
                    is_active: res.user.is_active,
                });
            } catch (err) {
                const e = err as ApiError;
                if (!cancelled) {
                    if (e.status === 404) setNotFound(true);
                    else toast.error('Failed to load admin', { description: e.message });
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id]);

    function validate(): boolean {
        const e: typeof errors = {};
        if (data.name.trim().length < 2) e.name = 'Name is required (min 2 chars)';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) e.email = 'Invalid email';
        if (data.password && data.password.length < 8)
            e.password = 'Password must be at least 8 characters';
        if (data.password !== data.password_confirmation)
            e.password_confirmation = 'Passwords do not match';
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (processing || !targetId) return;
        if (!validate()) return;

        // Prevent self-deactivate on client side too
        if (isSelf && !data.is_active) {
            toast.error('You cannot deactivate your own account');
            return;
        }

        setProcessing(true);
        try {
            const body: Record<string, unknown> = {
                id: targetId,
                name: data.name.trim(),
                email: data.email.trim().toLowerCase(),
                is_active: data.is_active,
            };
            if (data.password) body.password = data.password;

            await api('/api/admin/users/update.php', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            toast.success('Admin updated');
            navigate('/admin/users');
        } catch (err) {
            const er = err as ApiError;
            if (er.status === 409) setErrors({ email: er.message });
            toast.error('Update failed', { description: er.message });
        } finally {
            setProcessing(false);
        }
    }

    if (loading) {
        return (
            <AdminLayout
                breadcrumbs={[
                    { label: 'Users', href: '/admin/users' },
                    { label: 'Loading…' },
                ]}
            >
                <div className="flex items-center justify-center py-24 text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading admin…</span>
                </div>
            </AdminLayout>
        );
    }

    if (notFound) {
        return (
            <AdminLayout
                breadcrumbs={[
                    { label: 'Users', href: '/admin/users' },
                    { label: 'Not found' },
                ]}
            >
                <div className="max-w-md mx-auto py-16 text-center">
                    <AlertTriangle className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <h2 className="text-lg font-medium mb-2">Admin not found</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                        This user may have been deleted or the link is invalid.
                    </p>
                    <Button asChild variant="outline">
                        <Link to="/admin/users">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to users
                        </Link>
                    </Button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            breadcrumbs={[
                { label: 'Users', href: '/admin/users' },
                { label: data.name || 'Edit' },
            ]}
        >
            <div className="mb-6">
                <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2 cursor-pointer">
                    <Link to="/admin/users">
                        <ArrowLeft className="h-4 w-4" /> Back to Users
                    </Link>
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                {/* Basic Info */}
                <div className="space-y-4">
                    <div>
                        <Label className="text-base font-semibold">Basic Info</Label>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => set('name', e.target.value)}
                                maxLength={60}
                                required
                            />
                            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => set('email', e.target.value)}
                                maxLength={100}
                                required
                            />
                            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Password */}
                <div className="space-y-4">
                    <div>
                        <Label className="text-base font-semibold">Password</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                            Leave blank to keep the current password.
                        </p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPw ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={(e) => set('password', e.target.value)}
                                    autoComplete="new-password"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                    aria-label={showPw ? 'Hide password' : 'Show password'}
                                >
                                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation">Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    id="password_confirmation"
                                    type={showPw2 ? 'text' : 'password'}
                                    value={data.password_confirmation}
                                    onChange={(e) => set('password_confirmation', e.target.value)}
                                    autoComplete="new-password"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw2((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                    aria-label={showPw2 ? 'Hide password' : 'Show password'}
                                >
                                    {showPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password_confirmation && (
                                <p className="text-sm text-destructive">
                                    {errors.password_confirmation}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Status */}
                <div className="space-y-4">
                    <div>
                        <Label className="text-base font-semibold">Status</Label>
                        {isSelf && (
                            <p className="text-sm text-muted-foreground mt-1">
                                You cannot deactivate your own account.
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Switch
                            id="is_active"
                            checked={data.is_active}
                            onCheckedChange={(checked) => set('is_active', checked)}
                            disabled={isSelf}
                            className="data-[state=checked]:bg-[#6D9174]"
                        />
                        <Label
                            htmlFor="is_active"
                            className={`font-normal ${isSelf ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                        >
                            Active — can sign in
                        </Label>
                    </div>
                </div>

                <Separator />

                <div className="flex gap-3">
                    <Button type="submit" disabled={processing} className="cursor-pointer">
                        {processing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Saving…
                            </>
                        ) : (
                            'Update Admin'
                        )}
                    </Button>
                    <Button type="button" variant="outline" asChild className="cursor-pointer">
                        <Link to="/admin/users">Cancel</Link>
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
