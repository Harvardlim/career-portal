import { supabase } from './supabase'
import { SITE_URL } from './site'

export type ResolvedAccount = {
  userId: string
  /** true = brand-new signup, email confirmation still pending (no session yet).
   *  false = the email already had an account and we're now signed into it. */
  needsConfirm: boolean
}

/**
 * Work out which auth user a new candidate/employer profile should attach to.
 *
 * - New email → sign up. With email confirmation on there's no session yet.
 * - Email already registered + the same password → sign in, so a second profile
 *   (e.g. an employer profile on an account that already has a candidate one)
 *   can be added to the SAME auth user.
 * - Email already registered + a different password → throws.
 *
 * This avoids the `employers_user_id_fkey` / `candidates_user_id_fkey` violation
 * that happened when a duplicate signUp returned an obfuscated user whose id
 * isn't a real auth.users row.
 */
export async function resolveAccountForRegister(
  email: string,
  password: string,
): Promise<ResolvedAccount> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${SITE_URL}/?confirmed=1` },
  })

  if (error) {
    if (!/already registered|already exists|already been registered/i.test(error.message)) {
      throw error
    }
  } else if (data.user && (data.user.identities?.length ?? 0) > 0) {
    // Genuine new signup.
    return { userId: data.user.id, needsConfirm: !data.session }
  }

  // Email already has an account — sign in to attach the new profile to it.
  const { data: signIn, error: signInError } =
    await supabase.auth.signInWithPassword({ email, password })
  if (signInError || !signIn.user) {
    throw new Error(
      'This email is already registered. Enter its existing password to add this profile to your account, or sign in.',
    )
  }
  return { userId: signIn.user.id, needsConfirm: false }
}
