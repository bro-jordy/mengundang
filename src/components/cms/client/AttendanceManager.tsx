"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Camera, CameraOff, Users, UserCheck, QrCode, RefreshCw, Clock, Download } from "lucide-react";

interface Guest {
  id: string;
  name: string;
  phone: string | null;
  maxPax: number;
  invitationCategory: string;
}

interface AttendanceRow {
  id: string;
  guestId: string;
  barcodeType: "CHURCH" | "RECEPTION";
  arrivedAt: string;
  actualPax: number;
  guest: Guest;
}

interface Stats {
  totalGuests: number;
  totalHadir: number;
  totalPaxUndangan: number;
  churchActualPax: number;
  receptionActualPax: number;
  nasiBoxPax: number;
  nasiBoxCount: number;
  perCategory: { category: string; count: number }[];
}

interface EventInfo {
  type: string;
  label: string;
  venueName: string;
}

interface Props {
  clientId: string;
  initialAttendances: AttendanceRow[];
  initialStats: Stats;
  staffMode?: boolean;
  events?: EventInfo[];
}

const CATEGORY_LABEL: Record<string, string> = {
  GEREJA_SAJA: "Gereja Saja",
  GEREJA_RESEPSI: "Gereja + Resepsi",
  AKAD: "Akad",
  AKAD_RESEPSI: "Akad & Resepsi",
  PEMBERKATAN: "Pemberkatan",
  PEMBERKATAN_RESEPSI: "Pemberkatan & Resepsi",
  PEMBERKATAN_NASI_BOX: "Pemberkatan & Nasi Box",
  SANGJIT: "Sangjit",
  LAMARAN: "Lamaran",
};

const RECEPTION_TYPES = new Set(["RESEPSI", "AFTER_PARTY"]);

function buildScanLabels(events?: EventInfo[]): Record<string, string> {
  if (!events?.length) return { CHURCH: "Upacara", RECEPTION: "Resepsi" };
  const church = events.find((e) => !RECEPTION_TYPES.has(e.type));
  const reception = events.find((e) => RECEPTION_TYPES.has(e.type));
  return {
    CHURCH: church?.venueName || church?.label || "Upacara",
    RECEPTION: reception?.venueName || reception?.label || "Resepsi",
  };
}

