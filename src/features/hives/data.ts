import "server-only"
import { cache } from "react"
import { createClient } from "@/lib/supabase/server"

export async function getHivesForUser(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("group_members")
    .select("role, joined_at, group:groups(id, name, created_at)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true })

  if (error) throw error
  return data
}

/**
 * Runs on every page load under the (app) shell (see (app)/layout.tsx) to
 * let the nav link Stats/Log straight into that one hive instead of through
 * the picker page — so it deliberately fetches only enough to answer "is it
 * exactly one" (a group_id column, capped at 2 rows) rather than reusing
 * getHivesForUser's full name/timestamp row, which the nav never renders.
 */
export async function getSoleHiveId(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId)
    .limit(2)

  if (error) throw error
  return data.length === 1 ? data[0].group_id : null
}

/**
 * RLS (`groups_select_members`) already scopes this to hives the caller
 * belongs to — a non-member gets an empty result here, not an error, which
 * is exactly what we want: the caller treats that identically to "doesn't
 * exist" (notFound()), never leaking which hive IDs are real.
 *
 * Wrapped in cache() because the hive layout (every page under a hive) and
 * some of those pages themselves (e.g. settings) both need this same row —
 * without it, that was two identical DB round trips on one request instead
 * of one.
 */
export const getHiveById = cache(async (groupId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("groups")
    .select("id, name, created_at, created_by")
    .eq("id", groupId)
    .maybeSingle()

  return data
})

export async function getHiveMemberCount(groupId: string) {
  const supabase = await createClient()
  const { count } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId)

  return count ?? 0
}

export async function getHiveMembers(groupId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("group_members")
    .select("user_id, role, joined_at, profile:profiles(display_name, avatar_url)")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true })

  if (error) throw error
  return data
}

/**
 * A single member's row, scoped to this hive — RLS (`group_members_select_members`)
 * only returns it if the caller shares the hive with them, so a stranger's
 * userId here resolves to null exactly like a non-member's would.
 */
export async function getHiveMember(groupId: string, userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("group_members")
    .select("user_id, role, joined_at, profile:profiles(display_name, avatar_url)")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle()

  return data
}

export async function getMemberHiveStats(groupId: string, userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("play_participants")
    .select("is_winner, plays!inner(group_id)")
    .eq("user_id", userId)
    .eq("plays.group_id", groupId)

  if (error) throw error

  const totalPlays = data.length
  const totalWins = data.filter((p) => p.is_winner).length

  return {
    totalPlays,
    totalWins,
    winRate: totalPlays > 0 ? totalWins / totalPlays : 0,
  }
}

export async function getMyRole(groupId: string, userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle()

  return data?.role ?? null
}

export async function getActiveInviteCode(groupId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("group_invites")
    .select("code")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return data?.code ?? null
}
