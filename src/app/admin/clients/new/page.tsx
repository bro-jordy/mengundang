"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClientSchema, type CreateClientInput } from "@/modules/clients/clients.schema";
import { slugify } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewClientPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema) as any,
    defaultValues: { status: "DRAFT" },
  });

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    setValue("name", name);
    setValue("slug", slugify(name));
  }

  async function onSubmit(data: CreateClientInput) {
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

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/clients" className="text-stone-400 hover:text-stone-600">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold text-stone-800">Buat Client Baru</h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Nama Client
          </label>
          <input
            {...register("name")}
            onChange={handleNameChange}
            placeholder="Contoh: Budi & Ayu Wedding"
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
            <p className="text-stone-400 text-xs mt-1">
              URL: /invite/{slug}
            </p>
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
      </form>
    </div>
  );
}
