import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
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
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && isLogin) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
