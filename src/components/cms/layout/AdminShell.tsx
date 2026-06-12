"use client";

import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";

interface Props {
  role?: string;
  user: { name?: string | null; email?: string | null };
  children: React.ReactNode;
}

export function AdminShell({ role, user, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isSuperAdmin = role === "SUPERADMIN";

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden">
      {isSuperAdmin && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {isSuperAdmin && (
        <div
          className={[
            "fixed inset-y-0 left-0 z-30 transition-transform duration-300 ease-in-out",
            "lg:relative lg:translate-x-0 lg:transition-none",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <AdminSidebar role={role} onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AdminTopBar
          user={user}
          onMenuToggle={isSuperAdmin ? () => setSidebarOpen((v) => !v) : undefined}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
