"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { Eye, EyeOff, MessageSquareReply, Check, X } from "lucide-react";

interface Wish {
  id: string;
  name: string;
  message: string;
  reply: string | null;
  isApproved: boolean;
  createdAt: Date;
}

interface Props {
  clientId: string;
  initialWishes: Wish[];
}

export function WishesAdmin({ initialWishes }: Props) {
  const [wishes, setWishes] = useState<Wish[]>(initialWishes);

  async function toggleVisibility(id: string, current: boolean) {
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

  async function saveReply(id: string, reply: string) {
    const res = await fetch(`/api/wishes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: reply.trim() || null }),
    });
    if (res.ok) {
      setWishes((prev) =>
        prev.map((w) => (w.id === id ? { ...w, reply: reply.trim() || null } : w))
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
        <WishCard
          key={wish.id}
          wish={wish}
          onToggleVisibility={toggleVisibility}
          onSaveReply={saveReply}
        />
      ))}
    </div>
  );
}

function WishCard({
  wish,
  onToggleVisibility,
  onSaveReply,
}: {
  wish: Wish;
  onToggleVisibility: (id: string, current: boolean) => void;
  onSaveReply: (id: string, reply: string) => Promise<void>;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState(wish.reply ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSaveReply() {
    setSaving(true);
    await onSaveReply(wish.id, replyText);
    setSaving(false);
    setReplyOpen(false);
  }

  function handleCancelReply() {
    setReplyText(wish.reply ?? "");
    setReplyOpen(false);
  }

  return (
    <div
      className={`bg-white rounded-xl border p-4 ${
        wish.isApproved ? "border-stone-200" : "border-stone-100 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-stone-800 text-sm">{wish.name}</p>
            {!wish.isApproved && (
              <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                Disembunyikan
              </span>
            )}
            {wish.reply && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                Sudah dibalas
              </span>
            )}
          </div>
          <p className="text-stone-600 text-sm leading-relaxed">{wish.message}</p>
          <p className="text-xs text-stone-400 mt-2">{formatDate(wish.createdAt)}</p>

          {/* Existing reply display */}
          {wish.reply && !replyOpen && (
            <div className="mt-3 pl-3 border-l-2 border-blue-200">
              <p className="text-xs text-blue-500 font-medium mb-0.5">Balasan Anda</p>
              <p className="text-sm text-stone-600 leading-relaxed">{wish.reply}</p>
            </div>
          )}

          {/* Reply form */}
          {replyOpen && (
            <div className="mt-3 space-y-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                placeholder="Tulis balasan..."
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveReply}
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-stone-800 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-stone-700 disabled:opacity-50 transition-colors"
                >
                  <Check size={12} /> {saving ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  onClick={handleCancelReply}
                  className="flex items-center gap-1.5 border border-stone-200 text-stone-600 text-xs px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  <X size={12} /> Batal
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              setReplyText(wish.reply ?? "");
              setReplyOpen(!replyOpen);
            }}
            className="p-1.5 text-stone-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            title="Balas ucapan"
          >
            <MessageSquareReply size={16} />
          </button>
          <button
            onClick={() => onToggleVisibility(wish.id, wish.isApproved)}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
            title={wish.isApproved ? "Sembunyikan dari undangan" : "Tampilkan di undangan"}
          >
            {wish.isApproved ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
