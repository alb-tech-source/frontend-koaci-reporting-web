import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";

const ADMIN_ROLES = new Set(["administrator", "super_admin", "management"]);
const PROTECTED_PREFIX = "/admin";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const path = request.nextUrl.pathname;

  // Sudah login tapi buka root ("/") -> lempar ke dashboard, jangan tampilkan login lagi
  if (path === "/" && token) {
    try {
      jwtDecode(token);
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    } catch {
      // token rusak, biarkan lanjut ke halaman login
    }
  }

  // Belum login, coba akses area admin -> lempar ke login
  if (!token && path.startsWith(PROTECTED_PREFIX)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (token && path.startsWith(PROTECTED_PREFIX)) {
    try {
      const decoded: any = jwtDecode(token);
      if (!ADMIN_ROLES.has(decoded.role)) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/unauthorized"],
};