import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

// Rutas accesibles sin sesión. /api/cron se protege con CRON_SECRET en el
// propio route handler; /offline y /sw.js los precarga el service worker.
const PUBLIC_PREFIXES = [
  "/login",
  "/_next",
  "/manifest",
  "/icons",
  "/favicon",
  "/offline",
  "/sw.js",
  "/api/cron",
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const valid = token ? await verifySessionToken(token) : false;

  if (!valid) {
    // Las APIs responden 401 en vez de redirigir a una página HTML.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|offline|icons|apple-touch-icon.png|robots.txt).*)",
  ],
};
