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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${origin}/auth/confirm?next=/${locale}`,
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
  await supabase.auth.resetPasswordForEmail(validated.data.email, {
    redirectTo: `${origin}/auth/confirm?type=recovery&next=/${locale}/reset-password`,
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

// Verifies the token deferred from app/auth/confirm/route.ts — only reached
// by an explicit user click (see that file for why the GET itself doesn't
// verify). `tokenHash`/`type` are single-use, so this can only ever
// meaningfully succeed once; `next` is already a locale-prefixed path built
// server-side by the action that originated the email link, so this uses a
// plain (non-locale-rewriting) redirect to avoid double-prefixing it.
export async function confirmAuthLink(
  tokenHash: string | null,
  code: string | null,
  type: EmailOtpType,
  next: string
) {
  const locale = await getLocale()
  const supabase = await createClient()

  // A real recovery/confirmation link always carries a `code` (PKCE, the
  // default flow for @supabase/ssr) or a `token_hash` (implicit/OTP flow) —
  // there's no legitimate link with neither, so that case is invalid rather
  // than a variant to silently pass through.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      redirect({ href: "/login?error=invalid_link", locale })
      return
    }
  } else if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

    if (error) {
      redirect({ href: "/login?error=invalid_link", locale })
      return
    }
  } else {
    redirect({ href: "/login?error=invalid_link", locale })
    return
  }

  const href = next.startsWith("/") && !next.startsWith("//") ? next : "/"
  redirectPlain(href)
}
