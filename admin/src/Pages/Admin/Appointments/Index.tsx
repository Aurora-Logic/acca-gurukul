import { useState, useMemo, useCallback, useEffect } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    Eye,
    Trash2,
    Search,
    X,
    LayoutList,
    Kanban,
    Phone,
    Mail as MailIcon,
    Calendar,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/dates';
import { api, ApiError } from '@/lib/api';

interface Booking {
    id: number;
    name: string;
    full_name: string;
    phone: string;
    email: string;
    course: string;
    qualification: string;
    year_of_passing: string | null;
    location: string;
    appointment_date: string;
    appointment_time: string;
    source: string | null;
    message: string | null;
    booking_ref: string;
    status: 'new' | 'confirmed' | 'cancelled' | 'completed';
    created_at: string;
    updated_at: string;
}

interface ListResponse {
    error: boolean;
    message: string;
    bookings: Booking[];
    counts: Record<string, number>;
}

interface StatusDef {
    value: Booking['status'];
    label: string;
    color: string;
}

const statuses: StatusDef[] = [
    { value: 'new',       label: 'New',       color: 'bg-neutral-500' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-500' },
    { value: 'completed', label: 'Completed', color: 'bg-[#6D9174]' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
];

// Soft-tint palette matching the toast colors
const statusBadgeClass: Record<Booking['status'], string> = {
    new:
        'bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-100',
    confirmed:
        'bg-[#EEF5FB] text-[#1E4E7D] border border-[#C4DAEC] hover:bg-[#EEF5FB]',
    completed:
        'bg-[#EEF6F0] text-[#2F5F3F] border border-[#BFDCC6] hover:bg-[#EEF6F0]',
    cancelled:
        'bg-[#FEF2F2] text-[#9B1C2B] border border-[#F6C6CB] hover:bg-[#FEF2F2]',
};

interface KanbanCardProps {
    booking: Booking;
    onDelete: (id: number) => void;
}

function KanbanCard({ booking, onDelete }: KanbanCardProps) {
    return (
        <Card className="group cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight truncate">{booking.full_name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{booking.booking_ref}</p>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button asChild variant="ghost" size="icon" className="h-6 w-6">
                            <Link to={`/admin/appointments/${booking.id}`}>
                                <Eye className="h-3 w-3" />
                            </Link>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-red-700"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(booking.id);
                            }}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
                {booking.email && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MailIcon className="h-3 w-3 shrink-0" />
                        <span className="truncate">{booking.email}</span>
                    </div>
                )}
                {booking.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span>{booking.phone}</span>
                    </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span>
                        {formatDate(booking.appointment_date)} · {booking.appointment_time}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

interface KanbanColumnProps {
    status: StatusDef;
    bookings: Booking[];
    onStatusChange: (id: number, newStatus: Booking['status']) => void;
    onDelete: (id: number) => void;
}

function KanbanColumn({ status, bookings, onStatusChange, onDelete }: KanbanColumnProps) {
    const count = bookings.length;

    function handleDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-muted/50');
        const bookingId = e.dataTransfer.getData('bookingId');
        if (bookingId) onStatusChange(parseInt(bookingId, 10), status.value);
    }

    function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.currentTarget.classList.add('bg-muted/50');
    }

    function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
        e.currentTarget.classList.remove('bg-muted/50');
    }

    return (
        <div
            className="flex flex-col min-w-[260px] w-[260px] sm:min-w-[280px] sm:w-[280px] shrink-0"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            <div className="flex items-center gap-2 mb-3 px-1">
                <span className={cn('h-2 w-2 rounded-full shrink-0', status.color)} />
                <span className="text-sm font-medium">{status.label}</span>
                <span className="text-xs text-muted-foreground ml-auto tabular-nums">{count}</span>
            </div>
            <div className="flex-1 space-y-2 min-h-[200px] rounded-lg border border-dashed border-border p-2 transition-colors">
                {bookings.map((b) => (
                    <div
                        key={b.id}
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer.setData('bookingId', String(b.id));
                            e.currentTarget.classList.add('opacity-50');
                        }}
                        onDragEnd={(e) => {
                            e.currentTarget.classList.remove('opacity-50');
                        }}
                    >
                        <KanbanCard booking={b} onDelete={onDelete} />
                    </div>
                ))}
                {count === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-8">No bookings</p>
                )}
            </div>
        </div>
    );
}

