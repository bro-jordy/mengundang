"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClientSchema, type CreateClientInput } from "@/modules/clients/clients.schema";
import { slugify } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Heart, Star, Gem } from "lucide-react";

type ClientTypeOption = {
  value: "WEDDING" | "SANGJIT" | "LAMARAN";
  label: string;
  description: string;
  icon: React.ReactNode;
  subTypes?: { value: string; label: string; description: string }[];
};

const CLIENT_TYPE_OPTIONS: ClientTypeOption[] = [
  {
    value: "WEDDING",
    label: "Pernikahan",
    description: "Akad Nikah atau Pemberkatan + Resepsi",
    icon: <Heart size={22} />,
    subTypes: [
      { value: "AKAD", label: "Akad Nikah", description: "Untuk pasangan muslim" },
      { value: "PEMBERKATAN", label: "Pemberkatan Perkawinan", description: "Untuk pasangan non-muslim" },
    ],
  },
  {
    value: "SANGJIT",
    label: "Sangjit",
    description: "Upacara seserahan adat Tionghoa",
    icon: <Gem size={22} />,
  },
  {
    value: "LAMARAN",
    label: "Lamaran",
    description: "Acara lamaran / pertunangan",
    icon: <Star size={22} />,
  },
];

export default function NewClientPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<"WEDDING" | "SANGJIT" | "LAMARAN" | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema) as any,
    defaultValues: { status: "DRAFT", clientType: "WEDDING" },
  });

  function handleTypeSelect(type: "WEDDING" | "SANGJIT" | "LAMARAN") {
    setSelectedType(type);
    setValue("clientType", type);
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    setValue("name", name);
    setValue("slug", slugify(name));
  }

  async function onSubmit(data: CreateClientInput) {
    if (!selectedType) {
      setError("Pilih jenis acara terlebih dahulu");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error || "Terjadi kesalahan");
      setLoading(false);
      return;
    }

    router.push(`/admin/clients/${json.id}`);
  }

  const slug = watch("slug");

  const selectedOption = CLIENT_TYPE_OPTIONS.find((o) => o.value === selectedType);

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/clients" className="text-stone-400 hover:text-stone-600">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold text-stone-800">Buat Client Baru</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Step 1: Choose event category */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="font-semibold text-stone-800 mb-1">Jenis Acara</h2>
          <p className="text-xs text-stone-400 mb-4">Pilih kategori undangan yang akan dibuat</p>

          <div className="grid grid-cols-1 gap-3">
            {CLIENT_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleTypeSelect(opt.value)}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                  selectedType === opt.value
                    ? "border-stone-800 bg-stone-50"
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  selectedType === opt.value ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-500"
                }`}>
                  {opt.icon}
                </div>
                <div>
                  <p className="font-medium text-stone-800 text-sm">{opt.label}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{opt.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Wedding sub-type info */}
          {selectedType === "WEDDING" && selectedOption?.subTypes && (
            <div className="mt-4 bg-stone-50 rounded-xl p-4">
              <p className="text-xs font-medium text-stone-600 mb-2">
                Tersedia jenis acara:
              </p>
              <div className="space-y-1.5">
                {selectedOption.subTypes.map((sub) => (
                  <div key={sub.value} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0" />
                    <span className="text-xs text-stone-600">
                      <span className="font-medium">{sub.label}</span> — {sub.description}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-stone-400 mt-2">
                Bisa ditambahkan di menu Detail Acara setelah client dibuat.
              </p>
            </div>
          )}
        </div>

        {/* Step 2: Client details */}
        {selectedType && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
            <h2 className="font-semibold text-stone-800">Detail Client</h2>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Nama Client
              </label>
              <input
                {...register("name")}
                onChange={handleNameChange}
                placeholder={
                  selectedType === "WEDDING"
                    ? "Contoh: Budi & Ayu Wedding"
                    : selectedType === "SANGJIT"
                    ? "Contoh: Sangjit William & Lisa"
                    : "Contoh: Lamaran Dito & Rina"
                }
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Slug URL
              </label>
              <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-stone-400">
                <span className="px-3 py-2 bg-stone-50 text-stone-500 text-sm border-r border-stone-300">
                  /invite/
                </span>
                <input
                  {...register("slug")}
                  placeholder="budi-ayu"
                  className="flex-1 px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              {slug && (
                <p className="text-stone-400 text-xs mt-1">URL: /invite/{slug}</p>
              )}
              {errors.slug && (
                <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Status Awal
              </label>
              <select
                {...register("status")}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              >
                <option value="DRAFT">Draft (belum publik)</option>
                <option value="ACTIVE">Aktif (publik)</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-stone-800 text-white px-5 py-2 rounded-lg text-sm hover:bg-stone-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Menyimpan..." : "Buat Client"}
              </button>
              <Link
                href="/admin/clients"
                className="border border-stone-300 text-stone-600 px-5 py-2 rounded-lg text-sm hover:bg-stone-50 transition-colors"
              >
                Batal
              </Link>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
