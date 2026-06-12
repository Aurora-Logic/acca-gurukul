import { useState, useMemo, useEffect, useCallback } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import { formatDate } from '@/lib/dates';
import { api, ApiError } from '@/lib/api';

interface BlogPost {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    tags: string[];
    featured_image: string | null;
    is_published: boolean;
    is_featured: boolean;
    published_at: string | null;
    meta_title: string;
    meta_description: string;
    views: number;
    read_time: number;
    created_at: string;
    updated_at: string;
}

export default function BlogIndex() {
    const [search, setSearch] = useState('');
    const [publishedFilter, setPublishedFilter] = useState('');
    const [featuredFilter, setFeaturedFilter] = useState('');
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState<BlogPost[]>([]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await api<{ blogs: BlogPost[] }>('/api/admin/blogs/list.php');
                if (!cancelled) setPosts(data.blogs || []);
            } catch (err) {
                const e = err as ApiError;
                if (!cancelled) toast.error('Failed to load posts', { description: e.message });
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const filteredData = useMemo(() => {
        let items = posts;
        if (search) {
            const q = search.toLowerCase();
            items = items.filter(p => p.title.toLowerCase().includes(q));
        }
        if (publishedFilter === 'published') {
            items = items.filter(p => p.is_published);
        } else if (publishedFilter === 'draft') {
            items = items.filter(p => !p.is_published);
        }
        if (featuredFilter === 'featured') {
            items = items.filter(p => p.is_featured);
        } else if (featuredFilter === 'not_featured') {
            items = items.filter(p => !p.is_featured);
        }
        return items;
    }, [posts, search, publishedFilter, featuredFilter]);

    const handleSearch = (value: string) => {
        setSearch(value);
    };

    const handlePublishedFilter = (value: string) => {
        setPublishedFilter(value);
    };

    const hasActiveFilters = search !== '' || publishedFilter !== '' || featuredFilter !== '';

    const clearFilters = () => {
        setSearch('');
        setPublishedFilter('');
        setFeaturedFilter('');
    };

    const handleDelete = useCallback(async () => {
        if (!deleteId) return;
        setProcessing(true);

        const previous = posts;
        setPosts((prev) => prev.filter((p) => p.id !== deleteId));

        try {
            await api('/api/admin/blogs/delete.php', {
                method: 'POST',
                body: JSON.stringify({ id: deleteId }),
            });
            toast.success('Post deleted successfully.');
            setDeleteId(null);
        } catch (err) {
            setPosts(previous);
            const e = err as ApiError;
            toast.error('Delete failed', { description: e.message });
        } finally {
            setProcessing(false);
        }
    }, [deleteId, posts]);

    const columns = useMemo((): ColumnDef<BlogPost>[] => [
        {
            accessorKey: 'title',
            header: ({ column }) => <SortableHeader column={column} title="Title" />,
            cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
        },
        {
            id: 'category',
            header: 'Category',
            cell: ({ row }) => (
                <span className="text-muted-foreground">{row.original.category || 'Uncategorized'}</span>
            ),
        },
        {
            accessorKey: 'views',
            header: ({ column }) => <SortableHeader column={column} title="Views" />,
            cell: ({ row }) => (
                <Badge variant="outline">{row.original.views}</Badge>
            ),
        },
        {
            accessorKey: 'read_time',
            header: 'Read Time',
            cell: ({ row }) => (
                <span className="text-muted-foreground">{row.original.read_time ? `${row.original.read_time} min` : 'N/A'}</span>
            ),
        },
        {
            accessorKey: 'is_featured',
            header: 'Featured',
            cell: ({ row }) => (
                row.original.is_featured
                    ? <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">Featured</Badge>
                    : <span className="text-muted-foreground">—</span>
            ),
        },
        {
            accessorKey: 'is_published',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant={row.original.is_published ? 'default' : 'secondary'}>
                    {row.original.is_published ? 'Published' : 'Draft'}
                </Badge>
            ),
        },
        {
            id: 'date',
            header: 'Date',
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {formatDate(row.original.published_at || row.original.created_at)}
                </span>
            ),
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <Button asChild variant="ghost" size="icon">
                        <Link to={`/admin/blog/${row.original.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(row.original.id)}
                        className="text-destructive hover:text-red-700"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ], []);

    const toolbar = (
        <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-72 sm:flex-none">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search posts..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select
                    value={publishedFilter || '_all'}
                    onValueChange={(v) => handlePublishedFilter(v === '_all' ? '' : v)}
                >
                    <SelectTrigger className="w-32.5 shrink-0 sm:w-35">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="_all">All Status</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={featuredFilter || '_all'}
                    onValueChange={(v) => setFeaturedFilter(v === '_all' ? '' : v)}
                >
                    <SelectTrigger className="w-32.5 shrink-0 sm:w-35">
                        <SelectValue placeholder="All Posts" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="_all">All Posts</SelectItem>
                        <SelectItem value="featured">Featured</SelectItem>
                        <SelectItem value="not_featured">Not Featured</SelectItem>
                    </SelectContent>
                </Select>
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive hover:text-destructive shrink-0 hidden sm:flex">
                        <X className="h-4 w-4 mr-1" />
                        Reset
                    </Button>
                )}
            </div>
            <Button asChild className="w-full sm:w-auto sm:ml-auto">
                <Link to="/admin/blog/create">
                    <Plus className="h-4 w-4 mr-2" />
                    New Post
                </Link>
            </Button>
        </div>
    );

    return (
        <AdminLayout breadcrumbs={[{ label: 'Blog' }]}>
            <DataTable
                columns={columns}
                data={filteredData}
                toolbar={toolbar}
                emptyMessage={loading ? "Loading blog posts..." : "No blog posts found."}
            />

            <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Post</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this post? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)} disabled={processing}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={processing}>
                            {processing ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
