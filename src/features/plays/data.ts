import "server-only"
import { unstable_cache } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function getRecentPlaysForHive(groupId: string, limit = 5) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("plays")
    .select(
      "id, played_at, notes, game:games(bgg_id, name, image_url), participants:play_participants(id, user_id, guest_name, is_winner, profile:profiles(display_name))"
    )
    .eq("group_id", groupId)
    .order("played_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function getRecentPlaysForGameInHive(groupId: string, bggId: number, limit = 3) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("plays")
    .select(
      "id, played_at, participants:play_participants(id, user_id, guest_name, is_winner, profile:profiles(display_name))"
    )
    .eq("group_id", groupId)
    .eq("game_id", bggId)
    .order("played_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function getPlaysForHive(groupId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("plays")
    .select(
      "id, played_at, notes, game:games(bgg_id, name, image_url), participants:play_participants(id, user_id, guest_name, is_winner, profile:profiles(display_name))"
    )
    .eq("group_id", groupId)
    .order("played_at", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getPlayById(playId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("plays")
    .select(
      `id, group_id, played_at, notes, logged_by, mode,
       game:games(bgg_id, name, image_url, min_players, max_players),
       participants:play_participants(id, user_id, guest_name, score, placement, is_winner, faction:factions(id, name), profile:profiles(display_name, avatar_url)),
       comments(id, user_id, body, created_at, updated_at, profile:profiles(display_name, avatar_url)),
       photos(id, storage_path, caption, uploaded_by)`
    )
    .eq("id", playId)
    .maybeSingle()

  if (error) throw error
  return data
}

// A stable signed URL (instead of a fresh token on every render) is what
// lets the browser actually cache the image bytes, and it saves a Storage
// round-trip on every render of a play with photos. No manual invalidation
// needed: the cache key is the exact set of paths passed in, and that set
// always comes straight from the photos this play currently has in the DB
// — delete one and the next render calls this with a shorter path list,
// which is a different cache key on its own. A stale entry for the old,
// longer list just goes unused; nothing ever reads it again.
export async function getPlayPhotoUrls(paths: string[]) {
  const urls = new Map<string, string>()
  if (paths.length === 0) return urls

  // createClient() reads cookies() — Next.js doesn't allow that inside an
  // unstable_cache scope (throws at runtime, not at build time, which is
  // why this didn't surface until production traffic actually hit a play
  // with photos). Resolving the client first, outside the cached callback,
  // fixes it: the callback below only ever touches the already-built
  // client, never cookies() itself.
  const supabase = await createClient()

  const entries = await unstable_cache(
    async () => {
      const { data, error } = await supabase.storage.from("play-photos").createSignedUrls(paths, 3600)
      if (error) return []
      return data
        .filter((entry) => entry.signedUrl && !entry.error)
        .map((entry) => ({ path: entry.path ?? "", signedUrl: entry.signedUrl! }))
    },
    ["play-photo-signed-urls", ...paths.slice().sort()],
    { revalidate: 3300 }
  )()

  for (const entry of entries) {
    urls.set(entry.path, entry.signedUrl)
  }
  return urls
}

export async function getFactionsForGame(groupId: string, bggId: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("factions")
    .select("id, name")
    .eq("group_id", groupId)
    .eq("game_id", bggId)
    .order("name", { ascending: true })

  if (error) throw error
  return data
}

const GAME_SEARCH_COLUMNS = "bgg_id, name, image_url, min_players, max_players, year_published"

// How many raw substring-match candidates the fallback below is willing to
// fetch before sorting. Bounding this (rather than sorting the full match
// set in SQL) is what keeps a common substring fast — see the comment on
// the fallback query.
const SUBSTRING_SCAN_CAP = 200

export async function searchGames(query: string, limit = 20) {
  const q = query.trim()
  if (!q) return []
  const supabase = await createClient()

  // Prefix matches ("Wing..." for "wing") are what most people type first,
  // and are cheap even at 140k+ rows: the trigram index narrows candidates
  // and ORDER BY only has to sort that narrow slice. A bare "%wing%" scan
  // can match thousands of rows for a common word ("war" alone matches
  // 5,000+ titles) and forces a full sort of all of them before LIMIT
  // applies — only pay that cost when prefix matches don't already fill
  // the page.
  const { data: prefixMatches, error: prefixError } = await supabase
    .from("games")
    .select(GAME_SEARCH_COLUMNS)
    .ilike("name", `${q}%`)
    .order("name", { ascending: true })
    .limit(limit)

  if (prefixError) throw prefixError
  if (prefixMatches.length >= limit) return prefixMatches

  // Unordered and capped: Postgres can stop at the cap instead of pulling
  // and sorting every substring match (9,000+ for something like "ing"),
  // so this stays index-bound and fast regardless of how common the
  // substring is. Sorting/deduping this small, bounded slice in JS is
  // effectively free — the tradeoff is that the fallback tier isn't
  // guaranteed strictly alphabetical across the *entire* match set, only
  // within what got sampled, which is fine for search suggestions.
  const prefixIds = new Set(prefixMatches.map((g) => g.bgg_id))
  const { data: rawSubstringMatches, error: substringError } = await supabase
    .from("games")
    .select(GAME_SEARCH_COLUMNS)
    .ilike("name", `%${q}%`)
    .limit(SUBSTRING_SCAN_CAP)

  if (substringError) throw substringError

  const substringMatches = rawSubstringMatches
    .filter((g) => !prefixIds.has(g.bgg_id))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, limit - prefixMatches.length)

  return [...prefixMatches, ...substringMatches]
}

export async function getGroupLibraryGames(groupId: string, limit = 12) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("group_library")
    .select("game_id, owner_count, game:games(bgg_id, name, image_url)")
    .eq("group_id", groupId)
    .order("owner_count", { ascending: false })
    .limit(limit)

  if (error) throw error
  const gameIds = data.map((d) => d.game_id).filter((id) => id !== null)
  if (gameIds.length === 0) return data.map((d) => ({ ...d, play_count: 0 }))

  const { data: plays, error: playsError } = await supabase
    .from("plays")
    .select("game_id")
    .eq("group_id", groupId)
    .in("game_id", gameIds)

  if (playsError) throw playsError

  const playCounts = new Map<number, number>()
  for (const p of plays) {
    playCounts.set(p.game_id, (playCounts.get(p.game_id) ?? 0) + 1)
  }

  return data.map((d) => ({
    ...d,
    play_count: d.game_id === null ? 0 : (playCounts.get(d.game_id) ?? 0),
  }))
}
