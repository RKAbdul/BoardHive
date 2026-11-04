import "server-only"
import { createClient } from "@/lib/supabase/server"
import { computeGameStats } from "./game-stats"

export async function getHiveStats(groupId: string) {
  const supabase = await createClient()
  const { data: plays, error } = await supabase
    .from("plays")
    .select(
      "id, game:games(bgg_id, name), participants:play_participants(user_id, guest_name, is_winner, profile:profiles(display_name))"
    )
    .eq("group_id", groupId)

  if (error) throw error

  const gameCounts = new Map<string, { bggId: number; name: string; count: number }>()
  const playerStats = new Map<string, { name: string; plays: number; wins: number }>()

  for (const play of plays) {
    if (play.game) {
      const key = String(play.game.bgg_id)
      const existing = gameCounts.get(key)
      gameCounts.set(key, {
        bggId: play.game.bgg_id,
        name: play.game.name,
        count: (existing?.count ?? 0) + 1,
      })
    }

    for (const p of play.participants) {
      const key = p.user_id ?? `guest:${p.guest_name}`
      const name = p.profile?.display_name ?? p.guest_name ?? "?"
      const existing = playerStats.get(key) ?? { name, plays: 0, wins: 0 }
      existing.plays += 1
      if (p.is_winner) existing.wins += 1
      playerStats.set(key, existing)
    }
  }

  const mostPlayed = [...gameCounts.values()].sort((a, b) => b.count - a.count).slice(0, 8)
  const standings = [...playerStats.values()]
    .map((p) => ({ ...p, winRate: p.plays > 0 ? p.wins / p.plays : 0 }))
    .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate)

  return {
    totalPlays: plays.length,
    mostPlayed,
    standings,
  }
}

export async function getGameStatsForHive(groupId: string, bggId: number) {
  const supabase = await createClient()
  const { data: plays, error } = await supabase
    .from("plays")
    .select(
      `id, mode, played_at, created_at,
       participants:play_participants(user_id, guest_name, is_winner, score, placement, faction:factions(id, name), profile:profiles(display_name))`
    )
    .eq("group_id", groupId)
    .eq("game_id", bggId)

  if (error) throw error
  return computeGameStats(plays)
}
