import * as z from "zod"

export const PLAY_MODES = ["generic", "racing", "asymmetric"] as const
export type PlayMode = (typeof PLAY_MODES)[number]

export const participantSchema = z
  .object({
    userId: z.string().nullable(),
    guestName: z.string().trim().nullable(),
    isWinner: z.boolean(),
    score: z.number().nullable(),
    placement: z.number().int().nullable(),
    // Exactly one of these (or neither, outside asymmetric mode) — an
    // existing faction picked from this game's list, or a new name to
    // create. Resolved to a faction_id server-side before insert.
    factionId: z.string().nullable(),
    newFactionName: z.string().trim().nullable(),
  })
  .refine((p) => (p.userId === null) !== (p.guestName === null), {
    error: "Each participant is either a member or a guest, not both.",
  })

export const createPlaySchema = z.object({
  gameId: z.number().int(),
  mode: z.enum(PLAY_MODES),
  playedAt: z.string(),
  notes: z.string().trim().nullable(),
  participants: z.array(participantSchema).min(1),
})

export type CreatePlayInput = z.infer<typeof createPlaySchema>

export type ActionState = {
  error?: string
  // Present on success instead of redirecting server-side, so the client
  // can upload staged photos directly to storage (bypassing the platform's
  // request-body limit on server actions) before navigating itself.
  playId?: string
  groupId?: string
} | null

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024
export const MAX_PHOTOS_PER_PLAY = 6

export type PhotoErrorCode = "invalidType" | "tooLarge" | "generic"
