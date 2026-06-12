"use client";

import { signOut } from "next-auth/react";
import { LogOut, Menu } from "lucide-react";

interface Props {
  user: {
    name?: string | null;
    email?: string | null;
  };
  onMenuToggle?: () => void;
}

export function AdminTopBar({ user, onMenuToggle }: Props) {
  return (
    <header
      className="h-14 flex items-center justify-between px-4 md:px-6 shrink-0"
      style={{
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        fontFamily: "'IBM Plex Sans', Arial, sans-serif",
      }}
    >
      {onMenuToggle ? (
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded transition-colors"
          style={{ color: "#64748b" }}
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-3 ml-auto">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{
              background: "linear-gradient(135deg, #D4A85C, #a8752d)",
              color: "#0a0a0a",
            }}
          >
            {user.name?.[0]?.toUpperCase() ?? "A"}
          </div>
          <span className="hidden sm:inline text-sm font-medium" style={{ color: "#374151" }}>
            {user.name}
          </span>
        </div>

        <div style={{ width: "1px", height: "20px", background: "#e2e8f0" }} />

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 text-sm rounded-lg px-3 py-1.5 transition-colors"
          style={{ color: "#64748b" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#ef4444";
            (e.currentTarget as HTMLElement).style.background = "#fef2f2";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#64748b";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
}
