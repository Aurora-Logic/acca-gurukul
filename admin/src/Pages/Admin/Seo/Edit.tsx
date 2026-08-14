import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Save, ExternalLink, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type SeoPage = {
    id: number;
    page_key: string;
    path: string;
    label: string;
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
    canonical_url: string;
    og_title: string;
    og_description: string;
    og_image: string;
    og_type: string;
    twitter_card: string;
    robots_noindex: boolean;
    robots_nofollow: boolean;
    structured_data: string;
    in_sitemap: boolean;
    sitemap_priority: number;
    sitemap_freq: string;
};

const SITE_URL = 'https://accagurukul.com';

/** Google truncates around these limits; staying inside them keeps copy intact. */
const LIMITS = {
    title: { min: 30, max: 60 },
    description: { min: 70, max: 160 },
};

function Counter({ value, min, max }: { value: number; min: number; max: number }) {
    const tone =
        value === 0 ? 'text-muted-foreground'
        : value < min ? 'text-amber-600'
        : value > max ? 'text-destructive'
        : 'text-emerald-600';
    const hint = value === 0 ? '' : value < min ? ' · too short' : value > max ? ' · will be truncated' : ' · good';
    return (
        <span className={`text-xs tabular-nums ${tone}`}>
            {value}/{max}
            {hint}
        </span>
    );
}

