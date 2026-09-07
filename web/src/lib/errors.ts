/** Extracts a readable message from anything a try/catch might throw,
 *  including Supabase's PostgrestError/StorageError, which don't extend Error. */
export function errMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err && 'message' in err) {
    return String((err as { message: unknown }).message)
  }
  return 'Something went wrong. Please try again.'
}
