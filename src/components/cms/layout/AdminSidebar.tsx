"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, LayoutDashboard, Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ALL_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true, superAdminOnly: false },
  { href: "/admin/clients", label: "Client", icon: Heart, superAdminOnly: false },
  { href: "/admin/users", label: "Pengguna", icon: Users, superAdminOnly: true },
];

interface Props {
  role?: string;
  onClose?: () => void;
}

export function AdminSidebar({ role, onClose }: Props) {
  const pathname = usePathname();
  const navItems = ALL_NAV.filter((item) => !item.superAdminOnly || role === "SUPERADMIN");

  return (
    <aside className="w-64 h-full bg-white border-r border-stone-200 flex flex-col shrink-0">
      <div className="h-14 flex items-center justify-between px-4 border-b border-stone-200">
        <span className="font-bold text-stone-800 text-sm">Mengundang</span>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active ? "bg-stone-800 text-white" : "text-stone-600 hover:bg-stone-100"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-stone-200">
        <p className="text-xs text-stone-400 text-center">v1.0.0</p>
      </div>
    </aside>
  );
}
