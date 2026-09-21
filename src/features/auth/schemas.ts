import * as z from "zod"
import type { useTranslations } from "next-intl"
import type { EmailOtpType } from "@supabase/supabase-js"

// The only two types this app's own email templates ever generate — hive
// invites are a separate, in-app mechanism (group_invites + a code), not
// Supabase Auth's email-invite flow, and nothing here sends a magic link,
// email-change confirmation, or generic OTP.
const VALID_OTP_TYPES: EmailOtpType[] = ["signup", "recovery"]

export function isValidOtpType(type: string): type is EmailOtpType {
  return VALID_OTP_TYPES.includes(type as EmailOtpType)
}

type ValidationT = ReturnType<typeof useTranslations<"validation">>

export function getSignupSchema(t: ValidationT) {
  return z.object({
    displayName: z
      .string()
      .trim()
      .min(2, { error: t("displayNameMin") })
      .max(60, { error: t("displayNameMax") }),
    email: z.email({ error: t("invalidEmail") }).trim(),
    password: z
      .string()
      .min(8, { error: t("passwordMin") })
      .regex(/[a-zA-Z]/, { error: t("passwordLetter") })
      .regex(/[0-9]/, { error: t("passwordNumber") }),
  })
}

export function getLoginSchema(t: ValidationT) {
  return z.object({
    email: z.email({ error: t("invalidEmail") }).trim(),
    password: z.string().min(1, { error: t("passwordRequired") }),
  })
}

export function getForgotPasswordSchema(t: ValidationT) {
  return z.object({
    email: z.email({ error: t("invalidEmail") }).trim(),
  })
}

export function getResetPasswordSchema(t: ValidationT) {
  return z.object({
    password: z
      .string()
      .min(8, { error: t("passwordMin") })
      .regex(/[a-zA-Z]/, { error: t("passwordLetter") })
      .regex(/[0-9]/, { error: t("passwordNumber") }),
  })
}

export type ActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  success?: boolean
} | null
