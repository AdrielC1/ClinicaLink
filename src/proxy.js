import { NextResponse } from "next/server";

// Mapping role → prefix URL yang diizinkan
const ROLE_ROUTES = {
  admin: "/admin",
  doctor: "/doctor",
  patient: "/patient",
};

// URL yang hanya boleh diakses ketika BELUM login
const PUBLIC_ONLY_ROUTES = ["/login", "/register"];

// URL yang perlu autentikasi (mulai dengan /admin, /doctor, atau /patient)
const PROTECTED_PREFIXES = Object.values(ROLE_ROUTES);

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Ambil role dari cookie (ditulis saat login, lebih cepat dari query DB)
  const roleCookie = request.cookies.get("clinicalink_role")?.value;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // 1. Belum login (tidak ada cookie role) dan mencoba akses halaman protected
  if (isProtected && !roleCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 2. Sudah login dan mencoba akses halaman protected
  if (isProtected && roleCookie) {
    const allowedPrefix = ROLE_ROUTES[roleCookie];

    // Jika URL tidak cocok dengan role → tendang ke dashboard yang benar
    if (allowedPrefix && !pathname.startsWith(allowedPrefix)) {
      const url = request.nextUrl.clone();
      url.pathname = `${allowedPrefix}/dashboard`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Jalankan proxy di semua path kecuali file statis dan API
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
