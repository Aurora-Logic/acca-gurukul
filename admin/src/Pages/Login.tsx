import { useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const redirectTo = (location.state as { from?: string } | null)?.from || '/admin';

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (isSubmitting) return;

        setError(null);

        const trimmedEmail = email.trim();
        if (!trimmedEmail || !password) {
            setError('Please fill in both email and password.');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await login(trimmedEmail, password, remember);

            if (result.ok) {
                toast.success('Welcome back!', {
                    description: 'Signed in successfully.',
                });
                navigate(redirectTo, { replace: true });
                return;
            }

            const msg = result.message;
            setError(msg);

            if (result.status === 429) {
                toast.error('Too many attempts', { description: msg });
            } else if (result.status === 403) {
                toast.error('Account inactive', { description: msg });
            } else if (result.status === 401) {
                toast.error('Invalid credentials', { description: msg });
            } else if (result.status === 422) {
                toast.error('Check your input', { description: msg });
            } else {
                toast.error('Sign-in failed', { description: msg });
            }
        } catch {
            const msg = 'Network error. Please check your connection and try again.';
            setError(msg);
            toast.error('Connection failed', { description: msg });
        } finally {
            setIsSubmitting(false);
        }
    }

    const logoSrc = `${import.meta.env.BASE_URL}images/logo.png`;

    return (
        <div className="relative grid min-h-svh lg:grid-cols-2 bg-white">
            {/* ── Left branded panel (desktop only) ── */}
            <div className="relative hidden flex-col p-10 lg:flex overflow-hidden">
                {/* Ambient brand wash */}
                <div
                    aria-hidden
                    className="absolute inset-0 bg-[#F4F1EB]"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(ellipse 70% 55% at 20% 25%, rgba(181,28,36,0.12) 0%, transparent 70%), radial-gradient(ellipse 55% 45% at 85% 90%, rgba(178,128,59,0.12) 0%, transparent 70%)',
                    }}
                />
                {/* Grain overlay */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-30 mix-blend-multiply"
                    style={{
                        backgroundImage:
                            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
                        backgroundSize: '180px',
                    }}
                />

                {/* Logo — top left */}
                <div className="relative z-10 flex items-center">
                    <img src={logoSrc} alt="ACCA Gurukul" className="h-10 w-auto" />
                </div>

                {/* Quote — bottom left */}
                <div className="relative z-10 mt-auto max-w-md">
                    <div className="mb-5 inline-flex items-center gap-3 text-[11px] font-medium tracking-[0.18em] uppercase text-[#B2803B]">
                        <span className="h-px w-7 bg-[#B2803B]" />
                        ACCA Gurukul
                    </div>
                    <p className="text-[13.5px] leading-relaxed text-[#0E0D0A]/60">
                        Manage bookings, enquiries and content across ACCA Gurukul from one place.
                    </p>
                </div>
            </div>

            {/* ── Right form panel ── */}
            <div className="relative flex items-center justify-center p-6 md:p-10">
                {/* Subtle ambient glow on mobile */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 lg:hidden"
                    style={{
                        background:
                            'radial-gradient(ellipse 60% 50% at 80% 20%, rgba(181,28,36,0.08) 0%, transparent 70%), radial-gradient(ellipse 50% 50% at 15% 85%, rgba(178,128,59,0.06) 0%, transparent 70%)',
                    }}
                />

                <div className="relative mx-auto flex w-full max-w-85 flex-col justify-center gap-7">
                    {/* Mobile-only logo */}
                    <div className="flex justify-center lg:hidden">
                        <img src={logoSrc} alt="ACCA Gurukul" className="h-9 w-auto" />
                    </div>

                    {/* Header */}
                    <div className="flex flex-col gap-1.5 text-center">
                        <h1 className="font-medium text-[24px] leading-[1.15] tracking-[-0.01em] text-neutral-900">
                            Welcome back
                        </h1>
                        <p className="text-[13.5px] font-light leading-relaxed text-neutral-500">
                            Enter your credentials to access the admin panel.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="email"
                                className="text-[13px] font-normal text-neutral-700"
                            >
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                                className="h-9 bg-white border-neutral-200 focus:border-[#B51C24] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none shadow-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label
                                htmlFor="password"
                                className="text-[13px] font-normal text-neutral-700"
                            >
                                Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    required
                                    className="pr-9 h-9 bg-white border-neutral-200 focus:border-[#B51C24] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none shadow-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="remember"
                                checked={remember}
                                onCheckedChange={(v) => setRemember(Boolean(v))}
                                className="data-[state=checked]:bg-[#B51C24] data-[state=checked]:border-[#B51C24]"
                            />
                            <Label
                                htmlFor="remember"
                                className="text-[13px] font-normal text-neutral-600 cursor-pointer"
                            >
                                Remember me
                            </Label>
                        </div>

                        {error && (
                            <div className="rounded-md border border-red-200 bg-red-50/60 px-3 py-2 text-[12.5px] text-red-700">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-9 bg-[#B51C24] hover:bg-[#96131a] text-white text-[13.5px] font-medium transition-colors disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                    Signing in…
                                </>
                            ) : (
                                'Sign in'
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
