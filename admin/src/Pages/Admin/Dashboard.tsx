import { useState, useMemo, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { CalendarDays, Mail, Newspaper, Eye, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatShortDate, formatDate as formatDateIST } from '@/lib/dates';
import { format, subDays, startOfDay, startOfYear } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { LucideIcon } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { toast } from 'sonner';

interface TrendDataPoint {
    date: string;
    count: number;
}

interface TrendChartProps {
    data: TrendDataPoint[];
    config: Record<string, { label: string; color: string }>;
    gradientId: string;
    color: string;
}

interface DatePreset {
    label: string;
    range: () => DateRange;
}

interface RecentAppointment {
    id: number;
    patient_name: string;
    phone: string;
    email: string;
    preferred_date: string;
    preferred_time: string;
    status: string;
    created_at: string;
}

interface RecentBlog {
    id: number;
    title: string;
    views: number;
    created_at: string;
}

interface DashboardStats {
    total_appointments: number;
    new_appointments: number;
    unread_contacts: number;
    total_contacts: number;
    total_posts: number;
    published_posts: number;
    total_blog_views: number;
}

interface DashboardData {
    stats: DashboardStats;
    appointments_by_status: Record<string, number>;
    appointments_trend: TrendDataPoint[];
    blog_views_trend: TrendDataPoint[];
    contacts_trend: TrendDataPoint[];
    recent_appointments: RecentAppointment[];
    recent_blogs: RecentBlog[];
}

const trendConfig = {
    count: { label: 'Appointments', color: 'var(--chart-1)' },
};

const blogViewsConfig = {
    count: { label: 'Views', color: 'var(--chart-3)' },
};

const contactsConfig = {
    count: { label: 'Contacts', color: 'var(--chart-4)' },
};

const statusConfig = {
    count: { label: 'Count', color: 'var(--chart-2)' },
};

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

const statusColors: Record<string, BadgeVariant> = {
    new: 'default',
    pending: 'default',
    contacted: 'secondary',
    confirmed: 'secondary',
    scheduled: 'outline',
    completed: 'default',
    cancelled: 'destructive',
};

function TrendChart({ data, config, gradientId, color }: TrendChartProps) {
    return (
        <ChartContainer config={config} className="h-[180px] sm:h-[220px] w-full">
            <AreaChart data={data || []} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={formatShortDate}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
                <ChartTooltip
                    content={
                        <ChartTooltipContent labelFormatter={formatDateIST} />
                    }
                />
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                    </linearGradient>
                </defs>
                <Area
                    dataKey="count"
                    type="monotone"
                    fill={`url(#${gradientId})`}
                    stroke={color}
                    strokeWidth={2}
                />
            </AreaChart>
        </ChartContainer>
    );
}

const presets: DatePreset[] = [
    {
        label: 'Today',
        range: () => {
            const today = startOfDay(new Date());
            return { from: today, to: today };
        },
    },
    {
        label: 'Yesterday',
        range: () => {
            const yesterday = startOfDay(subDays(new Date(), 1));
            return { from: yesterday, to: yesterday };
        },
    },
    {
        label: 'Last 7 days',
        range: () => ({
            from: startOfDay(subDays(new Date(), 6)),
            to: startOfDay(new Date()),
        }),
    },
    {
        label: 'Last 30 days',
        range: () => ({
            from: startOfDay(subDays(new Date(), 29)),
            to: startOfDay(new Date()),
        }),
    },
    {
        label: 'Last 90 days',
        range: () => ({
            from: startOfDay(subDays(new Date(), 89)),
            to: startOfDay(new Date()),
        }),
    },
    {
        label: 'This Year',
        range: () => ({
            from: startOfYear(new Date()),
            to: startOfDay(new Date()),
        }),
    },
];

const emptyStats: DashboardStats = {
    total_appointments: 0,
    new_appointments: 0,
    unread_contacts: 0,
    total_contacts: 0,
    total_posts: 0,
    published_posts: 0,
    total_blog_views: 0,
};

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);

    useEffect(() => {
        document.title = 'Dashboard — ACCA Gurukul Admin';
    }, []);

    const [dateRange, setDateRange] = useState<DateRange>({
        from: startOfDay(subDays(new Date(), 29)),
        to: startOfDay(new Date()),
    });
    const [popoverOpen, setPopoverOpen] = useState(false);

    const fetchDashboard = useCallback(async (range: DateRange) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (range.from) params.set('date_from', format(range.from, 'yyyy-MM-dd'));
            if (range.to) params.set('date_to', format(range.to, 'yyyy-MM-dd'));

            const result = await api<DashboardData>(`/api/admin/dashboard.php?${params.toString()}`);
            setData(result);
        } catch (err) {
            const e = err as ApiError;
            toast.error('Failed to load dashboard', { description: e.message });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard(dateRange);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    function applyDateRange(range: DateRange) {
        if (!range?.from) return;
        setDateRange(range);
        setPopoverOpen(false);
        fetchDashboard(range);
    }

    function handlePreset(preset: DatePreset) {
        const range = preset.range();
        applyDateRange(range);
    }

    function handleCalendarSelect(range: DateRange | undefined) {
        if (!range) return;
        setDateRange(range);
        if (range.from && range.to) {
            applyDateRange(range);
        }
    }

    const dateRangeLabel = useMemo(() => {
        if (!dateRange?.from) return 'Pick a date range';
        if (!dateRange.to || dateRange.from.getTime() === dateRange.to.getTime()) {
            return format(dateRange.from, 'MMMM d, yyyy');
        }
        const sameYear = dateRange.from.getFullYear() === dateRange.to.getFullYear();
        if (sameYear) {
            return `${format(dateRange.from, 'MMM d')} – ${format(dateRange.to, 'MMM d, yyyy')}`;
        }
        return `${format(dateRange.from, 'MMM d, yyyy')} – ${format(dateRange.to, 'MMM d, yyyy')}`;
    }, [dateRange]);

    // Derived data from API response
    const stats = data?.stats ?? emptyStats;
    const recentAppointments = data?.recent_appointments ?? [];
    const recentBlogs = data?.recent_blogs ?? [];
    const appointmentsTrend = data?.appointments_trend ?? [];
    const blogViewsTrend = data?.blog_views_trend ?? [];
    const contactsTrend = data?.contacts_trend ?? [];
    const appointmentsByStatus = data?.appointments_by_status ?? {};

    const statusData = useMemo(() => {
        return Object.entries(appointmentsByStatus).map(([status, count]) => ({
            status: status.charAt(0).toUpperCase() + status.slice(1),
            count,
        }));
    }, [appointmentsByStatus]);

    const statCards: { title: string; value: number; sub: string; icon: LucideIcon }[] = [
        { title: 'Total Appointments', value: stats.total_appointments, sub: `${stats.new_appointments} new`, icon: CalendarDays },
        { title: 'Unread Contacts', value: stats.unread_contacts, sub: `${stats.total_contacts} total`, icon: Mail },
        { title: 'Blog Posts', value: stats.total_posts, sub: `${stats.published_posts} published`, icon: Newspaper },
        { title: 'Blog Views', value: stats.total_blog_views, sub: 'Unique visitors', icon: Eye },
    ];

    return (
        <AdminLayout breadcrumbs={[{ label: 'Dashboard' }]}>
            <div className="space-y-6">
                {/* Toolbar: Title + Date Range Picker */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'justify-start text-left font-normal w-full sm:w-auto sm:min-w-[240px]',
                                    !dateRange?.from && 'text-muted-foreground'
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRangeLabel}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <div className="flex flex-col sm:flex-row">
                                <div className="flex flex-col gap-1 border-b p-3 sm:border-b-0 sm:border-r">
                                    <p className="mb-1 text-xs font-medium text-muted-foreground px-1">Presets</p>
                                    {presets.map((preset) => (
                                        <Button
                                            key={preset.label}
                                            variant="ghost"
                                            size="sm"
                                            className="justify-start text-xs h-8"
                                            onClick={() => handlePreset(preset)}
                                        >
                                            {preset.label}
                                        </Button>
                                    ))}
                                </div>
                                <div className="p-3">
                                    <Calendar
                                        mode="range"
                                        selected={dateRange}
                                        onSelect={handleCalendarSelect}
                                        numberOfMonths={typeof window !== 'undefined' && window.innerWidth < 640 ? 1 : 2}
                                        defaultMonth={dateRange?.from}
                                        disabled={{ after: new Date() }}
                                    />
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Stat Cards - Single row on desktop */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
                    {statCards.map((stat) => (
                        <Card key={stat.title}>
                            <CardContent className="p-3">
                                <div className="flex items-start justify-between gap-1">
                                    <div className="space-y-0.5 min-w-0">
                                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">{stat.title}</p>
                                        <span className="text-xl font-bold tabular-nums tracking-tight block">
                                            {loading ? '—' : stat.value}
                                        </span>
                                        <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
                                    </div>
                                    <div className="flex size-7 items-center justify-center rounded-md bg-muted shrink-0">
                                        <stat.icon className="size-3.5 text-muted-foreground" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Charts - 2x2 */}
                <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                    {/* Appointment Trend */}
                    <Card>
                        <CardHeader className="p-4 pb-0">
                            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-3">
                            <TrendChart
                                data={appointmentsTrend}
                                config={trendConfig}
                                gradientId="fillAppointments"
                                color="var(--color-count)"
                            />
                        </CardContent>
                    </Card>

                    {/* Blog Views Trend */}
                    <Card>
                        <CardHeader className="p-4 pb-0">
                            <CardTitle className="text-sm font-medium">Blog Views</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-3">
                            <TrendChart
                                data={blogViewsTrend}
                                config={blogViewsConfig}
                                gradientId="fillBlogViews"
                                color="var(--chart-3)"
                            />
                        </CardContent>
                    </Card>

                    {/* Status Breakdown */}
                    <Card>
                        <CardHeader className="p-4 pb-0">
                            <CardTitle className="text-sm font-medium">Appointments by Status</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-3">
                            {statusData.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-6">No data yet</p>
                            ) : (
                                <ChartContainer config={statusConfig} className="h-[180px] sm:h-[220px] w-full">
                                    <BarChart data={statusData} accessibilityLayer>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="status" tickLine={false} axisLine={false} tickMargin={8} />
                                        <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ChartContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Contacts Trend */}
                    <Card>
                        <CardHeader className="p-4 pb-0">
                            <CardTitle className="text-sm font-medium">Contact Submissions</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-3">
                            <TrendChart
                                data={contactsTrend}
                                config={contactsConfig}
                                gradientId="fillContacts"
                                color="var(--chart-4)"
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Tables row */}
                <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                    {/* Recent Appointments */}
                    <Card>
                        <CardHeader className="p-4 pb-0">
                            <CardTitle className="text-sm font-medium">Recent Appointments</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-3 overflow-auto">
                            {(!recentAppointments || recentAppointments.length === 0) ? (
                                <p className="text-center text-xs text-muted-foreground py-6">
                                    {loading ? 'Loading...' : 'No appointments yet'}
                                </p>
                            ) : (
                                <>
                                    <div className="space-y-2 sm:hidden">
                                        {recentAppointments.map((apt) => (
                                            <div key={apt.id} className="rounded-md border p-3 space-y-1">
                                                <p className="text-xs font-medium">{apt.patient_name}</p>
                                                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                                    <span>{apt.phone || apt.email}</span>
                                                    <Badge variant={statusColors[apt.status] || 'secondary'} className="text-[10px]">
                                                        {apt.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Table className="hidden sm:table">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-xs">Student</TableHead>
                                                <TableHead className="text-xs">Contact</TableHead>
                                                <TableHead className="text-xs">Date</TableHead>
                                                <TableHead className="text-xs">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recentAppointments.map((apt) => (
                                                <TableRow key={apt.id}>
                                                    <TableCell className="text-xs font-medium">{apt.patient_name}</TableCell>
                                                    <TableCell className="text-xs">{apt.phone || apt.email}</TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {formatDateIST(apt.preferred_date)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={statusColors[apt.status] || 'secondary'} className="text-[10px]">
                                                            {apt.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Blog Posts */}
                    <Card>
                        <CardHeader className="p-4 pb-0">
                            <CardTitle className="text-sm font-medium">Recent Blog Posts</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-3 overflow-auto">
                            {(!recentBlogs || recentBlogs.length === 0) ? (
                                <p className="text-center text-xs text-muted-foreground py-6">
                                    {loading ? 'Loading...' : 'No blog posts yet'}
                                </p>
                            ) : (
                                <>
                                    <div className="space-y-2 sm:hidden">
                                        {recentBlogs.map((post) => (
                                            <div key={post.id} className="rounded-md border p-3 space-y-1">
                                                <p className="text-xs font-medium truncate">{post.title}</p>
                                                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="h-3 w-3" />
                                                        {post.views} views
                                                    </span>
                                                    <span>{formatDateIST(post.created_at)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Table className="hidden sm:table">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-xs">#</TableHead>
                                                <TableHead className="text-xs">Title</TableHead>
                                                <TableHead className="text-xs text-right">Views</TableHead>
                                                <TableHead className="text-xs">Date</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recentBlogs.map((post, i) => (
                                                <TableRow key={post.id}>
                                                    <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                                                    <TableCell className="text-xs font-medium truncate max-w-[200px]">{post.title}</TableCell>
                                                    <TableCell className="text-xs text-right tabular-nums">{post.views}</TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">{formatDateIST(post.created_at)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
