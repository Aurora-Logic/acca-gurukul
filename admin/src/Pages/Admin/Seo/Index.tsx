import { useMemo, useState, useEffect } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Pencil, Globe } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type SeoPage = {
    identifier: string;
    label: string;
    description?: string;
    icon?: string;
    meta_title: string;
    meta_description: string;
    noindex: boolean;
    has_seo: boolean;
};

export default function SeoIndex() {
    const [search, setSearch] = useState('');
    const [pagesWithSeo, setPagesWithSeo] = useState<SeoPage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSeo() {
            try {
                const data = await api<SeoPage[]>('/api/admin/seo/list.php');
                setPagesWithSeo(data);
            } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed to load SEO data');
            } finally {
                setLoading(false);
            }
        }
        fetchSeo();
    }, []);

    const filteredData = useMemo(() => {
        if (!search) return pagesWithSeo;
        const q = search.toLowerCase();
        return pagesWithSeo.filter(
            (p) => p.label.toLowerCase().includes(q) || p.identifier.toLowerCase().includes(q)
        );
    }, [search, pagesWithSeo]);

    const columns: ColumnDef<SeoPage>[] = [
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
                        <span className="text-xs text-muted-foreground">/{row.original.identifier}</span>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'meta_title',
            header: ({ column }) => <SortableHeader column={column} title="Meta Title" />,
            cell: ({ row }) => (
                <div className="max-w-75 truncate text-sm">
                    {row.original.has_seo ? row.original.meta_title : <span className="text-muted-foreground italic">Not set</span>}
                </div>
            ),
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-2">
                    <Button asChild variant="outline" size="sm" className="h-8 gap-1">
                        <Link to={`/admin/seo/${row.original.identifier}/edit`}>
                            <Pencil className="size-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                        </Link>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AdminLayout breadcrumbs={[{ label: 'SEO Management' }]}>
            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <p className="text-sm text-muted-foreground animate-pulse">Loading SEO map...</p>
                </div>
            ) : (
                <>
                    <div className="mb-4">
                        <Input
                            placeholder="Filter pages..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-sm h-9"
                        />
                    </div>
                    <DataTable
                        columns={columns}
                        data={filteredData}
                    />
                </>
            )}
        </AdminLayout>
    );
}