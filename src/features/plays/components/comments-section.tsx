"use client"

import { useState, useTransition } from "react"
import { useFormatter, useNow, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { upsertComment } from "@/features/plays/actions"
import { tokenClassFor } from "@/lib/token-color"
import { Pencil } from "lucide-react"

type Comment = {
  id: string
  user_id: string
  body: string
  created_at: string
  profile: { display_name: string } | null
}

export function CommentsSection({
  groupId,
  playId,
  comments,
  currentUserId,
}: {
  groupId: string
  playId: string
  comments: Comment[]
  currentUserId: string | null
}) {
  const t = useTranslations("plays.detail")
  const tCommon = useTranslations("common")
  const format = useFormatter()
  // Keeps "5 minutes ago" honest without needing a page refresh, and gives
  // relativeTime a stable `now` so server and client render the same thing
  // on first paint instead of drifting by however long hydration takes.
  const now = useNow({ updateInterval: 60_000 })

  const myComment = comments.find((c) => c.user_id === currentUserId)
  const [editing, setEditing] = useState(!myComment)
  const [body, setBody] = useState(myComment?.body ?? "")
  const [pending, startTransition] = useTransition()

  const sorted = [...comments].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  return (
    <div className="flex flex-col gap-3">
      {sorted.length > 0 && (
        <ul className="flex flex-col gap-3">
          {sorted.map((c) => {
            const isMine = c.user_id === currentUserId
            const name = isMine ? t("yourComment") : (c.profile?.display_name ?? "?")
            return (
              <li key={c.id} className="flex items-start gap-2.5">
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${tokenClassFor(c.user_id)}`}
                  aria-hidden="true"
                >
                  {(c.profile?.display_name ?? "?").charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-border bg-card px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">
                      {name}
                    </span>
                    <span className="shrink-0 text-[0.7rem] text-muted-foreground">
                      {format.relativeTime(new Date(c.created_at), now)}
                    </span>
                    {isMine && !editing && (
                      <button
                        type="button"
                        aria-label={t("editComment")}
                        onClick={() => setEditing(true)}
                        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm whitespace-pre-wrap text-foreground break-words">
                    {c.body}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {editing && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            startTransition(async () => {
              await upsertComment(groupId, playId, body)
              setEditing(false)
            })
          }}
          className="flex flex-col gap-2 pl-[42px]"
        >
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("commentPlaceholder")}
            rows={2}
            autoFocus={!!myComment}
          />
          <div className="flex justify-end gap-2">
            {myComment && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBody(myComment.body)
                  setEditing(false)
                }}
              >
                {tCommon("cancel")}
              </Button>
            )}
            <Button type="submit" size="sm" disabled={pending || !body.trim()}>
              {pending ? t("posting") : t("postComment")}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
