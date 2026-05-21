"use client";

import { useState, useRef } from "react";

interface Options {
  clientId: string;
  onSuccess: (url: string) => void;
  onError?: (msg: string) => void;
}

export function useImageUpload({ clientId, onSuccess, onError }: Options) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    inputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset so same file can be re-selected if needed
    e.target.value = "";

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("clientId", clientId);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        onError?.(data.error || "Upload gagal");
        return;
      }

      onSuccess(data.url);
    } catch {
      onError?.("Terjadi kesalahan saat upload");
    } finally {
      setUploading(false);
    }
  }

  const inputProps = {
    ref: inputRef,
    type: "file" as const,
    accept: "image/jpeg,image/jpg,image/png,image/webp,image/gif",
    onChange: handleFileChange,
    className: "hidden",
  };

  return { uploading, openPicker, inputProps };
}