function formatArrivalTime(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hh}:${mm}:${ss}`;
}

async function exportToXlsx(
  rows: AttendanceRow[],
  sheetName: string,
  isNasiBox: boolean
) {
  const { utils, writeFile } = await import("xlsx");

  const header = isNasiBox
    ? ["No", "Nama Tamu", "Kategori", "WhatsApp", "Waktu Kedatangan", "Pax", "Actual Pax", "Sudah Ambil Nasi Box", "Catatan"]
    : ["No", "Nama Tamu", "Kategori", "WhatsApp", "Waktu Kedatangan", "Pax", "Actual Pax"];

  const data = rows.map((att, i) => {
    const base = [
      i + 1,
      att.guest.name,
      CATEGORY_LABEL[att.guest.invitationCategory] ?? att.guest.invitationCategory,
      att.guest.phone || "",
      formatArrivalTime(att.arrivedAt),
      att.guest.maxPax,
      att.actualPax,
    ];
    if (isNasiBox) base.push("", "");
    return base;
  });

  const ws = utils.aoa_to_sheet([header, ...data]);

  // Column widths
  ws["!cols"] = isNasiBox
    ? [{ wch: 4 }, { wch: 28 }, { wch: 26 }, { wch: 16 }, { wch: 22 }, { wch: 6 }, { wch: 12 }, { wch: 24 }, { wch: 20 }]
    : [{ wch: 4 }, { wch: 28 }, { wch: 26 }, { wch: 16 }, { wch: 22 }, { wch: 6 }, { wch: 12 }];

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  writeFile(wb, `${sheetName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

type ScanResult =
  | { type: "success"; guestName: string; barcodeType: string }
  | { type: "already"; guestName: string; arrivedAt: string; barcodeType: string }
  | { type: "outsideWindow"; message: string }
  | { type: "error"; message: string };

export function AttendanceManager({ clientId, initialAttendances, initialStats, staffMode = false, events }: Props) {
  const [attendances, setAttendances] = useState<AttendanceRow[]>(initialAttendances);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [activeTab, setActiveTab] = useState<"CHURCH" | "RECEPTION">("CHURCH");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const scanLabels = buildScanLabels(events);
  const hasReceptionEvent = events?.some((e) => RECEPTION_TYPES.has(e.type)) ?? false;
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loadingPax, setLoadingPax] = useState<string | null>(null);
  const scannerDivId = "qr-scanner-container";
  const scannerRef = useRef<any>(null);
  const isProcessingRef = useRef(false);

  const refreshData = useCallback(async () => {
    const res = await fetch(`/api/clients/${clientId}/attendance`);
    if (res.ok) {
      const { attendances: a, stats: s } = await res.json();
      setAttendances(a);
      setStats(s);
    }
  }, [clientId]);

  const handleScan = useCallback(async (barcode: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const res = await fetch(`/api/clients/${clientId}/attendance/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode }),
    });

    const data = await res.json();

    if (res.status === 404) {
      setScanResult({ type: "error", message: data.error || "Barcode tidak ditemukan" });
    } else if (data.outsideWindow) {
      setScanResult({ type: "outsideWindow", message: data.error });
    } else if (data.alreadyCheckedIn) {
      setScanResult({
        type: "already",
        guestName: data.guest?.name || "Tamu",
        arrivedAt: formatArrivalTime(data.arrivedAt),
        barcodeType: scanLabels[data.barcodeType] || data.barcodeType,
      });
    } else if (data.success) {
      setScanResult({
        type: "success",
        guestName: data.attendance?.guest?.name || "Tamu",
        barcodeType: scanLabels[data.barcodeType] || data.barcodeType,
      });
      await refreshData();
    }

    stopScanner();
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 1000);
  }, [clientId, refreshData]);

  function stopScanner() {
    setScanning(false);
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
  }

  useEffect(() => {
    if (!scanning) return;

    let mounted = true;

    import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
      if (!mounted || !document.getElementById(scannerDivId)) return;

      const scanner = new Html5QrcodeScanner(
        scannerDivId,
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        false
      );

      scanner.render(
        (decodedText: string) => {
          handleScan(decodedText);
        },
        () => {}
      );

      scannerRef.current = scanner;
    });

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [scanning, handleScan]);

  async function updateActualPax(attendanceId: string, actualPax: number) {
    setLoadingPax(attendanceId);
    const res = await fetch(`/api/clients/${clientId}/attendance`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendanceId, actualPax }),
    });
    if (res.ok) {
      setAttendances((prev) =>
        prev.map((a) => (a.id === attendanceId ? { ...a, actualPax } : a))
      );
      const att = attendances.find((a) => a.id === attendanceId);
      if (att) {
        const diff = actualPax - att.actualPax;
        setStats((prev) => ({
          ...prev,
          churchActualPax: att.barcodeType === "CHURCH" ? prev.churchActualPax + diff : prev.churchActualPax,
          receptionActualPax: att.barcodeType === "RECEPTION" ? prev.receptionActualPax + diff : prev.receptionActualPax,
          nasiBoxPax: att.barcodeType === "CHURCH" && att.guest.invitationCategory === "PEMBERKATAN_NASI_BOX" ? prev.nasiBoxPax + diff : prev.nasiBoxPax,
        }));
      }
    }
    setLoadingPax(null);
  }



  return (
    <div className="space-y-6">
      {/* Stats — hidden in staffMode */}
      {!staffMode && (
        <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
          {/* Grup 1: Tamu */}
          <div className="px-5 py-4">
            <p className="text-xs text-stone-400 font-medium uppercase tracking-wide mb-3">Tamu</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-4 bg-stone-50">
                <p className="text-xs text-stone-500 font-medium">Total Tamu</p>
                <p className="text-3xl font-bold text-stone-800 mt-1">{stats.totalGuests}</p>
              </div>
              <div className="rounded-xl p-4 bg-green-50">
                <p className="text-xs text-green-600 font-medium">Sudah Hadir</p>
                <p className="text-3xl font-bold text-green-700 mt-1">{stats.totalHadir}</p>
              </div>
            </div>
          </div>

          {/* Grup 2: Kehadiran per lokasi */}
          <div className="px-5 py-4">
            <p className="text-xs text-stone-400 font-medium uppercase tracking-wide mb-3">Kehadiran</p>
            <div className={`grid gap-3 ${hasReceptionEvent ? "grid-cols-2" : "grid-cols-1"}`}>
              <div className="rounded-xl p-4 bg-blue-50">
                <p className="text-xs text-blue-600 font-medium">{scanLabels.CHURCH}</p>
                <p className="text-3xl font-bold text-blue-700 mt-1">{stats.churchActualPax}</p>
                <p className="text-xs text-blue-400 mt-0.5">orang</p>
              </div>
              {hasReceptionEvent && (
                <div className="rounded-xl p-4 bg-indigo-50">
                  <p className="text-xs text-indigo-600 font-medium">{scanLabels.RECEPTION}</p>
                  <p className="text-3xl font-bold text-indigo-700 mt-1">{stats.receptionActualPax}</p>
                  <p className="text-xs text-indigo-400 mt-0.5">orang</p>
                </div>
              )}
            </div>
          </div>

          {/* Grup 3: Nasi Box — hanya tampil kalau ada */}
          {stats.nasiBoxPax > 0 && (
            <div className="px-5 py-4">
              <p className="text-xs text-stone-400 font-medium uppercase tracking-wide mb-3">Nasi Box</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-4 bg-amber-50">
                  <p className="text-xs text-amber-600 font-medium">Total Kotak</p>
                  <p className="text-3xl font-bold text-amber-700 mt-1">{stats.nasiBoxPax}</p>
                  <p className="text-xs text-amber-400 mt-0.5">kotak</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scanner area */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-stone-800">Scan Barcode Tamu</h3>
          <button
            onClick={refreshData}
            className="text-stone-400 hover:text-stone-700"
            title="Refresh data"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {!scanning && (
          <button
            onClick={() => { setScanResult(null); setScanning(true); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm hover:bg-blue-700 transition-colors"
          >
            <Camera size={16} />
            Open Camera
          </button>
        )}

        {scanning && (
          <div className="space-y-3">
            <div id={scannerDivId} className="w-full max-w-sm mx-auto" />
            <button
              onClick={stopScanner}
              className="flex items-center gap-2 border border-stone-300 text-stone-600 px-4 py-2 rounded-xl text-sm hover:bg-stone-50"
            >
              <CameraOff size={16} />
              Tutup Kamera
            </button>
          </div>
        )}

        {/* Scan result notification */}
        {scanResult && (
          <div className={`mt-4 rounded-xl p-4 flex items-start gap-3 ${
            scanResult.type === "success"
              ? "bg-green-50 border border-green-200"
              : scanResult.type === "already"
              ? "bg-yellow-50 border border-yellow-200"
              : scanResult.type === "outsideWindow"
              ? "bg-orange-50 border border-orange-200"
              : "bg-red-50 border border-red-200"
          }`}>
            {scanResult.type === "success" && (
              <>
                <UserCheck className="text-green-600 mt-0.5 shrink-0" size={20} />
                <div>
                  <p className="font-medium text-green-800">Check-in Berhasil!</p>
                  <p className="text-sm text-green-700 mt-0.5">
                    <strong>{scanResult.guestName}</strong> — {scanResult.barcodeType}
                  </p>
                </div>
              </>
            )}
            {scanResult.type === "already" && (
              <>
                <QrCode className="text-yellow-600 mt-0.5 shrink-0" size={20} />
                <div>
                  <p className="font-medium text-yellow-800">Sudah Check-in {scanResult.barcodeType}</p>
                  <p className="text-sm text-yellow-700 mt-0.5">
                    <strong>{scanResult.guestName}</strong> sudah check-in <strong>{scanResult.barcodeType}</strong> pada {scanResult.arrivedAt}.
                  </p>
                </div>
              </>
            )}
            {scanResult.type === "outsideWindow" && (
              <>
                <Clock className="text-orange-600 mt-0.5 shrink-0" size={20} />
                <div>
                  <p className="font-medium text-orange-800">Di Luar Jadwal Scan</p>
                  <p className="text-sm text-orange-700 mt-0.5">{scanResult.message}</p>
                </div>
              </>
            )}
            {scanResult.type === "error" && (
              <>
                <QrCode className="text-red-500 mt-0.5 shrink-0" size={20} />
                <div>
                  <p className="font-medium text-red-800">Scan Gagal</p>
                  <p className="text-sm text-red-700 mt-0.5">{scanResult.message}</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Attendance table — hidden in staffMode */}
      {!staffMode && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          {/* Tabs — hanya tampil kalau ada 2 event */}
          <div className="flex items-center border-b border-stone-100">
            <div className="flex flex-1">
              {hasReceptionEvent
                ? (["CHURCH", "RECEPTION"] as const).map((tab) => {
                    const count = attendances.filter((a) => a.barcodeType === tab).length;
                    return (
                      <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setActiveCategory(null); }}
                        className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                          activeTab === tab
                            ? "border-blue-600 text-blue-700"
                            : "border-transparent text-stone-500 hover:text-stone-700"
                        }`}
                      >
                        <Users size={14} />
                        {scanLabels[tab]}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          activeTab === tab ? "bg-blue-100 text-blue-700" : "bg-stone-100 text-stone-500"
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })
                : (
                  <div className="flex items-center gap-2 px-5 py-3.5 text-sm font-medium text-blue-700 border-b-2 border-blue-600">
                    <Users size={14} />
                    {scanLabels.CHURCH}
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {attendances.filter((a) => a.barcodeType === "CHURCH").length}
                    </span>
                  </div>
                )
              }
            </div>
            <button
              onClick={() => {
                const tab = hasReceptionEvent ? activeTab : "CHURCH";
                const rows = activeCategory
                  ? attendances.filter((a) => a.barcodeType === tab && a.guest.invitationCategory === activeCategory)
                  : attendances.filter((a) => a.barcodeType === tab);
                const isNasiBox = activeCategory === "PEMBERKATAN_NASI_BOX" ||
                  (tab === "CHURCH" && rows.every((r) => r.guest.invitationCategory === "PEMBERKATAN_NASI_BOX"));
                const label = activeCategory ? (CATEGORY_LABEL[activeCategory] ?? activeCategory) : scanLabels[tab];
                exportToXlsx(rows, label, isNasiBox);
              }}
              className="flex items-center gap-1.5 mr-4 px-3 py-1.5 text-xs font-medium text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
            >
              <Download size={13} />
              Export Excel
            </button>
          </div>

          {(() => {
            const currentTab = hasReceptionEvent ? activeTab : "CHURCH";
            const byTab = attendances.filter((a) => a.barcodeType === currentTab);
            const tabCategories = [...new Set(byTab.map((a) => a.guest.invitationCategory))];
            const filtered = activeCategory ? byTab.filter((a) => a.guest.invitationCategory === activeCategory) : byTab;
            if (byTab.length === 0) {
              return (
                <div className="p-10 text-center">
                  <p className="text-stone-400 text-sm">Belum ada tamu yang check-in di {scanLabels[currentTab]}.</p>
                </div>
              );
            }
            return (
              <>
                {tabCategories.length > 1 && (
                  <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-stone-100">
                    <button
                      onClick={() => setActiveCategory(null)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                        activeCategory === null
                          ? "bg-stone-800 text-white"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      Semua ({byTab.length})
                    </button>
                    {tabCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                          activeCategory === cat
                            ? "bg-stone-800 text-white"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                        }`}
                      >
                        {CATEGORY_LABEL[cat] ?? cat} ({byTab.filter((a) => a.guest.invitationCategory === cat).length})
                      </button>
                    ))}
                  </div>
                )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-stone-100 text-left bg-stone-50">
                      <th className="px-4 py-3 text-stone-500 font-medium sticky left-0 bg-stone-50 z-10 border-r border-stone-100">Nama Tamu</th>
                      <th className="px-4 py-3 text-stone-500 font-medium">No</th>
                      <th className="px-4 py-3 text-stone-500 font-medium">WhatsApp</th>
                      <th className="px-4 py-3 text-stone-500 font-medium">Waktu Kedatangan</th>
                      <th className="px-4 py-3 text-stone-500 font-medium">Pax</th>
                      <th className="px-4 py-3 text-stone-500 font-medium">Actual Pax</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {filtered.map((att, i) => (
                      <tr key={att.id} className="hover:bg-stone-50 group">
                        <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-stone-50 z-10 border-r border-stone-100">
                          <p className="font-medium text-stone-800">{att.guest.name}</p>
                          <p className="text-xs text-stone-400">{CATEGORY_LABEL[att.guest.invitationCategory]}</p>
                        </td>
                        <td className="px-4 py-3 text-stone-400">{i + 1}</td>
                        <td className="px-4 py-3 text-stone-600 text-xs">{att.guest.phone || "—"}</td>
                        <td className="px-4 py-3 text-stone-600 text-xs font-mono whitespace-nowrap">
                          {formatArrivalTime(att.arrivedAt)}
                        </td>
                        <td className="px-4 py-3 text-stone-600 text-center">{att.guest.maxPax}</td>
                        <td className="px-4 py-3">
                          <select
                            value={att.actualPax}
                            onChange={(e) => updateActualPax(att.id, Number(e.target.value))}
                            disabled={loadingPax === att.id}
                            className="border border-stone-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                          >
                            {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
