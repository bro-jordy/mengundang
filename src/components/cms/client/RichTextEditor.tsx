"use client";

import { useRef, useEffect, useCallback } from "react";
import { Bold, Italic, List } from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  rows?: number;
}

// Convert plain-text content (with \n) to HTML on initial load.
// Once the editor emits HTML, subsequent loads stay as HTML.
function toEditorHtml(val: string): string {
  if (!val) return "";
  if (val.includes("<")) return val; // already HTML
  return val.replace(/&/g, "&amp;").replace(/\n/g, "<br>");
}

export function RichTextEditor({ value, onChange, placeholder, rows = 4 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  // Track whether the current change came from user input (avoid cursor reset)
  const isUserInput = useRef(false);

  // Sync external value → editor only when value changes from outside (e.g. initial load / reset)
  useEffect(() => {
    const el = ref.current;
    if (!el || isUserInput.current) return;
    const html = toEditorHtml(value);
    if (el.innerHTML !== html) {
      el.innerHTML = html;
    }
  }, [value]);

  const handleChange = useCallback(() => {
    isUserInput.current = true;
    const raw = ref.current?.innerHTML ?? "";
    // Treat a lone <br> (empty div) as empty string
    const cleaned = raw === "<br>" ? "" : raw;
    onChange(cleaned);
    // Reset flag after microtask so next external update can sync
    queueMicrotask(() => { isUserInput.current = false; });
  }, [onChange]);

  function execCmd(cmd: string) {
    ref.current?.focus();
    document.execCommand(cmd, false, undefined);
    handleChange();
  }

  const minH = `${rows * 1.6}rem`;

  return (
    <div className="border border-stone-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-stone-400">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-stone-50 border-b border-stone-200">
        <ToolBtn onClick={() => execCmd("bold")} title="Bold (Ctrl+B)">
          <Bold size={13} />
        </ToolBtn>
        <ToolBtn onClick={() => execCmd("italic")} title="Italic (Ctrl+I)">
          <Italic size={13} />
        </ToolBtn>
        <div className="w-px h-4 bg-stone-200 mx-1.5 self-center" />
        <ToolBtn onClick={() => execCmd("insertUnorderedList")} title="Bullet list">
          <List size={13} />
        </ToolBtn>
        <div className="ml-auto text-xs text-stone-400 pr-1">
          B <em>I</em> •
        </div>
      </div>

      {/* Editable area */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleChange}
        onKeyDown={(e) => {
          // Ctrl+B / Ctrl+I shortcuts
          if (e.ctrlKey || e.metaKey) {
            if (e.key === "b") { e.preventDefault(); execCmd("bold"); }
            if (e.key === "i") { e.preventDefault(); execCmd("italic"); }
          }
        }}
        data-placeholder={placeholder}
        className="px-3 py-2.5 text-sm text-stone-800 outline-none"
        style={{
          minHeight: minH,
          lineHeight: 1.7,
          // Placeholder via CSS when empty
        }}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #a8a29e;
          pointer-events: none;
        }
        [contenteditable] ul {
          list-style-type: disc;
          padding-left: 1.4em;
          margin: 0.3em 0;
        }
        [contenteditable] li {
          margin: 0.15em 0;
        }
      `}</style>
    </div>
  );
}

function ToolBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      // Prevent editor blur on toolbar click
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className="p-1.5 rounded hover:bg-stone-200 active:bg-stone-300 transition-colors text-stone-600"
    >
      {children}
    </button>
  );
}
