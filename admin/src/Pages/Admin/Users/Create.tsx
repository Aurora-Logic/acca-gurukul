import { useState, FormEvent } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { api, ApiError } from '@/lib/api';

interface CreateFormData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    is_active: boolean;
}

export default function UserCreate() {
    const navigate = useNavigate();
    const [data, setData] = useState<CreateFormData>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        is_active: true,
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof CreateFormData, string>>>({});
    const [showPw, setShowPw] = useState(false);
    const [showPw2, setShowPw2] = useState(false);

    const set = <K extends keyof CreateFormData>(key: K, val: CreateFormData[K]) => {
        setData((prev) => ({ ...prev, [key]: val }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    function validate(): boolean {
        const e: typeof errors = {};
        if (data.name.trim().length < 2) e.name = 'Name is required (min 2 chars)';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) e.email = 'Invalid email';
        if (data.password.length < 8) e.password = 'Password must be at least 8 characters';
        if (data.password !== data.password_confirmation)
            e.password_confirmation = 'Passwords do not match';
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (processing) return;
        if (!validate()) return;

        setProcessing(true);
        try {
            await api('/api/admin/users/create.php', {
                method: 'POST',
                body: JSON.stringify({
                    name: data.name.trim(),
                    email: data.email.trim().toLowerCase(),
                    password: data.password,
                    is_active: data.is_active,
                }),
            });
            toast.success('Admin created', {
                description: `${data.name} can now sign in.`,
            });
            navigate('/admin/users');
        } catch (err) {
            const er = err as ApiError;
            if (er.status === 409) setErrors({ email: er.message });
            toast.error('Create failed', { description: er.message });
        } finally {
            setProcessing(false);
        }
    }

    return (
        <AdminLayout
            breadcrumbs={[{ label: 'Users', href: '/admin/users' }, { label: 'Create' }]}
        >
            <div className="mb-6">
                <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
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
                                autoComplete="name"
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
                                autoComplete="email"
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
                        <p className="text-sm text-muted-foreground mt-1">Minimum 8 characters.</p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Password *</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPw ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={(e) => set('password', e.target.value)}
                                    minLength={8}
                                    required
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
                            <Label htmlFor="password_confirmation">Confirm Password *</Label>
                            <div className="relative">
                                <Input
                                    id="password_confirmation"
                                    type={showPw2 ? 'text' : 'password'}
                                    value={data.password_confirmation}
                                    onChange={(e) => set('password_confirmation', e.target.value)}
                                    required
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
                    </div>
                    <div className="flex items-center gap-3">
                        <Switch
                            id="is_active"
                            checked={data.is_active}
                            onCheckedChange={(checked) => set('is_active', checked)}
                            className="data-[state=checked]:bg-[#6D9174]"
                        />
                        <Label htmlFor="is_active" className="font-normal cursor-pointer">
                            Active — can sign in immediately
                        </Label>
                    </div>
                </div>

                <Separator />

                <div className="flex gap-3">
                    <Button type="submit" disabled={processing} className="cursor-pointer">
                        {processing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Creating…
                            </>
                        ) : (
                            'Create Admin'
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        asChild
                        className="cursor-pointer"
                    >
                        <Link to="/admin/users">Cancel</Link>
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
