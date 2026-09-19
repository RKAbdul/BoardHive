"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { removeGameFromLibrary } from "@/features/library/actions"
import { X } from "lucide-react"

export function RemoveFromLibraryButton({ gameId }: { gameId: number }) {
  const t = useTranslations("library")
  const [pending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={t("remove")}
      disabled={pending}
      onClick={() => startTransition(() => removeGameFromLibrary(gameId))}
    >
      <X className="size-4" />
    </Button>
  )
}
