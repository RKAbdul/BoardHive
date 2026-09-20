"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { ToolParticipant } from "@/features/tools/types"
import { X } from "lucide-react"

type Member = { user_id: string; display_name: string }

export function ParticipantPicker({
  members,
  selectedIds,
  onToggleMember,
  guests,
  onAddGuest,
  onRemoveGuest,
}: {
  members: Member[]
  selectedIds: Set<string>
  onToggleMember: (userId: string) => void
  guests: ToolParticipant[]
  onAddGuest: (name: string) => void
  onRemoveGuest: (key: string) => void
}) {
  const t = useTranslations("tools.participants")
  const [guestDraft, setGuestDraft] = useState("")

  function submitGuest() {
    const name = guestDraft.trim()
    if (!name) return
    onAddGuest(name)
    setGuestDraft("")
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-foreground">{t("label")}</p>
      <div className="flex flex-wrap gap-2">
        {members.map((m) => {
          const active = selectedIds.has(m.user_id)
          return (
            <button
              key={m.user_id}
              type="button"
              onClick={() => onToggleMember(m.user_id)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-accent"
              }`}
            >
              {m.display_name}
            </button>
          )
        })}
        {guests.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => onRemoveGuest(g.key)}
            className="flex items-center gap-1 rounded-full border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          >
            {g.name}
            <X className="size-3.5" aria-hidden="true" />
          </button>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        <Input
          type="text"
          placeholder={t("guestPlaceholder")}
          value={guestDraft}
          onChange={(e) => setGuestDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              submitGuest()
            }
          }}
        />
        <Button type="button" variant="outline" onClick={submitGuest}>
          {t("addGuest")}
        </Button>
      </div>

      {selectedIds.size === 0 && guests.length === 0 && (
        <p className="mt-2 text-xs text-muted-foreground">{t("empty")}</p>
      )}
    </div>
  )
}
