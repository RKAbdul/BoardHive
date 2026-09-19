"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { generateInviteCode } from "@/features/hives/actions"
import { Check, Copy } from "lucide-react"

export function InviteCodeSection({
  groupId,
  initialCode,
}: {
  groupId: string
  initialCode: string | null
}) {
  const t = useTranslations("members")
  const [code, setCode] = useState(initialCode)
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="font-display text-base font-bold text-foreground">{t("inviteTitle")}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t("inviteBody")}</p>

      {code ? (
        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg bg-muted px-3 py-2 font-display text-sm tracking-wide text-foreground">
            {code}
          </code>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t("copyCode")}
            onClick={() => {
              navigator.clipboard.writeText(code)
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            }}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          className="mt-3"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const newCode = await generateInviteCode(groupId)
              if (newCode) setCode(newCode)
            })
          }
        >
          {t("generateCode")}
        </Button>
      )}
    </div>
  )
}
