// Pure per-game stats computation — no I/O, so the rules below (especially
// how positions get inferred) are readable in one place and independent of
// how the plays were fetched.

export type StatsParticipant = {
  user_id: string | null
  guest_name: string | null
  is_winner: boolean
  score: number | null
  placement: number | null
  faction: { id: string; name: string } | null
  profile: { display_name: string } | null
}

export type StatsPlay = {
  id: string
  mode: string
  played_at: string
  created_at: string
  participants: StatsParticipant[]
}

export type PlayerGameStats = {
  key: string
  name: string
  plays: number
  wins: number
  winRate: number
  podiums: number
  /** null when no play of theirs had a placement or a rankable score. */
  avgPosition: number | null
  avgScore: number | null
  bestScore: number | null
  longestWinStreak: number
  topFaction: { name: string; plays: number; wins: number } | null
}

export type FactionGameStats = {
  name: string
  plays: number
  wins: number
  winRate: number
  avgScore: number | null
}

export type GameRecords = {
  /** Most plays only ever crown the lowest score (golf-style). */
  lowerScoreWins: boolean
  bestScore: { score: number; name: string; playId: string; playedAt: string } | null
  avgWinningScore: number | null
  avgTableSize: number
  closestWin: { margin: number; name: string; playId: string; playedAt: string } | null
}

type ScoreDirection = "high" | "low"

function participantKey(p: StatsParticipant) {
  return p.user_id ?? `guest:${p.guest_name}`
}

function participantName(p: StatsParticipant) {
  return p.profile?.display_name ?? p.guest_name ?? "?"
}

function average(values: number[]) {
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null
}

/**
 * Which way the score ran in one play, judged from who was marked winner:
 * a winner holding the top score means high wins, holding the bottom one
 * means low wins. Null when that can't be told (no winner, no spread, or the
 * winner sits mid-table, e.g. a co-op or a tiebreak on something else).
 */
function playScoreDirection(play: StatsPlay): ScoreDirection | null {
  const scored = play.participants.filter((p) => p.score !== null)
  const winners = scored.filter((p) => p.is_winner)
  if (scored.length < 2 || winners.length === 0) return null

  const scores = scored.map((p) => p.score!)
  const max = Math.max(...scores)
  const min = Math.min(...scores)
  if (max === min) return null

  if (winners.every((w) => w.score === max)) return "high"
  if (winners.every((w) => w.score === min)) return "low"
  return null
}

/**
 * Finishing position for each participant in one play (index-aligned with
 * play.participants, null where unknown).
 *
 * Logged placements win outright. Only when a play has no placements at all
 * are positions inferred from score — ranked in the direction that play's
 * winner implies, falling back to the game's usual direction — using
 * standard competition ranking (two tied for first are both 1st, next is
 * 3rd). A play needs at least two scores for a rank to mean anything.
 */
function resolvePositions(play: StatsPlay, gameDirection: ScoreDirection): (number | null)[] {
  if (play.participants.some((p) => p.placement !== null)) {
    return play.participants.map((p) => p.placement)
  }

  const scored = play.participants.filter((p) => p.score !== null)
  if (scored.length < 2) return play.participants.map(() => null)

  const direction = playScoreDirection(play) ?? gameDirection
  return play.participants.map((p) => {
    if (p.score === null) return null
    const better = scored.filter((o) =>
      direction === "high" ? o.score! > p.score! : o.score! < p.score!
    ).length
    return better + 1
  })
}

