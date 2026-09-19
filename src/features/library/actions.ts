"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireSession } from "@/lib/dal"

export async function addGameToLibrary(gameId: number) {
  const session = await requireSession()
  const supabase = await createClient()
  await supabase
    .from("game_library")
    .upsert({ user_id: session.userId, game_id: gameId }, { onConflict: "user_id,game_id" })
  revalidatePath("/library")
}

export async function removeGameFromLibrary(gameId: number) {
  const session = await requireSession()
  const supabase = await createClient()
  await supabase
    .from("game_library")
    .delete()
    .eq("user_id", session.userId)
    .eq("game_id", gameId)
  revalidatePath("/library")
}
