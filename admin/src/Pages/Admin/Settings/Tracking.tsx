import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Search, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

export type ScriptType = 'google_tag' | 'meta_pixel' | 'custom_head' | 'custom_body';

export interface ScriptItem {
    id: ScriptType;
    name: string;
    typeLabel: string;
    enabled: boolean;
    script: string;
    targetLocation: string;
}

interface RawSettings {
    google_tag_enabled: boolean;
    google_tag_script: string;
    meta_pixel_enabled: boolean;
    meta_pixel_script: string;
    custom_head_script: string;
    custom_body_script: string;
}

export default function TrackingSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    
    // Settings state
    const [rawSettings, setRawSettings] = useState<RawSettings>({
        google_tag_enabled: false,
        google_tag_script: '',
        meta_pixel_enabled: false,
        meta_pixel_script: '',
        custom_head_script: '',
        custom_body_script: '',
    });

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editType, setEditType] = useState<ScriptType>('google_tag');
    const [editEnabled, setEditEnabled] = useState(true);
    const [editScript, setEditScript] = useState('');

    const fetchSettings = async () => {
        try {
            const res = await api<{ error: boolean; settings: RawSettings }>('/api/admin/settings/tracking.php');
            if (res && res.settings) {
                setRawSettings(res.settings);
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to load tracking settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    // Convert raw settings object to structured script array for table view
    const scriptItems: ScriptItem[] = useMemo(() => {
        return [
            {
                id: 'google_tag',
                name: 'Google Tag',
                typeLabel: 'Google Tag',
                enabled: rawSettings.google_tag_enabled,
                script: rawSettings.google_tag_script || '',
                targetLocation: '<head>',
            },
            {
                id: 'meta_pixel',
                name: 'Meta Pixel',
                typeLabel: 'Meta Pixel',
                enabled: rawSettings.meta_pixel_enabled,
                script: rawSettings.meta_pixel_script || '',
                targetLocation: '<head>',
            },
            {
                id: 'custom_head',
                name: 'Custom Head Script',
                typeLabel: 'Custom Head',
                enabled: !!rawSettings.custom_head_script.trim(),
                script: rawSettings.custom_head_script || '',
                targetLocation: '<head>',
            },
            {
                id: 'custom_body',
                name: 'Custom Body Script',
                typeLabel: 'Custom Body',
                enabled: !!rawSettings.custom_body_script.trim(),
                script: rawSettings.custom_body_script || '',
                targetLocation: '<body>',
            },
        ];
    }, [rawSettings]);

    const filteredItems = useMemo(() => {
        if (!search) return scriptItems;
        const q = search.toLowerCase();
        return scriptItems.filter(
            (item) =>
                item.name.toLowerCase().includes(q) ||
                item.typeLabel.toLowerCase().includes(q) ||
                item.script.toLowerCase().includes(q)
        );
    }, [search, scriptItems]);

    // Save entire settings to backend
    const saveAllSettings = async (updated: RawSettings, successMessage: string) => {
        setSaving(true);
        try {
            await api('/api/admin/settings/tracking.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated),
            });
            setRawSettings(updated);
            toast.success(successMessage, {
                description: 'Updated script changes are active across all website pages.',
            });
            setModalOpen(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save tracking settings');
        } finally {
            setSaving(false);
        }
    };

    // Toggle active status directly from table row
    const handleToggleRow = (item: ScriptItem) => {
        const updated = { ...rawSettings };
        if (item.id === 'google_tag') {
            updated.google_tag_enabled = !item.enabled;
        } else if (item.id === 'meta_pixel') {
            updated.meta_pixel_enabled = !item.enabled;
        }
        saveAllSettings(updated, `${item.name} status updated`);
    };

    // Open modal for creating or editing
    const openModal = (targetItem?: ScriptItem) => {
        if (targetItem) {
            setEditType(targetItem.id);
            setEditEnabled(targetItem.enabled);
            setEditScript(targetItem.script);
        } else {
            setEditType('google_tag');
            setEditEnabled(true);
            setEditScript('');
        }
        setModalOpen(true);
    };

    // Handle modal form submit
    const handleModalSave = () => {
        const updated = { ...rawSettings };
        if (editType === 'google_tag') {
            updated.google_tag_enabled = editScript.trim() ? editEnabled : false;
            updated.google_tag_script = editScript;
        } else if (editType === 'meta_pixel') {
            updated.meta_pixel_enabled = editScript.trim() ? editEnabled : false;
            updated.meta_pixel_script = editScript;
        } else if (editType === 'custom_head') {
            updated.custom_head_script = editScript;
        } else if (editType === 'custom_body') {
            updated.custom_body_script = editScript;
        }
        saveAllSettings(updated, 'Tracking script saved successfully');
    };

    // Handle clear/delete script snippet
    const handleClearScript = (item: ScriptItem) => {
        const updated = { ...rawSettings };
        if (item.id === 'google_tag') {
            updated.google_tag_script = '';
            updated.google_tag_enabled = false;
        } else if (item.id === 'meta_pixel') {
            updated.meta_pixel_script = '';
            updated.meta_pixel_enabled = false;
        } else if (item.id === 'custom_head') {
            updated.custom_head_script = '';
        } else if (item.id === 'custom_body') {
            updated.custom_body_script = '';
        }
        saveAllSettings(updated, `${item.name} removed`);
    };

    const columns: ColumnDef<ScriptItem>[] = [
        {
            accessorKey: 'name',
            header: ({ column }) => <SortableHeader column={column} title="Script Name" />,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-sm">{item.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{item.targetLocation}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'script',
            header: ({ column }) => <SortableHeader column={column} title="Script Preview" />,
            cell: ({ row }) => {
                const scriptText = row.original.script;
                return (
                    <div className="max-w-md truncate font-mono text-xs text-muted-foreground">
                        {scriptText ? (
                            <span>{scriptText.slice(0, 70)}{scriptText.length > 70 ? '...' : ''}</span>
                        ) : (
                            <span className="italic text-muted-foreground/60">No script code added</span>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'enabled',
            header: ({ column }) => <SortableHeader column={column} title="Status" />,
            cell: ({ row }) => {
                const item = row.original;
                const isToggleable = item.id === 'google_tag' || item.id === 'meta_pixel';
                const hasCode = !!item.script.trim();

                if (isToggleable) {
                    return (
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={item.enabled && hasCode}
                                disabled={!hasCode || saving}
                                onCheckedChange={() => handleToggleRow(item)}
                            />
                            <span className="text-xs font-medium">
                                {item.enabled && hasCode ? (
                                    <Badge variant="default" className="bg-emerald-600">Active</Badge>
                                ) : (
                                    <Badge variant="secondary">Inactive</Badge>
                                )}
                            </span>
                        </div>
                    );
                }

                return (
                    <div>
                        {hasCode ? (
                            <Badge variant="default" className="bg-emerald-600">Active</Badge>
                        ) : (
                            <Badge variant="secondary">Inactive</Badge>
                        )}
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 cursor-pointer"
                            onClick={() => openModal(item)}
                        >
                            <Pencil className="size-3.5" />
                            <span>Edit</span>
                        </Button>
                        {item.script.trim() && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-destructive hover:text-destructive cursor-pointer"
                                onClick={() => handleClearScript(item)}
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];

    const toolbar = (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search scripts..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9"
                />
            </div>
            <Button onClick={() => openModal()} className="w-full sm:w-auto sm:ml-auto gap-2 cursor-pointer">
                <Plus className="h-4 w-4" />
                Add Script
            </Button>
        </div>
    );

    return (
        <AdminLayout breadcrumbs={[{ label: 'System' }, { label: 'Tracking & Analytics' }]}>
            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <p className="text-sm text-muted-foreground animate-pulse">Loading tracking scripts...</p>
                </div>
            ) : (
                <>
                    <DataTable
                        columns={columns}
                        data={filteredItems}
                        toolbar={toolbar}
                        emptyMessage="No tracking scripts configured."
                    />

                    {/* Add / Edit Script Dialog Modal */}
                    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                        <DialogContent className="sm:max-w-xl">
                            <DialogHeader>
                                <DialogTitle>
                                    Add / Edit Tracking Script
                                </DialogTitle>
                                <DialogDescription>
                                    Select the script type, enter your raw code snippet, and enable tracking for all public pages.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-2">
                                {/* Script Type Select */}
                                <div className="space-y-2">
                                    <Label htmlFor="script-type-select" className="text-sm font-medium">
                                        Script Type
                                    </Label>
                                    <Select
                                        value={editType}
                                        onValueChange={(val: ScriptType) => {
                                            setEditType(val);
                                            // Fill existing script if switching
                                            const existing = scriptItems.find((i) => i.id === val);
                                            if (existing) {
                                                setEditEnabled(existing.enabled);
                                                setEditScript(existing.script);
                                            }
                                        }}
                                    >
                                        <SelectTrigger id="script-type-select" className="w-full">
                                            <SelectValue placeholder="Select script type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="google_tag">Google Tag</SelectItem>
                                            <SelectItem value="meta_pixel">Meta Pixel</SelectItem>
                                            <SelectItem value="custom_head">Custom Head Script (&lt;head&gt;)</SelectItem>
                                            <SelectItem value="custom_body">Custom Body Script (&lt;body&gt;)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Active Toggle (For Google / Meta) */}
                                {(editType === 'google_tag' || editType === 'meta_pixel') && (
                                    <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/40">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-medium">Enable Status</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Activate this tracking tag across all site pages
                                            </p>
                                        </div>
                                        <Switch
                                            checked={editEnabled}
                                            onCheckedChange={setEditEnabled}
                                        />
                                    </div>
                                )}

                                {/* Raw Script Textarea */}
                                <div className="space-y-2">
                                    <Label htmlFor="modal-script-textarea" className="text-sm font-medium">
                                        Raw Script Code
                                    </Label>
                                    <Textarea
                                        id="modal-script-textarea"
                                        placeholder="<!-- Paste script code snippet here -->&#10;<script>...</script>"
                                        rows={8}
                                        value={editScript}
                                        onChange={(e) => setEditScript(e.target.value)}
                                        className="font-mono text-xs bg-background text-foreground"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        The raw script snippet will be dynamically executed on every page when active.
                                    </p>
                                </div>
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleModalSave}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save Script'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </AdminLayout>
    );
}
