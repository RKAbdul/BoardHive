"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { GamePicker } from "@/features/plays/components/game-picker"
import { getFactionsForGameAction } from "@/features/plays/actions"
import { shuffle } from "@/features/tools/lib/shuffle"
import type { ToolParticipant } from "@/features/tools/types"

type Game = { bgg_id: number; name: string; image_url: string | null }
type Faction = { id: string; name: string }

export function TurnOrderTool({
  groupId,
  libraryGames,
  participants,
}: {
  groupId: string
  libraryGames: Game[]
  participants: ToolParticipant[]
}) {
  const t = useTranslations("tools.order")
  const [game, setGame] = useState<Game | null>(null)
  const [pickingGame, setPickingGame] = useState(false)
  // Tagged by the game they were fetched/rolled for, so a game change
  // invalidates them by comparison at render time instead of needing a
  // second effect just to clear stale state.
  const [factionsState, setFactionsState] = useState<{ bggId: number; factions: Faction[] } | null>(
    null
  )
  const [rollState, setRollState] = useState<{
    bggId: number | null
    entries: { participant: ToolParticipant; faction: string | null }[]
  } | null>(null)

  useEffect(() => {
    if (!game) return
    let cancelled = false
    getFactionsForGameAction(groupId, game.bgg_id).then((f) => {
      if (!cancelled) setFactionsState({ bggId: game.bgg_id, factions: f })
    })
    return () => {
      cancelled = true
    }
  }, [game, groupId])

  const currentGameId = game?.bgg_id ?? null
  const factions = factionsState?.bggId === currentGameId ? factionsState.factions : []
  const result = rollState?.bggId === currentGameId ? rollState.entries : null

  function rollOrder() {
    const orderedParticipants = shuffle(participants)
    const orderedFactions = shuffle(factions)
    setRollState({
      bggId: currentGameId,
      entries: orderedParticipants.map((p, i) => ({
        participant: p,
        faction: orderedFactions[i]?.name ?? null,
      })),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label className="mb-2">{t("gameLabel")}</Label>
        {game ? (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
            <span className="min-w-0 flex-1 truncate font-medium text-foreground">
              {game.name}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setGame(null)}>
              {t("changeGame")}
            </Button>
          </div>
        ) : pickingGame ? (
          <GamePicker
            libraryGames={libraryGames}
            onSelect={(g) => {
              setGame(g)
              setPickingGame(false)
            }}
          />
        ) : (
          <Button type="button" variant="outline" onClick={() => setPickingGame(true)}>
            {t("pickGame")}
          </Button>
        )}
        {game && factions.length > 0 && (
          <p className="mt-1.5 text-xs text-muted-foreground">{t("factionHint")}</p>
        )}
      </div>

      <Button type="button" size="lg" onClick={rollOrder} disabled={participants.length === 0}>
        {result ? t("shuffleAgain") : t("shuffle")}
      </Button>

      {result && (
        <ol className="flex flex-col gap-2">
          {result.map((r, i) => (
            <li
              key={r.participant.key}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                {r.participant.name}
              </span>
              {r.faction && (
                <span className="shrink-0 truncate rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                  {r.faction}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
