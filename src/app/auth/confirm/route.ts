import { type NextRequest, NextResponse } from "next/server"
import { routing, type Locale } from "@/i18n/routing"
import { isValidOtpType } from "@/features/auth/schemas"

// Kept outside the [locale] segment on purpose: this is the link target
// inside Supabase's auth emails (signup confirmation, password recovery),
// which next-intl's locale-prefix redirect would otherwise intercept.
//
// This route deliberately does NOT verify the token itself. Enterprise
// email security scanners (Microsoft Safe Links and similar) prefetch every
// link in an incoming email to scan it, which is a plain GET indistinguishable
// from a real click — and since Supabase's recovery/confirmation tokens are
// single-use, that silent prefetch consumes the token before the user ever
// clicks, so their real click then fails with "invalid or expired" even
// though the link was never actually broken. Supabase's documented fix is to
// not let a bare GET consume the token: forward it to a page that requires
// an explicit button click (a scanner fetches links, it doesn't click
// buttons) and verify only there. See:
// https://supabase.com/docs/guides/auth/auth-email-templates#email-prefetching
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get("token_hash")
  const code = searchParams.get("code")
  const type = searchParams.get("type")
  const next = searchParams.get("next") ?? `/${routing.defaultLocale}`

  if (!type || !isValidOtpType(type)) {
    return NextResponse.redirect(
      new URL(`/${routing.defaultLocale}/login?error=invalid_link`, request.url)
    )
  }

  // A real link always carries a `code` (PKCE, the default @supabase/ssr
  // flow) or a `token_hash` (implicit/OTP flow) — there's no legitimate
  // link with neither, regardless of `type`.
  if (!tokenHash && !code) {
    return NextResponse.redirect(
      new URL(`/${routing.defaultLocale}/login?error=invalid_link`, request.url)
    )
  }

  // `next` is already locale-prefixed (e.g. "/es/reset-password") by
  // whichever action built the original email link, so the confirm page
  // lives at that same locale.
  const [, localeSegment] = next.split("/")
  const locale = routing.locales.includes(localeSegment as Locale)
    ? (localeSegment as Locale)
    : routing.defaultLocale

  const confirmUrl = new URL(`/${locale}/confirm`, request.url)
  confirmUrl.searchParams.set("type", type)
  confirmUrl.searchParams.set("next", next)

  if (tokenHash) {
    confirmUrl.searchParams.set("token_hash", tokenHash)
  }

  if (code) {
    confirmUrl.searchParams.set("code", code)
  }

  return NextResponse.redirect(confirmUrl)
}
