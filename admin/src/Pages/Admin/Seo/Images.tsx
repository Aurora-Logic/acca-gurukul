import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, ImageOff, AlertTriangle, ArrowLeft, Undo2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type ManagedImage = {
    id: number;
    image_key: string;
    alt_text: string;
    default_alt: string;
    effective_alt: string;
    alt_length: number;
    location: string;
    is_decorative: boolean;
    issues: string[];
};

export default function SeoImages() {
    const [images, setImages] = useState<ManagedImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [location, setLocation] = useState('all');
    const [dirty, setDirty] = useState<Set<number>>(new Set());

    useEffect(() => {
        (async () => {
            try {
                const data = await api<{ images: ManagedImage[] }>('/api/admin/images/list.php');
                setImages(data.images);
            } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed to load images');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const locations = useMemo(
        () => Array.from(new Set(images.map((i) => i.location))).sort(),
        [images]
    );

    const filtered = useMemo(() => {
        let list = images;
        if (location !== 'all') list = list.filter((i) => i.location === location);
        if (location === 'issues') list = images.filter((i) => i.issues.length > 0);
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(
                (i) => i.image_key.toLowerCase().includes(q) || i.effective_alt.toLowerCase().includes(q)
            );
        }
        return list;
    }, [images, search, location]);

    const grouped = useMemo(() => {
        const map = new Map<string, ManagedImage[]>();
        for (const img of filtered) {
            if (!map.has(img.location)) map.set(img.location, []);
            map.get(img.location)!.push(img);
        }
        return [...map.entries()];
    }, [filtered]);

    const withIssues = images.filter((i) => i.issues.length > 0).length;

    function edit(id: number, patch: Partial<ManagedImage>) {
        setImages((list) =>
            list.map((i) => {
                if (i.id !== id) return i;
                const next = { ...i, ...patch };
                next.effective_alt = next.is_decorative ? '' : next.alt_text || next.default_alt;
                next.alt_length = next.effective_alt.length;
                return next;
            })
        );
        setDirty((d) => new Set(d).add(id));
    }

    async function save() {
        if (dirty.size === 0) {
            toast.info('Nothing changed yet');
            return;
        }
        setSaving(true);
        try {
            const payload = images
                .filter((i) => dirty.has(i.id))
                .map((i) => ({ id: i.id, alt_text: i.alt_text, is_decorative: i.is_decorative }));
            const res = await api<{ updated: number }>('/api/admin/images/update.php', {
                method: 'POST',
                body: JSON.stringify({ images: payload }),
            });
            toast.success('Alt text saved', { description: `${res.updated} image(s) updated and live.` });
            setDirty(new Set());
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    }

    return (
        <AdminLayout breadcrumbs={[{ label: 'SEO', href: '/admin/seo' }, { label: 'Image alt text' }]}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="icon" className="size-8">
                        <Link to="/admin/seo"><ArrowLeft className="size-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">Image alt text</h1>
                        <p className="text-sm text-muted-foreground">
                            Describes each image for screen readers and Google Images. Changes go live immediately.
                        </p>
                    </div>
                </div>
                <Button onClick={save} disabled={saving || dirty.size === 0} className="gap-2">
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    Save{dirty.size > 0 ? ` (${dirty.size})` : ''}
                </Button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
                {[
                    { label: 'Images managed', value: images.length },
                    { label: 'Needing attention', value: withIssues },
                    { label: 'Unsaved changes', value: dirty.size },
                ].map((s) => (
                    <Card key={s.label}>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                            <p className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-12 text-muted-foreground">
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    <span className="text-sm">Loading images…</span>
                </div>
            ) : (
                <>
                    <div className="mb-4 flex flex-wrap gap-3">
                        <Input
                            placeholder="Search by file or description…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-9 max-w-sm"
                        />
                        <Select value={location} onValueChange={setLocation}>
                            <SelectTrigger className="h-9 w-56"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All pages</SelectItem>
                                <SelectItem value="issues">Needs attention ({withIssues})</SelectItem>
                                {locations.map((l) => (
                                    <SelectItem key={l} value={l}>{l}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-6">
                        {grouped.map(([group, items]) => (
                            <div key={group}>
                                <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                                    {group} <span className="font-normal">({items.length})</span>
                                </h2>
                                <Card>
                                    <CardContent className="divide-y p-0">
                                        {items.map((img) => (
                                            <div key={img.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                                                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                                                    <img
                                                        src={img.image_key}
                                                        alt=""
                                                        className="size-full object-cover"
                                                        onError={(e) => {
                                                            const el = e.target as HTMLImageElement;
                                                            el.style.display = 'none';
                                                            el.parentElement?.classList.add('text-muted-foreground');
                                                        }}
                                                    />
                                                </div>

                                                <div className="min-w-0 flex-1 space-y-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <code className="truncate text-xs text-muted-foreground">
                                                            {img.image_key}
                                                        </code>
                                                        {img.issues.map((issue) => (
                                                            <Badge
                                                                key={issue}
                                                                variant="outline"
                                                                className="gap-1 border-amber-200 text-amber-700"
                                                            >
                                                                <AlertTriangle className="size-3" />
                                                                {issue}
                                                            </Badge>
                                                        ))}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            value={img.is_decorative ? '' : img.alt_text || img.default_alt}
                                                            disabled={img.is_decorative}
                                                            placeholder={
                                                                img.is_decorative
                                                                    ? 'Decorative — announced as nothing'
                                                                    : 'Describe what the image shows'
                                                            }
                                                            onChange={(e) => edit(img.id, { alt_text: e.target.value })}
                                                            className="h-9"
                                                        />
                                                        {!img.is_decorative && img.alt_text && img.alt_text !== img.default_alt && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-9 shrink-0"
                                                                title={`Reset to "${img.default_alt}"`}
                                                                onClick={() => edit(img.id, { alt_text: img.default_alt })}
                                                            >
                                                                <Undo2 className="size-4" />
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-4">
                                                        <span
                                                            className={`text-xs tabular-nums ${
                                                                img.alt_length > 125 ? 'text-destructive' : 'text-muted-foreground'
                                                            }`}
                                                        >
                                                            {img.alt_length}/125
                                                        </span>
                                                        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                                                            <Switch
                                                                checked={img.is_decorative}
                                                                onCheckedChange={(v) => edit(img.id, { is_decorative: v })}
                                                            />
                                                            <ImageOff className="size-3.5" />
                                                            Decorative (skip for screen readers)
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        ))}

                        {grouped.length === 0 && (
                            <p className="p-8 text-center text-sm text-muted-foreground">
                                No images match that filter.
                            </p>
                        )}
                    </div>
                </>
            )}
        </AdminLayout>
    );
}
