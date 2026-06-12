import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

interface SeoFieldsData {
    meta_title: string;
    meta_description: string;
}

interface SeoFieldsProps {
    data: SeoFieldsData;
    onChange: (field: string, value: string) => void;
    errors?: Partial<Record<keyof SeoFieldsData, string>>;
}

export default function SeoFields({ data, onChange, errors }: SeoFieldsProps) {
    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold">SEO</h2>
                <p className="text-sm text-muted-foreground">Search engine optimization settings</p>
            </div>
            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="meta_title">Meta Title</Label>
                    <Input
                        id="meta_title"
                        value={data.meta_title}
                        onChange={(e) => onChange('meta_title', e.target.value)}
                        placeholder="Page title for search engines"
                    />
                    <p className="text-xs text-muted-foreground">{data.meta_title.length}/60 characters</p>
                    {errors?.meta_title && <p className="text-xs text-destructive">{errors.meta_title}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="meta_description">Meta Description</Label>
                    <Textarea
                        id="meta_description"
                        value={data.meta_description}
                        onChange={(e) => onChange('meta_description', e.target.value)}
                        placeholder="Brief description for search results"
                        rows={2}
                    />
                    <p className="text-xs text-muted-foreground">{data.meta_description.length}/160 characters</p>
                </div>
            </div>
        </div>
    );
}
