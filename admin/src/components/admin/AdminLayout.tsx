import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
    LayoutDashboard,
    Newspaper,
    CalendarDays,
    Users,
    LogOut,
    Menu,
    PanelLeftClose,
    PanelLeft,
    MoreVertical,
    Mail,
    HelpCircle,
    Tag,
    FileCode,
    Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { LucideIcon } from 'lucide-react';

interface NavItemData {
    name: string;
    href: string;
    icon: LucideIcon;
}

interface NavGroup {
    label: string;
    color: string;
    textColor: string;
    items: NavItemData[];
}

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface NavItemProps {
    item: NavItemData;
    groupColor: string;
    isActive: boolean;
    renderCollapsed: boolean;
    onNavigate: () => void;
}

interface AdminLayoutProps {
    children: React.ReactNode;
    title?: string;
    breadcrumbs?: BreadcrumbItem[];
}

const navGroups: NavGroup[] = [
    {
        label: 'Overview',
        color: 'bg-red-500',
        textColor: 'text-red-600',
        items: [
            { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        ],
    },
    {
        label: 'Manage',
        color: 'bg-blue-500',
        textColor: 'text-blue-600',
        items: [
            { name: 'Blog', href: '/admin/blog', icon: Newspaper },
            { name: 'Appointments', href: '/admin/appointments', icon: CalendarDays },
            { name: 'Contacts', href: '/admin/contacts', icon: Mail },
            { name: 'FAQ', href: '/admin/faq', icon: HelpCircle },
        ],
    },
    {
        label: 'Search',
        color: 'bg-emerald-500',
        textColor: 'text-emerald-600',
        items: [
            { name: 'SEO', href: '/admin/seo', icon: Search },
            { name: 'Sitemap', href: '/admin/sitemap', icon: FileCode },
        ],
    },
    {
        label: 'System',
        color: 'bg-orange-500',
        textColor: 'text-orange-600',
        items: [
            { name: 'Users', href: '/admin/users', icon: Users },
            { name: 'Tracking & Analytics', href: '/admin/settings/tracking', icon: Tag },
        ],
    },
];

const SIDEBAR_W = 240;
const SIDEBAR_COLLAPSED_W = 52;

function NavItem({ item, groupColor, isActive, renderCollapsed, onNavigate }: NavItemProps) {
    const Icon = item.icon;
    const link = (
        <Link
            to={item.href}
            onClick={onNavigate}
            className={cn(
                'relative flex items-center rounded-md text-[13px]',
                isActive
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground',
                renderCollapsed
                    ? 'justify-center p-2'
                    : 'gap-2.5 px-3 py-1'
            )}
        >
            {renderCollapsed ? (
                <Icon className="h-4 w-4 shrink-0" />
            ) : (
                <>
                    <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', isActive ? groupColor : 'bg-muted-foreground/40')} />
                    <span className="whitespace-nowrap">{item.name}</span>
                </>
            )}
        </Link>
    );

    if (renderCollapsed) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.name}</TooltipContent>
            </Tooltip>
        );
    }
    return link;
}

