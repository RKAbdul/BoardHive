"use server"

import { revalidatePath, revalidateTag } from "next/cache"
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

  // The upload reused the same path (upsert), so the previously-cached
  // signed URL now points at stale content — `{ expire: 0 }` forces an
  // immediate miss instead of Next 16's default stale-while-revalidate,
  // since serving the old URL even once here means showing the old photo.
  revalidateTag(`avatar:${storagePath}`, { expire: 0 })
  revalidatePath("/profile")
  return { error: null }
}
