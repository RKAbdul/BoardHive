import "server-only"
import { cache } from "react"
import { getLocale } from "next-intl/server"
import { redirect } from "@/i18n/navigation"
import { createClient } from "@/lib/supabase/server"

/**
 * Verifies the current session against Supabase's public keys (never trusts
 * a cookie value alone) and memoizes the result for the duration of one
 * render pass. Every Server Component / Server Action that needs "who is
 * this" should go through this, not a raw supabase.auth call — it's the
 * single place authorization logic lives.
 */
export const verifySession = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims) {
    return null
  }

  return { userId: data.claims.sub as string }
})

export const requireSession = cache(async (): Promise<{ userId: string }> => {
  const session = await verifySession()
  if (session) return session

  const locale = await getLocale()
  redirect({ href: "/login", locale })
  throw new Error("unreachable")
})

export const getCurrentProfile = cache(async () => {
  const session = await verifySession()
  if (!session) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", session.userId)
    .single()

  return data
})
