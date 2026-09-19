import "server-only"
import { createClient } from "@/lib/supabase/server"

export async function getMyLibrary(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("game_library")
    .select("added_at, game:games(bgg_id, name, image_url)")
    .eq("user_id", userId)
    .order("added_at", { ascending: false })

  if (error) throw error
  return data
}
