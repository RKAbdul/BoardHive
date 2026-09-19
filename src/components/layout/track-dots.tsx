const TOKEN_CLASSES = [
  "bg-token-1",
  "bg-token-2",
  "bg-token-3",
  "bg-token-4",
  "bg-token-6",
]

/**
 * A row of player-token pips, like pieces lined up at the start of a
 * scoring track. Purely a signature-world flourish — reused sparingly
 * wherever a moment of arrival/start deserves a small nod to the direction.
 */
export function TrackDots({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className ?? ""}`} aria-hidden="true">
      {TOKEN_CLASSES.map((cls, i) => (
        <span key={i} className={`size-2 rounded-full ${cls}`} />
      ))}
    </div>
  )
}
