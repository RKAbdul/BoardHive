"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateHiveName, leaveHive, deleteHive } from "@/features/hives/actions"

export function SettingsForm({
  groupId,
  initialName,
  isOwner,
}: {
  groupId: string
  initialName: string
  isOwner: boolean
}) {
  const t = useTranslations("settings")
  const [name, setName] = useState(initialName)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex flex-col gap-8">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          startTransition(async () => {
            await updateHiveName(groupId, name)
            setSaved(true)
            setTimeout(() => setSaved(false), 1500)
          })
        }}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">{t("nameLabel")}</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isOwner}
          />
        </div>
        {isOwner && (
          <Button type="submit" disabled={pending} className="self-start">
            {saved ? t("saved") : t("save")}
          </Button>
        )}
      </form>

      <div className="flex flex-col gap-3 border-t border-border pt-6">
        <p className="text-xs font-medium tracking-wide text-destructive uppercase">
          {t("dangerZone")}
        </p>
        <Button
          type="button"
          variant="outline"
          className="self-start text-destructive hover:text-destructive"
          onClick={() => {
            if (window.confirm(t("confirmLeave"))) {
              startTransition(() => leaveHive(groupId))
            }
          }}
        >
          {t("leaveHive")}
        </Button>
        {isOwner && (
          <Button
            type="button"
            variant="outline"
            className="self-start text-destructive hover:text-destructive"
            onClick={() => {
              if (window.confirm(t("confirmDelete"))) {
                startTransition(() => deleteHive(groupId))
              }
            }}
          >
            {t("deleteHive")}
          </Button>
        )}
      </div>
    </div>
  )
}
