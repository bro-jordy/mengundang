"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

interface Wish {
  id: string;
  name: string;
  message: string;
  isApproved: boolean;
  createdAt: Date;
}

interface Props {
  clientId: string;
  initialWishes: Wish[];
}

export function WishesAdmin({ initialWishes }: Props) {
  const [wishes, setWishes] = useState<Wish[]>(initialWishes);

  async function toggle(id: string, current: boolean) {
    const res = await fetch(`/api/wishes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: !current }),
    });

    if (res.ok) {
      setWishes((prev) =>
        prev.map((w) => (w.id === id ? { ...w, isApproved: !current } : w))
      );
    }
  }

  if (wishes.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
        <p className="text-stone-400 text-sm">Belum ada ucapan masuk.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {wishes.map((wish) => (
        <div
          key={wish.id}
          className={`bg-white rounded-xl border p-4 ${
            wish.isApproved ? "border-stone-200" : "border-stone-100 opacity-60"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-stone-800 text-sm">{wish.name}</p>
                {!wish.isApproved && (
                  <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                    Disembunyikan
                  </span>
                )}
              </div>
              <p className="text-stone-600 text-sm leading-relaxed">{wish.message}</p>
              <p className="text-xs text-stone-400 mt-2">{formatDate(wish.createdAt)}</p>
            </div>
            <button
              onClick={() => toggle(wish.id, wish.isApproved)}
              className="text-stone-400 hover:text-stone-700 shrink-0"
              title={wish.isApproved ? "Sembunyikan" : "Tampilkan"}
            >
              {wish.isApproved ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
