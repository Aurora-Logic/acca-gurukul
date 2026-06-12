import { useState, useMemo, useEffect, useCallback } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Eye, Trash2, Search, X, Mail, MailOpen, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/dates';
import { api, ApiError } from '@/lib/api';

interface Contact {
    id: number;
    name: string;
    email: string;
    phone: string;
    topic: string;
    message: string | null;
    is_read: boolean;
    created_at: string;
    updated_at: string;
}

interface ListResponse {
    error: boolean;
    message: string;
    contacts: Contact[];
    total: number;
    unread: number;
}

export default function ContactsIndex() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);

    // ─── Fetch list ───
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await api<ListResponse>('/api/admin/contacts/list.php');
                if (!cancelled) setContacts(data.contacts || []);
            } catch (err) {
                const e = err as ApiError;
                if (!cancelled) toast.error('Failed to load enquiries', { description: e.message });
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // ─── Derived values ───
    const unreadCount = useMemo(
        () => contacts.filter((c) => !c.is_read).length,
        [contacts]
    );

    const filteredData = useMemo(() => {
        let result = contacts;
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(
                (c) =>
                    c.name.toLowerCase().includes(q) ||
                    c.email.toLowerCase().includes(q) ||
                    (c.topic || '').toLowerCase().includes(q) ||
                    (c.phone || '').toLowerCase().includes(q)
            );
        }
        if (statusFilter === 'unread') result = result.filter((c) => !c.is_read);
        if (statusFilter === 'read') result = result.filter((c) => c.is_read);
        return result;
    }, [search, statusFilter, contacts]);

    const hasActiveFilters = search !== '' || statusFilter !== '';

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('');
    };

    // ─── Mark read / unread (optimistic) ───
    const toggleRead = useCallback(async (id: number, nextIsRead: boolean) => {
        // Optimistic update
        setContacts((prev) =>
            prev.map((c) => (c.id === id ? { ...c, is_read: nextIsRead } : c))
        );

        try {
            await api('/api/admin/contacts/update.php', {
                method: 'POST',
                body: JSON.stringify({ id, is_read: nextIsRead }),
            });
            toast.success(nextIsRead ? 'Marked as read' : 'Marked as unread');
        } catch (err) {
            // Revert
            setContacts((prev) =>
                prev.map((c) => (c.id === id ? { ...c, is_read: !nextIsRead } : c))
            );
            const e = err as ApiError;
            toast.error('Update failed', { description: e.message });
        }
    }, []);

    const handleStatusIconClick = useCallback(
        (e: React.MouseEvent, c: Contact) => {
            e.stopPropagation();
            toggleRead(c.id, !c.is_read);
        },
        [toggleRead]
    );

    // ─── Delete ───
    const handleDelete = useCallback(async () => {
        if (!deleteId) return;
        setProcessing(true);
        try {
            await api('/api/admin/contacts/delete.php', {
                method: 'POST',
                body: JSON.stringify({ id: deleteId }),
            });
            setContacts((prev) => prev.filter((c) => c.id !== deleteId));
            toast.success('Enquiry deleted');
            setDeleteId(null);
        } catch (err) {
            const e = err as ApiError;
            toast.error('Delete failed', { description: e.message });
        } finally {
            setProcessing(false);
        }
    }, [deleteId]);

    // ─── Columns ───
    const columns = useMemo(
        (): ColumnDef<Contact>[] => [
            {
                id: 'status',
                header: () => <span className="sr-only">Status</span>,
                cell: ({ row }) => (
                    <button
                        onClick={(e) => handleStatusIconClick(e, row.original)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                        title={row.original.is_read ? 'Mark as unread' : 'Mark as read'}
                    >
                        {row.original.is_read ? (
                            <MailOpen className="h-4 w-4" />
                        ) : (
                            <Mail className="h-4 w-4 text-primary" />
                        )}
                    </button>
                ),
            },
            {
                accessorKey: 'name',
                header: ({ column }) => <SortableHeader column={column} title="Name" />,
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <span
                            className={cn(
                                'font-medium',
                                !row.original.is_read && 'font-semibold'
                            )}
                        >
                            {row.original.name}
                        </span>
                        {!row.original.is_read && (
                            <Badge variant="default" className="text-[10px]">
                                New
                            </Badge>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: 'email',
                header: 'Email',
                cell: ({ row }) => (
                    <span className="text-muted-foreground">{row.original.email}</span>
                ),
            },
            {
                accessorKey: 'topic',
                header: 'Subject',
                cell: ({ row }) => (
                    <span className="max-w-55 truncate block">{row.original.topic}</span>
                ),
            },
            {
                id: 'date',
                header: ({ column }) => <SortableHeader column={column} title="Date" />,
                accessorFn: (row) => new Date(row.created_at).getTime(),
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        {formatDate(row.original.created_at)}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: () => <span className="sr-only">Actions</span>,
                cell: ({ row }) => (
                    <div className="flex items-center gap-1">
                        {!row.original.is_read && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleRead(row.original.id, true)}
                                title="Mark as read"
                                className="cursor-pointer"
                            >
                                <MailOpen className="h-4 w-4" />
                            </Button>
                        )}
                        <Button asChild variant="ghost" size="icon" className="cursor-pointer">
                            <Link to={`/admin/contacts/${row.original.id}`} title="View">
                                <Eye className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(row.original.id)}
                            title="Delete"
                            className="text-destructive hover:text-red-700 cursor-pointer"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ),
            },
        ],
        [handleStatusIconClick, toggleRead]
    );

    const toolbar = (
        <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-72 sm:flex-none">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search name, email, subject..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select
                    value={statusFilter || '_all'}
                    onValueChange={(v) => setStatusFilter(v === '_all' ? '' : v)}
                >
                    <SelectTrigger className="w-[130px] shrink-0 sm:w-[140px]">
                        <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="_all">All</SelectItem>
                        <SelectItem value="unread">Unread</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                    </SelectContent>
                </Select>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-destructive hover:text-destructive shrink-0 hidden sm:flex"
                    >
                        <X className="h-4 w-4 mr-1" />
                        Reset
                    </Button>
                )}
            </div>
            {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground sm:ml-auto">
                    {unreadCount} unread
                </p>
            )}
        </div>
    );

    return (
        <AdminLayout breadcrumbs={[{ label: 'Contacts' }]}>
            {loading ? (
                <div className="flex items-center justify-center py-24 text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading enquiries…</span>
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={filteredData}
                    toolbar={toolbar}
                    emptyMessage="No contact submissions found."
                />
            )}

            <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete enquiry</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this contact enquiry? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>
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
