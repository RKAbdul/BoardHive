import "server-only"
import { createClient } from "@/lib/supabase/server"

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
  const supabase = await createClient()
  const { data, error } = await supabase.storage.from("avatars").createSignedUrl(path, 3600)
  if (error) return null
  return data.signedUrl
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
  const { data, error } = await supabase.storage.from("avatars").createSignedUrls(uniquePaths, 3600)
  if (error) return new Map<string, string>()

  const map = new Map<string, string>()
  for (const entry of data) {
    if (entry.path && entry.signedUrl) map.set(entry.path, entry.signedUrl)
  }
  return map
}
