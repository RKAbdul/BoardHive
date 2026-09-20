"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireSession } from "@/lib/dal"

export type AvatarErrorCode = "invalidType" | "tooLarge" | "generic"

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

// The file itself is uploaded client-side, straight to Supabase Storage —
// Vercel's serverless functions cap request bodies at 4.5MB, well under
// what a real photo can be. This only records the resulting path once
// that upload has already succeeded.
export async function confirmAvatarUpload(
  storagePath: string
): Promise<{ error: AvatarErrorCode | null }> {
  const session = await requireSession()

  // Defense in depth — storage RLS already scopes the upload itself to the
  // caller's own folder, but the path is still client-supplied, so it
  // shouldn't be trusted blindly for the DB write either.
  if (storagePath !== `${session.userId}/avatar`) {
    return { error: "generic" }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: storagePath })
    .eq("id", session.userId)
  if (error) return { error: "generic" }

  revalidatePath("/profile")
  return { error: null }
}
