import * as z from "zod"
import type { useTranslations } from "next-intl"

type ValidationT = ReturnType<typeof useTranslations<"validation">>

export function getCreateHiveSchema(t: ValidationT) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(2, { error: t("displayNameMin") })
      .max(60, { error: t("displayNameMax") }),
  })
}

export function getJoinHiveSchema() {
  return z.object({
    code: z.string().trim().min(1),
  })
}

export type ActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
} | null
