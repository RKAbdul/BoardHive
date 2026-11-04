// Who may edit or delete a logged play: the member who logged it, or the
// hive's owner (its admin). Kept as a plain function so the play detail page
// (to decide whether to show the controls) and the server actions (to
// actually enforce it) can't drift apart. The database enforces the same
// rule through RLS (see can_manage_play) — this is the app-level mirror.
export function canManagePlay(
  play: { logged_by: string },
  userId: string | null | undefined,
  role: string | null | undefined
) {
  if (!userId) return false
  return play.logged_by === userId || role === "owner"
}
