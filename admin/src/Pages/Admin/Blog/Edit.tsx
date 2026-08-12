import { useRef, useState, useCallback } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Upload, X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import SeoFields from '@/components/SeoFields';
import { api, ApiError } from '@/lib/api';
import { useEffect } from 'react';

interface FaqItem {
    question: string;
    answer: string;
}

interface BlogEditFormData {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featured_image: File | null;
    category: string;
    tags: string;
    meta_title: string;
    meta_description: string;
    og_title: string;
    og_description: string;
    featured_image_alt: string;
    author: string;
    read_time: string;
    is_published: boolean;
    is_featured: boolean;
    show_toc: boolean;
    faqsList: FaqItem[];
}

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9']+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export default function BlogEdit() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [slugManuallyEdited, setSlugManuallyEdited] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [processing, setProcessing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [errors] = useState<Partial<Record<keyof BlogEditFormData, string>>>({});
    const [existingImage, setExistingImage] = useState<string | null>(null);

    const [data, setDataState] = useState<BlogEditFormData>({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        featured_image: null,
        category: '',
        tags: '',
        meta_title: '',
        meta_description: '',
        og_title: '',
        og_description: '',
        featured_image_alt: '',
        author: '',
        read_time: '',
        is_published: false,
        is_featured: false,
        show_toc: true,
        faqsList: [],
    });

    useEffect(() => {
        let active = true;
        api<{ blog: Record<string, unknown> }>(`/api/admin/blogs/show.php?id=${id}`)
            .then((res) => {
                if (!active) return;
                const b = res.blog as Record<string, unknown>;
                let faqsParsed: FaqItem[] = [];
                if (typeof b.faqs === 'string' && b.faqs.trim() !== '') {
                    try {
                        faqsParsed = JSON.parse(b.faqs);
                    } catch (e) {
                        console.error('Failed to parse FAQs JSON', e);
                    }
                } else if (Array.isArray(b.faqs)) {
                    faqsParsed = b.faqs as FaqItem[];
                }

                setDataState({
                    title: (b.title as string) || '',
                    slug: (b.slug as string) || '',
                    excerpt: (b.excerpt as string) || '',
                    content: (b.content as string) || '',
                    featured_image: null,
                    category: (b.category as string) || '',
                    tags: Array.isArray(b.tags) ? b.tags.join(', ') : ((b.tags as string) || ''),
                    meta_title: (b.meta_title as string) || '',
                    meta_description: (b.meta_description as string) || '',
                    og_title: (b.og_title as string) || '',
                    og_description: (b.og_description as string) || '',
                    featured_image_alt: (b.featured_image_alt as string) || '',
                    author: (b.author as string) || '',
                    read_time: b.read_time ? String(b.read_time) : '',
                    is_published: !!b.is_published,
                    is_featured: !!b.is_featured,
                    show_toc: b.show_toc === undefined ? true : !!b.show_toc,
                    faqsList: faqsParsed,
                });
                setExistingImage((b.featured_image as string) || null);
            })
            .catch((err: ApiError) => {
                if (active) toast.error('Failed to load blog', { description: err.message });
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [id]);

    const setData = useCallback((keyOrFn: keyof BlogEditFormData | ((prev: BlogEditFormData) => BlogEditFormData), val?: BlogEditFormData[keyof BlogEditFormData]) => {
        if (typeof keyOrFn === 'function') {
            setDataState(keyOrFn);
        } else {
            setDataState(prev => ({ ...prev, [keyOrFn]: val }));
        }
    }, []);

    const imagePreview = data.featured_image
        ? URL.createObjectURL(data.featured_image)
        : existingImage;

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) setData('featured_image', file);
    }

    function clearImage() {
        setData('featured_image', null);
        setExistingImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    const handleTitleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newTitle = e.target.value;
            setData((prev) => ({
                ...prev,
                title: newTitle,
                ...(!slugManuallyEdited ? { slug: generateSlug(newTitle) } : {}),
            }));
        },
        [slugManuallyEdited, setData]
    );

    function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
        setSlugManuallyEdited(true);
        setData('slug', e.target.value);
    }

    function handleSeoChange(field: string, value: string) {
        setData(field as keyof BlogEditFormData, value);
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setProcessing(true);

        try {
            const formData = new FormData();
            formData.append('id', String(id));
            formData.append('title', data.title);
            formData.append('slug', data.slug || generateSlug(data.title));
            formData.append('excerpt', data.excerpt);
            formData.append('content', data.content);
            if (data.featured_image instanceof File) {
                formData.append('featured_image', data.featured_image);
            } else if (!existingImage) {
                // Sent when user clears existing image
                formData.append('remove_image', '1');
            }

            formData.append('category', data.category);
            formData.append('tags', data.tags);
            formData.append('meta_title', data.meta_title);
            formData.append('meta_description', data.meta_description);
            formData.append('og_title', data.og_title);
            formData.append('og_description', data.og_description);
            formData.append('featured_image_alt', data.featured_image_alt);
            formData.append('author', data.author);
            formData.append('read_time', data.read_time);
            formData.append('is_published', data.is_published ? '1' : '0');
            formData.append('is_featured', data.is_featured ? '1' : '0');
            formData.append('show_toc', data.show_toc ? '1' : '0');
            formData.append('faqs', JSON.stringify(data.faqsList));

            await api('/api/admin/blogs/update.php', {
                method: 'POST',
                body: formData,
            });

            toast.success('Post updated successfully.');
            navigate('/admin/blog');
        } catch (err) {
            const e = err as ApiError;
            toast.error('Update failed', { description: e.message || 'Error occurred while saving.' });
        } finally {
            setProcessing(false);
        }
    }

    if (loading) {
        return (
            <AdminLayout breadcrumbs={[{ label: 'Blog', href: '/admin/blog' }, { label: 'Edit' }]}>
                <div className="flex items-center justify-center min-h-100">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout breadcrumbs={[{ label: 'Blog', href: '/admin/blog' }, { label: 'Edit' }]}>

            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-6">
                <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2 shrink-0">
                    <Link to="/admin/blog">
                        <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
                    </Link>
                </Button>
                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" asChild className="hidden sm:inline-flex">
                        <Link to="/admin/blog">Cancel</Link>
                    </Button>
                    <Button type="submit" size="sm" form="blog-form" disabled={processing}>
                        {processing ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            <form id="blog-form" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
                    {/* Left Column — content */}
                    <div className="space-y-6 min-w-0">
                        {/* Title & Slug */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="title">Title *</Label>
                                <Input id="title" value={data.title} onChange={handleTitleChange} placeholder="Post title" required />
                                {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="slug">Slug</Label>
                                <Input id="slug" value={data.slug} onChange={handleSlugChange} placeholder="post-url-slug" />
                                {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-1.5">
                            <Label>Content *</Label>
                            <RichTextEditor
                                value={data.content}
                                onChange={(html) => setData('content', html)}
                                placeholder="Write your blog content here..."
                            />
                            {errors.content && <p className="text-xs text-destructive">{errors.content}</p>}
                        </div>

                        {/* Excerpt */}
                        <div className="space-y-1.5">
                            <Label htmlFor="excerpt">Excerpt</Label>
                            <Textarea id="excerpt" value={data.excerpt} onChange={(e) => setData('excerpt', e.target.value)} rows={3} placeholder="Brief summary of the post" />
                            {errors.excerpt && <p className="text-xs text-destructive">{errors.excerpt}</p>}
                        </div>

                        {/* SEO */}
                        <SeoFields
                            data={{
                                meta_title: data.meta_title,
                                meta_description: data.meta_description,
                                og_title: data.og_title,
                                og_description: data.og_description,
                                featured_image_alt: data.featured_image_alt
                            }}
                            onChange={handleSeoChange}
                            errors={{
                                meta_title: errors.meta_title,
                                meta_description: errors.meta_description,
                                og_title: errors.og_title as string,
                                og_description: errors.og_description as string,
                                featured_image_alt: errors.featured_image_alt as string
                            }}
                        />

                        {/* FAQ Manager */}
                        <div className="space-y-4 rounded-lg border border-border p-4 bg-card text-card-foreground">
                            <div>
                                <h3 className="text-lg font-semibold">FAQs</h3>
                                <p className="text-sm text-muted-foreground">Add FAQ questions and answers that will appear at the end of this blog post.</p>
                            </div>
                            <Separator />
                            
                            <div className="space-y-4">
                                {data.faqsList.map((faq, index) => (
                                    <div key={index} className="flex gap-4 items-start border-b border-border/50 pb-4 last:border-0 last:pb-0">
                                        <div className="flex-1 space-y-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`faq-q-${index}`}>Question</Label>
                                                <Input 
                                                    id={`faq-q-${index}`} 
                                                    value={faq.question} 
                                                    onChange={(e) => {
                                                        const updated = [...data.faqsList];
                                                        const item = updated[index];
                                                        if (item) {
                                                            item.question = e.target.value;
                                                            setData('faqsList', updated);
                                                        }
                                                    }}
                                                    placeholder="e.g. What is the eligibility criteria for ACCA?" 
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`faq-a-${index}`}>Answer</Label>
                                                <Textarea 
                                                    id={`faq-a-${index}`} 
                                                    value={faq.answer} 
                                                    onChange={(e) => {
                                                        const updated = [...data.faqsList];
                                                        const item = updated[index];
                                                        if (item) {
                                                            item.answer = e.target.value;
                                                            setData('faqsList', updated);
                                                        }
                                                    }}
                                                    placeholder="Provide a brief, clear answer here." 
                                                    rows={2} 
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-6 shrink-0"
                                            onClick={() => {
                                                const updated = data.faqsList.filter((_, i) => i !== index);
                                                setData('faqsList', updated);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    className="gap-1.5"
                                    onClick={() => setData('faqsList', [...data.faqsList, { question: '', answer: '' }])}
                                >
                                    <Plus className="h-4 w-4" /> Add FAQ Item
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column — sidebar (sticky) */}
                    <div className="space-y-5 lg:sticky lg:top-4">
                        {/* Publish */}
                        <div className="rounded-lg border border-border p-4 space-y-4">
                            <p className="text-sm font-medium">Publish</p>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="is_published" className="font-normal cursor-pointer text-sm">Published</Label>
                                <Switch id="is_published" checked={data.is_published} onCheckedChange={(checked) => setData('is_published', checked)} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="is_featured" className="font-normal cursor-pointer text-sm">Featured post</Label>
                                <Switch id="is_featured" checked={data.is_featured} onCheckedChange={(checked) => setData('is_featured', checked)} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="show_toc" className="font-normal cursor-pointer text-sm">Show Table of Contents</Label>
                                <Switch id="show_toc" checked={data.show_toc} onCheckedChange={(checked) => setData('show_toc', checked)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="author" className="text-xs text-muted-foreground">Author</Label>
                                <Input id="author" value={data.author} onChange={(e) => setData('author', e.target.value)} placeholder="e.g. Himesh Gandhi" />
                            </div>
                        </div>

                        {/* Category */}
                        <div className="rounded-lg border border-border p-4 space-y-3">
                            <p className="text-sm font-medium">Category</p>
                            <Select value={data.category || '_none'} onValueChange={(v) => setData('category', v === '_none' ? '' : v)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none">No category</SelectItem>
                                    <SelectItem value="All Articles">All Articles</SelectItem>
                                    <SelectItem value="Syllabus & Guides">Syllabus & Guides</SelectItem>
                                    <SelectItem value="Exam Strategies">Exam Strategies</SelectItem>
                                    <SelectItem value="ACCA Updates">ACCA Updates</SelectItem>
                                    <SelectItem value="Careers & Jobs">Careers & Jobs</SelectItem>
                                    <SelectItem value="Success Stories">Success Stories</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
                        </div>

                        {/* Tags */}
                        <div className="rounded-lg border border-border p-4 space-y-3">
                            <p className="text-sm font-medium">Tags</p>
                            <Input value={data.tags} onChange={(e) => setData('tags', e.target.value)} placeholder="tag1, tag2, tag3" />
                            <p className="text-[10px] text-muted-foreground">Comma-separated</p>
                            {errors.tags && <p className="text-xs text-destructive">{errors.tags}</p>}
                        </div>

                        {/* Read Time */}
                        <div className="rounded-lg border border-border p-4 space-y-3">
                            <p className="text-sm font-medium">Read Time (mins)</p>
                            <Input type="number" min="1" value={data.read_time} onChange={(e) => setData('read_time', e.target.value)} placeholder="e.g. 5" />
                            {errors.read_time && <p className="text-xs text-destructive">{errors.read_time}</p>}
                        </div>

                        {/* Featured Image */}
                        <div className="rounded-lg border border-border p-4 space-y-3">
                            <p className="text-sm font-medium">Featured Image</p>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            <div
                                className="relative aspect-video w-full rounded-md border-2 border-dashed border-border bg-muted/50 flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 hover:bg-muted transition-colors overflow-hidden"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} alt="Featured image" className="absolute inset-0 w-full h-full object-cover" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1.5 right-1.5 h-6 w-6 z-10"
                                            onClick={(e) => { e.stopPropagation(); clearImage(); }}
                                        >
                                            <X className="size-3" />
                                        </Button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-1 text-muted-foreground py-4">
                                        <Upload className="size-6" />
                                        <span className="text-xs">Click to upload</span>
                                        <span className="text-[10px]">1200 x 630 recommended</span>
                                    </div>
                                )}
                            </div>
                            {errors.featured_image && <p className="text-xs text-destructive">{errors.featured_image}</p>}
                        </div>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
