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
  clientType?: string;
}

const SUBDOMAIN: Record<string, string> = {
  WEDDING: "pernikahan",
  SANGJIT: "sangjit",
  LAMARAN: "lamaran",
};

function getInvitationUrl(clientType: string | undefined, slug: string) {
  const sub = SUBDOMAIN[clientType ?? ""] ?? "pernikahan";
  const domain = process.env.NEXT_PUBLIC_INVITATION_DOMAIN ?? "jordyrea.my.id";
  return `https://${sub}.${domain}/${slug}`;
}

const BASE_TABS = [
  { label: "Overview", path: "" },
  { label: "Acara", path: "/events" },
  { label: "Profil", path: "/profile" },
  { label: "Tamu", path: "/guests" },
  { label: "RSVP", path: "/rsvp" },
  { label: "Ucapan", path: "/wishes" },
  { label: "Galeri", path: "/gallery" },
  { label: "Musik", path: "/music" },
  { label: "Tema", path: "/theme" },
  { label: "Tampilan", path: "/sections" },
  { label: "Gift", path: "/gifts" },
  { label: "WhatsApp", path: "/whatsapp" },
  { label: "Kehadiran", path: "/attendance" },
];

const SUPERADMIN_TABS = [
  ...BASE_TABS,
  { label: "Pengguna", path: "/users" },
];

export function ClientNav({ client, role }: { client: Client; role?: string }) {
  const tabs = role === "SUPERADMIN" ? SUPERADMIN_TABS : BASE_TABS;
  const pathname = usePathname();
  const base = `/admin/clients/${client.id}`;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/clients" className="text-stone-400 hover:text-stone-600 shrink-0">
            <ArrowLeft size={16} />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base md:text-lg font-bold text-stone-800 truncate">{client.name}</h1>
              <ClientStatusBadge status={client.status} />
            </div>
            <p className="text-stone-400 text-xs font-mono truncate">{client.slug}</p>
          </div>
        </div>

        <a
          href={`/invite/${client.slug}?preview=1`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1.5 border border-stone-300 text-stone-600 text-xs px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors"
        >
          <ExternalLink size={12} />
          <span className="hidden sm:inline">Preview</span>
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
