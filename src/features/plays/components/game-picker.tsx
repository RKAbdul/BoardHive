"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { searchGamesAction } from "@/features/plays/actions"
import { Dices } from "lucide-react"

type Game = {
  bgg_id: number
  name: string
  image_url: string | null
}

export function GamePicker({
  libraryGames,
  onSelect,
}: {
  libraryGames: Game[]
  onSelect: (game: Game) => void
}) {
  const t = useTranslations("plays.new")
  const [query, setQuery] = useState("")
  // Tagged with the query it answers, so `list`/`loading` below can be
  // derived by comparing against the current `query` instead of needing
  // their own effect-synced state (and so a stale response can never
  // render: it's simply for a query nothing is asking about anymore).
  const [results, setResults] = useState<{ query: string; games: Game[] } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Guards against out-of-order responses: a slow request for an earlier
  // query could otherwise resolve after a faster one for the current query
  // and clobber its (more relevant) results.
  const latestQueryRef = useRef("")

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) return
    debounceRef.current = setTimeout(async () => {
      const searchedQuery = query
      latestQueryRef.current = searchedQuery
      const games = await searchGamesAction(searchedQuery)
      if (latestQueryRef.current !== searchedQuery) return
      setResults({ query: searchedQuery, games })
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const showLibrary = !query.trim() && libraryGames.length > 0
  const list = query.trim() && results?.query === query ? results.games : null
  const loading = query.trim() !== "" && list === null

  return (
    <div className="flex flex-col gap-3">
      <Input
        type="search"
        placeholder={t("gameSearchPlaceholder")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />

      {showLibrary && (
        <div>
          <p className="text-xs font-medium text-muted-foreground">{t("fromLibrary")}</p>
          <GameGrid games={libraryGames} onSelect={onSelect} />
        </div>
      )}

      {query.trim() && (
        <div>
          <p className="text-xs font-medium text-muted-foreground">{t("searchResults")}</p>
          {loading ? (
            <p className="mt-2 text-sm text-muted-foreground">…</p>
          ) : list && list.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">{t("noResults")}</p>
          ) : (
            <GameGrid games={list ?? []} onSelect={onSelect} />
          )}
        </div>
      )}
    </div>
  )
}

function GameGrid({ games, onSelect }: { games: Game[]; onSelect: (g: Game) => void }) {
  return (
    <div className="mt-2 -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-4 sm:overflow-visible sm:px-0 sm:pb-0 md:grid-cols-5">
      {games.map((game) => (
        <button
          key={game.bgg_id}
          type="button"
          onClick={() => onSelect(game)}
          className="flex w-24 shrink-0 snap-start flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-2 text-center transition-colors hover:bg-accent sm:w-auto sm:shrink sm:snap-align-none"
        >
          <span className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-muted">
            {game.image_url ? (
              <Image
                src={game.image_url}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
            ) : (
              <Dices className="size-6 text-muted-foreground" aria-hidden="true" />
            )}
          </span>
          <span className="line-clamp-2 text-xs font-medium text-foreground">
            {game.name}
          </span>
        </button>
      ))}
    </div>
  )
}
