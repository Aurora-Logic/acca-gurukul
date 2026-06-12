import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Code,
    Undo,
    Redo,
    Link as LinkIcon,
    Unlink,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Minus,
} from 'lucide-react';

function ToolbarButton({ onClick, active, disabled, children, title }: {
    onClick: () => void
    active?: boolean
    disabled?: boolean
    children: React.ReactNode
    title: string
}) {
    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
                'h-7 w-7 rounded-md',
                active && 'bg-muted text-foreground'
            )}
            onClick={onClick}
            disabled={disabled}
            title={title}
        >
            {children}
        </Button>
    );
}

function ToolbarDivider() {
    return <div className="mx-0.5 h-5 w-px bg-border" />;
}

export function RichTextEditor({ value, onChange, placeholder = 'Start writing...', className }: {
    value: string
    onChange: (html: string) => void
    placeholder?: string
    className?: string
}) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: 'text-primary underline' },
            }),
            Placeholder.configure({ placeholder }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] px-3 py-2',
            },
        },
    });

    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value, { emitUpdate: false });
        }
    }, [value, editor]);

    const setLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    if (!editor) return null;

    return (
        <div className={cn('rounded-lg border border-border overflow-hidden bg-background', className)}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-1.5 py-1">
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
                    <Bold className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
                    <Italic className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
                    <UnderlineIcon className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
                    <Strikethrough className="h-3.5 w-3.5" />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
                    <Heading1 className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
                    <Heading2 className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
                    <Heading3 className="h-3.5 w-3.5" />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
                    <List className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List">
                    <ListOrdered className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
                    <Quote className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
                    <Code className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
                    <Minus className="h-3.5 w-3.5" />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
                    <AlignLeft className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
                    <AlignCenter className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
                    <AlignRight className="h-3.5 w-3.5" />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Add Link">
                    <LinkIcon className="h-3.5 w-3.5" />
                </ToolbarButton>
                {editor.isActive('link') && (
                    <ToolbarButton onClick={() => editor.chain().focus().unsetLink().run()} title="Remove Link">
                        <Unlink className="h-3.5 w-3.5" />
                    </ToolbarButton>
                )}

                <ToolbarDivider />

                <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
                    <Undo className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
                    <Redo className="h-3.5 w-3.5" />
                </ToolbarButton>
            </div>

            {/* Editor */}
            <EditorContent editor={editor} />
        </div>
    );
}
