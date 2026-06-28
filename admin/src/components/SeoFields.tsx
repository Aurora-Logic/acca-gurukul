import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

interface SeoFieldsData {
    meta_title: string;
    meta_description: string;
    og_title: string;
    og_description: string;
    featured_image_alt: string;
}

interface SeoFieldsProps {
    data: SeoFieldsData;
    onChange: (field: string, value: string) => void;
    errors?: Partial<Record<keyof SeoFieldsData, string>>;
}

export default function SeoFields({ data, onChange, errors }: SeoFieldsProps) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">SEO & Social Sharing</h2>
                <p className="text-sm text-muted-foreground">Search engine optimization and social preview settings</p>
            </div>
            <Separator />

            {/* Standard SEO (Google) */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Search Engine SEO (Google)</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="meta_title">Meta Title</Label>
                        <Input
                            id="meta_title"
                            value={data.meta_title || ''}
                            onChange={(e) => onChange('meta_title', e.target.value)}
                            placeholder="Page title for Google search"
                        />
                        <p className="text-[10px] text-muted-foreground">{(data.meta_title || '').length}/60 characters (recommended)</p>
                        {errors?.meta_title && <p className="text-xs text-destructive">{errors.meta_title}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="meta_description">Meta Description</Label>
                        <Textarea
                            id="meta_description"
                            value={data.meta_description || ''}
                            onChange={(e) => onChange('meta_description', e.target.value)}
                            placeholder="Brief description for search results"
                            rows={2}
                        />
                        <p className="text-[10px] text-muted-foreground">{(data.meta_description || '').length}/160 characters (recommended)</p>
                        {errors?.meta_description && <p className="text-xs text-destructive">{errors.meta_description}</p>}
                    </div>
                </div>
            </div>

            <Separator />

            {/* Open Graph / Social Sharing (WhatsApp, etc) */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Social Media Preview (OG - WhatsApp, Facebook)</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="og_title">OG Title</Label>
                        <Input
                            id="og_title"
                            value={data.og_title || ''}
                            onChange={(e) => onChange('og_title', e.target.value)}
                            placeholder="Title shown when shared on social media"
                        />
                        <p className="text-[10px] text-muted-foreground">{(data.og_title || '').length} characters (falls back to Meta Title)</p>
                        {errors?.og_title && <p className="text-xs text-destructive">{errors.og_title}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="og_description">OG Description</Label>
                        <Textarea
                            id="og_description"
                            value={data.og_description || ''}
                            onChange={(e) => onChange('og_description', e.target.value)}
                            placeholder="Description shown when shared on social media"
                            rows={2}
                        />
                        <p className="text-[10px] text-muted-foreground">{(data.og_description || '').length} characters (falls back to Meta Description)</p>
                        {errors?.og_description && <p className="text-xs text-destructive">{errors.og_description}</p>}
                    </div>
                </div>
            </div>

            <Separator />

            {/* Accessibility / Alt Tags */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Image Accessibility</h3>
                <div className="space-y-2 max-w-md">
                    <Label htmlFor="featured_image_alt">Featured Image Alt Tag</Label>
                    <Input
                        id="featured_image_alt"
                        value={data.featured_image_alt || ''}
                        onChange={(e) => onChange('featured_image_alt', e.target.value)}
                        placeholder="Alternative text describing the featured image"
                    />
                    <p className="text-[10px] text-muted-foreground">Crucial for Google Image Search and accessibility (falls back to Blog Title)</p>
                    {errors?.featured_image_alt && <p className="text-xs text-destructive">{errors.featured_image_alt}</p>}
                </div>
            </div>
        </div>
    );
}
