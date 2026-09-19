"use client"

import { useActionState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requestPasswordReset } from "@/features/auth/actions"
import type { ActionState } from "@/features/auth/schemas"

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword")
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    requestPasswordReset,
    null
  )

  if (state?.success) {
    return (
      <p role="status" className="rounded-lg bg-secondary p-4 text-secondary-foreground">
        {t("checkEmail")}
      </p>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={!!state?.fieldErrors?.email}
        />
        {state?.fieldErrors?.email && (
          <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <Button type="submit" disabled={pending} size="lg" className="mt-2">
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  )
}
