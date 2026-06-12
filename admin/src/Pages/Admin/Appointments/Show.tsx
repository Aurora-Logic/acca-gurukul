import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Loader2,
    AlertTriangle,
    Trash2,
    Mail as MailIcon,
    Phone as PhoneIcon,
    User,
    MapPin,
    Calendar,
    Clock,
    Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import { Separator } from '@/components/ui/separator';
import { formatDate, formatDateTime } from '@/lib/dates';
import { api, ApiError } from '@/lib/api';

interface Booking {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    age: number;
    gender: string;
    phone: string;
    email: string;
    country: string | null;
    city: string | null;
    consult_type: string;
    diagnosed: string;
    mode: string;
    concern: string | null;
    appointment_date: string;
    appointment_time: string;
    booking_ref: string;
    status: 'new' | 'confirmed' | 'cancelled' | 'completed';
    ip_address: string | null;
    created_at: string;
    updated_at: string;
}

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

const statusOptions: { value: Booking['status']; label: string }[] = [
    { value: 'new', label: 'New' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
];

interface DetailItemProps {
    label: string;
    value: string | number | null | undefined;
    icon?: React.ComponentType<{ className?: string }>;
    mono?: boolean;
}

function DetailItem({ label, value, icon: Icon, mono }: DetailItemProps) {
    return (
        <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <div className="flex items-center gap-2">
                {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                <p className={mono ? 'text-sm font-mono' : 'text-sm font-medium'}>
                    {value || value === 0 ? value : '—'}
                </p>
            </div>
        </div>
    );
}

export default function AppointmentShow() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [status, setStatus] = useState<Booking['status']>('new');
    const [saving, setSaving] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // ─── Fetch ───
    useEffect(() => {
        let cancelled = false;
        if (!id) {
            setNotFound(true);
            setLoading(false);
            return;
        }
        (async () => {
            try {
                const data = await api<{ booking: Booking }>(
                    `/api/admin/bookings/show.php?id=${encodeURIComponent(id)}`
                );
                if (cancelled) return;
                setBooking(data.booking);
                setStatus(data.booking.status);
            } catch (err) {
                const e = err as ApiError;
                if (!cancelled) {
                    if (e.status === 404) setNotFound(true);
                    else toast.error('Failed to load booking', { description: e.message });
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id]);

    useEffect(() => {
        if (booking) document.title = `${booking.full_name} — iRUS Admin`;
    }, [booking]);

    // ─── Save status ───
    const handleSave = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (!booking || saving) return;

            if (status === booking.status) {
                toast.info('No changes to save');
                return;
            }

            setSaving(true);
            try {
                await api('/api/admin/bookings/update.php', {
                    method: 'POST',
                    body: JSON.stringify({ id: booking.id, status }),
                });
                setBooking({ ...booking, status });
                toast.success(`Marked as ${status}`);
            } catch (err) {
                const e = err as ApiError;
                toast.error('Update failed', { description: e.message });
            } finally {
                setSaving(false);
            }
        },
        [booking, status, saving]
    );

    // ─── Delete ───
    const handleDelete = useCallback(async () => {
        if (!booking) return;
        setDeleting(true);
        try {
            await api('/api/admin/bookings/delete.php', {
                method: 'POST',
                body: JSON.stringify({ id: booking.id }),
            });
            toast.success('Booking deleted');
            navigate('/admin/appointments', { replace: true });
        } catch (err) {
            const e = err as ApiError;
            toast.error('Delete failed', { description: e.message });
        } finally {
            setDeleting(false);
            setDeleteOpen(false);
        }
    }, [booking, navigate]);

    // ─── Loading ───
    if (loading) {
        return (
            <AdminLayout
                breadcrumbs={[
                    { label: 'Appointments', href: '/admin/appointments' },
                    { label: 'Loading…' },
                ]}
            >
                <div className="flex items-center justify-center py-24 text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading booking…</span>
                </div>
            </AdminLayout>
        );
    }

    // ─── Not found ───
    if (notFound || !booking) {
        return (
            <AdminLayout
                breadcrumbs={[
                    { label: 'Appointments', href: '/admin/appointments' },
                    { label: 'Not found' },
                ]}
            >
                <div className="max-w-md mx-auto py-16 text-center">
                    <AlertTriangle className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <h2 className="text-lg font-medium mb-2">Booking not found</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                        This booking may have been deleted or the link is invalid.
                    </p>
                    <Button asChild variant="outline">
                        <Link to="/admin/appointments">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to bookings
                        </Link>
                    </Button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            breadcrumbs={[
                { label: 'Appointments', href: '/admin/appointments' },
                { label: booking.full_name },
            ]}
        >
            <div className="w-full space-y-6">
                {/* Header row */}
                <div className="flex items-center justify-between gap-3">
                    <Button asChild variant="ghost" size="sm" className="cursor-pointer">
                        <Link to="/admin/appointments">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className={`capitalize ${statusBadgeClass[booking.status]}`}
                        >
                            {booking.status}
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground">
                            {booking.booking_ref}
                        </span>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteOpen(true)}
                            className="cursor-pointer"
                        >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Patient */}
                <div className="space-y-4">
                    <div>
                        <Label className="text-base font-semibold">Patient Information</Label>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <DetailItem label="Full name" value={booking.full_name} icon={User} />
                        <DetailItem label="Age / Gender" value={`${booking.age} · ${booking.gender}`} />
                        <DetailItem label="Phone" value={booking.phone} icon={PhoneIcon} />
                        <DetailItem label="Email" value={booking.email} icon={MailIcon} />
                        <DetailItem label="Country" value={booking.country} icon={MapPin} />
                        <DetailItem label="City" value={booking.city} icon={MapPin} />
                    </div>
                </div>

                <Separator />

                {/* Concern */}
                <div className="space-y-4">
                    <div>
                        <Label className="text-base font-semibold">Consultation</Label>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <DetailItem label="Type" value={booking.consult_type} />
                        <DetailItem label="Prior diagnosis" value={booking.diagnosed} />
                        <DetailItem label="Mode" value={booking.mode} />
                    </div>
                    {booking.concern && (
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                Patient's concern
                            </p>
                            <div className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                                {booking.concern}
                            </div>
                        </div>
                    )}
                </div>

                <Separator />

                {/* Slot */}
                <div className="space-y-4">
                    <div>
                        <Label className="text-base font-semibold">Appointment slot</Label>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <DetailItem
                            label="Date"
                            value={formatDate(booking.appointment_date)}
                            icon={Calendar}
                        />
                        <DetailItem label="Time" value={booking.appointment_time} icon={Clock} />
                        <DetailItem label="Booking ref" value={booking.booking_ref} icon={Hash} mono />
                    </div>
                </div>

                <Separator />

                {/* Timeline */}
                <div className="space-y-4">
                    <div>
                        <Label className="text-base font-semibold">Timeline</Label>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <DetailItem label="Submitted" value={formatDateTime(booking.created_at)} />
                        <DetailItem label="Last updated" value={formatDateTime(booking.updated_at)} />
                        <DetailItem label="Submitted from" value={booking.ip_address} mono />
                    </div>
                </div>

                <Separator />

                {/* Update status */}
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <Label className="text-base font-semibold">Update status</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                            Change the booking status after confirming with the patient.
                        </p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4 max-w-md">
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={status}
                                onValueChange={(v) => setStatus(v as Booking['status'])}
                            >
                                <SelectTrigger id="status" className="w-full">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button type="submit" disabled={saving || status === booking.status} className="cursor-pointer">
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                    Saving…
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/admin/appointments')}
                            className="cursor-pointer"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>

            {/* Delete confirmation */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete booking</DialogTitle>
                        <DialogDescription>
                            Delete this booking from {booking.full_name}? This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? 'Deleting…' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
