import { useRef, useState, useEffect } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft,
    Upload,
    X,
    Code2,
    Tags,
    Share2,
    Eye,
    Settings2,
} from 'lucide-react';
import { api } from '@/lib/api';

interface SeoEditFormData {
    meta_title: string;
    meta_description: string;
    og_image: File | null;
    og_title: string;
    og_description: string;
    meta_keywords: string;
    structured_data: string;
    canonical_url: string;
    noindex: boolean;
}

export default function SeoEdit() {
    const { pageIdentifier } = useParams();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(true);

    const [data, setDataState] = useState<SeoEditFormData>({
        meta_title: '',
        meta_description: '',
        og_image: null,
        og_title: '',
        og_description: '',
        meta_keywords: '',
        structured_data: '',
        canonical_url: '',
        noindex: false,
    });
    
    // Original OG image URL for preview if any
    const [originalOgImage, setOriginalOgImage] = useState<string | null>(null);

    const setData = (key: keyof SeoEditFormData, val: SeoEditFormData[keyof SeoEditFormData]) => setDataState(prev => ({ ...prev, [key]: val }));
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof SeoEditFormData, string>>>({});

    useEffect(() => {
        async function fetchSeo() {
            try {
                const res = await api<Record<string, unknown>>(`/api/admin/seo/get.php?id=${pageIdentifier}`);
                setDataState(prev => ({
                    ...prev,
                    meta_title: (res.meta_title as string) || '',
                    meta_description: (res.meta_description as string) || '',
                    og_title: (res.og_title as string) || '',
                    og_description: (res.og_description as string) || '',
                    meta_keywords: Array.isArray(res.meta_keywords) ? res.meta_keywords.join(', ') : ((res.meta_keywords as string) || ''),
                    canonical_url: (res.canonical_url as string) || '',
                    noindex: !!res.noindex,
                    structured_data: (res.structured_data as string) || ''
                }));
                setOriginalOgImage((res.og_image as string) || null);
            } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed to load SEO data');
            } finally {
                setLoading(false);
            }
        }
        if (pageIdentifier) fetchSeo();
    }, [pageIdentifier]);

    const ogPreview = data.og_image
        ? URL.createObjectURL(data.og_image)
        : originalOgImage;

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setData('og_image', file);
        }
    }

    function clearOgImage() {
        setData('og_image', null);
        setOriginalOgImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        
        try {
            const formData = new FormData();
            formData.append('page_identifier', pageIdentifier || '');
            if (data.meta_title) formData.append('meta_title', data.meta_title);
            if (data.meta_description) formData.append('meta_description', data.meta_description);
            if (data.og_title) formData.append('og_title', data.og_title);
            if (data.og_description) formData.append('og_description', data.og_description);
            if (data.meta_keywords) formData.append('meta_keywords', data.meta_keywords);
            if (data.canonical_url) formData.append('canonical_url', data.canonical_url);
            if (data.noindex) formData.append('noindex', 'true');
            if (data.structured_data) formData.append('structured_data', data.structured_data);
            if (data.og_image) formData.append('og_image', data.og_image);

            await api('/api/admin/seo/update.php', {
                method: 'POST',
                body: formData
            });
            toast.success('SEO settings saved successfully.');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save settings');
            if (err && typeof err === 'object' && 'errors' in err) {
                setErrors((err as { errors: Record<string, string> }).errors);
            }
        } finally {
            setProcessing(false);
        }
    }

    const identifier = pageIdentifier || '';
    const pageName = identifier.charAt(0).toUpperCase() + identifier.slice(1);

    const previewTitle = data.meta_title || pageName || 'Page Title';
    const previewDescription =
        data.meta_description || 'No description provided. Add a meta description to control how this page appears in search results.';

    return (
        <AdminLayout
            breadcrumbs={[
                { label: 'SEO', href: '/admin/seo' },
                { label: pageName },
            ]}
        >
            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <p className="text-sm text-muted-foreground animate-pulse">Loading settings...</p>
                </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                    <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2 shrink-0">
                        <Link to="/admin/seo">
                            <ArrowLeft className="size-3.5" />
                            <span className="hidden sm:inline">Back</span>
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" asChild className="hidden sm:inline-flex">
                            <Link to="/admin/seo">Cancel</Link>
                        </Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            {processing ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>

                {/* Google Preview - compact */}
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Eye className="size-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Search Preview</span>
                    </div>
                    <div className="max-w-lg">
                        <p className="text-[11px] text-muted-foreground truncate">
                            {data.canonical_url || `https://example.com/${pageIdentifier || ''}`}
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium truncate leading-snug">
                            {previewTitle}
                        </p>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                            {previewDescription}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="meta" className="w-full">
                    <TabsList className="w-full grid grid-cols-3">
                        <TabsTrigger value="meta" className="gap-1 sm:gap-1.5 text-[11px] sm:text-xs px-2 sm:px-3">
                            <Tags className="size-3 sm:size-3.5" />
                            <span className="hidden xs:inline">Meta </span>Tags
                        </TabsTrigger>
                        <TabsTrigger value="social" className="gap-1 sm:gap-1.5 text-[11px] sm:text-xs px-2 sm:px-3">
                            <Share2 className="size-3 sm:size-3.5" />
                            Social
                        </TabsTrigger>
                        <TabsTrigger value="advanced" className="gap-1 sm:gap-1.5 text-[11px] sm:text-xs px-2 sm:px-3">
                            <Settings2 className="size-3 sm:size-3.5" />
                            Advanced
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Meta Tags */}
                    <TabsContent value="meta" className="mt-4 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Meta Title */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="meta_title">Meta Title</Label>
                                    <span className="text-[10px] text-muted-foreground tabular-nums">
                                        {data.meta_title.length}/70
                                    </span>
                                </div>
                                <Input
                                    id="meta_title"
                                    value={data.meta_title}
                                    onChange={(e) => setData('meta_title', e.target.value)}
                                    maxLength={70}
                                    placeholder="Page title for search engines"
                                />
                                {errors.meta_title && (
                                    <p className="text-xs text-destructive">{errors.meta_title}</p>
                                )}
                            </div>

                            {/* Keywords */}
                            <div className="space-y-1.5">
                                <Label htmlFor="meta_keywords">Keywords</Label>
                                <Input
                                    id="meta_keywords"
                                    value={data.meta_keywords}
                                    onChange={(e) => setData('meta_keywords', e.target.value)}
                                    placeholder="keyword1, keyword2, keyword3"
                                />
                                <p className="text-[10px] text-muted-foreground">Comma-separated</p>
                                {errors.meta_keywords && (
                                    <p className="text-xs text-destructive">{errors.meta_keywords}</p>
                                )}
                            </div>
                        </div>

                        {/* Meta Description - full width */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="meta_description">Meta Description</Label>
                                <span className="text-[10px] text-muted-foreground tabular-nums">
                                    {data.meta_description.length}/170
                                </span>
                            </div>
                            <Textarea
                                id="meta_description"
                                value={data.meta_description}
                                onChange={(e) => setData('meta_description', e.target.value)}
                                maxLength={170}
                                rows={2}
                                placeholder="Brief description for search results"
                                className="resize-none"
                            />
                            {errors.meta_description && (
                                <p className="text-xs text-destructive">{errors.meta_description}</p>
                            )}
                        </div>
                    </TabsContent>

                    {/* Tab 2: Social & Links */}
                    <TabsContent value="social" className="mt-4">
                        <div className="grid gap-4 lg:grid-cols-[1fr_2fr] items-start">
                            {/* OG Image */}
                            <div className="space-y-2 max-w-sm">
                                <Label>OG Image</Label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <div
                                    className="relative aspect-video w-full rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 hover:bg-muted transition-colors overflow-hidden"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {ogPreview ? (
                                        <>
                                            <img
                                                src={ogPreview}
                                                alt="OG Image preview"
                                                className="absolute inset-0 w-full h-full object-cover"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2 h-7 w-7 z-10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    clearOgImage();
                                                }}
                                            >
                                                <X className="size-3.5" />
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                                            <Upload className="size-8" />
                                            <span className="text-xs">Click to upload</span>
                                            <span className="text-[10px]">1200 x 630px recommended</span>
                                        </div>
                                    )}
                                </div>
                                {errors.og_image && (
                                    <p className="text-xs text-destructive">{errors.og_image}</p>
                                )}
                            </div>

                            {/* OG Fields */}
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <Label htmlFor="og_title">OG Title</Label>
                                    </div>
                                    <Input
                                        id="og_title"
                                        value={data.og_title}
                                        onChange={(e) => setData('og_title', e.target.value)}
                                        placeholder="Social share title"
                                    />
                                    {errors.og_title && (
                                        <p className="text-xs text-destructive">{errors.og_title}</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between gap-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <Label htmlFor="og_description">OG Description</Label>
                                        </div>
                                    </div>
                                    <Textarea
                                        id="og_description"
                                        value={data.og_description}
                                        onChange={(e) => setData('og_description', e.target.value)}
                                        rows={3}
                                        placeholder="Brief description for social sharing"
                                        className="resize-none"
                                    />
                                    {errors.og_description && (
                                        <p className="text-xs text-destructive">{errors.og_description}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab 3: Advanced */}
                    <TabsContent value="advanced" className="mt-4 space-y-4">
                        <div className="grid gap-4 lg:grid-cols-2 items-start">
                            {/* Canonical URL and Indexing */}
                            <div className="space-y-4">
                                <div className="rounded-lg border border-border p-4 space-y-3">
                                    <p className="text-sm font-medium">Canonical URL</p>
                                    <div className="space-y-1.5">
                                        <Input
                                            id="canonical_url"
                                            value={data.canonical_url}
                                            onChange={(e) => setData('canonical_url', e.target.value)}
                                            placeholder="https://example.com/page"
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                            Leave empty to use the default page URL
                                        </p>
                                        {errors.canonical_url && (
                                            <p className="text-xs text-destructive">{errors.canonical_url}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Indexing */}
                                <div className="rounded-lg border border-border p-4 space-y-3">
                                    <p className="text-sm font-medium">Indexing</p>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="noindex" className="cursor-pointer text-sm font-normal">
                                                Prevent Indexing
                                            </Label>
                                            <p className="text-[10px] text-muted-foreground">
                                                Add noindex meta tag to this page
                                            </p>
                                        </div>
                                        <Switch
                                            id="noindex"
                                            checked={data.noindex}
                                            onCheckedChange={(checked) => setData('noindex', checked)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Structured Data */}
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5">
                                    <Code2 className="size-3.5 text-muted-foreground" />
                                    <Label htmlFor="structured_data">Structured Data (JSON-LD)</Label>
                                </div>
                                <Textarea
                                    id="structured_data"
                                    value={data.structured_data}
                                    onChange={(e) => setData('structured_data', e.target.value)}
                                    rows={8}
                                    placeholder='{"@context": "https://schema.org", ...}'
                                    className="resize-y font-mono text-xs"
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Add structured data for rich search results
                                </p>
                                {errors.structured_data && (
                                    <p className="text-xs text-destructive">{errors.structured_data}</p>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </form>
            )}
        </AdminLayout>
    );
}
