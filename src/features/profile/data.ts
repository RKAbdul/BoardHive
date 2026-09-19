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
