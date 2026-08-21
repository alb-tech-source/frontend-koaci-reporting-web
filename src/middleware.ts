import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIX = "/admin";

export function middleware(request: NextRequest) {
  const userRole = request.cookies.get("user_role")?.value;
  const path = request.nextUrl.pathname;

  if (path === "/" && userRole) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  if (!userRole && path.startsWith(PROTECTED_PREFIX)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/unauthorized"],
};