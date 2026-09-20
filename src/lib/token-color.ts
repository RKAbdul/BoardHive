// The shared six-color set used for player/hive "piece" colors throughout
// the app (standings dots, avatars, team badges, hive tiles).
export const TOKEN_CLASSES = [
  "bg-token-1",
  "bg-token-2",
  "bg-token-3",
  "bg-token-4",
  "bg-token-5",
  "bg-token-6",
]

// A stable-per-identity token color — the same id always resolves to the
// same "piece color" everywhere it appears, rather than varying by render
// order or position in a list.
export function tokenClassFor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i)
    hash |= 0
  }
  return TOKEN_CLASSES[Math.abs(hash) % TOKEN_CLASSES.length]
}
