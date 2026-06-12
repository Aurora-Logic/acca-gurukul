import AdminLayout from '../../../components/admin/AdminLayout';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    ArrowLeft,
    Trash2,
    Mail,
    MailOpen,
    Phone,
    Calendar,
    User,
    Loader2,
    AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/dates';
import { api, ApiError } from '@/lib/api';

interface Contact {
    id: number;
    name: string;
    phone: string;
    email: string;
    topic: string;
    message: string | null;
    is_read: boolean;
    ip_address: string | null;
    created_at: string;
    updated_at: string;
}

export default function ContactShow() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [contact, setContact] = useState<Contact | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    // ─── Fetch single enquiry ───
    useEffect(() => {
        let cancelled = false;
        if (!id) {
            setNotFound(true);
            setLoading(false);
            return;
        }
        (async () => {
            try {
                const data = await api<{ contact: Contact }>(
                    `/api/admin/contacts/show.php?id=${encodeURIComponent(id)}`
                );
                if (!cancelled) setContact(data.contact);
            } catch (err) {
                const e = err as ApiError;
                if (!cancelled) {
                    if (e.status === 404) setNotFound(true);
                    else toast.error('Failed to load enquiry', { description: e.message });
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id]);

    // ─── Mark read / unread (optimistic) ───
    const handleToggleRead = useCallback(async () => {
        if (!contact) return;
        const next = !contact.is_read;
        setContact({ ...contact, is_read: next });
        try {
            await api('/api/admin/contacts/update.php', {
                method: 'POST',
                body: JSON.stringify({ id: contact.id, is_read: next }),
            });
            toast.success(next ? 'Marked as read' : 'Marked as unread');
        } catch (err) {
            setContact((prev) => (prev ? { ...prev, is_read: !next } : prev));
            const e = err as ApiError;
            toast.error('Update failed', { description: e.message });
        }
    }, [contact]);

    // ─── Delete ───
    const handleDelete = useCallback(async () => {
        if (!contact) return;
        setProcessing(true);
        try {
            await api('/api/admin/contacts/delete.php', {
                method: 'POST',
                body: JSON.stringify({ id: contact.id }),
            });
            toast.success('Enquiry deleted');
            navigate('/admin/contacts', { replace: true });
        } catch (err) {
            const e = err as ApiError;
            toast.error('Delete failed', { description: e.message });
        } finally {
            setProcessing(false);
            setDeleteOpen(false);
        }
    }, [contact, navigate]);

    // ─── Loading ───
    if (loading) {
        return (
            <AdminLayout breadcrumbs={[{ label: 'Contacts', href: '/admin/contacts' }, { label: 'Loading…' }]}>
                <div className="flex items-center justify-center py-24 text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading enquiry…</span>
                </div>
            </AdminLayout>
        );
    }

    // ─── Not found ───
    if (notFound || !contact) {
        return (
            <AdminLayout breadcrumbs={[{ label: 'Contacts', href: '/admin/contacts' }, { label: 'Not found' }]}>
                <div className="max-w-md mx-auto py-16 text-center">
                    <AlertTriangle className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <h2 className="text-lg font-medium mb-2">Enquiry not found</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                        This enquiry may have been deleted or the link is invalid.
                    </p>
                    <Button asChild variant="outline">
                        <Link to="/admin/contacts">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to contacts
                        </Link>
                    </Button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout breadcrumbs={[{ label: 'Contacts', href: '/admin/contacts' }, { label: contact.name }]}>
            <div className="space-y-4 w-full">
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                    <Button asChild variant="ghost" size="sm">
                        <Link to="/admin/contacts">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleToggleRead}>
                            {contact.is_read ? (
                                <>
                                    <Mail className="h-3.5 w-3.5 mr-1.5" />
                                    Mark Unread
                                </>
                            ) : (
                                <>
                                    <MailOpen className="h-3.5 w-3.5 mr-1.5" />
                                    Mark Read
                                </>
                            )}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Contact info */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <CardTitle className="text-lg">{contact.topic}</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    From {contact.name}
                                </p>
                            </div>
                            <Badge variant={contact.is_read ? 'secondary' : 'default'}>
                                {contact.is_read ? 'Read' : 'Unread'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Sender details */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span>{contact.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                                <a
                                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${contact.email}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline truncate"
                                >
                                    {contact.email}
                                </a>
                            </div>
                            {contact.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <a
                                        href={`tel:${contact.phone}`}
                                        className="text-primary hover:underline"
                                    >
                                        {contact.phone}
                                    </a>
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Message */}
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                Message
                            </p>
                            <div className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                                {contact.message || (
                                    <span className="italic text-muted-foreground">
                                        No message provided.
                                    </span>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Timestamp */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                Submitted on {formatDateTime(contact.created_at)}
                            </span>
                            {contact.ip_address && (
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="opacity-60">IP</span>
                                    <span className="font-mono">{contact.ip_address}</span>
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Delete dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete enquiry</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this enquiry from {contact.name}? This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={processing}>
                            {processing ? 'Deleting…' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
