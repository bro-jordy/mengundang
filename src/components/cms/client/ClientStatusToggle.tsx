"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ClientStatus } from "@/types/prisma.types";

interface Props {
  clientId: string;
  currentStatus: ClientStatus;
}

const STATUS_CONFIG: Record<
  ClientStatus,
  { label: string; color: string; actions: { status: ClientStatus; label: string; style: string }[] }
> = {
  DRAFT: {
    label: "Draft",
    color: "bg-stone-100 text-stone-600",
    actions: [
      { status: "ACTIVE", label: "Aktifkan", style: "bg-green-600 hover:bg-green-700 text-white" },
      { status: "ARCHIVED", label: "Arsipkan", style: "bg-stone-200 hover:bg-stone-300 text-stone-700" },
    ],
  },
  ACTIVE: {
    label: "Aktif",
    color: "bg-green-100 text-green-700",
    actions: [
      { status: "DRAFT", label: "Kembalikan ke Draft", style: "bg-stone-200 hover:bg-stone-300 text-stone-700" },
      { status: "ARCHIVED", label: "Arsipkan", style: "bg-stone-200 hover:bg-stone-300 text-stone-700" },
    ],
  },
  ARCHIVED: {
    label: "Diarsipkan",
    color: "bg-amber-100 text-amber-700",
    actions: [
      { status: "ACTIVE", label: "Aktifkan Kembali", style: "bg-green-600 hover:bg-green-700 text-white" },
      { status: "DRAFT", label: "Kembalikan ke Draft", style: "bg-stone-200 hover:bg-stone-300 text-stone-700" },
    ],
  },
};

export function ClientStatusToggle({ clientId, currentStatus }: Props) {
  const [status, setStatus] = useState<ClientStatus>(currentStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const config = STATUS_CONFIG[status];

  async function handleChange(newStatus: ClientStatus) {
    if (
      newStatus === "ACTIVE" &&
      !confirm("Aktifkan undangan? Undangan akan bisa diakses publik.")
    )
      return;

    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${config.color}`}>
        {config.label}
      </span>
      {config.actions.map((action) => (
        <button
          key={action.status}
          onClick={() => handleChange(action.status)}
          disabled={loading}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${action.style}`}
        >
          {loading ? "..." : action.label}
        </button>
      ))}
    </div>
  );
}
