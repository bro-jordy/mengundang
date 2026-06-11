import { auth } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

const MAIN_DOMAIN = "jordyrea.my.id";

export default auth((req) => {
  const hostname = req.nextUrl.hostname;
  const isSubdomain =
    hostname !== MAIN_DOMAIN && hostname.endsWith(`.${MAIN_DOMAIN}`);

  if (isSubdomain) {
    const slug = req.nextUrl.pathname.slice(1);
    if (slug && !slug.startsWith("_next") && !slug.startsWith("api")) {
      const url = req.nextUrl.clone();
      url.pathname = `/invite/${slug}`;
      return NextResponse.rewrite(url);
    }
  }

  const isLoggedIn = !!req.auth;
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  const isLoginPage = req.nextUrl.pathname === "/login";

  if (isAdminRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
