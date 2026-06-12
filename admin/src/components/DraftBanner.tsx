import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface DraftBannerProps {
    show: boolean;
    onDiscard: () => void;
    onDismiss: () => void;
}

export default function DraftBanner({ show, onDiscard, onDismiss }: DraftBannerProps) {
    if (!show) return null;

    return (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200 mb-6 sm:flex-row sm:items-center sm:gap-3 sm:px-4">
            <span className="flex-1">Draft restored from your last session.</span>
            <div className="flex items-center gap-1 shrink-0">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onDiscard}
                    className="text-destructive hover:text-destructive text-xs"
                >
                    Discard Draft
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onDismiss}
                    className="h-6 w-6 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
