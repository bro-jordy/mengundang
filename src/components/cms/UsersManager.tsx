"use client";

import { useState } from "react";
import { Trash2, Plus, Shield, User, ChevronDown } from "lucide-react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  _count: { clientUsers: number };
}

interface Props {
  currentUserId: string;
  initialUsers: UserItem[];
}

const ROLE_LABELS: Record<string, { label: string; cls: string }> = {
  SUPERADMIN: { label: "Super Admin", cls: "bg-red-50 text-red-700" },
  ADMIN:      { label: "Admin",       cls: "bg-blue-50 text-blue-700" },
  STAFF:      { label: "Staff",       cls: "bg-stone-100 text-stone-600" },
};

const inputClass = "w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300";
const labelClass = "block text-xs font-medium text-stone-600 mb-1";

export function UsersManager({ currentUserId, initialUsers }: Props) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "ADMIN" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  function updateForm(k: keyof typeof form, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleCreate() {
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Gagal membuat pengguna"); return; }
      setUsers((p) => [{ ...data, _count: { clientUsers: 0 } }, ...p]);
      setForm({ name: "", email: "", password: "", role: "ADMIN" });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus pengguna ini?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) setUsers((p) => p.filter((u) => u.id !== id));
  }

  async function handleRoleChange(id: string, role: string) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) setUsers((p) => p.map((u) => u.id === id ? { ...u, role } : u));
  }

  return (
    <div className="space-y-6">
      {/* Add user */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-stone-800">Tambah Pengguna</h2>
            <p className="text-xs text-stone-400 mt-0.5">Buat akun login untuk pengelola undangan</p>
          </div>
          <button onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 text-sm border border-stone-200 px-3 py-1.5 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors">
            <Plus size={14} /> Tambah
          </button>
        </div>

        {showForm && (
          <div className="border-t border-stone-100 pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Nama</label>
                <input value={form.name} onChange={(e) => updateForm("name", e.target.value)}
                  placeholder="Nama lengkap" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)}
                  placeholder="email@example.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input type="password" value={form.password} onChange={(e) => updateForm("password", e.target.value)}
                  placeholder="Min. 8 karakter" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Role</label>
                <select value={form.role} onChange={(e) => updateForm("role", e.target.value)} className={inputClass}>
                  <option value="ADMIN">Admin — kelola client yang ditetapkan</option>
                  <option value="STAFF">Staff — akses terbatas</option>
                  <option value="SUPERADMIN">Super Admin — akses penuh</option>
                </select>
              </div>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex gap-2">
              <button onClick={handleCreate} disabled={saving}
                className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-700 disabled:opacity-50 transition-colors">
                {saving ? "Menyimpan..." : "Buat Pengguna"}
              </button>
              <button onClick={() => { setShowForm(false); setError(""); }}
                className="border border-stone-200 text-stone-600 px-4 py-2 rounded-lg text-sm hover:bg-stone-50">
                Batal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User list */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-800">
            Daftar Pengguna
            <span className="ml-2 text-xs font-normal text-stone-400">({users.length} pengguna)</span>
          </h2>
        </div>
        {users.length === 0 ? (
          <div className="p-10 text-center">
            <User size={32} className="text-stone-300 mx-auto mb-3" />
            <p className="text-stone-400 text-sm">Belum ada pengguna.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {users.map((user) => {
              const roleInfo = ROLE_LABELS[user.role] ?? { label: user.role, cls: "bg-stone-100 text-stone-600" };
              const isMe = user.id === currentUserId;
              return (
                <div key={user.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                    {user.role === "SUPERADMIN" ? <Shield size={16} className="text-stone-500" /> : <User size={16} className="text-stone-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-stone-800 truncate">{user.name}</p>
                      {isMe && <span className="text-xs text-stone-400">(Anda)</span>}
                    </div>
                    <p className="text-xs text-stone-400 truncate">{user.email}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{user._count.clientUsers} client</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Role dropdown */}
                    <div className="relative">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={isMe}
                        className={`appearance-none pl-2 pr-6 py-1 rounded-full text-xs font-medium border-0 focus:outline-none cursor-pointer disabled:cursor-not-allowed ${roleInfo.cls}`}
                      >
                        <option value="SUPERADMIN">Super Admin</option>
                        <option value="ADMIN">Admin</option>
                        <option value="STAFF">Staff</option>
                      </select>
                      <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                    </div>
                    {!isMe && (
                      <button onClick={() => handleDelete(user.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