export default function SeoEdit() {
    const { pageKey } = useParams<{ pageKey: string }>();
    const navigate = useNavigate();

    const [page, setPage] = useState<SeoPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [schemaError, setSchemaError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await api<{ page: SeoPage }>(
                    `/api/admin/seo/get.php?page_key=${encodeURIComponent(pageKey ?? '')}`
                );
                setPage(data.page);
            } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed to load page');
                navigate('/admin/seo', { replace: true });
            } finally {
                setLoading(false);
            }
        })();
    }, [pageKey, navigate]);

    const set = <K extends keyof SeoPage>(key: K, value: SeoPage[K]) =>
        setPage((p) => (p ? { ...p, [key]: value } : p));

    // Validated as the admin types so a JSON slip is caught before saving.
    useEffect(() => {
        if (!page?.structured_data?.trim()) {
            setSchemaError(null);
            return;
        }
        try {
            JSON.parse(page.structured_data);
            setSchemaError(null);
        } catch (e) {
            setSchemaError(e instanceof Error ? e.message : 'Invalid JSON');
        }
    }, [page?.structured_data]);

    const previewUrl = useMemo(
        () => (page?.canonical_url?.trim() ? page.canonical_url : SITE_URL + (page?.path ?? '/')),
        [page?.canonical_url, page?.path]
    );

    async function handleSave() {
        if (!page) return;
        if (schemaError) {
            toast.error('Fix the structured data JSON before saving');
            return;
        }
        setSaving(true);
        try {
            await api('/api/admin/seo/update.php', {
                method: 'POST',
                body: JSON.stringify(page),
            });
            toast.success('SEO saved', { description: `${page.label} is live on the site.` });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    }

    if (loading || !page) {
        return (
            <AdminLayout breadcrumbs={[{ label: 'SEO', href: '/admin/seo' }, { label: 'Edit' }]}>
                <div className="flex items-center justify-center p-12 text-muted-foreground">
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    <span className="text-sm">Loading…</span>
                </div>
            </AdminLayout>
        );
    }

    const titleLen = page.meta_title?.length ?? 0;
    const descLen = page.meta_description?.length ?? 0;

    return (
        <AdminLayout breadcrumbs={[{ label: 'SEO', href: '/admin/seo' }, { label: page.label }]}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="icon" className="size-8">
                        <Link to="/admin/seo"><ArrowLeft className="size-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">{page.label}</h1>
                        <a
                            href={page.path}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                        >
                            {page.path} <ExternalLink className="size-3" />
                        </a>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving || !!schemaError} className="gap-2">
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    Save changes
                </Button>
            </div>

            {/* Live result preview — the point is to judge copy at the width it
                actually renders, rather than guessing from a character count. */}
            <Card className="mb-4">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Google result preview</CardTitle>
                    <CardDescription>How this page is likely to appear in search results.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="max-w-2xl rounded-lg border bg-background p-4">
                        <div className="mb-1 flex items-center gap-2">
                            <div className="flex size-6 items-center justify-center rounded-full border bg-muted text-[10px] font-semibold">
                                AG
                            </div>
                            <div className="leading-tight">
                                <div className="text-xs font-medium">ACCA Gurukul</div>
                                <div className="text-xs text-muted-foreground">{previewUrl}</div>
                            </div>
                        </div>
                        <div className="text-lg leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">
                            {page.meta_title?.slice(0, 60) || 'Untitled page'}
                            {titleLen > 60 && '…'}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                            {page.meta_description?.slice(0, 160) || 'No meta description set.'}
                            {descLen > 160 && '…'}
                        </div>
                        {page.robots_noindex && (
                            <Badge variant="destructive" className="mt-2">
                                Hidden — this page is set to noindex and will not appear at all
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="search">
                <TabsList>
                    <TabsTrigger value="search">Search</TabsTrigger>
                    <TabsTrigger value="social">Social</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                {/* ── Search ── */}
                <TabsContent value="search" className="mt-4 space-y-4">
                    <Card>
                        <CardContent className="space-y-4 p-5">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="meta_title">Meta title</Label>
                                    <Counter value={titleLen} {...LIMITS.title} />
                                </div>
                                <Input
                                    id="meta_title"
                                    value={page.meta_title ?? ''}
                                    onChange={(e) => set('meta_title', e.target.value)}
                                    placeholder="Primary keyword first, brand name last"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="meta_description">Meta description</Label>
                                    <Counter value={descLen} {...LIMITS.description} />
                                </div>
                                <Textarea
                                    id="meta_description"
                                    rows={3}
                                    value={page.meta_description ?? ''}
                                    onChange={(e) => set('meta_description', e.target.value)}
                                    placeholder="One or two sentences describing the page, written for a person rather than a crawler."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="canonical_url">Canonical URL</Label>
                                <Input
                                    id="canonical_url"
                                    value={page.canonical_url ?? ''}
                                    onChange={(e) => set('canonical_url', e.target.value)}
                                    placeholder={SITE_URL + page.path}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave blank to use <code>{SITE_URL + page.path}</code>. Only set this when this
                                    page duplicates another one.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="meta_keywords">Meta keywords</Label>
                                <Input
                                    id="meta_keywords"
                                    value={page.meta_keywords ?? ''}
                                    onChange={(e) => set('meta_keywords', e.target.value)}
                                    placeholder="acca coaching, acca course fees"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Google has ignored this tag since 2009 — safe to leave empty.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Social ── */}
                <TabsContent value="social" className="mt-4 space-y-4">
                    <Card>
                        <CardContent className="space-y-4 p-5">
                            <div className="space-y-2">
                                <Label htmlFor="og_title">Social title</Label>
                                <Input
                                    id="og_title"
                                    value={page.og_title ?? ''}
                                    onChange={(e) => set('og_title', e.target.value)}
                                    placeholder={page.meta_title || 'Falls back to the meta title'}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="og_description">Social description</Label>
                                <Textarea
                                    id="og_description"
                                    rows={2}
                                    value={page.og_description ?? ''}
                                    onChange={(e) => set('og_description', e.target.value)}
                                    placeholder={page.meta_description || 'Falls back to the meta description'}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="og_image">Share image URL</Label>
                                <Input
                                    id="og_image"
                                    value={page.og_image ?? ''}
                                    onChange={(e) => set('og_image', e.target.value)}
                                    placeholder="/assets/images/building.webp"
                                />
                                <p className="text-xs text-muted-foreground">
                                    1200×630 works best. Blank uses the site-wide default image.
                                </p>
                                {page.og_image && (
                                    <img
                                        src={page.og_image}
                                        alt="Share preview"
                                        className="mt-2 max-h-48 rounded-lg border object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Open Graph type</Label>
                                    <Select value={page.og_type} onValueChange={(v) => set('og_type', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="website">website</SelectItem>
                                            <SelectItem value="article">article</SelectItem>
                                            <SelectItem value="profile">profile</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Twitter card</Label>
                                    <Select value={page.twitter_card} onValueChange={(v) => set('twitter_card', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="summary_large_image">summary_large_image</SelectItem>
                                            <SelectItem value="summary">summary</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Advanced ── */}
                <TabsContent value="advanced" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Indexing</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 p-5 pt-0">
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                    <p className="text-sm font-medium">Hide from search engines</p>
                                    <p className="text-xs text-muted-foreground">
                                        Adds <code>noindex</code> and removes the page from the sitemap.
                                    </p>
                                </div>
                                <Switch
                                    checked={page.robots_noindex}
                                    onCheckedChange={(v) => set('robots_noindex', v)}
                                />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                    <p className="text-sm font-medium">Don't follow links on this page</p>
                                    <p className="text-xs text-muted-foreground">Adds <code>nofollow</code>.</p>
                                </div>
                                <Switch
                                    checked={page.robots_nofollow}
                                    onCheckedChange={(v) => set('robots_nofollow', v)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Sitemap</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 p-5 pt-0">
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                    <p className="text-sm font-medium">Include in sitemap.xml</p>
                                    <p className="text-xs text-muted-foreground">Helps Google discover the page.</p>
                                </div>
                                <Switch
                                    checked={page.in_sitemap}
                                    onCheckedChange={(v) => set('in_sitemap', v)}
                                />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="priority">Priority ({page.sitemap_priority.toFixed(1)})</Label>
                                    <Input
                                        id="priority"
                                        type="number"
                                        min={0}
                                        max={1}
                                        step={0.1}
                                        value={page.sitemap_priority}
                                        onChange={(e) => set('sitemap_priority', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Change frequency</Label>
                                    <Select value={page.sitemap_freq} onValueChange={(v) => set('sitemap_freq', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'].map((f) => (
                                                <SelectItem key={f} value={f}>{f}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Structured data (JSON-LD)</CardTitle>
                            <CardDescription>
                                Added alongside the site-wide Organization data. Use a Course, Event or Product
                                object here — do not repeat the organisation details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 p-5 pt-0">
                            <Textarea
                                rows={14}
                                spellCheck={false}
                                className="font-mono text-xs"
                                value={page.structured_data ?? ''}
                                onChange={(e) => set('structured_data', e.target.value)}
                                placeholder={'{\n  "@type": "Course",\n  "name": "…"\n}'}
                            />
                            {schemaError ? (
                                <p className="flex items-center gap-1.5 text-xs text-destructive">
                                    <AlertTriangle className="size-3.5" /> {schemaError}
                                </p>
                            ) : page.structured_data?.trim() ? (
                                <p className="flex items-center gap-1.5 text-xs text-emerald-600">
                                    <CheckCircle2 className="size-3.5" /> Valid JSON
                                </p>
                            ) : null}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </AdminLayout>
    );
}
