import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { getGroupLibraryGames, getPlayById } from "@/features/plays/data"
import { getHiveMembers, getMyRole } from "@/features/hives/data"
import { PlayForm } from "@/features/plays/components/play-form"
import { canManagePlay } from "@/features/plays/permissions"
import { PLAY_MODES, type PlayMode } from "@/features/plays/schemas"
import { requireSession } from "@/lib/dal"

export default async function EditPlayPage({
  params,
}: PageProps<"/[locale]/hives/[groupId]/plays/[playId]/edit">) {
  const { groupId, playId } = await params
  const session = await requireSession()

  const [play, role, members, library, t] = await Promise.all([
    getPlayById(playId),
    getMyRole(groupId, session.userId),
    getHiveMembers(groupId),
    getGroupLibraryGames(groupId),
    getTranslations("plays.edit"),
  ])

  // Someone who can't edit this play gets the same 404 as a play that
  // doesn't exist — the edit URL isn't something they were ever linked to.
  if (!play || play.group_id !== groupId || !canManagePlay(play, session.userId, role)) {
    notFound()
  }

  const memberList = members
    .filter((m) => m.profile)
    .map((m) => ({ user_id: m.user_id, display_name: m.profile!.display_name }))

  const libraryGames = library.filter((l) => l.game).map((l) => l.game!)

  const mode: PlayMode = (PLAY_MODES as readonly string[]).includes(play.mode)
    ? (play.mode as PlayMode)
    : "generic"

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
        {t("title")}
      </h1>
      <div className="mt-5">
        <PlayForm
          groupId={groupId}
          members={memberList}
          libraryGames={libraryGames}
          playId={play.id}
          initial={{
            game: play.game
              ? { bgg_id: play.game.bgg_id, name: play.game.name, image_url: play.game.image_url }
              : null,
            mode,
            playedAt: play.played_at.slice(0, 10),
            notes: play.notes ?? "",
            participants: play.participants.map((p) => ({
              key: `row:${p.id}`,
              id: p.id,
              userId: p.user_id,
              guestName: p.user_id ? null : (p.guest_name ?? ""),
              displayName: p.profile?.display_name ?? p.guest_name ?? "?",
              isWinner: p.is_winner,
              score: p.score === null ? "" : String(p.score),
              placement: p.placement === null ? "" : String(p.placement),
              factionId: p.faction?.id ?? null,
              newFactionName: null,
            })),
          }}
        />
      </div>
    </div>
  )
}
