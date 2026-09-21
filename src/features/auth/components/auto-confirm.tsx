"use client"

import { useEffect, useTransition } from "react"
import { useTranslations } from "next-intl"

// Fires confirm() once, immediately, on mount — no click required. Safe
// against a prescanning email client: those only ever do a plain GET of
// this page (rendering this component, not running it), never JS. Only a
// real browser executing this effect calls confirm(), and confirm() always
// ends in a redirect (success or error), so there's no other state to show.
export function AutoConfirm({ confirm }: { confirm: () => Promise<void> }) {
  const t = useTranslations("auth.confirm")
  const [, startTransition] = useTransition()

  useEffect(() => {
    startTransition(confirm)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once on mount only
  }, [])

  return (
    <div className="flex flex-col items-center gap-3">
      <span
        className="size-6 animate-spin rounded-full border-2 border-foreground border-t-transparent"
        aria-hidden="true"
      />
      <p className="text-sm text-muted-foreground">{t("loading")}</p>
    </div>
  )
}
