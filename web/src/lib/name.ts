/**
 * Initials for an avatar badge. Uses the last two name parts so that names
 * where the given name comes last read naturally:
 *   "Lim Wei Keat" -> "WK"
 *   "John Doe"     -> "JD"
 *   "Madonna"      -> "M"
 */
export function initialsFromName(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (
    parts[parts.length - 2].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase()
}
