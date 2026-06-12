import { auth } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const role = (req.auth?.user as any)?.role as string | undefined;
  const { pathname } = req.nextUrl;

  if (role !== "STAFF") return NextResponse.next();

  // STAFF: only allowed on overview and attendance sub-routes
  const clientMatch = pathname.match(/^\/admin\/clients\/([^/]+)(\/.*)?$/);
  if (clientMatch) {
    const clientId = clientMatch[1];
    const subPath = clientMatch[2] || "";

    if (subPath !== "" && !subPath.startsWith("/attendance")) {
      return NextResponse.redirect(
        new URL(`/admin/clients/${clientId}/attendance`, req.url)
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/clients/:path*"],
};
