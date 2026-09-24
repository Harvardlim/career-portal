import { supabase } from './supabase'
import { SITE_URL } from './site'

export type ResolvedAccount = {
  userId: string
  /** true = brand-new signup, email confirmation still pending (no session yet).
   *  false = the email already had an account and we're now signed into it. */
  needsConfirm: boolean
}

export type EmailLookup = {
  /** Existing profile role for this email, if any. One email is one account, so any hit blocks registration. */
  role: 'candidate' | 'employer' | null
}

/** Check whether an email already belongs to an account (and as which role). */
export async function lookupEmail(email: string): Promise<EmailLookup> {
  const e = email.trim()
  const [candRes, empRes] = await Promise.all([
    supabase.from('candidates').select('id').ilike('email', e).limit(1),
    supabase.from('employers').select('id').ilike('business_email', e).limit(1),
  ])
  return {
    role: (candRes.data ?? []).length > 0 ? 'candidate' : (empRes.data ?? []).length > 0 ? 'employer' : null,
  }
}

/**
 * Work out which auth user a new candidate/employer profile should attach to.
 * One email is one account: callers check lookupEmail() first, and the database
 * refuses a second profile for the same auth user regardless.
 *
 * - Already signed in as this same email (and no profile yet) → use that account.
 * - New email → sign up. With email confirmation on there's no session yet.
 * - Email already has a login but no profile (an earlier sign-up that never
 *   finished) + the same password → sign in and finish it.
 * - Anything else → throws.
 */
export async function resolveAccountForRegister(
  email: string,
  password: string,
): Promise<ResolvedAccount> {
  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData.session
  if (
    session?.user.email &&
    session.user.email.toLowerCase() === email.trim().toLowerCase()
  ) {
    return { userId: session.user.id, needsConfirm: false }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${SITE_URL}/sign-in?confirmed=1` },
  })

  if (error) {
    if (!/already registered|already exists|already been registered/i.test(error.message)) {
      throw error
    }
  } else if (data.user && (data.user.identities?.length ?? 0) > 0) {
    // Genuine new signup.
    return { userId: data.user.id, needsConfirm: !data.session }
  }

  // The login exists but has no profile yet — sign in to finish the registration.
  const { data: signIn, error: signInError } =
    await supabase.auth.signInWithPassword({ email, password })
  if (signInError || !signIn.user) {
    throw new Error(
      'This email is already registered. Sign in instead — one email can only hold one account.',
    )
  }
  return { userId: signIn.user.id, needsConfirm: false }
}
