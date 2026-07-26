import './index.css';
import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/lib/auth';
import ProtectedRoute, { PublicOnlyRoute } from '@/components/ProtectedRoute';

const Login = lazy(() => import('./Pages/Login'));
const Dashboard = lazy(() => import('./Pages/Admin/Dashboard'));
const AppointmentsIndex = lazy(() => import('./Pages/Admin/Appointments/Index'));
const AppointmentCreate = lazy(() => import('./Pages/Admin/Appointments/Create'));
const AppointmentShow = lazy(() => import('./Pages/Admin/Appointments/Show'));
const BlogIndex = lazy(() => import('./Pages/Admin/Blog/Index'));
const BlogCreate = lazy(() => import('./Pages/Admin/Blog/Create'));
const BlogEdit = lazy(() => import('./Pages/Admin/Blog/Edit'));
const ContactsIndex = lazy(() => import('./Pages/Admin/Contacts/Index'));
const ContactShow = lazy(() => import('./Pages/Admin/Contacts/Show'));
const UsersIndex = lazy(() => import('./Pages/Admin/Users/Index'));
const UserCreate = lazy(() => import('./Pages/Admin/Users/Create'));
const UserEdit = lazy(() => import('./Pages/Admin/Users/Edit'));
const FaqIndex = lazy(() => import('./Pages/Admin/Faq/Index'));
const TrackingSettings = lazy(() => import('./Pages/Admin/Settings/Tracking'));

const el = document.getElementById('app');
if (el) {
    createRoot(el).render(
        <AuthProvider>
            <TooltipProvider>
                <BrowserRouter>
                    <Suspense fallback={<div className="flex h-screen items-center justify-center text-muted-foreground">Loading...</div>}>
                        <Routes>
                            {/* Public */}
                            <Route
                                path="/admin/login"
                                element={
                                    <PublicOnlyRoute>
                                        <Login />
                                    </PublicOnlyRoute>
                                }
                            />

                            {/* Protected admin routes */}
                            <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                            <Route path="/admin/appointments" element={<ProtectedRoute><AppointmentsIndex /></ProtectedRoute>} />
                            <Route path="/admin/appointments/create" element={<ProtectedRoute><AppointmentCreate /></ProtectedRoute>} />
                            <Route path="/admin/appointments/:id" element={<ProtectedRoute><AppointmentShow /></ProtectedRoute>} />
                            <Route path="/admin/blog" element={<ProtectedRoute><BlogIndex /></ProtectedRoute>} />
                            <Route path="/admin/blog/create" element={<ProtectedRoute><BlogCreate /></ProtectedRoute>} />
                            <Route path="/admin/blog/:id/edit" element={<ProtectedRoute><BlogEdit /></ProtectedRoute>} />
                            <Route path="/admin/contacts" element={<ProtectedRoute><ContactsIndex /></ProtectedRoute>} />
                            <Route path="/admin/contacts/:id" element={<ProtectedRoute><ContactShow /></ProtectedRoute>} />
                            <Route path="/admin/users" element={<ProtectedRoute><UsersIndex /></ProtectedRoute>} />
                            <Route path="/admin/users/create" element={<ProtectedRoute><UserCreate /></ProtectedRoute>} />
                            <Route path="/admin/users/:id/edit" element={<ProtectedRoute><UserEdit /></ProtectedRoute>} />
                            <Route path="/admin/faq" element={<ProtectedRoute><FaqIndex /></ProtectedRoute>} />
                            <Route path="/admin/settings/tracking" element={<ProtectedRoute><TrackingSettings /></ProtectedRoute>} />

                            {/* Redirects */}
                            <Route path="/" element={<Navigate to="/admin" replace />} />
                            <Route path="*" element={<Navigate to="/admin" replace />} />
                        </Routes>
                    </Suspense>

                    <Toaster />
                </BrowserRouter>
            </TooltipProvider>
        </AuthProvider>
    );
}
