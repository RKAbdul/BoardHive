"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { GamePicker } from "@/features/plays/components/game-picker"
import { addGameToLibrary } from "@/features/library/actions"
import { Plus } from "lucide-react"

export function AddGameSheet() {
  const t = useTranslations("library")
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button className="gap-2" />}>
        <Plus className="size-4" aria-hidden="true" />
        {t("addGame")}
      </SheetTrigger>
      <SheetContent side="bottom" className="pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">{t("addGame")}</SheetTitle>
        </SheetHeader>
        <div className="px-4">
          <GamePicker
            libraryGames={[]}
            onSelect={(game) => {
              startTransition(() => addGameToLibrary(game.bgg_id))
              setOpen(false)
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
