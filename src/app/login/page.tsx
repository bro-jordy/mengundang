"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email atau password salah.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        fontFamily: "'IBM Plex Sans', Arial, sans-serif",
        background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 60%, #e0f2fe 100%)",
      }}
    >
      <div className="w-full max-w-sm">
        {/* Monogram logo */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-md"
            style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
          >
            <span className="text-white text-2xl font-semibold tracking-tight select-none">
              JR
            </span>
          </div>
          <p className="text-slate-400 text-sm tracking-wide">Admin Panel</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-2xl shadow-sm border p-6 space-y-4"
          style={{ borderColor: "#dbeafe" }}
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="admin@example.com"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              {...register("password")}
              type="password"
              placeholder="••••••••"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
            style={{ background: loading ? "#93c5fd" : "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
