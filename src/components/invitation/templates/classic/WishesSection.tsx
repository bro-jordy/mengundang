"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { Send } from "lucide-react";

interface Wish {
  id: string;
  name: string;
  message: string;
  reply: string | null;
  createdAt: Date;
}

interface Props {
  clientId: string;
  initialWishes: Wish[];
  guestName?: string;
  guestId?: string;
  lang?: "EN" | "ID";
}

const WISHES_T = {
  EN: {
    eyebrow: "Wishes & Prayers",
    title: "Send Your Wishes",
    sent: "Wish sent! Thank you 🙏",
    namePlaceholder: "Your Name",
    msgPlaceholder: "Write your best wishes and prayers for the couple...",
    sending: "Sending...",
    sendBtn: "Send Wishes",
    reply: "Reply",
    empty: "No wishes yet. Be the first!",
  },
  ID: {
    eyebrow: "Ucapan & Doa",
    title: "Sampaikan Ucapan",
    sent: "Ucapan terkirim! Terima kasih 🙏",
    namePlaceholder: "Nama Anda",
    msgPlaceholder: "Tuliskan doa dan ucapan terbaik untuk pasangan...",
    sending: "Mengirim...",
    sendBtn: "Kirim Ucapan",
    reply: "Balasan",
    empty: "Belum ada ucapan. Jadilah yang pertama!",
  },
} as const;

export function WishesSection({ clientId, initialWishes, guestName, guestId, lang = "ID" }: Props) {
  const t = WISHES_T[lang];
  const [wishes, setWishes] = useState<Wish[]>(initialWishes);
  const [name, setName] = useState(guestName || "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function sendWish() {
    if (!name.trim() || !message.trim()) return;
    setLoading(true);

    const res = await fetch("/api/wishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, name, message, guestId }),
    });

    if (res.ok) {
      const wish = await res.json();
      setWishes((prev) => [wish, ...prev]);
      setMessage("");
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    }

    setLoading(false);
  }

  return (
    <section className="py-20 px-6 bg-stone-50">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs tracking-widest uppercase text-stone-400 mb-2">
            {t.eyebrow}
          </p>
          <h2 className="font-heading text-3xl text-stone-800">
            {t.title}
          </h2>
        </div>

        {/* Send form */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-6">
          {sent && (
            <p className="text-green-600 text-sm mb-3">
              {t.sent}
            </p>
          )}
          <div className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.namePlaceholder}
              className={inputClass}
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.msgPlaceholder}
              rows={3}
              className={inputClass}
            />
            <button
              onClick={sendWish}
              disabled={loading || !name.trim() || !message.trim()}
              className="flex items-center gap-2 bg-stone-800 text-white px-5 py-2 rounded-full text-sm hover:bg-stone-700 disabled:opacity-50 transition-colors"
            >
              <Send size={14} />
              {loading ? t.sending : t.sendBtn}
            </button>
          </div>
        </div>

        {/* Wishes list */}
        {wishes.length > 0 && (
          <div className="space-y-3">
            {wishes.map((wish) => (
              <div
                key={wish.id}
                className="bg-white rounded-xl border border-stone-200 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-stone-800 text-sm">{wish.name}</p>
                  <p className="text-xs text-stone-400">
                    {formatDate(wish.createdAt)}
                  </p>
                </div>
                <p className="text-stone-600 text-sm leading-relaxed">
                  {wish.message}
                </p>
                {wish.reply && (
                  <div className="mt-3 pt-3 border-t border-stone-100 pl-3 border-l-2 border-l-stone-300">
                    <p className="text-xs text-stone-400 font-medium mb-0.5">{t.reply}</p>
                    <p className="text-stone-500 text-sm leading-relaxed italic">{wish.reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {wishes.length === 0 && (
          <p className="text-center text-stone-400 text-sm">
            {t.empty}
          </p>
        )}
      </div>
    </section>
  );
}

const inputClass =
  "w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400";
