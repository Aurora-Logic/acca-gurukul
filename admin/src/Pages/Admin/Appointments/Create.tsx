import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { servicesData } from '@/mock-data';
import { ArrowLeft } from 'lucide-react';
import { toISODate } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { DatePicker, TimePicker } from '@/components/ui/date-picker';

interface AppointmentFormData {
    patient_name: string;
    email: string;
    phone: string;
    service_id: string;
    preferred_date: string;
    preferred_time: string;
    status: string;
    notes: string;
}

const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
];

export default function AppointmentCreate() {
    const navigate = useNavigate();
    const [data, setDataState] = useState<AppointmentFormData>({
        patient_name: '',
        email: '',
        phone: '',
        service_id: '',
        preferred_date: '',
        preferred_time: '',
        status: 'scheduled',
        notes: '',
    });
    const setData = (key: keyof AppointmentFormData, val: string) => setDataState(prev => ({ ...prev, [key]: val }));
    const [processing, setProcessing] = useState(false);
    const [errors] = useState<Partial<Record<keyof AppointmentFormData, string>>>({});

    useEffect(() => {
        document.title = 'New Appointment — ACCA Gurukul Admin';
    }, []);

    const services = servicesData;

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setProcessing(true);
        toast.success('Appointment created successfully.');
        navigate('/admin/appointments');
    }

    return (
        <AdminLayout breadcrumbs={[{ label: 'Appointments', href: '/admin/appointments' }, { label: 'Create' }]}>
            <div className="mb-6">
                <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Appointments
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Student Info */}
                <div className="space-y-4">
                    <div>
                        <Label className="text-base font-semibold">Student Information</Label>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="patient_name">Student Name *</Label>
                            <Input id="patient_name" value={data.patient_name} onChange={(e) => setData('patient_name', e.target.value)} required />
                            {errors.patient_name && <p className="text-sm text-destructive">{errors.patient_name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone *</Label>
                            <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} required />
                            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Appointment Details */}
                <div className="space-y-4">
                    <div>
                        <Label className="text-base font-semibold">Appointment Details</Label>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="service_id">Service</Label>
                            <Select value={data.service_id || '_none'} onValueChange={(v) => setData('service_id', v === '_none' ? '' : v)}>
                                <SelectTrigger id="service_id">
                                    <SelectValue placeholder="Select service" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none">No specific service</SelectItem>
                                    {(services || []).map((service) => (
                                        <SelectItem key={service.id} value={String(service.id)}>{service.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.service_id && <p className="text-sm text-destructive">{errors.service_id}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="preferred_date">Preferred Date *</Label>
                            <DatePicker
                                id="preferred_date"
                                value={data.preferred_date}
                                onChange={(date) => setData('preferred_date', toISODate(date))}
                            />
                            {errors.preferred_date && <p className="text-sm text-destructive">{errors.preferred_date}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="preferred_time">Preferred Time *</Label>
                            <TimePicker
                                id="preferred_time"
                                value={data.preferred_time}
                                onChange={(time) => setData('preferred_time', time)}
                                placeholder="Pick a time"
                            />
                            {errors.preferred_time && <p className="text-sm text-destructive">{errors.preferred_time}</p>}
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Status & Notes */}
                <div className="space-y-4">
                    <div>
                        <Label className="text-base font-semibold">Status & Notes</Label>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={4} placeholder="Add notes about this appointment..." className="resize-y" />
                        {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
                    </div>
                </div>

                <Separator />

                <div className="flex gap-3">
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Creating...' : 'Create Appointment'}
                    </Button>
                    <Button type="button" variant="outline" asChild>
                        <Link to="/admin/appointments">Cancel</Link>
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
