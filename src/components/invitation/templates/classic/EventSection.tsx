"use client";

import { formatDate } from "@/lib/utils";
import { MapPin, Clock, Calendar } from "lucide-react";
import { CountdownTimer } from "../../sections/CountdownTimer";

const EVENT_LABEL = {
  EN: { AKAD: "Wedding Ceremony", PEMBERKATAN: "Church Wedding", RESEPSI: "Reception", AFTER_PARTY: "After Party", SANGJIT: "Sangjit", LAMARAN: "Engagement" },
  ID: { AKAD: "Akad Nikah", PEMBERKATAN: "Pemberkatan", RESEPSI: "Resepsi", AFTER_PARTY: "After Party", SANGJIT: "Sangjit", LAMARAN: "Lamaran" },
} as const;

const EVENT_T = {
  EN: { eyebrow: "Wedding Events", saveTheDate: "Save the Date", openMaps: "Open Google Maps" },
  ID: { eyebrow: "Acara Pernikahan", saveTheDate: "Simpan Tanggalnya", openMaps: "Buka Google Maps" },
} as const;

interface Event {
  id: string;
  type: string;
  label: string;
  date: Date | null;
  timeStart: string;
  timeEnd: string;
  venueName: string;
  venueAddress: string;
  mapsUrl: string;
}

function getMapEmbedUrl(mapsUrl: string, venueName: string, venueAddress: string): string {
  const coordMatch = mapsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch) return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&output=embed&z=17`;
  const qMatch = mapsUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return `https://maps.google.com/maps?q=${qMatch[1]},${qMatch[2]}&output=embed&z=17`;
  return `https://maps.google.com/maps?q=${encodeURIComponent(`${venueName} ${venueAddress}`.trim())}&output=embed&z=17`;
}

export function EventSection({ events, showMap, lang = "ID" }: { events: Event[]; showMap?: boolean; lang?: "EN" | "ID" }) {
  const t = EVENT_T[lang];
  const labels = EVENT_LABEL[lang];
  const firstEvent = events[0];

  return (
    <section className="py-20 px-6 bg-stone-50">
      <div className="max-w-lg mx-auto text-center">
        <p className="text-xs tracking-widest uppercase text-stone-400 mb-2">
          {t.eyebrow}
        </p>
        <h2 className="font-heading text-3xl text-stone-800 mb-10">
          {t.saveTheDate}
        </h2>

        {firstEvent?.date && (
          <CountdownTimer targetDate={firstEvent.date} />
        )}

        <div className="space-y-6 mt-10">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-2xl border border-stone-200 p-6 text-left"
            >
              <h3 className="font-heading text-xl text-stone-800 mb-4 text-center">
                {event.label || labels[event.type as keyof typeof labels] || event.type}
              </h3>

              <div className="space-y-3">
                {event.date && (
                  <div className="flex items-start gap-3">
                    <Calendar size={16} className="text-stone-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-stone-700">
                      {formatDate(event.date)}
                    </p>
                  </div>
                )}

                {(event.timeStart || event.timeEnd) && (
                  <div className="flex items-start gap-3">
                    <Clock size={16} className="text-stone-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-stone-700">
                      {event.timeStart}
                      {event.timeEnd && ` – ${event.timeEnd}`} WIB
                    </p>
                  </div>
                )}

                {event.venueName && (
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-stone-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-stone-700">
                        {event.venueName}
                      </p>
                      {event.venueAddress && (
                        <p className="text-xs text-stone-500 mt-0.5">
                          {event.venueAddress}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {showMap && event.mapsUrl && event.venueName && (
                <div className="mt-4 rounded-xl overflow-hidden border border-stone-200">
                  <iframe
                    src={getMapEmbedUrl(event.mapsUrl, event.venueName, event.venueAddress)}
                    width="100%" height="200"
                    style={{ display: "block", border: "none" }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={event.venueName}
                  />
                </div>
              )}
              {event.mapsUrl && (
                <a
                  href={event.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex items-center justify-center gap-2 border border-stone-300 rounded-full px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors w-full"
                >
                  <MapPin size={14} />
                  {t.openMaps}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
