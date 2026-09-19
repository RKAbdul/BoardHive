import type { CSSProperties } from "react"
import { getFormatter, getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"

const TOKEN_CLASSES = ["bg-token-1", "bg-token-2", "bg-token-3", "bg-token-4", "bg-token-5", "bg-token-6"]

type PlayParticipant = {
  id: string
  user_id: string | null
  guest_name: string | null
  is_winner: boolean
  profile: { display_name: string } | null
}

type Play = {
  id: string
  played_at: string
  game: { bgg_id: number; name: string; image_url: string | null } | null
  participants: PlayParticipant[]
}

/**
 * The product's signature composition: a hive's play history as beads along
 * a scoring track, not a card grid. Reused (with real data) from the
 * landing page's demonstration.
 */
export async function PlayTrack({ plays, groupId }: { plays: Play[]; groupId: string }) {
  const format = await getFormatter()
  const t = await getTranslations("plays")

  return (
    <div className="relative flex flex-col gap-5 pl-4">
      <span
        className="absolute top-2 bottom-2 left-[7px] w-px bg-border"
        aria-hidden="true"
      />
      {plays.map((play, i) => {
        const winners = play.participants.filter((p) => p.is_winner)
        const summary =
          winners.length > 0
            ? winners
                .map((w) => w.profile?.display_name ?? w.guest_name ?? "?")
                .join(", ")
            : t("playerCount", { count: play.participants.length })

        return (
          <Link
            key={play.id}
            href={`/hives/${groupId}/plays/${play.id}`}
            className="track-enter relative flex items-start gap-3"
            style={{ "--track-i": i } as CSSProperties}
          >
            <span
              className={`z-10 mt-1 size-3.5 shrink-0 rounded-full ring-4 ring-background ${TOKEN_CLASSES[i % TOKEN_CLASSES.length]}`}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1">
              <span className="block font-display text-base font-bold tracking-tight text-foreground">
                {play.game?.name ?? t("unknownGame")}
              </span>
              <span className="block text-sm text-muted-foreground">
                {format.dateTime(new Date(play.played_at), { month: "short", day: "numeric" })}
                {" · "}
                {winners.length > 0 ? t("won", { name: summary }) : summary}
              </span>
            </span>
          </Link>
        )
      })}
    </div>
  )
}
