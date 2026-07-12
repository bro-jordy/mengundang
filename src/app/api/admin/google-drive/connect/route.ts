import { requireAuth } from "@/lib/auth/permissions";
import { getGoogleAuthUrl } from "@/lib/googleDrive";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(req.url);
    const returnTo = searchParams.get("returnTo") || "/admin/clients";

    const url = getGoogleAuthUrl(userId);
    const res = NextResponse.redirect(url);
    res.cookies.set("gdrive_return_to", returnTo, { httpOnly: true, maxAge: 600, path: "/" });
    return res;
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}
