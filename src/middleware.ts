import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authSecureCookies, publicAppUrl } from "@/lib/auth-env";

function requestOrigin(req: NextRequest): string {
  return publicAppUrl() ?? req.nextUrl.origin;
}

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: authSecureCookies(),
  });
  const isLoggedIn = !!token;
  const pathname = req.nextUrl.pathname;
  const isLogin = pathname.startsWith("/login");
  const isApiAuth = pathname.startsWith("/api/auth");
  const isPublic =
    pathname.startsWith("/_next") ||
    pathname === "/sw.js" ||
    pathname.startsWith("/templates/") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/api/v1/health";

  if (isApiAuth || isPublic) return NextResponse.next();

  if (!isLoggedIn && !isLogin) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "غير مصرح" } },
        { status: 401 },
      );
    }
    return NextResponse.redirect(new URL("/login", requestOrigin(req)));
  }

  if (isLoggedIn && isLogin) {
    return NextResponse.redirect(new URL("/", requestOrigin(req)));
  }

  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (authSecureCookies()) {
    res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
