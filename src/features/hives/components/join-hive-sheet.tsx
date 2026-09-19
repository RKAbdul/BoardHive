"use client"

import { useActionState, useState } from "react"
import { useTranslations } from "next-intl"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { joinHive } from "@/features/hives/actions"
import type { ActionState } from "@/features/hives/schemas"

export function JoinHiveSheet() {
  const t = useTranslations("hives.join")
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    joinHive,
    null
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" />}>
        {t("cta")}
      </SheetTrigger>
      <SheetContent side="bottom" className="pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">{t("title")}</SheetTitle>
        </SheetHeader>
        <form action={formAction} className="flex flex-col gap-4 px-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="code">{t("code")}</Label>
            <Input
              id="code"
              name="code"
              type="text"
              autoCapitalize="off"
              autoCorrect="off"
              required
              aria-invalid={!!state?.fieldErrors?.code}
            />
            {state?.fieldErrors?.code && (
              <p className="text-sm text-destructive">{state.fieldErrors.code[0]}</p>
            )}
          </div>
          {state?.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending} size="lg">
            {pending ? t("submitting") : t("submit")}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
