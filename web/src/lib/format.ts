/**
 * Dates across partly.asia read day-first (27/9/2027), the way they're written
 * in Southeast Asia -- never the browser's locale, which gives 9/27/2027 on a
 * US-configured machine.
 */
export function formatDate(value: string | number | Date | null | undefined): string {
  if (value == null) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

/** 2/10/2026, 15:26 */
export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (value == null) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${formatDate(d)}, ${hh}:${mm}`
}
