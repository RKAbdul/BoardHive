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
  // Set by Supabase's own /verify endpoint when IT already rejected the
  // token (most commonly: something already consumed the single-use token
  // before this request — see the "already used" handling below).
  const supabaseErrorCode = searchParams.get("error_code")
  const next = searchParams.get("next") ?? `/${routing.defaultLocale}`

  // `next` is already locale-prefixed (e.g. "/es/reset-password") by
  // whichever action built the original email link, so error redirects and
  // the confirm page itself both stay at that same locale.
  const [, localeSegment] = next.split("/")
  const locale = routing.locales.includes(localeSegment as Locale)
    ? (localeSegment as Locale)
    : routing.defaultLocale

  if (!type || !isValidOtpType(type)) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=invalid_link`, request.url))
  }

  // A real link always carries a `code` (PKCE, the default @supabase/ssr
  // flow) or a `token_hash` (implicit/OTP flow) — there's no legitimate
  // link with neither, regardless of `type`.
  if (!tokenHash && !code) {
    // For a signup confirmation specifically, Supabase already performs the
    // actual confirmation (setting email_confirmed_at) the moment its own
    // /verify endpoint is hit — this leg only hands back a session. So if
    // something got there first (an email client's link-safety prescan is
    // the usual culprit — Gmail and Outlook both do this) and used up the
    // single-use token, the account is confirmed either way; the user just
    // needs to log in normally instead of via the now-dead link. Any other
    // type (recovery, magic link, etc.) genuinely needs a fresh link, since
    // the token IS the thing that grants the follow-up action there.
    const reason = type === "signup" && supabaseErrorCode ? "link_already_used" : "invalid_link"
    return NextResponse.redirect(new URL(`/${locale}/login?error=${reason}`, request.url))
  }

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

// Next.js serves HEAD requests through the GET handler above by default
// when no HEAD handler is defined — and a HEAD is exactly what a link
// scanner or an email client's own "is this safe" prescan sends. This
// route never consumes a token itself either way (see the comment above),
// but responding without touching the query string at all is the
// documented-safe pattern: https://github.com/supabase/agent-skills/issues/586
export function HEAD() {
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } })
}
