"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useState } from "react";

export function DeleteClientButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Hapus client "${clientName}"?\n\nSemua data tamu, ucapan, dan galeri akan ikut terhapus permanen.`)) return;

    setLoading(true);
    const res = await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
    setLoading(false);

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Gagal menghapus client.");
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-stone-400 hover:text-red-500 transition-colors disabled:opacity-40"
      title="Hapus client"
    >
      <Trash2 size={14} />
    </button>
  );
}
