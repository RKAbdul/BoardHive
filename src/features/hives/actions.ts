"use server"

import { randomBytes } from "node:crypto"
import { revalidatePath } from "next/cache"
import { getLocale, getTranslations } from "next-intl/server"
import { redirect } from "@/i18n/navigation"
import { createClient } from "@/lib/supabase/server"
import { requireSession } from "@/lib/dal"
import {
  getCreateHiveSchema,
  getJoinHiveSchema,
  type ActionState,
} from "./schemas"

function generateCode() {
  return randomBytes(6).toString("base64url")
}

export async function createHive(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession()
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: "validation" })

  const validated = getCreateHiveSchema(t).safeParse({
    name: formData.get("name"),
  })

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("groups")
    .insert({ name: validated.data.name, created_by: session.userId })
    .select("id")
    .single()

  if (error || !data) {
    return { error: error?.message }
  }

  redirect({ href: `/hives/${data.id}`, locale })
  return null
}

export async function joinHive(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireSession()
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: "hives.join" })

  const validated = getJoinHiveSchema().safeParse({
    code: formData.get("code"),
  })

  if (!validated.success) {
    return { fieldErrors: { code: [t("invalidCode")] } }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("join_group_with_code", {
    p_code: validated.data.code,
  })

  if (error || !data) {
    return { error: t("invalidCode") }
  }

  redirect({ href: `/hives/${data}`, locale })
  return null
}

export async function joinHiveByCode(code: string): Promise<{ error?: string; groupId?: string }> {
  await requireSession()
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: "hives.join" })

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("join_group_with_code", { p_code: code })

  if (error || !data) {
    return { error: t("invalidCode") }
  }

  return { groupId: data }
}

export async function generateInviteCode(groupId: string) {
  const session = await requireSession()
  const supabase = await createClient()
  const code = generateCode()

  const { error } = await supabase
    .from("group_invites")
    .insert({ group_id: groupId, code, created_by: session.userId })

  if (error) return null

  revalidatePath(`/hives/${groupId}/members`)
  return code
}

export async function updateHiveName(groupId: string, name: string) {
  await requireSession()
  if (!name.trim()) return
  const supabase = await createClient()
  await supabase.from("groups").update({ name: name.trim() }).eq("id", groupId)
  revalidatePath(`/hives/${groupId}`, "layout")
}

export async function leaveHive(groupId: string) {
  const session = await requireSession()
  const locale = await getLocale()
  const supabase = await createClient()
  await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", session.userId)
  redirect({ href: "/hives", locale })
}

export async function deleteHive(groupId: string) {
  await requireSession()
  const locale = await getLocale()
  const supabase = await createClient()
  await supabase.from("groups").delete().eq("id", groupId)
  redirect({ href: "/hives", locale })
}
