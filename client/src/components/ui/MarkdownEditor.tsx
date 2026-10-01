import { useRef, useCallback, useState } from 'react';
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Link as LinkIcon, Image, Minus,
  Eye, EyeOff, Table,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

interface ToolbarAction {
  icon: React.ReactNode;
  label: string;
  prefix: string;
  suffix: string;
  block?: boolean;
}

const actions: ToolbarAction[] = [
  { icon: <Bold size={14} />, label: 'Bold', prefix: '**', suffix: '**' },
  { icon: <Italic size={14} />, label: 'Italic', prefix: '_', suffix: '_' },
  { icon: <Strikethrough size={14} />, label: 'Strikethrough', prefix: '~~', suffix: '~~' },
  { icon: <Code size={14} />, label: 'Inline code', prefix: '`', suffix: '`' },
  { icon: <Heading1 size={14} />, label: 'Heading 1', prefix: '# ', suffix: '', block: true },
  { icon: <Heading2 size={14} />, label: 'Heading 2', prefix: '## ', suffix: '', block: true },
  { icon: <Heading3 size={14} />, label: 'Heading 3', prefix: '### ', suffix: '', block: true },
  { icon: <List size={14} />, label: 'Bullet list', prefix: '- ', suffix: '', block: true },
  { icon: <ListOrdered size={14} />, label: 'Numbered list', prefix: '1. ', suffix: '', block: true },
  { icon: <Quote size={14} />, label: 'Blockquote', prefix: '> ', suffix: '', block: true },
  { icon: <Minus size={14} />, label: 'Horizontal rule', prefix: '\n---\n', suffix: '', block: true },
  { icon: <LinkIcon size={14} />, label: 'Link', prefix: '[', suffix: '](url)' },
  { icon: <Image size={14} />, label: 'Image', prefix: '![alt](', suffix: ')' },
];

const tableTemplate = `\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n`;

export default function MarkdownEditor({ value, onChange, placeholder, minHeight = '350px' }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  const applyAction = useCallback((action: ToolbarAction) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const before = value.substring(0, start);
    const after = value.substring(end);

    let newText: string;
    let cursorPos: number;

    if (action.block && !selected) {
      // For block-level items, ensure we start on a new line
      const needsNewline = before.length > 0 && !before.endsWith('\n');
      const prefix = (needsNewline ? '\n' : '') + action.prefix;
      newText = before + prefix + action.suffix + after;
      cursorPos = before.length + prefix.length;
    } else {
      newText = before + action.prefix + (selected || 'text') + action.suffix + after;
      cursorPos = before.length + action.prefix.length + (selected || 'text').length + action.suffix.length;
    }

    onChange(newText);
    // Restore cursor
    requestAnimationFrame(() => {
      textarea.focus();
      if (selected) {
        textarea.setSelectionRange(start + action.prefix.length, end + action.prefix.length);
      } else {
        textarea.setSelectionRange(cursorPos, cursorPos);
      }
    });
  }, [value, onChange]);

  const insertTable = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const before = value.substring(0, start);
    const after = value.substring(start);
    const needsNewline = before.length > 0 && !before.endsWith('\n');
    const insert = (needsNewline ? '\n' : '') + tableTemplate;
    onChange(before + insert + after);
    requestAnimationFrame(() => {
      textarea.focus();
      const pos = before.length + insert.length;
      textarea.setSelectionRange(pos, pos);
    });
  }, [value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      requestAnimationFrame(() => {
        textarea.setSelectionRange(start + 2, start + 2);
      });
    }
    // Ctrl+B / Cmd+B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      applyAction(actions[0]); // Bold
    }
    // Ctrl+I / Cmd+I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      applyAction(actions[1]); // Italic
    }
  }, [value, onChange, applyAction]);

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0f1117] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-white/[0.06] bg-white/[0.02] flex-wrap">
        {actions.map((action, i) => (
          <button
            key={action.label}
            type="button"
            onClick={() => applyAction(action)}
            className={`w-7 h-7 rounded-md flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors ${i === 4 || i === 7 || i === 10 ? 'ml-1.5' : ''}`}
            title={action.label}
          >
            {action.icon}
          </button>
        ))}
        <button
          type="button"
          onClick={insertTable}
          className="w-7 h-7 rounded-md flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors ml-1.5"
          title="Insert table"
        >
          <Table size={14} />
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Preview toggle */}
        <button
          type="button"
          onClick={() => setPreview(!preview)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
            preview ? 'bg-terra/15 text-terra-light' : 'text-white/40 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          {preview ? <EyeOff size={12} /> : <Eye size={12} />}
          {preview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {/* Editor / Preview */}
      {preview ? (
        <div
          className="p-4 text-sm text-white/80 overflow-auto prose prose-invert prose-sm max-w-none
            prose-headings:text-white prose-headings:font-display
            prose-p:text-white/70 prose-p:leading-relaxed
            prose-a:text-terra-light prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white
            prose-code:bg-white/[0.08] prose-code:text-terra-light prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-black/30 prose-pre:rounded-xl prose-pre:border prose-pre:border-white/[0.06]
            prose-blockquote:border-l-2 prose-blockquote:border-terra/40 prose-blockquote:bg-white/[0.02] prose-blockquote:rounded-r prose-blockquote:py-1
            prose-li:text-white/70
            prose-table:text-sm prose-th:text-white/60 prose-th:px-3 prose-th:py-1.5 prose-td:px-3 prose-td:py-1.5 prose-td:border-b prose-td:border-white/[0.06]
          "
          style={{ minHeight }}
        >
          {value ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown> : <p className="text-white/20 italic">Nothing to preview</p>}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Write your content using Markdown…'}
          className="w-full bg-transparent text-white/90 text-sm font-mono leading-relaxed p-4 resize-y focus:outline-none placeholder:text-white/20"
          style={{ minHeight }}
        />
      )}

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/[0.06] bg-white/[0.01]">
        <span className="text-[10px] text-white/20">
          Markdown supported · <kbd className="px-1 py-0.5 rounded bg-white/[0.06] text-white/30 text-[9px]">Ctrl+B</kbd> Bold · <kbd className="px-1 py-0.5 rounded bg-white/[0.06] text-white/30 text-[9px]">Ctrl+I</kbd> Italic
        </span>
        <span className="text-[10px] text-white/20">{value.length} chars</span>
      </div>
    </div>
  );
}
