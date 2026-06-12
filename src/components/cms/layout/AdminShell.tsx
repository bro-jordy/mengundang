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
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#0a0a0a", fontFamily: "'IBM Plex Sans', Arial, sans-serif" }}
    >
      {/* Watermark logo */}
      <div
        className="fixed inset-0 pointer-events-none select-none flex items-center justify-center overflow-hidden"
        style={{ zIndex: 0 }}
      >
        <img
          src="/logo.png"
          alt=""
          draggable={false}
          style={{ width: 560, height: 560, opacity: 0.07 }}
        />
      </div>

      {isSuperAdmin && sidebarOpen && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)" }}
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

      <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ position: "relative", zIndex: 1 }}>
        <AdminTopBar
          user={user}
          onMenuToggle={isSuperAdmin ? () => setSidebarOpen((v) => !v) : undefined}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