export default function AppointmentsIndex() {
    const [currentView, setCurrentView] = useState<'table' | 'kanban'>('table');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = 'Appointments — ACCA Gurukul Admin';
    }, []);

    // ─── Fetch list ───
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await api<ListResponse>('/api/admin/bookings/list.php');
                if (!cancelled) setBookings(data.bookings || []);
            } catch (err) {
                const e = err as ApiError;
                if (!cancelled) toast.error('Failed to load bookings', { description: e.message });
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // ─── Filter ───
    const filteredItems = useMemo(() => {
        let items = bookings;
        if (search) {
            const q = search.toLowerCase();
            items = items.filter(
                (a) =>
                    a.full_name?.toLowerCase().includes(q) ||
                    a.email?.toLowerCase().includes(q) ||
                    a.phone?.toLowerCase().includes(q) ||
                    a.booking_ref?.toLowerCase().includes(q) ||
                    a.course?.toLowerCase().includes(q)
            );
        }
        if (statusFilter) {
            items = items.filter((a) => a.status === statusFilter);
        }
        return items;
    }, [bookings, search, statusFilter]);

    const hasActiveFilters = search !== '' || statusFilter !== '';

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('');
    };

    const switchView = (view: 'table' | 'kanban') => {
        setCurrentView(view);
        if (view === 'kanban') setStatusFilter('');
    };

    // ─── Delete (optimistic) ───
    const handleDelete = useCallback(async () => {
        if (!deleteId) return;
        setProcessing(true);

        const previous = bookings;
        setBookings((prev) => prev.filter((a) => a.id !== deleteId));
        try {
            await api('/api/admin/bookings/delete.php', {
                method: 'POST',
                body: JSON.stringify({ id: deleteId }),
            });
            toast.success('Booking deleted');
            setDeleteId(null);
        } catch (err) {
            setBookings(previous); // revert
            const e = err as ApiError;
            toast.error('Delete failed', { description: e.message });
        } finally {
            setProcessing(false);
        }
    }, [deleteId, bookings]);

    // ─── Status change (optimistic) ───
    const handleStatusChange = useCallback(
        async (bookingId: number, newStatus: Booking['status']) => {
            const prevStatus = bookings.find((b) => b.id === bookingId)?.status;
            if (prevStatus === newStatus) return;

            setBookings((prev) =>
                prev.map((a) => (a.id === bookingId ? { ...a, status: newStatus } : a))
            );
            try {
                await api('/api/admin/bookings/update.php', {
                    method: 'POST',
                    body: JSON.stringify({ id: bookingId, status: newStatus }),
                });
                toast.success(`Marked as ${newStatus}`);
            } catch (err) {
                // revert
                setBookings((prev) =>
                    prev.map((a) =>
                        a.id === bookingId && prevStatus ? { ...a, status: prevStatus } : a
                    )
                );
                const e = err as ApiError;
                toast.error('Status update failed', { description: e.message });
            }
        },
        [bookings]
    );

    const groupedBookings = useMemo(() => {
        const grouped: Record<Booking['status'], Booking[]> = {
            new: [],
            confirmed: [],
            completed: [],
            cancelled: [],
        };
        bookings.forEach((b) => {
            grouped[b.status]?.push(b);
        });
        return grouped;
    }, [bookings]);

    const paginatedData = useMemo(
        () => ({
            data: filteredItems,
            current_page: 1,
            last_page: 1,
            from: filteredItems.length > 0 ? 1 : null,
            to: filteredItems.length > 0 ? filteredItems.length : null,
            total: filteredItems.length,
            prev_page_url: null,
            next_page_url: null,
            links: [],
        }),
        [filteredItems]
    );

    const columns = useMemo(
        (): ColumnDef<Booking>[] => [
            {
                accessorKey: 'full_name',
                header: ({ column }) => <SortableHeader column={column} title="Student" />,
                cell: ({ row }) => (
                    <div>
                        <p className="font-medium">{row.original.full_name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                            {row.original.booking_ref}
                        </p>
                    </div>
                ),
            },
            {
                accessorKey: 'email',
                header: 'Email',
                cell: ({ row }) => (
                    <span className="text-muted-foreground truncate max-w-50 block">{row.original.email}</span>
                ),
            },
            {
                accessorKey: 'phone',
                header: 'Phone',
                cell: ({ row }) => (
                    <span className="text-muted-foreground">{row.original.phone || '—'}</span>
                ),
            },
            {
                id: 'appointment',
                header: ({ column }) => <SortableHeader column={column} title="Appointment" />,
                accessorFn: (row) => new Date(row.appointment_date).getTime(),
                cell: ({ row }) => (
                    <div className="text-sm">
                        <div>{formatDate(row.original.appointment_date)}</div>
                        <div className="text-[11px] text-muted-foreground">
                            {row.original.appointment_time}
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ row }) => (
                    <Badge
                        variant="outline"
                        className={statusBadgeClass[row.original.status]}
                    >
                        {row.original.status?.charAt(0).toUpperCase() + row.original.status?.slice(1)}
                    </Badge>
                ),
            },
            {
                id: 'actions',
                header: () => <span className="sr-only">Actions</span>,
                cell: ({ row }) => (
                    <div className="flex items-center gap-1">
                        <Button asChild variant="ghost" size="icon" className="cursor-pointer">
                            <Link to={`/admin/appointments/${row.original.id}`} title="View">
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
        []
    );

    const toolbar = (
        <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-72 sm:flex-none">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search name, email, phone, ref…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                {currentView === 'table' && (
                    <Select
                        value={statusFilter || '_all'}
                        onValueChange={(v) => setStatusFilter(v === '_all' ? '' : v)}
                    >
                        <SelectTrigger className="w-[140px] shrink-0 sm:w-[160px]">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all">All Statuses</SelectItem>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                )}
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
                <div className="flex items-center border rounded-md shrink-0 ml-auto sm:ml-0">
                    <Button
                        variant={currentView === 'table' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8 rounded-r-none cursor-pointer"
                        onClick={() => switchView('table')}
                    >
                        <LayoutList className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={currentView === 'kanban' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8 rounded-l-none cursor-pointer"
                        onClick={() => switchView('kanban')}
                    >
                        <Kanban className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <AdminLayout breadcrumbs={[{ label: 'Appointments' }]}>
            {loading ? (
                <div className="flex items-center justify-center py-24 text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading bookings…</span>
                </div>
            ) : currentView === 'table' ? (
                <DataTable
                    columns={columns}
                    data={filteredItems}
                    toolbar={toolbar}
                    serverPagination={{
                        current_page: paginatedData.current_page,
                        last_page: paginatedData.last_page,
                        from: paginatedData.from,
                        to: paginatedData.to,
                        total: paginatedData.total,
                        prev_page_url: paginatedData.prev_page_url,
                        next_page_url: paginatedData.next_page_url,
                        links: paginatedData.links,
                    }}
                    emptyMessage="No bookings found."
                />
            ) : (
                <div className="space-y-4">
                    {toolbar}
                    <ScrollArea className="w-full">
                        <div className="flex gap-4 pb-4">
                            {statuses.map((status) => (
                                <KanbanColumn
                                    key={status.value}
                                    status={status}
                                    bookings={groupedBookings[status.value] || []}
                                    onStatusChange={handleStatusChange}
                                    onDelete={setDeleteId}
                                />
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            )}

            <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete booking</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this booking? This action cannot be undone.
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
