"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { RichTextEditor } from "./RichTextEditor";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X } from "lucide-react";
import {
  weddingProfileSchema,
  type WeddingProfileInput,
} from "@/modules/wedding/wedding.schema";
import type { WeddingProfile } from "@/types/prisma.types";
import { useImageUpload } from "@/hooks/useImageUpload";

interface Props {
  clientId: string;
  initialData: WeddingProfile | null;
}

export function ProfileForm({ clientId, initialData }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<WeddingProfileInput>({
      resolver: zodResolver(weddingProfileSchema) as any,
      defaultValues: {
        groomName: initialData?.groomName ?? "",
        brideName: initialData?.brideName ?? "",
        groomNickname: initialData?.groomNickname ?? "",
        brideNickname: initialData?.brideNickname ?? "",
        groomParents: initialData?.groomParents ?? "",
        brideParents: initialData?.brideParents ?? "",
        groomPhoto: initialData?.groomPhoto ?? "",
        bridePhoto: initialData?.bridePhoto ?? "",
        showGroomPhoto: (initialData as any)?.showGroomPhoto ?? true,
        showBridePhoto: (initialData as any)?.showBridePhoto ?? true,
        heroImage: initialData?.heroImage ?? "",
        story: initialData?.story ?? "",
        storyTitle: (initialData as any)?.storyTitle ?? "",
        showStoryTitle: (initialData as any)?.showStoryTitle ?? true,
        openingQuote: initialData?.openingQuote ?? "",
        openingQuoteBy: initialData?.openingQuoteBy ?? "",
      },
    });

  async function saveData(data: WeddingProfileInput) {
    const res = await fetch(`/api/clients/${clientId}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error || "Gagal menyimpan");
      return false;
    }
    return true;
  }

  async function onSubmit(data: WeddingProfileInput) {
    setSaving(true);
    setError("");
    setSaved(false);
    const ok = await saveData(data);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  async function autoSaveToggle(field: string, value: boolean) {
    setValue(field as any, value, { shouldDirty: true });
    const current = watch();
    await saveData({ ...current, [field]: value } as WeddingProfileInput);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
          Profil berhasil disimpan.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
        <h3 className="font-medium text-stone-700 text-sm">Mempelai Pria</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nama Lengkap" error={errors.groomName?.message}>
            <input {...register("groomName")} placeholder="Ahmad Budi Santoso" className={inputClass} />
          </Field>
          <Field label="Nama Panggilan" error={errors.groomNickname?.message}>
            <input {...register("groomNickname")} placeholder="Budi" className={inputClass} />
          </Field>
        </div>
        <Field label="Nama Orang Tua" error={errors.groomParents?.message}>
          <input
            {...register("groomParents")}
            placeholder="Putra dari Bpk. Santoso & Ibu Sari"
            className={inputClass}
          />
        </Field>
        <PhotoField
          label="Foto Mempelai Pria"
          clientId={clientId}
          value={watch("groomPhoto") ?? ""}
          onChange={(v) => setValue("groomPhoto", v, { shouldDirty: true })}
        />
        <Toggle
          label="Tampilkan foto mempelai pria di undangan"
          value={watch("showGroomPhoto") ?? true}
          onChange={(v) => autoSaveToggle("showGroomPhoto", v)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
        <h3 className="font-medium text-stone-700 text-sm">Mempelai Wanita</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nama Lengkap" error={errors.brideName?.message}>
            <input {...register("brideName")} placeholder="Ayu Putri Lestari" className={inputClass} />
          </Field>
          <Field label="Nama Panggilan" error={errors.brideNickname?.message}>
            <input {...register("brideNickname")} placeholder="Ayu" className={inputClass} />
          </Field>
        </div>
        <Field label="Nama Orang Tua" error={errors.brideParents?.message}>
          <input
            {...register("brideParents")}
            placeholder="Putri dari Bpk. Lestari & Ibu Dewi"
            className={inputClass}
          />
        </Field>
        <PhotoField
          label="Foto Mempelai Wanita"
          clientId={clientId}
          value={watch("bridePhoto") ?? ""}
          onChange={(v) => setValue("bridePhoto", v, { shouldDirty: true })}
        />
        <Toggle
          label="Tampilkan foto mempelai wanita di undangan"
          value={watch("showBridePhoto") ?? true}
          onChange={(v) => autoSaveToggle("showBridePhoto", v)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
        <h3 className="font-medium text-stone-700 text-sm">Konten Undangan</h3>
        <Field label="Kata Pembuka / Quote" error={errors.openingQuote?.message}>
          <textarea
            {...register("openingQuote")}
            rows={3}
            placeholder="Dan di antara tanda-tanda kekuasaan-Nya..."
            className={inputClass}
          />
        </Field>
        <Field label="Sumber Quote" error={errors.openingQuoteBy?.message}>
          <input
            {...register("openingQuoteBy")}
            placeholder="Contoh: QS. Ar-Rum: 21 · 1 Korintus 13:4 · Bhagavad Gita · Dhammapada"
            className={inputClass}
          />
        </Field>
        <Field label="Isi Cerita / Pesan" error={errors.story?.message}>
          <RichTextEditor
            value={watch("story") ?? ""}
            onChange={(html) => setValue("story" as any, html, { shouldDirty: true })}
            placeholder="Kisah pertemuan kami dimulai dari..."
            rows={5}
          />
          <p className="text-xs text-stone-400 mt-1">Gunakan toolbar untuk teks tebal, miring, atau daftar poin.</p>
        </Field>
        <div className="space-y-3 pt-1">
          <Toggle
            label="Tampilkan judul di atas cerita"
            value={watch("showStoryTitle") ?? true}
            onChange={(v) => autoSaveToggle("showStoryTitle", v)}
          />
          {(watch("showStoryTitle") ?? true) && (
            <Field label="Judul bagian cerita" error={undefined}>
              <input
                {...register("storyTitle")}
                placeholder="Cerita Singkat Pasangan"
                className={inputClass}
              />
              <p className="text-xs text-stone-400 mt-1">Kosongkan untuk menggunakan judul default</p>
            </Field>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-stone-800 text-white px-6 py-2 rounded-lg text-sm hover:bg-stone-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Menyimpan..." : "Simpan Profil"}
        </button>
      </div>
    </form>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div className="relative shrink-0">
        <input
          type="checkbox"
          className="sr-only"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className="w-9 h-5 rounded-full transition-colors"
          style={{ backgroundColor: value ? "#292524" : "#d6d3d1" }}
        />
        <div
          className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
          style={{ transform: value ? "translateX(16px)" : "translateX(0)" }}
        />
      </div>
      <span className="text-sm text-stone-700">{label}</span>
    </label>
  );
}

function PhotoField({
  label,
  clientId,
  value,
  onChange,
}: {
  label: string;
  clientId: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploadError, setUploadError] = useState("");

  const { uploading, openPicker, inputProps } = useImageUpload({
    clientId,
    onSuccess: (url) => {
      onChange(url);
      setUploadError("");
    },
    onError: (msg) => setUploadError(msg),
  });

  const displayUrl = value || "";

  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-2">{label}</label>
      <div className="flex gap-2">
        <input
          type="url"
          value={displayUrl}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... atau link Google Drive"
          className={inputClass + " flex-1"}
        />
        <input {...inputProps} />
        <button
          type="button"
          onClick={openPicker}
          disabled={uploading}
          title="Upload dari laptop"
          className="shrink-0 flex items-center gap-1.5 border border-stone-200 text-stone-600 text-xs px-3 py-2 rounded-lg hover:bg-stone-50 disabled:opacity-50 transition-colors"
        >
          <Upload size={13} />
          {uploading ? "..." : "Upload"}
        </button>
        {displayUrl && (
          <button
            type="button"
            onClick={() => onChange("")}
            title="Hapus foto"
            className="shrink-0 p-2 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
      {displayUrl && (
        <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden border border-stone-200 bg-stone-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={displayUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400";
