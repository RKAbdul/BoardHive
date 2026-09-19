"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { deletePlay } from "@/features/plays/actions"

export function DeletePlayButton({ groupId, playId }: { groupId: string; playId: string }) {
  const t = useTranslations("plays.detail")
  const [pending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive"
      disabled={pending}
      onClick={() => {
        if (window.confirm(t("confirmDelete"))) {
          startTransition(() => deletePlay(groupId, playId))
        }
      }}
    >
      {t("deletePlay")}
    </Button>
  )
}