export default function AdminLayout({ children, title, breadcrumbs }: AdminLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { admin, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [renderCollapsed, setRenderCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const currentPath = location.pathname;

    const isActive = (href: string): boolean => {
        if (href === '/admin') return currentPath === '/admin' || currentPath === '/admin/';
        return currentPath.startsWith(href);
    };

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out', { description: 'You have been signed out.' });
        navigate('/admin/login', { replace: true });
    };

    const toggleSidebar = () => {
        const next = !collapsed;
        setCollapsed(next);
        setRenderCollapsed(next);
    };

    const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W;
    const showCollapsed = renderCollapsed && !mobileOpen;

    const sidebarContent = (
        <>
            {/* Sidebar header */}
            <div className="flex h-12 items-center border-b border-border shrink-0 px-3 gap-2">
                {!showCollapsed && (
                    <span className="text-sm font-bold tracking-tight text-foreground flex-1 whitespace-nowrap">
                        ACCA Gurukul Admin
                    </span>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        'h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground hidden lg:flex',
                        showCollapsed && 'mx-auto',
                    )}
                    onClick={toggleSidebar}
                >
                    {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </Button>
            </div>

            {/* Nav */}
            <ScrollArea className="flex-1 py-2">
                <div className={cn('px-2', showCollapsed ? 'space-y-1' : 'space-y-3')}>
                    {navGroups.map((group) => (
                        <div key={group.label}>
                            {!showCollapsed && (
                                <p className={cn(
                                    'mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap',
                                    group.textColor,
                                )}>
                                    {group.label}
                                </p>
                            )}
                            <nav className="flex flex-col gap-0.5">
                                {group.items.map((item) => (
                                    <NavItem key={item.href} item={item} groupColor={group.color} isActive={isActive(item.href)} renderCollapsed={showCollapsed} onNavigate={() => setMobileOpen(false)} />
                                ))}
                            </nav>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* User footer */}
            <div className="border-t border-border p-2 shrink-0">
                {showCollapsed ? (
                    // Collapsed: avatar alone is the trigger
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex w-full items-center justify-center rounded-md py-1.5 hover:bg-muted">
                                <Avatar className="h-6 w-6 shrink-0">
                                    <AvatarFallback className="text-[10px] bg-foreground text-primary-foreground">
                                        {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="end" className="w-52">
                            <div className="px-2 py-1.5">
                                <p className="text-sm font-medium truncate">{admin?.name || 'Admin'}</p>
                                <p className="text-xs text-muted-foreground truncate">{admin?.email || ''}</p>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer focus:text-destructive">
                                <LogOut className="h-4 w-4 mr-2" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    // Expanded: avatar + info on the left, kebab on the right
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md">
                        <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="text-[10px] bg-foreground text-primary-foreground">
                                {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="truncate text-xs font-medium text-foreground">{admin?.name || 'Admin'}</p>
                            <p className="truncate text-[10px] text-muted-foreground">{admin?.email || ''}</p>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                    aria-label="User menu"
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top" align="end" className="w-52">
                                <div className="px-2 py-1.5">
                                    <p className="text-sm font-medium truncate">{admin?.name || 'Admin'}</p>
                                    <p className="text-xs text-muted-foreground truncate">{admin?.email || ''}</p>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer focus:text-destructive">
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>
        </>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Mobile overlay */}
            <div
                className={cn(
                    'fixed inset-0 z-40 bg-foreground/40 lg:hidden transition-opacity duration-300 ease-out',
                    mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={() => setMobileOpen(false)}
            />

            {/* Sidebar spacer */}
            <div
                className="hidden lg:block shrink-0"
                style={{
                    width: sidebarWidth,
                    transition: 'width 280ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            />

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-background overflow-hidden',
                    mobileOpen
                        ? 'translate-x-0'
                        : '-translate-x-full lg:translate-x-0',
                )}
                style={{
                    width: mobileOpen ? SIDEBAR_W : sidebarWidth,
                    transition: 'width 280ms cubic-bezier(0.4, 0, 0.2, 1), transform 300ms ease-out',
                }}
            >
                {sidebarContent}
            </aside>

            {/* Main */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <header className="flex h-12 items-center gap-3 border-b border-border bg-background px-4">
                    <Button variant="ghost" size="icon" className="h-7 w-7 lg:hidden" onClick={() => setMobileOpen(true)}>
                        <Menu className="h-4 w-4" />
                    </Button>

                    {breadcrumbs && breadcrumbs.length > 0 ? (
                        <Breadcrumb className="min-w-0">
                            <BreadcrumbList className="flex-nowrap">
                                {/* Desktop: render the crumbs as given (no Dashboard prefix) */}
                                {breadcrumbs.map((crumb, i) => (
                                    <span key={i} className="contents sm:contents">
                                        {i > 0 && <BreadcrumbSeparator className="hidden sm:block" />}
                                        <BreadcrumbItem className="hidden sm:inline-flex">
                                            {crumb.href ? (
                                                <BreadcrumbLink asChild>
                                                    <Link to={crumb.href} className="text-muted-foreground hover:text-foreground">{crumb.label}</Link>
                                                </BreadcrumbLink>
                                            ) : (
                                                <BreadcrumbPage className="text-foreground truncate max-w-40">{crumb.label}</BreadcrumbPage>
                                            )}
                                        </BreadcrumbItem>
                                    </span>
                                ))}

                                {/* Mobile: if there are intermediate crumbs, show them in a dropdown */}
                                {breadcrumbs.length > 1 && (
                                    <BreadcrumbItem className="sm:hidden">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="flex items-center gap-1">
                                                <BreadcrumbEllipsis />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start">
                                                {breadcrumbs.slice(0, -1).map((crumb, i) => (
                                                    <DropdownMenuItem key={i} asChild>
                                                        <Link to={crumb.href || '#'}>{crumb.label}</Link>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <BreadcrumbSeparator />
                                    </BreadcrumbItem>
                                )}
                                <BreadcrumbItem className="sm:hidden min-w-0">
                                    <BreadcrumbPage className="text-foreground truncate">
                                        {breadcrumbs?.[breadcrumbs.length - 1]?.label}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    ) : (
                        title && <h1 className="text-sm font-medium text-foreground">{title}</h1>
                    )}

                    <Link to="/admin" className="ml-auto flex items-center shrink-0">
                        <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="ACCA Gurukul" className="w-auto object-contain h-7 max-w-30" />
                    </Link>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
