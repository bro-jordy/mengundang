"use client";

import { signOut } from "next-auth/react";
import { LogOut, ChevronDown, Menu } from "lucide-react";
import { useState } from "react";

interface Props {
  user: {
    name?: string | null;
    email?: string | null;
  };
  onMenuToggle?: () => void;
}

export function AdminTopBar({ user, onMenuToggle }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <header className="h-14 bg-white border-b border-stone-200 flex items-center justify-between px-4 md:px-6 shrink-0">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded text-stone-500 hover:text-stone-800 hover:bg-stone-100"
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>

      <div className="hidden lg:block" />

      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-sm text-stone-700 hover:text-stone-900"
        >
          <div className="w-7 h-7 rounded-full bg-stone-800 text-white flex items-center justify-center text-xs font-bold">
            {user.name?.[0]?.toUpperCase() ?? "A"}
          </div>
          <span className="hidden sm:inline">{user.name}</span>
          <ChevronDown size={14} />
        </button>

        {open && (
          <div className="absolute right-0 top-10 bg-white border border-stone-200 rounded-lg shadow-lg w-44 py-1 z-50">
            <div className="px-3 py-2 border-b border-stone-100">
              <p className="text-xs text-stone-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={14} />
              Keluar
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
