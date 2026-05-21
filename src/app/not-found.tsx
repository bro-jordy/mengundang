import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center text-center px-6">
      <div>
        <p className="text-6xl mb-4">💌</p>
        <h1 className="text-2xl font-bold text-stone-800 mb-2">
          Undangan Tidak Ditemukan
        </h1>
        <p className="text-stone-500 text-sm mb-6">
          Link undangan yang Anda buka tidak valid atau sudah tidak aktif.
        </p>
        <Link
          href="/"
          className="text-stone-600 underline text-sm hover:text-stone-800"
        >
          Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}
