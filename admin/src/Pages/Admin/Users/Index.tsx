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
import { Plus, Pencil, Trash2, Search, X, Loader2, Shield } from 'lucide-react';
import { formatDate } from '@/lib/dates';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface AdminUser {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface ListResponse {
    error: boolean;
    message: string;
    users: AdminUser[];
    total: number;
}

export default function UsersIndex() {
    const { admin: current } = useAuth();

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);

    // ─── Fetch ───
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await api<ListResponse>('/api/admin/users/list.php');
                if (!cancelled) setUsers(data.users || []);
            } catch (err) {
                const e = err as ApiError;
                if (!cancelled) toast.error('Failed to load users', { description: e.message });
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const filteredUsers = useMemo(() => {
        if (!search) return users;
        const q = search.toLowerCase();
        return users.filter(
            (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        );
    }, [search, users]);

    // ─── Delete (optimistic) ───
    const handleDelete = useCallback(async () => {
        if (!deleteId) return;
        setProcessing(true);

        const previous = users;
        setUsers((prev) => prev.filter((u) => u.id !== deleteId));

        try {
            await api('/api/admin/users/delete.php', {
                method: 'POST',
                body: JSON.stringify({ id: deleteId }),
            });
            toast.success('Admin deleted');
            setDeleteId(null);
        } catch (err) {
            setUsers(previous);
            const e = err as ApiError;
            toast.error('Delete failed', { description: e.message });
        } finally {
            setProcessing(false);
        }
    }, [deleteId, users]);

    const columns = useMemo(
        (): ColumnDef<AdminUser>[] => [
            {
                accessorKey: 'name',
                header: ({ column }) => <SortableHeader column={column} title="Name" />,
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{row.original.name}</span>
                        {row.original.id === current?.id && (
                            <Badge
                                variant="outline"
                                className="bg-[#EEF5FB] text-[#1E4E7D] border-[#C4DAEC] text-[10px]"
                            >
                                You
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
                id: 'status',
                header: 'Status',
                cell: ({ row }) =>
                    row.original.is_active ? (
                        <Badge
                            variant="outline"
                            className="bg-[#EEF6F0] text-[#2F5F3F] border-[#BFDCC6] hover:bg-[#EEF6F0]"
                        >
                            Active
                        </Badge>
                    ) : (
                        <Badge
                            variant="outline"
                            className="bg-neutral-100 text-neutral-600 border-neutral-200"
                        >
                            Inactive
                        </Badge>
                    ),
            },
            {
                accessorKey: 'created_at',
                header: ({ column }) => <SortableHeader column={column} title="Created" />,
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
                        <Button asChild variant="ghost" size="icon" className="cursor-pointer">
                            <Link to={`/admin/users/${row.original.id}/edit`} title="Edit">
                                <Pencil className="h-4 w-4" />
                            </Link>
                        </Button>
                        {row.original.id !== current?.id && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteId(row.original.id)}
                                title="Delete"
                                className="text-destructive hover:text-red-700 cursor-pointer"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ),
            },
        ],
        [current?.id]
    );

    const toolbar = (
        <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72 sm:flex-none">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                {search && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearch('')}
                        className="text-destructive hover:text-destructive shrink-0"
                    >
                        <X className="h-4 w-4 mr-1" />
                        Reset
                    </Button>
                )}
            </div>
            <Button asChild className="w-full sm:w-auto sm:ml-auto cursor-pointer">
                <Link to="/admin/users/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Admin
                </Link>
            </Button>
        </div>
    );

    // The "last admin" edge case — surface a small hint
    const activeCount = users.filter((u) => u.is_active).length;
    const isOnlyOne = users.length === 1;

    return (
        <AdminLayout breadcrumbs={[{ label: 'Users' }]}>
            {loading ? (
                <div className="flex items-center justify-center py-24 text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading admins…</span>
                </div>
            ) : (
                <>
                    <DataTable
                        columns={columns}
                        data={filteredUsers}
                        toolbar={toolbar}
                        emptyMessage="No admins found."
                    />
                    {!loading && isOnlyOne && (
                        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-2.5 text-xs text-amber-800">
                            <Shield className="h-4 w-4 shrink-0" />
                            <span>
                                Only one admin exists. Add another before you can delete this account.
                            </span>
                        </div>
                    )}
                    {!loading && !isOnlyOne && activeCount === 0 && (
                        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-2.5 text-xs text-amber-800">
                            <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>
                                No active admins. Activate at least one to maintain access.
                            </span>
                        </div>
                    )}
                </>
            )}

            <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete admin</DialogTitle>
                        <DialogDescription>
                            This will permanently revoke their access. This action cannot be undone.
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
