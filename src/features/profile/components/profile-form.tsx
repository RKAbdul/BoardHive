"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateDisplayName } from "@/features/profile/actions"

export function ProfileForm({ initialName }: { initialName: string }) {
  const t = useTranslations("profile")
  const [name, setName] = useState(initialName)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        startTransition(async () => {
          await updateDisplayName(name)
          setSaved(true)
          setTimeout(() => setSaved(false), 1500)
        })
      }}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">{t("displayName")}</Label>
        <Input id="displayName" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <Button type="submit" disabled={pending} className="self-start">
        {saved ? t("saved") : t("save")}
      </Button>
    </form>
  )
}
