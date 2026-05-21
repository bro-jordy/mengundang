"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createGuestSchema, type CreateGuestInput } from "@/modules/guests/guests.schema";
import { renderWhatsappMessage, buildWhatsappLink } from "@/lib/whatsapp";
import { formatDate } from "@/lib/utils";
import {
  Copy,
  MessageCircle,
  RefreshCw,
  Trash2,
  Plus,
  Upload,
  Download,
  Check,
} from "lucide-react";
import type { Guest, Rsvp } from "@/types/prisma.types";

type GuestWithRsvp = Guest & { rsvp: Rsvp | null };

interface ClientData {
  name: string;
  slug: string;
  weddingProfile: { groomName: string; brideName: string } | null;
  events: { date: Date | null }[];
  whatsappTemplate: { bodyTemplate: string } | null;
}

interface Props {
  clientId: string;
  initialGuests: GuestWithRsvp[];
  client: ClientData | null;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu",
  HADIR: "Hadir",
  TIDAK_HADIR: "Tidak Hadir",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  HADIR: "bg-green-50 text-green-700",
  TIDAK_HADIR: "bg-red-50 text-red-700",
};

export function GuestsManager({ clientId, initialGuests, client }: Props) {
  const [guests, setGuests] = useState<GuestWithRsvp[]>(initialGuests);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredGuests = guests.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateGuestInput>({
    resolver: zodResolver(createGuestSchema) as any,
    defaultValues: { maxPax: 2 },
  });

  function buildMessage(guest: GuestWithRsvp): string {
    const profile = client?.weddingProfile;
    const event = client?.events[0];
    return renderWhatsappMessage(client?.whatsappTemplate?.bodyTemplate ?? null, {
      guest_name: guest.name,
      groom_name: profile?.groomName || "-",
      bride_name: profile?.brideName || "-",
      client_name: client?.name || "-",
      event_date: event?.date ? formatDate(event.date) : "-",
      invitation_url: guest.invitationUrl,
      max_pax: guest.maxPax,
    });
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function addGuest(data: CreateGuestInput) {
    setLoading(true);
    const res = await fetch(`/api/clients/${clientId}/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const guest = await res.json();
      setGuests((prev) => [{ ...guest, rsvp: null }, ...prev]);
      reset();
      setShowAddForm(false);
    }
    setLoading(false);
  }

  async function removeGuest(id: string) {
    if (!confirm("Hapus tamu ini?")) return;
    const res = await fetch(`/api/clients/${clientId}/guests`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setGuests((prev) => prev.filter((g) => g.id !== id));
  }

  async function regenerateToken(guestId: string) {
    if (!confirm("Reset link tamu ini? Link lama akan tidak berlaku.")) return;
    const res = await fetch(
      `/api/clients/${clientId}/guests/${guestId}/regenerate-token`,
      { method: "POST" }
    );
    if (res.ok) {
      const updated = await res.json();
      setGuests((prev) =>
        prev.map((g) => (g.id === guestId ? { ...g, ...updated } : g))
      );
    }
  }

  async function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.trim().split("\n").slice(1);
    const parsed = lines.map((line) => {
      const [name, phone, email, maxPax] = line.split(",").map((s) => s.trim());
      return { name, phone, email, maxPax: Number(maxPax) || 2 };
    }).filter((g) => g.name);

    const res = await fetch(`/api/clients/${clientId}/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });

    if (res.ok) {
      const { count } = await res.json();
      alert(`${count} tamu berhasil diimport. Refresh halaman.`);
      window.location.reload();
    }
  }

  function exportCSV() {
    const rows = [
      ["Nama", "Telepon", "Email", "Maks Tamu", "Link Undangan", "Status RSVP", "Sudah Dibuka"],
      ...guests.map((g) => [
        g.name,
        g.phone || "",
        g.email || "",
        g.maxPax,
        g.invitationUrl,
        g.rsvpStatus,
        g.isOpened ? "Ya" : "Belum",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tamu-${clientId}.csv`;
    a.click();
  }

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Cari nama tamu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-stone-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 bg-stone-800 text-white px-3 py-2 rounded-lg text-sm hover:bg-stone-700"
        >
          <Plus size={14} /> Tambah Tamu
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 border border-stone-300 text-stone-600 px-3 py-2 rounded-lg text-sm hover:bg-stone-50"
        >
          <Upload size={14} /> Import CSV
        </button>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 border border-stone-300 text-stone-600 px-3 py-2 rounded-lg text-sm hover:bg-stone-50"
        >
          <Download size={14} /> Export CSV
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleCSVImport}
        />
      </div>

      {/* Format CSV info */}
      <p className="text-xs text-stone-400">
        Format CSV: <span className="font-mono">Nama,Telepon,Email,MaksTamu</span>
      </p>

      {/* Add form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit(addGuest)}
          className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4"
        >
          <h3 className="font-medium text-stone-800 text-sm">Tambah Tamu</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nama Tamu *</label>
              <input {...register("name")} placeholder="Ahmad Budi" className={inputClass} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className={labelClass}>No. WhatsApp</label>
              <input {...register("phone")} placeholder="08123456789" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email (opsional)</label>
              <input {...register("email")} type="email" placeholder="tamu@email.com" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Maks Tamu</label>
              <input
                {...register("maxPax", { valueAsNumber: true })}
                type="number"
                min={1}
                max={10}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-700 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="border border-stone-300 text-stone-600 px-4 py-2 rounded-lg text-sm"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Stats */}
      <div className="flex gap-4 text-sm text-stone-500">
        <span>{guests.length} tamu</span>
        <span>{guests.filter((g) => g.isOpened).length} sudah buka</span>
        <span>{guests.filter((g) => g.rsvpStatus === "HADIR").length} konfirmasi hadir</span>
      </div>

      {/* Guest table */}
      {filteredGuests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
          <p className="text-stone-400 text-sm">
            {search ? "Tidak ada tamu yang cocok." : "Belum ada tamu."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left">
                <th className="px-4 py-3 text-stone-500 font-medium">Nama</th>
                <th className="px-4 py-3 text-stone-500 font-medium">RSVP</th>
                <th className="px-4 py-3 text-stone-500 font-medium">Dibuka</th>
                <th className="px-4 py-3 text-stone-500 font-medium">Pax</th>
                <th className="px-4 py-3 text-stone-500 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredGuests.map((guest) => {
                const message = buildMessage(guest);
                const waLink = guest.phone
                  ? buildWhatsappLink(guest.phone, message)
                  : null;

                return (
                  <tr key={guest.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-stone-800">{guest.name}</p>
                      {guest.phone && (
                        <p className="text-xs text-stone-400">{guest.phone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[guest.rsvpStatus]}`}>
                        {STATUS_LABEL[guest.rsvpStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {guest.isOpened ? (
                        <span className="text-green-600 text-xs">Ya</span>
                      ) : (
                        <span className="text-stone-400 text-xs">Belum</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{guest.maxPax}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          title="Copy link undangan"
                          onClick={() => copyToClipboard(guest.invitationUrl, `link-${guest.id}`)}
                          className="text-stone-400 hover:text-stone-700"
                        >
                          {copied === `link-${guest.id}` ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>

                        <button
                          title="Copy pesan WhatsApp"
                          onClick={() => copyToClipboard(message, `msg-${guest.id}`)}
                          className="text-stone-400 hover:text-stone-700"
                        >
                          {copied === `msg-${guest.id}` ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <MessageCircle size={14} />
                          )}
                        </button>

                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Buka WhatsApp"
                            className="text-green-500 hover:text-green-700"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                          </a>
                        )}

                        <button
                          title="Reset token"
                          onClick={() => regenerateToken(guest.id)}
                          className="text-stone-400 hover:text-stone-700"
                        >
                          <RefreshCw size={14} />
                        </button>

                        <button
                          title="Hapus tamu"
                          onClick={() => removeGuest(guest.id)}
                          className="text-stone-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400";
const labelClass = "block text-sm font-medium text-stone-700 mb-1";