export function computeGameStats(plays: StatsPlay[]) {
  // Oldest first, so streaks are counted in the order games were played.
  const chronological = [...plays].sort(
    (a, b) =>
      a.played_at.localeCompare(b.played_at) || a.created_at.localeCompare(b.created_at)
  )

  let lowVotes = 0
  let highVotes = 0
  for (const play of chronological) {
    const direction = playScoreDirection(play)
    if (direction === "low") lowVotes += 1
    if (direction === "high") highVotes += 1
  }
  const gameDirection: ScoreDirection = lowVotes > highVotes ? "low" : "high"
  const isBetter = (a: number, b: number) => (gameDirection === "high" ? a > b : a < b)

  const modeCounts = { generic: 0, racing: 0, asymmetric: 0 }

  type Acc = {
    name: string
    plays: number
    wins: number
    podiums: number
    positions: number[]
    scores: number[]
    currentStreak: number
    longestWinStreak: number
    factions: Map<string, { name: string; plays: number; wins: number }>
  }
  const players = new Map<string, Acc>()
  const factions = new Map<string, { name: string; plays: number; wins: number; scores: number[] }>()

  let bestScore: GameRecords["bestScore"] = null
  let closestWin: GameRecords["closestWin"] = null
  const winningScores: number[] = []
  let participantTotal = 0

  for (const play of chronological) {
    if (play.mode in modeCounts) modeCounts[play.mode as keyof typeof modeCounts] += 1
    participantTotal += play.participants.length

    const positions = resolvePositions(play, gameDirection)

    play.participants.forEach((p, i) => {
      const key = participantKey(p)
      const acc: Acc = players.get(key) ?? {
        name: participantName(p),
        plays: 0,
        wins: 0,
        podiums: 0,
        positions: [],
        scores: [],
        currentStreak: 0,
        longestWinStreak: 0,
        factions: new Map(),
      }

      acc.plays += 1
      if (p.is_winner) {
        acc.wins += 1
        acc.currentStreak += 1
        acc.longestWinStreak = Math.max(acc.longestWinStreak, acc.currentStreak)
      } else {
        acc.currentStreak = 0
      }

      const position = positions[i]
      if (position !== null) acc.positions.push(position)
      if (play.mode === "racing" && p.placement !== null && p.placement <= 3) acc.podiums += 1

      if (p.score !== null) {
        acc.scores.push(p.score)
        if (!bestScore || isBetter(p.score, bestScore.score)) {
          bestScore = { score: p.score, name: participantName(p), playId: play.id, playedAt: play.played_at }
        }
      }

      if (play.mode === "asymmetric" && p.faction) {
        const pf = acc.factions.get(p.faction.id) ?? { name: p.faction.name, plays: 0, wins: 0 }
        pf.plays += 1
        if (p.is_winner) pf.wins += 1
        acc.factions.set(p.faction.id, pf)

        const f = factions.get(p.faction.id) ?? { name: p.faction.name, plays: 0, wins: 0, scores: [] }
        f.plays += 1
        if (p.is_winner) f.wins += 1
        if (p.score !== null) f.scores.push(p.score)
        factions.set(p.faction.id, f)
      }

      players.set(key, acc)
    })

    // Winning score and margin of victory — only for plays with a single
    // scored winner, where "by how much" has an unambiguous answer.
    const scoredWinners = play.participants.filter((p) => p.is_winner && p.score !== null)
    if (scoredWinners.length === 1) {
      const winner = scoredWinners[0]
      winningScores.push(winner.score!)

      const runnerUpScores = play.participants
        .filter((p) => !p.is_winner && p.score !== null)
        .map((p) => p.score!)
      if (runnerUpScores.length > 0) {
        const runnerUp =
          gameDirection === "high" ? Math.max(...runnerUpScores) : Math.min(...runnerUpScores)
        const margin = Math.abs(winner.score! - runnerUp)
        if (margin > 0 && (!closestWin || margin < closestWin.margin)) {
          closestWin = { margin, name: participantName(winner), playId: play.id, playedAt: play.played_at }
        }
      }
    }
  }

  const standings: PlayerGameStats[] = [...players.entries()]
    .map(([key, acc]) => {
      const topFaction =
        [...acc.factions.values()].sort((a, b) => b.plays - a.plays || b.wins - a.wins)[0] ?? null
      const best =
        acc.scores.length > 0
          ? gameDirection === "high"
            ? Math.max(...acc.scores)
            : Math.min(...acc.scores)
          : null
      return {
        key,
        name: acc.name,
        plays: acc.plays,
        wins: acc.wins,
        winRate: acc.plays > 0 ? acc.wins / acc.plays : 0,
        podiums: acc.podiums,
        avgPosition: average(acc.positions),
        avgScore: average(acc.scores),
        bestScore: best,
        longestWinStreak: acc.longestWinStreak,
        topFaction,
      }
    })
    .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate)

  const factionStandings: FactionGameStats[] = [...factions.values()]
    .map((f) => ({
      name: f.name,
      plays: f.plays,
      wins: f.wins,
      winRate: f.plays > 0 ? f.wins / f.plays : 0,
      avgScore: average(f.scores),
    }))
    .sort((a, b) => b.winRate - a.winRate || b.plays - a.plays)

  const records: GameRecords = {
    lowerScoreWins: gameDirection === "low",
    bestScore,
    avgWinningScore: average(winningScores),
    avgTableSize: plays.length > 0 ? participantTotal / plays.length : 0,
    closestWin,
  }

  return {
    totalPlays: plays.length,
    modeCounts,
    standings,
    factionStandings,
    records,
  }
}
