"use server"

import { headers } from "next/headers"
import { redirect as redirectPlain } from "next/navigation"
import type { EmailOtpType } from "@supabase/supabase-js"
import { getLocale, getTranslations } from "next-intl/server"
import { redirect } from "@/i18n/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  getForgotPasswordSchema,
  getLoginSchema,
  getResetPasswordSchema,
  getSignupSchema,
  type ActionState,
} from "./schemas"

async function getOrigin() {
  const h = await headers()
  const proto = h.get("x-forwarded-proto") ?? "https"
  const host = h.get("host")
  return `${proto}://${host}`
}

export async function signup(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: "validation" })
  const authT = await getTranslations({ locale, namespace: "auth.signup" })

  const validated = getSignupSchema(t).safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors }
  }

  const { displayName, email, password } = validated.data
  const supabase = await createClient()
  const origin = await getOrigin()

  // The confirmation email's actual link is built entirely by the "Confirm
  // signup" template in the Supabase dashboard now (token_hash straight to
  // our own /confirm page — see confirmAuthLink), not from this value, so
  // it's no longer substituted into anything the user sees. Kept anyway:
  // Supabase still validates it against the project's allow-listed Redirect
  // URLs at request time, and removing it hasn't been verified safe against
  // the live signUp call.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${origin}/${locale}`,
    },
  })

  if (error) {
    if (error.code === "user_already_exists") {
      return { fieldErrors: { email: [authT("emailTaken")] } }
    }
    return { error: error.message }
  }

  // Email confirmation is required before a session exists.
  if (data.user && !data.session) {
    return { success: true }
  }

  redirect({ href: "/", locale })
  return null
}

export async function login(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: "validation" })
  const authT = await getTranslations({ locale, namespace: "auth.login" })

  const validated = getLoginSchema(t).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(validated.data)

  if (error) {
    return { error: authT("invalidCredentials") }
  }

  const next = formData.get("next")
  const href = typeof next === "string" && next.startsWith("/") ? next : "/"
  redirect({ href, locale })
  return null
}

export async function logout() {
  const locale = await getLocale()
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect({ href: "/login", locale })
}

export async function requestPasswordReset(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: "validation" })

  const validated = getForgotPasswordSchema(t).safeParse({
    email: formData.get("email"),
  })

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const origin = await getOrigin()

  // Errors here are not surfaced to the caller (avoids confirming which
  // emails have accounts); the UI always shows the same "check your email"
  // state regardless of outcome.
  //
  // Same as signup's emailRedirectTo above: the "Reset Password" template
  // now builds its link directly (token_hash straight to our own /confirm
  // page), so this value isn't substituted into anything the user sees —
  // kept only because Supabase still validates it against the allow-listed
  // Redirect URLs at request time.
  await supabase.auth.resetPasswordForEmail(validated.data.email, {
    redirectTo: `${origin}/${locale}/reset-password`,
  })

  return { success: true }
}

export async function resetPassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: "validation" })

  const validated = getResetPasswordSchema(t).safeParse({
    password: formData.get("password"),
  })

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: validated.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect({ href: "/", locale })
  return null
}

// Verifies the token from our own email templates (they link straight here
// with token_hash — see the Confirm signup / Reset Password templates in
// the Supabase dashboard, not Supabase's own hosted /verify redirect flow).
// Only reached by an explicit button click on the /confirm page, which is
// what keeps an email client's own link-safety prescan from silently
// consuming the single-use token before the real click. `next` is already a
// locale-prefixed path built server-side by the action that originated the
// email link, so this uses a plain (non-locale-rewriting) redirect to avoid
// double-prefixing it.
export async function confirmAuthLink(tokenHash: string, type: EmailOtpType, next: string) {
  const locale = await getLocale()
  const supabase = await createClient()

  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

  if (error) {
    // otp_expired covers both "actually expired" and "already used" — for a
    // signup confirmation specifically, Supabase confirms the account the
    // instant a verifyOtp call succeeds against it, and a second attempt
    // against the same token always fails this way. So if that second
    // attempt is what's happening here, the account is fine; the user just
    // needs to log in rather than reuse a dead link. Other types (recovery,
    // etc.) genuinely need a fresh link, since the token IS what grants the
    // follow-up action there.
    const reason = type === "signup" && error.code === "otp_expired" ? "link_already_used" : "invalid_link"
    redirect({ href: `/login?error=${reason}`, locale })
    return
  }

  const href = next.startsWith("/") && !next.startsWith("//") ? next : "/"
  redirectPlain(href)
}
