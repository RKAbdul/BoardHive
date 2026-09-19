import { NextResponse, type NextRequest } from "next/server"
import createIntlMiddleware from "next-intl/middleware"
import { routing } from "@/i18n/routing"
import { updateSession } from "@/lib/supabase/proxy"

const intlMiddleware = createIntlMiddleware(routing)

export async function proxy(request: NextRequest) {
  // Supabase auth email links (confirmation, password recovery) point here.
  // Keep it locale-agnostic: the route handler manages its own redirect.
  if (request.nextUrl.pathname.startsWith("/auth/")) {
    return NextResponse.next()
  }

  const intlResponse = intlMiddleware(request)

  // A missing locale prefix gets redirected to add one (e.g. "/" -> "/en").
  // Let that happen on its own; auth guards apply once the follow-up
  // request lands on a locale-prefixed path.
  if (intlResponse.headers.get("location")) {
    return intlResponse
  }

  return await updateSession(request, intlResponse)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public asset extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
