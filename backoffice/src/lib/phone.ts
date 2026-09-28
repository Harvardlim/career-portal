/** Phones are stored as digits with the country code ("60123456789"); show them with a "+". */
export function formatStoredPhone(stored: string | null | undefined): string {
  const v = (stored ?? '').trim()
  return /^\d{8,15}$/.test(v) ? `+${v}` : v
}
