import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, Save, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type SeoSettings = Record<string, string>;

/** Rendered as labelled text inputs, grouped by the tab they belong to. */
const FIELDS = {
    identity: [
        ['site_name', 'Site name', 'ACCA Gurukul'],
        ['site_url', 'Site URL', 'https://accagurukul.com'],
        ['title_suffix', 'Title suffix', 'ACCA Gurukul'],
        ['title_separator', 'Title separator', '|'],
        ['default_og_image', 'Default share image', '/assets/images/building.webp'],
    ],
    organisation: [
        ['org_legal_name', 'Legal name', 'ACCA Gurukul'],
        ['org_logo', 'Logo URL', '/logo.png'],
        ['org_phone', 'Phone', '+91 8692 009 002'],
        ['org_email', 'Email', 'contact@accagurukul.com'],
        ['org_street', 'Street address', '...'],
        ['org_locality', 'City', 'Mumbai'],
        ['org_region', 'State', 'Maharashtra'],
        ['org_postal_code', 'Postal code', '400001'],
        ['org_country', 'Country code', 'IN'],
        ['org_latitude', 'Latitude', '19.0760'],
        ['org_longitude', 'Longitude', '72.8777'],
        ['org_founding_date', 'Founded', '2018'],
        ['org_price_range', 'Price range', '$$'],
        ['org_opening_hours', 'Opening hours', 'Mo-Sa 09:00-19:00'],
    ],
    social: [
        ['social_facebook', 'Facebook URL', 'https://facebook.com/…'],
        ['social_instagram', 'Instagram URL', 'https://instagram.com/…'],
        ['social_linkedin', 'LinkedIn URL', 'https://linkedin.com/company/…'],
        ['social_youtube', 'YouTube URL', 'https://youtube.com/@…'],
        ['social_twitter', 'X / Twitter URL', 'https://x.com/…'],
        ['twitter_handle', 'X / Twitter handle', '@accagurukul'],
    ],
    verification: [
        ['google_verification', 'Google Search Console token', 'google-site-verification value'],
        ['bing_verification', 'Bing Webmaster token', 'msvalidate.01 value'],
    ],
} as const;

export default function SeoSettings() {
    const [settings, setSettings] = useState<SeoSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const data = await api<{ settings: SeoSettings }>('/api/admin/seo/settings.php');
                setSettings(data.settings);
            } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed to load settings');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const set = (key: string, value: string) =>
        setSettings((s) => (s ? { ...s, [key]: value } : s));

    async function handleSave() {
        if (!settings) return;
        setSaving(true);
        try {
            await api('/api/admin/seo/settings.php', {
                method: 'POST',
                body: JSON.stringify(settings),
            });
            toast.success('Saved', { description: 'Site-wide SEO settings updated.' });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    }

    if (loading || !settings) {
        return (
            <AdminLayout breadcrumbs={[{ label: 'SEO', href: '/admin/seo' }, { label: 'Settings' }]}>
                <div className="flex items-center justify-center p-12 text-muted-foreground">
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    <span className="text-sm">Loading…</span>
                </div>
            </AdminLayout>
        );
    }

    const renderFields = (fields: readonly (readonly [string, string, string])[]) => (
        <Card>
            <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
                {fields.map(([key, label, placeholder]) => (
                    <div key={key} className="space-y-2">
                        <Label htmlFor={key}>{label}</Label>
                        <Input
                            id={key}
                            value={settings[key] ?? ''}
                            onChange={(e) => set(key, e.target.value)}
                            placeholder={placeholder}
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
    );

    return (
        <AdminLayout breadcrumbs={[{ label: 'SEO', href: '/admin/seo' }, { label: 'Site-wide settings' }]}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="icon" className="size-8">
                        <Link to="/admin/seo"><ArrowLeft className="size-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">Site-wide SEO settings</h1>
                        <p className="text-sm text-muted-foreground">
                            Feeds the organisation data attached to every page, plus robots.txt.
                        </p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    Save changes
                </Button>
            </div>

            <Tabs defaultValue="identity">
                <TabsList>
                    <TabsTrigger value="identity">Identity</TabsTrigger>
                    <TabsTrigger value="organisation">Organisation</TabsTrigger>
                    <TabsTrigger value="social">Social profiles</TabsTrigger>
                    <TabsTrigger value="verification">Verification</TabsTrigger>
                    <TabsTrigger value="robots">robots.txt</TabsTrigger>
                </TabsList>

                <TabsContent value="identity" className="mt-4">{renderFields(FIELDS.identity)}</TabsContent>

                <TabsContent value="organisation" className="mt-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                        These become the LocalBusiness and EducationalOrganization details Google uses for the
                        knowledge panel and local results. Latitude and longitude are optional but improve map
                        placement.
                    </p>
                    {renderFields(FIELDS.organisation)}
                </TabsContent>

                <TabsContent value="social" className="mt-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Published as <code>sameAs</code> links, which is how Google connects these profiles to
                        the organisation.
                    </p>
                    {renderFields(FIELDS.social)}
                </TabsContent>

                <TabsContent value="verification" className="mt-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Paste only the token value, not the whole meta tag.
                    </p>
                    {renderFields(FIELDS.verification)}
                </TabsContent>

                <TabsContent value="robots" className="mt-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">robots.txt</CardTitle>
                            <CardDescription>
                                Served live at{' '}
                                <a href="/robots.txt" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
                                    /robots.txt <ExternalLink className="size-3" />
                                </a>
                                . A <code>Sitemap:</code> line is appended automatically if you leave it out.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                            <Textarea
                                rows={16}
                                spellCheck={false}
                                className="font-mono text-xs"
                                value={settings.robots_txt ?? ''}
                                onChange={(e) => set('robots_txt', e.target.value)}
                            />
                            <p className="mt-2 text-xs text-muted-foreground">
                                Blocking a page here stops it being crawled but does not remove it from search —
                                use the noindex switch on the page itself for that.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </AdminLayout>
    );
}
