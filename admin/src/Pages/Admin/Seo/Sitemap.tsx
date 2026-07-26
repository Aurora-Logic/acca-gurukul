import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import {
    Copy,
    Check,
    RefreshCw,
    ExternalLink,
    Search,
} from 'lucide-react';
import { api } from '@/lib/api';

export interface SitemapUrlItem {
    type: string;
    name: string;
    url: string;
    loc: string;
    priority: string;
    changefreq: string;
    lastmod: string;
}

export interface SitemapData {
    host: string;
    sitemap_url: string;
    total_urls: number;
    static_count: number;
    blog_count: number;
    xml_content: string;
    last_generated: string;
    urls: SitemapUrlItem[];
}

export default function SitemapPage() {
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [search, setSearch] = useState('');
    const [data, setData] = useState<SitemapData | null>(null);

    const fetchSitemap = async () => {
        try {
            const res = await api<{ error: boolean; sitemap: SitemapData }>('/api/admin/sitemap.php');
            if (res && res.sitemap) {
                setData(res.sitemap);
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to load sitemap');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSitemap();
    }, []);

    const handleRegenerate = async () => {
        setRegenerating(true);
        try {
            const res = await api<{ error: boolean; message: string; sitemap: SitemapData }>('/api/admin/sitemap.php', {
                method: 'POST',
            });
            if (res && res.sitemap) {
                setData(res.sitemap);
                toast.success('Sitemap regenerated successfully');
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to regenerate sitemap');
        } finally {
            setRegenerating(false);
        }
    };

    const handleCopyUrl = (urlToCopy?: string) => {
        const targetUrl = urlToCopy || data?.sitemap_url || `${window.location.origin}/sitemap.xml`;
        navigator.clipboard.writeText(targetUrl);
        setCopied(true);
        toast.success('Sitemap URL copied to clipboard!');
        setTimeout(() => setCopied(false), 2500);
    };

    const filteredUrls = useMemo(() => {
        if (!data || !data.urls) return [];
        if (!search) return data.urls;
        const q = search.toLowerCase();
        return data.urls.filter(
            (u) =>
                u.name.toLowerCase().includes(q) ||
                u.url.toLowerCase().includes(q) ||
                u.type.toLowerCase().includes(q)
        );
    }, [data, search]);

    const columns: ColumnDef<SitemapUrlItem>[] = [
        {
            accessorKey: 'name',
            header: ({ column }) => <SortableHeader column={column} title="Page / Article" />,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-sm">{item.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{item.loc}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'type',
            header: ({ column }) => <SortableHeader column={column} title="Type" />,
            cell: ({ row }) => {
                const isBlog = row.original.type === 'Blog Article';
                return (
                    <Badge variant={isBlog ? 'secondary' : 'outline'} className="text-xs font-normal">
                        {row.original.type}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'priority',
            header: ({ column }) => <SortableHeader column={column} title="Priority" />,
            cell: ({ row }) => (
                <span className="font-mono text-xs font-semibold">{row.original.priority}</span>
            ),
        },
        {
            accessorKey: 'changefreq',
            header: ({ column }) => <SortableHeader column={column} title="Frequency" />,
            cell: ({ row }) => (
                <span className="capitalize text-xs text-muted-foreground">{row.original.changefreq}</span>
            ),
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 cursor-pointer"
                        onClick={() => handleCopyUrl(row.original.url)}
                    >
                        <Copy className="size-3.5" />
                        <span className="sr-only">Copy</span>
                    </Button>
                    <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 cursor-pointer"
                    >
                        <a href={row.original.url} target="_blank" rel="noreferrer">
                            <ExternalLink className="size-3.5" />
                            <span className="sr-only">Open</span>
                        </a>
                    </Button>
                </div>
            ),
        },
    ];

    const toolbar = (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search sitemap URLs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9"
                />
            </div>
            <div className="flex items-center gap-2 sm:ml-auto">
                <Button
                    variant="outline"
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="gap-2 cursor-pointer h-9"
                >
                    <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
                    {regenerating ? 'Regenerating...' : 'Regenerate Sitemap'}
                </Button>
            </div>
        </div>
    );

    if (loading) {
        return (
            <AdminLayout breadcrumbs={[{ label: 'System' }, { label: 'Sitemap' }]}>
                <div className="flex items-center justify-center p-12">
                    <p className="text-sm text-muted-foreground animate-pulse">Loading sitemap...</p>
                </div>
            </AdminLayout>
        );
    }

    const sitemapUrl = data?.sitemap_url || `${window.location.origin}/sitemap.xml`;

    return (
        <AdminLayout breadcrumbs={[{ label: 'System' }, { label: 'Sitemap' }]}>
            <div className="max-w-5xl mx-auto space-y-6 pb-12">
                {/* Search Console Sitemap Card */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">
                            Google Search Console Link
                        </CardTitle>
                        <CardDescription>
                            Copy this URL to paste into Google Search Console sitemaps section.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <Input
                                readOnly
                                value={sitemapUrl}
                                className="font-mono text-xs sm:text-sm bg-background font-medium"
                            />
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => handleCopyUrl(sitemapUrl)}
                                    className="gap-2 shrink-0 cursor-pointer"
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    {copied ? 'Copied!' : 'Copy Link'}
                                </Button>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="gap-2 shrink-0 cursor-pointer"
                                >
                                    <a href="/sitemap.xml" target="_blank" rel="noreferrer">
                                        <ExternalLink className="h-4 w-4" />
                                        View XML
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Simple Tabs for Table vs Raw XML */}
                <Tabs defaultValue="urls" className="w-full">
                    <div className="mb-4">
                        <TabsList className="grid w-full grid-cols-2 max-w-xs">
                            <TabsTrigger value="urls">
                                URL List ({data?.total_urls || 0})
                            </TabsTrigger>
                            <TabsTrigger value="xml">
                                XML Preview
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="urls" className="space-y-4">
                        <DataTable
                            columns={columns}
                            data={filteredUrls}
                            toolbar={toolbar}
                            emptyMessage="No URLs found in sitemap."
                        />
                    </TabsContent>

                    <TabsContent value="xml" className="space-y-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle className="text-base">sitemap.xml Raw Source</CardTitle>
                                    <CardDescription>Generated XML structure for search crawlers</CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 cursor-pointer"
                                    onClick={() => {
                                        if (data?.xml_content) {
                                            navigator.clipboard.writeText(data.xml_content);
                                            toast.success('XML copied to clipboard');
                                        }
                                    }}
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                    Copy XML
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <pre className="font-mono text-xs bg-background text-foreground p-4 rounded-lg overflow-x-auto max-h-128 border">
                                    {data?.xml_content || '<!-- No XML generated -->'}
                                </pre>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    );
}
