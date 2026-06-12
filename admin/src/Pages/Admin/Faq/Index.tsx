import { useState, useEffect, useCallback, useMemo } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, Edit, Trash2, Loader2, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';

interface Faq {
    id: number;
    question: string;
    answer: string;
    is_active: boolean;
    order_idx: number;
}

interface ListResponse {
    error: boolean;
    message: string;
    faqs: Faq[];
}

export default function FaqIndex() {
    const [faqs, setFaqs] = useState<Faq[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ question: '', answer: '', is_active: true, order_idx: 0 });
    
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);
    
    // Character limits
    const QUESTION_MAX = 200;
    const ANSWER_MAX = 500;

    const fetchFaqs = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api<ListResponse>('/api/admin/faqs/list.php');
            setFaqs(data.faqs || []);
        } catch (err) {
            const e = err as ApiError;
            toast.error('Failed to load FAQs', { description: e.message });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFaqs();
    }, [fetchFaqs]);

    const filteredData = useMemo(() => {
        let result = faqs;
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(
                (f) =>
                    f.question.toLowerCase().includes(q) ||
                    f.answer.toLowerCase().includes(q)
            );
        }
        if (statusFilter === 'active') result = result.filter((f) => f.is_active);
        if (statusFilter === 'inactive') result = result.filter((f) => !f.is_active);
        return result;
    }, [search, statusFilter, faqs]);

    const hasActiveFilters = search !== '' || statusFilter !== '';

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('');
    };

    const handleOpenDialog = useCallback((faq?: Faq) => {
        if (faq) {
            setEditingId(faq.id);
            setFormData({ 
                question: faq.question, 
                answer: faq.answer, 
                is_active: faq.is_active, 
                order_idx: faq.order_idx 
            });
        } else {
            setEditingId(null);
            setFormData({ question: '', answer: '', is_active: true, order_idx: 0 });
        }
        setIsDialogOpen(true);
    }, []);

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingId(null);
        setFormData({ question: '', answer: '', is_active: true, order_idx: 0 });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate unique display order
        const orderExists = faqs.some(
            (faq) => faq.order_idx === formData.order_idx && faq.id !== editingId
        );
        
        if (orderExists) {
            toast.error('This display order already exists', { description: 'Please choose a unique order number.' });
            return;
        }

        setProcessing(true);
        
        try {
            if (editingId) {
                await api('/api/admin/faqs/update.php', {
                    method: 'POST',
                    body: JSON.stringify({ id: editingId, ...formData }),
                });
                toast.success('FAQ updated successfully');
            } else {
                await api('/api/admin/faqs/create.php', {
                    method: 'POST',
                    body: JSON.stringify(formData),
                });
                toast.success('FAQ created successfully');
            }
            fetchFaqs();
            handleCloseDialog();
        } catch (err) {
            const e = err as ApiError;
            toast.error(editingId ? 'Failed to update FAQ' : 'Failed to create FAQ', { description: e.message });
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = useCallback(async () => {
        if (!deleteId) return;
        setProcessing(true);
        try {
            await api('/api/admin/faqs/delete.php', {
                method: 'POST',
                body: JSON.stringify({ id: deleteId }),
            });
            toast.success('FAQ deleted successfully');
            fetchFaqs();
            setDeleteId(null);
        } catch (err) {
            const e = err as ApiError;
            toast.error('Failed to delete FAQ', { description: e.message });
        } finally {
            setProcessing(false);
        }
    }, [deleteId, fetchFaqs]);

    const columns = useMemo(
        (): ColumnDef<Faq>[] => [
            {
                accessorKey: 'question',
                header: ({ column }) => <SortableHeader column={column} title="Question" />,
                cell: ({ row }) => <span className="font-medium">{row.original.question}</span>,
            },
            {
                accessorKey: 'answer',
                header: 'Answer',
                cell: ({ row }) => (
                    <div className="max-w-md truncate" title={row.original.answer}>
                        {row.original.answer}
                    </div>
                ),
            },
            {
                accessorKey: 'order_idx',
                header: ({ column }) => <SortableHeader column={column} title="Order" />,
                cell: ({ row }) => <span className="text-muted-foreground">{row.original.order_idx}</span>,
            },
            {
                accessorKey: 'is_active',
                header: 'Status',
                cell: ({ row }) => (
                    <span className={`text-xs px-2 py-1 rounded-full ${row.original.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {row.original.is_active ? 'Active' : 'Inactive'}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: () => <span className="sr-only">Actions</span>,
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(row.original)} title="Edit">
                            <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-red-700 cursor-pointer" onClick={() => setDeleteId(row.original.id)} title="Delete">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ),
            },
        ],
        [handleOpenDialog]
    );

    const toolbar = (
        <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-72 sm:flex-none">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search questions..."
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
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="_all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
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
            <Button onClick={() => handleOpenDialog()} className="gap-2 shrink-0">
                <Plus className="w-4 h-4" /> Add FAQ
            </Button>
        </div>
    );

    return (
        <AdminLayout breadcrumbs={[{ label: 'FAQs' }]}>
            {loading ? (
                <div className="flex items-center justify-center py-24 text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading FAQs…</span>
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={filteredData}
                    toolbar={toolbar}
                    emptyMessage="No FAQs found."
                />
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <label htmlFor="question" className="font-medium leading-none">Question</label>
                                <span className="text-muted-foreground text-xs">{formData.question.length} / {QUESTION_MAX}</span>
                            </div>
                            <Input 
                                id="question"
                                required 
                                maxLength={QUESTION_MAX}
                                placeholder="Enter the question..."
                                value={formData.question}
                                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <label htmlFor="answer" className="font-medium leading-none">Answer</label>
                                <span className="text-muted-foreground text-xs">{formData.answer.length} / {ANSWER_MAX}</span>
                            </div>
                            <textarea 
                                id="answer"
                                required 
                                maxLength={ANSWER_MAX}
                                placeholder="Enter the answer..."
                                value={formData.answer}
                                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-2">
                                <label htmlFor="order_idx" className="text-sm font-medium leading-none">Display Order</label>
                                <Input 
                                    id="order_idx"
                                    type="number"
                                    required 
                                    min="0"
                                    value={formData.order_idx}
                                    onChange={(e) => setFormData({ ...formData, order_idx: parseInt(e.target.value) || 0 })}
                                />
                                <p className="text-xs text-muted-foreground">Lower numbers appear first on the website.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <input 
                                type="checkbox" 
                                id="is_active" 
                                checked={formData.is_active} 
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} 
                            />
                            <label htmlFor="is_active" className="text-sm font-medium leading-none">Active (visible on website)</label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={processing}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                {editingId ? 'Save Changes' : 'Add FAQ'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete FAQ</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this FAQ? This action cannot be undone.
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
