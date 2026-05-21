"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ClientStatusBadge } from "./ClientStatusBadge";
import type { ClientStatus } from "@/types/prisma.types";
import { ExternalLink, ArrowLeft } from "lucide-react";

interface Client {
  id: string;
  name: string;
  slug: string;
  status: ClientStatus;
}

const tabs = [
  { label: "Overview", path: "" },
  { label: "Profil", path: "/profile" },
  { label: "Acara", path: "/events" },
  { label: "Tamu", path: "/guests" },
  { label: "RSVP", path: "/rsvp" },
  { label: "Ucapan", path: "/wishes" },
  { label: "Galeri", path: "/gallery" },
  { label: "Tema", path: "/theme" },
  { label: "Gift", path: "/gifts" },
  { label: "WhatsApp", path: "/whatsapp" },
];

export function ClientNav({ client }: { client: Client }) {
  const pathname = usePathname();
  const base = `/admin/clients/${client.id}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/clients" className="text-stone-400 hover:text-stone-600">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-stone-800">{client.name}</h1>
              <ClientStatusBadge status={client.status} />
            </div>
            <p className="text-stone-400 text-xs font-mono">/invite/{client.slug}</p>
          </div>
        </div>

        <a
          href={`/invite/${client.slug}?preview=1`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 border border-stone-300 text-stone-600 text-xs px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors"
        >
          <ExternalLink size={12} />
          Preview
        </a>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-stone-200">
        {tabs.map((tab) => {
          const href = `${base}${tab.path}`;
          const active =
            tab.path === ""
              ? pathname === base
              : pathname.startsWith(href);

          return (
            <Link
              key={tab.path}
              href={href}
              className={cn(
                "px-3 py-2 text-sm rounded-t-lg whitespace-nowrap transition-colors",
                active
                  ? "text-stone-800 border-b-2 border-stone-800 font-medium"
                  : "text-stone-500 hover:text-stone-700"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
