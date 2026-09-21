import "server-only"
import { unstable_cache } from "next/cache"
import { createClient } from "@/lib/supabase/server"

// A fresh signed URL — and its query-string token — is generated on every
// call, which defeats the browser's own HTTP cache for the image bytes
// even though nothing changed: same file, different URL, forced re-fetch
// every render. Caching the signed URL itself makes repeat requests for
// the same file return the identical URL, so the browser can actually
// cache the image, and it cuts the Storage round-trip these functions
// would otherwise make on every render.
//
// Unlike play photos, an avatar's path is reused on every upload (upsert
// to a fixed `${userId}/avatar`), so the cached URL genuinely can go
// stale when someone replaces their photo. Rather than wiring up manual
// invalidation for that, this just keeps the window short — a replaced
// avatar reaching every other page within a few minutes is a perfectly
// normal, unremarkable thing for an app this size, and it's simpler and
// harder to get wrong than tag-based busting.
const AVATAR_URL_TTL_SECONDS = 300

export async function getProfileStats(userId: string) {
  const supabase = await createClient()

  const [{ count: hivesCount }, { data: participantRows, error }] = await Promise.all([
    supabase.from("group_members").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("play_participants").select("is_winner").eq("user_id", userId),
  ])

  if (error) throw error

  const totalPlays = participantRows?.length ?? 0
  const totalWins = participantRows?.filter((p) => p.is_winner).length ?? 0

  return {
    hivesCount: hivesCount ?? 0,
    totalPlays,
    totalWins,
    winRate: totalPlays > 0 ? totalWins / totalPlays : 0,
  }
}

export async function getAvatarSignedUrl(path: string | null) {
  if (!path) return null

  // createClient() reads cookies() — not allowed inside an unstable_cache
  // scope (throws at runtime, not at build time). Resolving it outside the
  // cached callback fixes it: the callback only ever touches the
  // already-built client, never cookies() itself.
  const supabase = await createClient()

  return unstable_cache(
    async () => {
      const { data, error } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 3600)
      return error ? null : data.signedUrl
    },
    ["avatar-signed-url", path],
    { revalidate: AVATAR_URL_TTL_SECONDS }
  )()
}

/**
 * Batched form of getAvatarSignedUrl for lists (e.g. a members roster) —
 * one storage round-trip instead of one per row. Keyed by the original
 * storage path so callers can look up each member's URL by their
 * profile.avatar_url.
 */
export async function getAvatarSignedUrls(paths: (string | null)[]) {
  const uniquePaths = [...new Set(paths.filter((p): p is string => !!p))]
  if (uniquePaths.length === 0) return new Map<string, string>()

  const supabase = await createClient()

  const entries = await unstable_cache(
    async () => {
      const { data, error } = await supabase.storage.from("avatars").createSignedUrls(uniquePaths, 3600)
      if (error) return []
      return data.map((d) => ({ path: d.path, signedUrl: d.signedUrl }))
    },
    ["avatar-signed-urls", ...uniquePaths.sort()],
    { revalidate: AVATAR_URL_TTL_SECONDS }
  )()

  const map = new Map<string, string>()
  for (const entry of entries) {
    if (entry.path && entry.signedUrl) map.set(entry.path, entry.signedUrl)
  }
  return map
}
