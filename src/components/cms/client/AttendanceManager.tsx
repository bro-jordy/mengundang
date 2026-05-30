"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Camera, CameraOff, Users, UserCheck, QrCode, RefreshCw } from "lucide-react";

interface Guest {
  id: string;
  name: string;
  phone: string | null;
  maxPax: number;
  invitationCategory: "GEREJA_SAJA" | "GEREJA_RESEPSI";
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
  totalActualPax: number;
  totalGerejaOnly: number;
  totalGerejaResepsi: number;
}

interface Props {
  clientId: string;
  initialAttendances: AttendanceRow[];
  initialStats: Stats;
}

const CATEGORY_LABEL: Record<string, string> = {
  GEREJA_SAJA: "Gereja Saja",
  GEREJA_RESEPSI: "Gereja + Resepsi",
};

const BARCODE_TYPE_LABEL: Record<string, string> = {
  CHURCH: "Gereja",
  RECEPTION: "Resepsi",
};

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

type ScanResult =
  | { type: "success"; guestName: string; barcodeType: string }
  | { type: "already"; guestName: string; arrivedAt: string }
  | { type: "error"; message: string };

export function AttendanceManager({ clientId, initialAttendances, initialStats }: Props) {
  const [attendances, setAttendances] = useState<AttendanceRow[]>(initialAttendances);
  const [stats, setStats] = useState<Stats>(initialStats);
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
    } else if (data.alreadyCheckedIn) {
      setScanResult({
        type: "already",
        guestName: data.guest?.name || "Tamu",
        arrivedAt: formatArrivalTime(data.arrivedAt),
      });
    } else if (data.success) {
      setScanResult({
        type: "success",
        guestName: data.attendance?.guest?.name || "Tamu",
        barcodeType: BARCODE_TYPE_LABEL[data.barcodeType] || data.barcodeType,
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
      setStats((prev) => ({ ...prev, totalActualPax: prev.totalActualPax - (attendances.find(a => a.id === attendanceId)?.actualPax ?? 0) + actualPax }));
    }
    setLoadingPax(null);
  }

  const statCards = [
    { label: "Total Undangan", value: stats.totalGuests, color: "bg-stone-50 text-stone-700" },
    { label: "Total Hadir", value: stats.totalHadir, color: "bg-green-50 text-green-700" },
    { label: "Total Pax Undangan", value: stats.totalPaxUndangan, color: "bg-blue-50 text-blue-700" },
    { label: "Total Actual Pax", value: stats.totalActualPax, color: "bg-indigo-50 text-indigo-700" },
    { label: "Tamu Gereja Saja", value: stats.totalGerejaOnly, color: "bg-sky-50 text-sky-700" },
    { label: "Tamu Gereja + Resepsi", value: stats.totalGerejaResepsi, color: "bg-purple-50 text-purple-700" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-xs font-medium opacity-70">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

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
            className="flex items-center gap-2 bg-stone-800 text-white px-4 py-2.5 rounded-xl text-sm hover:bg-stone-700 transition-colors"
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
                  <p className="font-medium text-yellow-800">Sudah Check-in</p>
                  <p className="text-sm text-yellow-700 mt-0.5">
                    <strong>{scanResult.guestName}</strong> sudah melakukan check-in pada {scanResult.arrivedAt}.
                  </p>
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

      {/* Attendance table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
          <Users size={16} className="text-stone-500" />
          <h3 className="font-medium text-stone-800 text-sm">
            Daftar Kehadiran ({attendances.length} check-in)
          </h3>
        </div>

        {attendances.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-stone-400 text-sm">Belum ada tamu yang check-in.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-left bg-stone-50">
                  <th className="px-4 py-3 text-stone-500 font-medium">No</th>
                  <th className="px-4 py-3 text-stone-500 font-medium">Nama Tamu</th>
                  <th className="px-4 py-3 text-stone-500 font-medium">WhatsApp</th>
                  <th className="px-4 py-3 text-stone-500 font-medium">Waktu Kedatangan</th>
                  <th className="px-4 py-3 text-stone-500 font-medium">Pax Undangan</th>
                  <th className="px-4 py-3 text-stone-500 font-medium">Actual Pax</th>
                  <th className="px-4 py-3 text-stone-500 font-medium">Kategori</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {attendances.map((att, i) => (
                  <tr key={att.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3 text-stone-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-stone-800">{att.guest.name}</p>
                      <p className="text-xs text-stone-400">{BARCODE_TYPE_LABEL[att.barcodeType]}</p>
                    </td>
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
                        className="border border-stone-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:opacity-50"
                      >
                        {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-50 text-purple-700">
                        {CATEGORY_LABEL[att.guest.invitationCategory]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
