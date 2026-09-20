import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { routing } from "@/i18n/routing"

const AUTH_ONLY_ROUTES = ["/login", "/signup"]
const PUBLIC_ROUTE_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/invite",
  // The recovery-link continuation page: reached while deliberately
  // unauthenticated (it's the step that establishes the session via
  // exchangeCodeForSession/verifyOtp), so it must not be treated as a
  // protected route or the guard below bounces it straight to /login
  // before it ever gets to run.
  "/confirm",
]

function splitLocale(pathname: string) {
  const [, maybeLocale, ...rest] = pathname.split("/")
  const locale = routing.locales.find((l) => l === maybeLocale)
  if (!locale) return { locale: routing.defaultLocale, pathWithoutLocale: pathname }
  const pathWithoutLocale = `/${rest.join("/")}`.replace(/\/$/, "") || "/"
  return { locale, pathWithoutLocale }
}

function isPublicRoute(pathWithoutLocale: string) {
  if (pathWithoutLocale === "/") return true
  return PUBLIC_ROUTE_PREFIXES.some(
    (prefix) =>
      pathWithoutLocale === prefix || pathWithoutLocale.startsWith(`${prefix}/`)
  )
}

/**
 * Refreshes the Supabase session and applies route guards, writing cookies
 * onto `response` — which may already carry next-intl's locale rewrite, so
 * this never constructs a fresh NextResponse of its own.
 */
export async function updateSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and supabase.auth.getClaims().
  // A simple mistake could make it very hard to debug issues with users
  // being randomly logged out.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  const { locale, pathWithoutLocale } = splitLocale(request.nextUrl.pathname)

  if (!user && !isPublicRoute(pathWithoutLocale)) {
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/login`
    url.searchParams.set("next", pathWithoutLocale)
    return NextResponse.redirect(url)
  }

  if (user && AUTH_ONLY_ROUTES.includes(pathWithoutLocale)) {
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}`
    url.search = ""
    return NextResponse.redirect(url)
  }

  // The marketing page has nothing for a signed-in visitor — send them
  // straight to their hives instead. Doing this here (rather than inside
  // the page itself, which is where this check used to live) means the
  // page component no longer has any session-dependent branch, so it can
  // be fully static instead of running the session check + a DB query on
  // every single logged-out visit too.
  if (user && pathWithoutLocale === "/") {
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/hives`
    url.search = ""
    return NextResponse.redirect(url)
  }

  // IMPORTANT: return `response` as-is (aside from the redirects above). It
  // carries next-intl's locale rewrite/cookie plus the refreshed auth
  // cookies — replacing it risks dropping either and desyncing the client
  // and server sessions.
  return response
}
