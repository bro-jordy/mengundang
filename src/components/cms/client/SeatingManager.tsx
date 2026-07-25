"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";

interface GuestChip {
  id: string;
  name: string;
  pax: number;
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
  pax: number;
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
  const [search, setSearch] = useState("");
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function filledPax(table: TableRow) {
    return table.guests.reduce((sum, g) => sum + g.pax, 0);
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
        setUnassigned((prev) => [...prev, ...table.guests.map((g) => ({ id: g.id, name: g.name, pax: g.pax }))]);
      }
      setTables((prev) => prev.filter((t) => t.id !== id));
    }
  }

  async function assignGuest(tableId: string) {
    if (!selectedGuestId) return;
    const guestId = selectedGuestId;
    const guest = unassigned.find((g) => g.id === guestId);
    if (!guest) return;

    const res = await fetch(`/api/clients/${clientId}/tables/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId, tableId }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Gagal menempatkan tamu");
      return;
    }

    setUnassigned((prev) => prev.filter((g) => g.id !== guestId));
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, guests: [...t.guests, { id: guest.id, name: guest.name, pax: guest.pax }] } : t))
    );
    setSelectedGuestId(null);
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
    setUnassigned((prev) => [...prev, { id: guest.id, name: guest.name, pax: guest.pax }]);
  }

  const sections = [...new Set(tables.map((t) => t.sectionLabel))];
  const totalCapacity = tables.reduce((s, t) => s + t.capacity, 0);
  const totalFilled = tables.reduce((s, t) => s + filledPax(t), 0);
  const selectedGuest = unassigned.find((g) => g.id === selectedGuestId) ?? null;
  const filteredUnassigned = unassigned.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-4 text-sm text-stone-500">
          <span><strong className="text-stone-800">{tables.length}</strong> meja</span>
          <span><strong className="text-stone-800">{totalFilled}/{totalCapacity}</strong> pax terisi</span>
          <span><strong className="text-stone-800">{unassigned.length}</strong> belum ditempatkan</span>
        </div>
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

      <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start">
        <div className="lg:sticky lg:top-4 bg-white rounded-2xl border border-stone-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-medium text-stone-800">Tamu Belum Ditempatkan</p>
            <span className="text-xs text-stone-400">{unassigned.length}</span>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama tamu..."
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-stone-300"
          />
          {selectedGuest && (
            <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-3">
              <strong>{selectedGuest.name}</strong> dipilih — klik meja di kanan untuk menempatkan.
            </p>
          )}
          <div className="space-y-1.5 max-h-[65vh] overflow-y-auto">
            {filteredUnassigned.length === 0 ? (
              <p className="text-xs text-stone-300 italic py-4 text-center">
                {unassigned.length === 0 ? "Semua tamu resepsi sudah ditempatkan" : "Tidak ditemukan"}
              </p>
            ) : (
              filteredUnassigned.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGuestId((prev) => (prev === g.id ? null : g.id))}
                  className={`w-full flex items-center justify-between text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
                    selectedGuestId === g.id
                      ? "border-blue-500 bg-blue-50 text-blue-800"
                      : "border-stone-200 hover:bg-stone-50 text-stone-700"
                  }`}
                >
                  <span className="truncate">{g.name}</span>
                  <span className="text-xs text-stone-400 shrink-0 ml-2">{g.pax} pax</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          {sections.map((section) => {
            const sectionTables = tables.filter((t) => t.sectionLabel === section);
            const sectionCapacity = sectionTables.reduce((s, t) => s + t.capacity, 0);
            const sectionFilled = sectionTables.reduce((s, t) => s + filledPax(t), 0);

            return (
              <div key={section} className="bg-white rounded-2xl border border-stone-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-stone-400 font-medium uppercase tracking-wide">{section}</p>
                  <p className="text-xs text-stone-400">{sectionFilled}/{sectionCapacity} pax</p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {sectionTables.map((t) => {
                    const filled = filledPax(t);
                    const remaining = t.capacity - filled;
                    const isFull = remaining <= 0;
                    const canSeatSelected = !!selectedGuest && remaining >= selectedGuest.pax;
                    const fillRatio = Math.min(1, filled / t.capacity);

                    return (
                      <div
                        key={t.id}
                        onClick={() => selectedGuest && canSeatSelected && assignGuest(t.id)}
                        className={`rounded-xl border p-3 transition-all ${
                          selectedGuest
                            ? canSeatSelected
                              ? "border-blue-400 bg-blue-50/60 cursor-pointer hover:border-blue-500 hover:shadow-sm"
                              : "border-stone-100 opacity-40 cursor-not-allowed"
                            : isFull
                            ? "border-green-200 bg-green-50/40"
                            : filled > 0
                            ? "border-amber-200 bg-amber-50/30"
                            : "border-stone-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="font-semibold text-stone-800 text-sm">{t.code}</p>
                          {!selectedGuest && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); openEdit(t); }}
                                className="p-1 text-stone-400 hover:text-stone-600"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); removeTable(t.id); }}
                                className="p-1 text-stone-400 hover:text-red-500"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden mb-2">
                          <div
                            className={`h-full rounded-full ${isFull ? "bg-green-500" : filled > 0 ? "bg-amber-400" : "bg-stone-200"}`}
                            style={{ width: `${fillRatio * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-stone-500 mb-2">{filled}/{t.capacity} pax</p>
                        {t.guests.length === 0 ? (
                          <p className="text-xs text-stone-300 italic">Kosong</p>
                        ) : (
                          <div className="space-y-1">
                            {t.guests.map((g) => (
                              <div
                                key={g.id}
                                className="flex items-center justify-between text-xs bg-white/70 rounded-lg px-2 py-1 border border-stone-100"
                              >
                                <span className="text-stone-700 truncate">{g.name} ({g.pax})</span>
                                {!selectedGuest && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); unassignGuest(g.id, t.id); }}
                                    className="text-stone-400 hover:text-red-500 shrink-0 ml-2"
                                  >
                                    <X size={11} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {tables.length === 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-stone-400 text-sm">
              Belum ada meja. Tambahkan meja sesuai layout venue.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
