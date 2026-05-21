"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventSchema, type EventInput } from "@/modules/wedding/wedding.schema";
import { formatDate, formatDateInput } from "@/lib/utils";
import { Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import type { Event } from "@/types/prisma.types";

const EVENT_LABELS: Record<string, string> = {
  AKAD: "Akad Nikah",
  RESEPSI: "Resepsi",
  AFTER_PARTY: "After Party",
};

interface Props {
  clientId: string;
  initialEvents: Event[];
}

export function EventsManager({ clientId, initialEvents }: Props) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [openForm, setOpenForm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function saveEvent(data: EventInput, eventId?: string) {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/clients/${clientId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, id: eventId }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error || "Gagal menyimpan");
    } else {
      setEvents((prev) =>
        eventId
          ? prev.map((e) => (e.id === eventId ? json : e))
          : [...prev, json]
      );
      setOpenForm(null);
    }
    setLoading(false);
  }

  async function removeEvent(id: string) {
    if (!confirm("Hapus acara ini?")) return;

    const res = await fetch(`/api/clients/${clientId}/events`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {events.map((event) => (
        <div
          key={event.id}
          className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
        >
          <div
            className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-stone-50"
            onClick={() =>
              setOpenForm(openForm === event.id ? null : event.id)
            }
          >
            <div>
              <p className="font-medium text-stone-800 text-sm">
                {EVENT_LABELS[event.type] || event.type}
              </p>
              <p className="text-xs text-stone-400 mt-0.5">
                {event.date ? formatDate(event.date) : "Tanggal belum diatur"}{" "}
                {event.venueName && `• ${event.venueName}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); removeEvent(event.id); }}
                className="text-stone-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
              {openForm === event.id ? (
                <ChevronUp size={14} className="text-stone-400" />
              ) : (
                <ChevronDown size={14} className="text-stone-400" />
              )}
            </div>
          </div>

          {openForm === event.id && (
            <div className="border-t border-stone-100 px-5 py-4">
              <EventForm
                defaultValues={{
                  ...event,
                  date: formatDateInput(event.date),
                }}
                onSubmit={(data) => saveEvent(data, event.id)}
                loading={loading}
              />
            </div>
          )}
        </div>
      ))}

      {openForm === "new" ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <h3 className="font-medium text-stone-800 text-sm mb-4">
            Tambah Acara Baru
          </h3>
          <EventForm
            onSubmit={(data) => saveEvent(data)}
            onCancel={() => setOpenForm(null)}
            loading={loading}
          />
        </div>
      ) : (
        <button
          onClick={() => setOpenForm("new")}
          className="flex items-center gap-2 w-full border-2 border-dashed border-stone-300 rounded-2xl px-5 py-4 text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-colors text-sm"
        >
          <Plus size={16} />
          Tambah Acara
        </button>
      )}
    </div>
  );
}

function EventForm({
  defaultValues,
  onSubmit,
  onCancel,
  loading,
}: {
  defaultValues?: Partial<EventInput>;
  onSubmit: (data: EventInput) => void;
  onCancel?: () => void;
  loading?: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<EventInput>({
    resolver: zodResolver(eventSchema) as any,
    defaultValues: defaultValues ?? { type: "AKAD", sortOrder: 0 },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Jenis Acara</label>
          <select {...register("type")} className={inputClass}>
            <option value="AKAD">Akad Nikah</option>
            <option value="RESEPSI">Resepsi</option>
            <option value="AFTER_PARTY">After Party</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Label Kustom</label>
          <input {...register("label")} placeholder="Akad Nikah" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Tanggal</label>
          <input type="date" {...register("date")} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelClass}>Jam Mulai</label>
            <input type="time" {...register("timeStart")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Jam Selesai</label>
            <input type="time" {...register("timeEnd")} className={inputClass} />
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass}>Nama Venue</label>
        <input {...register("venueName")} placeholder="Gedung Serbaguna Harmoni" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Alamat Venue</label>
        <textarea {...register("venueAddress")} rows={2} placeholder="Jl. Merdeka No. 1, Jakarta Pusat" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Link Google Maps</label>
        <input {...register("mapsUrl")} placeholder="https://maps.google.com/..." className={inputClass} />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-stone-800 text-white px-5 py-2 rounded-lg text-sm hover:bg-stone-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Menyimpan..." : "Simpan"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="border border-stone-300 text-stone-600 px-5 py-2 rounded-lg text-sm hover:bg-stone-50"
          >
            Batal
          </button>
        )}
      </div>
    </form>
  );
}

const inputClass =
  "w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400";
const labelClass = "block text-sm font-medium text-stone-700 mb-1";
