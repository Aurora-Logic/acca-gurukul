import { useMemo, useState, useEffect } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Globe, Settings2, AlertTriangle, CheckCircle2, EyeOff, Image as ImageIcon } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export type SeoPageRow = {
    id: number;
    page_key: string;
    path: string;
    label: string;
    meta_title: string | null;
    meta_description: string | null;
    title_length: number;
    desc_length: number;
    robots_noindex: boolean;
    has_schema: boolean;
    in_sitemap: boolean;
    issues: string[];
    score: number;
    updated_at: string;
};

/**
 * Titles are truncated by Google around 60 characters and descriptions around
 * 160, so the counters warn before the copy is cut off in results.
 */
function LengthBadge({ value, min, max }: { value: number; min: number; max: number }) {
    const tone =
        value === 0 ? 'text-destructive'
        : value < min || value > max ? 'text-amber-600'
        : 'text-emerald-600';
    return <span className={`text-xs tabular-nums ${tone}`}>{value}</span>;
}

export default function SeoIndex() {
    const [search, setSearch] = useState('');
    const [pages, setPages] = useState<SeoPageRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const data = await api<{ pages: SeoPageRow[] }>('/api/admin/seo/list.php');
                setPages(data.pages);
            } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed to load SEO data');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = useMemo(() => {
        if (!search) return pages;
        const q = search.toLowerCase();
        return pages.filter(
            (p) => p.label.toLowerCase().includes(q) || p.path.toLowerCase().includes(q)
        );
    }, [search, pages]);

    const summary = useMemo(() => {
        const total = pages.length;
        const clean = pages.filter((p) => p.issues.length === 0).length;
        const noindex = pages.filter((p) => p.robots_noindex).length;
        const schema = pages.filter((p) => p.has_schema).length;
        return { total, clean, noindex, schema };
    }, [pages]);

    const columns: ColumnDef<SeoPageRow>[] = [
        {
            accessorKey: 'label',
            header: ({ column }) => <SortableHeader column={column} title="Page" />,
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted shrink-0">
                        <Globe className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium">{row.original.label}</span>
                        <span className="text-xs text-muted-foreground">{row.original.path}</span>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'meta_title',
            header: 'Title',
            cell: ({ row }) => (
                <div className="flex max-w-80 flex-col gap-0.5">
                    <span className="truncate text-sm">
                        {row.original.meta_title || <span className="italic text-muted-foreground">Not set</span>}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        title <LengthBadge value={row.original.title_length} min={30} max={60} />
                        {' · '}
                        desc <LengthBadge value={row.original.desc_length} min={70} max={160} />
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'score',
            header: ({ column }) => <SortableHeader column={column} title="Status" />,
            cell: ({ row }) => {
                const { issues, robots_noindex, has_schema } = row.original;
                return (
                    <div className="flex flex-wrap items-center gap-1.5">
                        {issues.length === 0 ? (
                            <Badge variant="outline" className="gap-1 border-emerald-200 text-emerald-700">
                                <CheckCircle2 className="size-3" /> Healthy
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="gap-1 border-amber-200 text-amber-700" title={issues.join('\n')}>
                                <AlertTriangle className="size-3" />
                                {issues.length} issue{issues.length > 1 ? 's' : ''}
                            </Badge>
                        )}
                        {robots_noindex && (
                            <Badge variant="outline" className="gap-1 border-red-200 text-red-700">
                                <EyeOff className="size-3" /> noindex
                            </Badge>
                        )}
                        {has_schema && <Badge variant="secondary">Schema</Badge>}
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-2">
                    <Button asChild variant="outline" size="sm" className="h-8 gap-1">
                        <Link to={`/admin/seo/${row.original.page_key}/edit`}>
                            <Pencil className="size-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                        </Link>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AdminLayout breadcrumbs={[{ label: 'SEO' }]}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold">Search Engine Optimisation</h1>
                    <p className="text-sm text-muted-foreground">
                        Titles, descriptions, social cards and structured data for every public page.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" className="gap-2">
                        <Link to="/admin/seo/images">
                            <ImageIcon className="size-4" />
                            Image alt text
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="gap-2">
                        <Link to="/admin/seo/settings">
                            <Settings2 className="size-4" />
                            Site-wide settings
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                    { label: 'Pages managed', value: summary.total },
                    { label: 'Fully optimised', value: `${summary.clean}/${summary.total}` },
                    { label: 'With structured data', value: summary.schema },
                    { label: 'Hidden from search', value: summary.noindex },
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
                <div className="flex items-center justify-center p-12">
                    <p className="animate-pulse text-sm text-muted-foreground">Loading SEO map…</p>
                </div>
            ) : (
                <>
                    <div className="mb-4">
                        <Input
                            placeholder="Filter pages…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-9 max-w-sm"
                        />
                    </div>
                    <DataTable columns={columns} data={filtered} />
                </>
            )}
        </AdminLayout>
    );
}
