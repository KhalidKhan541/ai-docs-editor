import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

const publicPaths = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/error",
  "/api/auth",
  "/api/search",
];

const apiPrefix = "/api/";

function isPublicPath(pathname: string): boolean {
  if (publicPaths.includes(pathname)) return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname === "/api/documents" && !pathname.includes("/api/documents/")) return false;

  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    if (pathname.startsWith("/api/auth") || pathname === "/api/search") {
      return NextResponse.next();
    }

    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", token.id as string);
    requestHeaders.set("x-user-email", token.email as string);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set("x-user-id", token.id as string);
  response.headers.set("x-user-email", token.email as string);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
