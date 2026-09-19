import "server-only"
import { createClient } from "@/lib/supabase/server"

export async function getGameDetail(bggId: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("games")
    .select(
      `bgg_id, name, image_url, description, min_players, max_players, min_playtime, max_playtime, year_published,
       categories:game_categories(category:categories(name)),
       mechanics:game_mechanics(mechanic:mechanics(name))`
    )
    .eq("bgg_id", bggId)
    .maybeSingle()

  if (error) throw error
  return data
}
