import { notFound } from "next/navigation"
import Image from "next/image"
import { getFormatter, getTranslations } from "next-intl/server"
import { getPlayById, getPlayPhotoUrls } from "@/features/plays/data"
import { verifySession } from "@/lib/dal"
import { Link } from "@/i18n/navigation"
import { CommentsSection } from "@/features/plays/components/comments-section"
import { DeletePlayButton } from "@/features/plays/components/delete-play-button"
import { PhotoCarousel, type Photo } from "@/features/plays/components/photo-carousel"
import { PhotoUploader } from "@/features/plays/components/photo-uploader"
import { Dices, Flag, Shuffle, Star, Trophy } from "lucide-react"

const PODIUM_TOKEN: Record<number, string> = {
  1: "text-token-2",
  2: "text-muted-foreground",
  3: "text-token-3",
}

export default async function PlayDetailPage({
  params,
}: PageProps<"/[locale]/hives/[groupId]/plays/[playId]">) {
  const { groupId, playId } = await params
  // Independent of the play lookup below — no reason to serialize them.
  const [play, session] = await Promise.all([getPlayById(playId), verifySession()])

  if (!play || play.group_id !== groupId) {
    notFound()
  }

  const format = await getFormatter()
  const t = await getTranslations("plays.detail")
  const tMode = await getTranslations("plays.new.mode")

  const photoUrls = await getPlayPhotoUrls(play.photos.map((p) => p.storage_path))
  const photos: Photo[] = play.photos
    .map((p) => ({
      id: p.id,
      url: photoUrls.get(p.storage_path),
      storagePath: p.storage_path,
      uploadedBy: p.uploaded_by,
    }))
    .filter((p): p is Photo => !!p.url)

  const sortedParticipants =
    play.mode === "racing"
      ? [...play.participants].sort((a, b) => {
          if (a.placement === null) return 1
          if (b.placement === null) return -1
          return a.placement - b.placement
        })
      : play.participants

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        {play.game ? (
          <Link
            href={`/hives/${groupId}/games/${play.game.bgg_id}`}
            className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted"
          >
            {play.game.image_url ? (
              <Image src={play.game.image_url} alt="" fill sizes="64px" className="object-cover" />
            ) : (
              <Dices className="size-6 text-muted-foreground" aria-hidden="true" />
            )}
          </Link>
        ) : (
          <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
            <Dices className="size-6 text-muted-foreground" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          {play.game ? (
            <Link href={`/hives/${groupId}/games/${play.game.bgg_id}`}>
              <h1 className="font-display text-xl font-bold tracking-tight text-foreground hover:underline break-words">
                {play.game.name}
              </h1>
            </Link>
          ) : (
            <h1 className="font-display text-xl font-bold tracking-tight text-foreground">—</h1>
          )}
          <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>{format.dateTime(new Date(play.played_at), { dateStyle: "long" })}</span>
            {play.mode === "racing" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-token-2">
                <Flag className="size-3" aria-hidden="true" />
                {tMode("racing")}
              </span>
            )}
            {play.mode === "asymmetric" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-token-1">
                <Shuffle className="size-3" aria-hidden="true" />
                {tMode("asymmetric")}
              </span>
            )}
          </div>
        </div>
      </div>

      {play.notes && (
        <div>
          <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t("notes")}
          </h2>
          <p className="mt-1 text-sm text-foreground">{play.notes}</p>
        </div>
      )}

      <div>
        <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t("participants")}
        </h2>
        <ul className="mt-2 flex flex-col gap-2">
          {sortedParticipants.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5"
            >
              {play.mode === "racing" ? (
                p.placement !== null && p.placement <= 3 ? (
                  <Trophy
                    className={`size-4 shrink-0 ${PODIUM_TOKEN[p.placement]}`}
                    aria-hidden="true"
                  />
                ) : (
                  <span className="size-4 shrink-0" aria-hidden="true" />
                )
              ) : (
                p.is_winner && (
                  <Star className="size-4 shrink-0 fill-token-2 text-token-2" aria-hidden="true" />
                )
              )}
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                {p.profile?.display_name ?? p.guest_name}
              </span>
              {play.mode === "asymmetric" && p.faction && (
                <span className="shrink-0 truncate rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                  {p.faction.name}
                </span>
              )}
              {p.score !== null && (
                <span className="shrink-0 font-display text-sm font-bold tabular-nums text-foreground">
                  {p.score}
                </span>
              )}
              {play.mode === "racing" && p.placement !== null && (
                <span className="shrink-0 text-xs font-medium text-muted-foreground">#{p.placement}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t("photos.title")}
        </h2>
        <div className="mt-2 flex flex-col gap-3">
          <PhotoCarousel
            groupId={groupId}
            playId={playId}
            photos={photos}
            currentUserId={session?.userId ?? null}
          />
          {session && <PhotoUploader groupId={groupId} playId={playId} />}
        </div>
      </div>

      <div>
        <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t("comments")}
        </h2>
        <div className="mt-2">
          <CommentsSection
            groupId={groupId}
            playId={playId}
            comments={play.comments}
            currentUserId={session?.userId ?? null}
          />
        </div>
      </div>

      {session?.userId === play.logged_by && (
        <div className="flex justify-end">
          <DeletePlayButton groupId={groupId} playId={playId} />
        </div>
      )}
    </div>
  )
}
