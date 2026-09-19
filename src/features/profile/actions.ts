"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireSession } from "@/lib/dal"

const MAX_AVATAR_BYTES = 5 * 1024 * 1024

export type AvatarErrorCode = "noFile" | "invalidType" | "tooLarge" | "generic"

export async function updateDisplayName(displayName: string) {
  const session = await requireSession()
  if (!displayName.trim()) return
  const supabase = await createClient()
  await supabase
    .from("profiles")
    .update({ display_name: displayName.trim() })
    .eq("id", session.userId)
  revalidatePath("/profile")
}

export async function uploadAvatar(
  _prevState: { error: AvatarErrorCode | null } | null,
  formData: FormData
): Promise<{ error: AvatarErrorCode | null }> {
  const session = await requireSession()
  const file = formData.get("avatar")

  if (!(file instanceof File) || file.size === 0) {
    return { error: "noFile" }
  }
  if (!file.type.startsWith("image/")) {
    return { error: "invalidType" }
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { error: "tooLarge" }
  }

  const supabase = await createClient()
  const path = `${session.userId}/avatar`

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type })
  if (uploadError) return { error: "generic" }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: path })
    .eq("id", session.userId)
  if (updateError) return { error: "generic" }

  revalidatePath("/profile")
  return { error: null }
}
