"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Bold, Italic, List, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  rows?: number;
}

function toEditorHtml(val: string): string {
  if (!val) return "";
  if (val.includes("<")) return val;
  return val.replace(/&/g, "&amp;").replace(/\n/g, "<br>");
}

type Align = "left" | "center" | "right";

export function RichTextEditor({ value, onChange, placeholder, rows = 4 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isUserInput = useRef(false);
  const [align, setAlign] = useState<Align>("left");

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
    const cleaned = raw === "<br>" ? "" : raw;
    onChange(cleaned);
    queueMicrotask(() => { isUserInput.current = false; });
  }, [onChange]);

  function execCmd(cmd: string) {
    ref.current?.focus();
    document.execCommand(cmd, false, undefined);
    handleChange();
  }

  function setAlignment(a: Align) {
    setAlign(a);
    const cmdMap: Record<Align, string> = {
      left: "justifyLeft",
      center: "justifyCenter",
      right: "justifyRight",
    };
    execCmd(cmdMap[a]);
  }

  function updateAlignFromSelection() {
    if (document.queryCommandState("justifyCenter")) setAlign("center");
    else if (document.queryCommandState("justifyRight")) setAlign("right");
    else setAlign("left");
  }

  const minH = `${rows * 1.6}rem`;

  return (
    <div className="border border-stone-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-stone-400">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-stone-50 border-b border-stone-200 flex-wrap">
        <ToolBtn onClick={() => execCmd("bold")} title="Bold (Ctrl+B)">
          <Bold size={13} />
        </ToolBtn>
        <ToolBtn onClick={() => execCmd("italic")} title="Italic (Ctrl+I)">
          <Italic size={13} />
        </ToolBtn>
        <ToolBtn onClick={() => execCmd("insertUnorderedList")} title="Bullet list">
          <List size={13} />
        </ToolBtn>

        <div className="w-px h-4 bg-stone-200 mx-1.5 self-center" />

        <ToolBtn
          onClick={() => setAlignment("left")}
          title="Rata Kiri"
          active={align === "left"}
        >
          <AlignLeft size={13} />
        </ToolBtn>
        <ToolBtn
          onClick={() => setAlignment("center")}
          title="Rata Tengah"
          active={align === "center"}
        >
          <AlignCenter size={13} />
        </ToolBtn>
        <ToolBtn
          onClick={() => setAlignment("right")}
          title="Rata Kanan"
          active={align === "right"}
        >
          <AlignRight size={13} />
        </ToolBtn>
      </div>

      {/* Editable area */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleChange}
        onKeyUp={updateAlignFromSelection}
        onMouseUp={updateAlignFromSelection}
        onKeyDown={(e) => {
          if (e.ctrlKey || e.metaKey) {
            if (e.key === "b") { e.preventDefault(); execCmd("bold"); }
            if (e.key === "i") { e.preventDefault(); execCmd("italic"); }
          }
        }}
        data-placeholder={placeholder}
        className="px-3 py-2.5 text-sm text-stone-800 outline-none"
        style={{ minHeight: minH, lineHeight: 1.7 }}
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
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors text-stone-600 ${
        active
          ? "bg-stone-200 text-stone-900"
          : "hover:bg-stone-200 active:bg-stone-300"
      }`}
    >
      {children}
    </button>
  );
}
