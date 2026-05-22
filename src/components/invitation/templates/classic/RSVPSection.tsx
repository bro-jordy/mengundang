"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, LockKeyhole } from "lucide-react";
import type { Rsvp } from "@/types/prisma.types";

const schema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  paxCount: z.number().int().min(1),
  status: z.enum(["HADIR", "TIDAK_HADIR"]),
  message: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  clientId: string;
  guest: { id: string; name: string; maxPax: number; rsvp: Rsvp | null };
  token: string;
}

export function RSVPSection({ clientId, guest, token }: Props) {
  const [submitted, setSubmitted] = useState(!!guest.rsvp);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: guest.name,
      paxCount: guest.rsvp?.paxCount ?? 1,
      status: (guest.rsvp?.status as "HADIR" | "TIDAK_HADIR") ?? "HADIR",
      message: guest.rsvp?.message ?? "",
    },
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    setError("");

    const res = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, token }),
    });

    if (res.ok) {
      setSubmitted(true);
    } else {
      const json = await res.json();
      setError(json.error || "Gagal mengirim konfirmasi");
    }
    setLoading(false);
  }

  if (submitted) {
    return (
      <section className="py-20 px-6 bg-stone-50">
        <div className="max-w-md mx-auto text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="font-heading text-2xl text-stone-800 mb-2">
            Terima Kasih!
          </h2>
          <p className="text-stone-500 text-sm">
            Konfirmasi kehadiran Anda telah kami terima.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs tracking-widest uppercase text-stone-400 mb-2">
            Konfirmasi
          </p>
          <h2 className="font-heading text-3xl text-stone-800">
            RSVP
          </h2>
          <p className="text-stone-500 text-sm mt-2">
            Mohon konfirmasikan kehadiran Anda
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>Nama Anda</label>
            <input
              {...register("name")}
              className={inputClass}
              placeholder="Nama Anda"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Konfirmasi Kehadiran</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-3 border border-stone-300 rounded-lg px-4 py-3 cursor-pointer hover:bg-stone-50">
                <input {...register("status")} type="radio" value="HADIR" />
                <span className="text-sm">Hadir 🎉</span>
              </label>
              <label className="flex items-center gap-3 border border-stone-300 rounded-lg px-4 py-3 cursor-pointer hover:bg-stone-50">
                <input {...register("status")} type="radio" value="TIDAK_HADIR" />
                <span className="text-sm">Tidak Hadir</span>
              </label>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Jumlah Tamu (maks. {guest.maxPax})
            </label>
            <input
              {...register("paxCount", { valueAsNumber: true })}
              type="number"
              min={1}
              max={guest.maxPax}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Ucapan (opsional)</label>
            <textarea
              {...register("message")}
              rows={3}
              placeholder="Semoga pernikahannya lancar dan bahagia..."
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-800 text-white py-3 rounded-full text-sm hover:bg-stone-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Mengirim..." : "Kirim Konfirmasi"}
          </button>
        </form>
      </div>
    </section>
  );
}

export function RSVPPlaceholder() {
  return (
    <section className="py-20 px-6 bg-stone-50">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs tracking-widest uppercase text-stone-400 mb-2">Konfirmasi</p>
          <h2 className="font-heading text-3xl text-stone-800">RSVP</h2>
          <p className="text-stone-500 text-sm mt-2">Mohon konfirmasikan kehadiran Anda</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
            <LockKeyhole size={20} className="text-stone-400" />
          </div>
          <p className="font-medium text-stone-700 mb-1">Konfirmasi Kehadiran</p>
          <p className="text-sm text-stone-400 leading-relaxed">
            RSVP tersedia melalui link undangan personal yang dikirimkan ke tamu.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 opacity-40 pointer-events-none">
            <div className="flex items-center gap-3 border border-stone-300 rounded-lg px-4 py-3">
              <span className="text-sm">Hadir 🎉</span>
            </div>
            <div className="flex items-center gap-3 border border-stone-300 rounded-lg px-4 py-3">
              <span className="text-sm">Tidak Hadir</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const inputClass =
  "w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400";
const labelClass = "block text-sm font-medium text-stone-700 mb-1";
