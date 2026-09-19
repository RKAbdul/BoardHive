"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { useRouter } from "@/i18n/navigation"
import { joinHiveByCode } from "@/features/hives/actions"

export function JoinInviteButton({ code }: { code: string }) {
  const t = useTranslations("invite")
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        size="lg"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await joinHiveByCode(code)
            if (result.error) {
              setError(result.error)
            } else if (result.groupId) {
              router.replace(`/hives/${result.groupId}`)
            }
          })
        }
      >
        {pending ? t("joining") : t("join")}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
