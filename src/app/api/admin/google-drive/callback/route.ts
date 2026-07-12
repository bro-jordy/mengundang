import { requireAuth } from "@/lib/auth/permissions";
import { connectGoogleDrive } from "@/lib/googleDrive";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const returnToCookie = req.headers.get("cookie")?.match(/gdrive_return_to=([^;]+)/)?.[1];
  const returnTo = returnToCookie ? decodeURIComponent(returnToCookie) : "/admin/clients";

  try {
    const session = await requireAuth();
    const userId = (session.user as { id: string }).id;
    if (!code) throw new Error("Kode otorisasi tidak ditemukan");

    await connectGoogleDrive(userId, code);

    const url = new URL(returnTo, req.url);
    url.searchParams.set("gdrive", "connected");
    const res = NextResponse.redirect(url);
    res.cookies.delete("gdrive_return_to");
    return res;
  } catch (err) {
    const url = new URL(returnTo, req.url);
    url.searchParams.set("gdrive", "error");
    url.searchParams.set("gdrive_message", err instanceof Error ? err.message : "Gagal menghubungkan Google Drive");
    return NextResponse.redirect(url);
  }
}
