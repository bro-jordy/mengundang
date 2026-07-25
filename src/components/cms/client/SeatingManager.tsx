"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Users } from "lucide-react";

interface GuestChip {
  id: string;
  name: string;
  maxPax: number;
}

interface TableRow {
  id: string;
  sectionLabel: string;
  code: string;
  capacity: number;
  sortOrder: number;
  guests: GuestChip[];
}

interface UnassignedGuest {
  id: string;
  name: string;
  maxPax: number;
  invitationCategory: string;
}

interface Props {
  clientId: string;
  initialTables: TableRow[];
  initialUnassignedGuests: UnassignedGuest[];
}

const emptyForm = { sectionLabel: "", code: "", capacity: 4 };

export function SeatingManager({ clientId, initialTables, initialUnassignedGuests }: Props) {
  const [tables, setTables] = useState<TableRow[]>(initialTables);
  const [unassigned, setUnassigned] = useState<UnassignedGuest[]>(initialUnassignedGuests);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignSelection, setAssignSelection] = useState<Record<string, string>>({});

  function filledPax(table: TableRow) {
    return table.guests.reduce((sum, g) => sum + g.maxPax, 0);
  }

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
    setShowForm(true);
  }

  function openEdit(table: TableRow) {
    setForm({ sectionLabel: table.sectionLabel, code: table.code, capacity: table.capacity });
    setEditingId(table.id);
    setError(null);
    setShowForm(true);
  }

  async function saveTable() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${clientId}/tables`, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan meja");
        return;
      }
      if (editingId) {
        setTables((prev) => prev.map((t) => (t.id === editingId ? { ...t, ...form } : t)));
      } else {
        setTables((prev) => [...prev, { ...data, guests: [] }]);
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function removeTable(id: string) {
    if (!confirm("Hapus meja ini? Tamu yang duduk di sini akan jadi belum ditempatkan.")) return;
    const res = await fetch(`/api/clients/${clientId}/tables`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      const table = tables.find((t) => t.id === id);
      if (table) {
        setUnassigned((prev) => [
          ...prev,
          ...table.guests.map((g) => ({ id: g.id, name: g.name, maxPax: g.maxPax, invitationCategory: "RESEPSI" })),
        ]);
      }
      setTables((prev) => prev.filter((t) => t.id !== id));
    }
  }

  async function assignGuest(guestId: string) {
    const tableId = assignSelection[guestId];
    if (!tableId) return;
    const res = await fetch(`/api/clients/${clientId}/tables/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId, tableId }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Gagal assign tamu");
      return;
    }
    const guest = unassigned.find((g) => g.id === guestId);
    if (!guest) return;
    setUnassigned((prev) => prev.filter((g) => g.id !== guestId));
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId ? { ...t, guests: [...t.guests, { id: guest.id, name: guest.name, maxPax: guest.maxPax }] } : t
      )
    );
  }

  async function unassignGuest(guestId: string, tableId: string) {
    const res = await fetch(`/api/clients/${clientId}/tables/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId, tableId: null }),
    });
    if (!res.ok) return;
    const table = tables.find((t) => t.id === tableId);
    const guest = table?.guests.find((g) => g.id === guestId);
    if (!guest) return;
    setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, guests: t.guests.filter((g) => g.id !== guestId) } : t)));
    setUnassigned((prev) => [...prev, { id: guest.id, name: guest.name, maxPax: guest.maxPax, invitationCategory: "RESEPSI" }]);
  }

  const sections = [...new Set(tables.map((t) => t.sectionLabel))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500">
          {tables.length} meja · {unassigned.length} tamu belum ditempatkan
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Tambah Meja
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-medium text-stone-800">{editingId ? "Edit Meja" : "Meja Baru"}</p>
            <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600">
              <X size={16} />
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-stone-500 mb-1">Section</label>
              <input
                type="text"
                value={form.sectionLabel}
                onChange={(e) => setForm((p) => ({ ...p, sectionLabel: e.target.value }))}
                placeholder="VIP 1 / Section 5"
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Kode Meja</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                placeholder="T.82"
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Kapasitas</label>
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm((p) => ({ ...p, capacity: Number(e.target.value) }))}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              />
            </div>
          </div>
          <button
            onClick={saveTable}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      )}

      {unassigned.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <p className="font-medium text-stone-800 mb-3">Tamu Belum Ditempatkan ({unassigned.length})</p>
          <div className="space-y-2">
            {unassigned.map((g) => (
              <div key={g.id} className="flex items-center gap-3 text-sm">
                <span className="flex-1 text-stone-700">
                  {g.name} <span className="text-stone-400">({g.maxPax} pax)</span>
                </span>
                <select
                  value={assignSelection[g.id] || ""}
                  onChange={(e) => setAssignSelection((prev) => ({ ...prev, [g.id]: e.target.value }))}
                  className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-stone-300"
                >
                  <option value="">Pilih meja...</option>
                  {tables
                    .filter((t) => t.capacity - filledPax(t) >= g.maxPax)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.sectionLabel} — {t.code} ({filledPax(t)}/{t.capacity})
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => assignGuest(g.id)}
                  disabled={!assignSelection[g.id]}
                  className="px-3 py-1.5 text-xs bg-stone-800 text-white rounded-lg disabled:opacity-40"
                >
                  Assign
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {sections.map((section) => (
        <div key={section} className="bg-white rounded-2xl border border-stone-200 p-5">
          <p className="text-xs text-stone-400 font-medium uppercase tracking-wide mb-3">{section}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tables
              .filter((t) => t.sectionLabel === section)
              .map((t) => {
                const filled = filledPax(t);
                return (
                  <div key={t.id} className="rounded-xl border border-stone-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-stone-800">{t.code}</p>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(t)} className="p-1 text-stone-400 hover:text-stone-600">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => removeTable(t.id)} className="p-1 text-stone-400 hover:text-red-500">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-stone-500 mb-2 flex items-center gap-1">
                      <Users size={12} /> {filled}/{t.capacity} pax
                    </p>
                    {t.guests.length === 0 ? (
                      <p className="text-xs text-stone-300 italic">Belum ada tamu</p>
                    ) : (
                      <div className="space-y-1">
                        {t.guests.map((g) => (
                          <div key={g.id} className="flex items-center justify-between text-xs bg-stone-50 rounded-lg px-2 py-1">
                            <span className="text-stone-700 truncate">{g.name} ({g.maxPax})</span>
                            <button onClick={() => unassignGuest(g.id, t.id)} className="text-stone-400 hover:text-red-500 shrink-0 ml-2">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      ))}

      {tables.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-stone-400 text-sm">
          Belum ada meja. Tambahkan meja sesuai layout venue.
        </div>
      )}
    </div>
  );
}
