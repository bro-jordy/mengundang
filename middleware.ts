import { NextRequest, NextResponse } from "next/server";

const EVENT_SUBDOMAINS = new Set(["pernikahan", "lamaran", "sangjit"]);

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const subdomain = hostname.split(".")[0];

  if (!EVENT_SUBDOMAINS.has(subdomain)) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  const token = pathname.slice(1); // strip leading /

  if (!token) {
    return NextResponse.redirect(
      new URL("/", `${request.nextUrl.protocol}//${hostname}`)
    );
  }

  const url = request.nextUrl.clone();
  url.pathname = `/invite/${subdomain}/g/${token}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
