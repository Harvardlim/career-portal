import { supabase } from './supabase'
import { SITE_URL } from './site'

export type ResolvedAccount = {
  userId: string
  /** true = brand-new signup, email confirmation still pending (no session yet).
   *  false = the email already had an account and we're now signed into it. */
  needsConfirm: boolean
}

export type EmailLookup = {
  /** Existing profile role for this email, if any. */
  role: 'candidate' | 'employer' | null
  /** The current session already belongs to this same email. */
  signedInSameUser: boolean
}

/** Check whether an email is already registered (and as which role), and
 *  whether the person is already signed in with that same email. */
export async function lookupEmail(email: string): Promise<EmailLookup> {
  const e = email.trim()
  const [sessionRes, candRes, empRes] = await Promise.all([
    supabase.auth.getSession(),
    supabase.from('candidates').select('id').ilike('email', e).maybeSingle(),
    supabase.from('employers').select('id').ilike('business_email', e).maybeSingle(),
  ])
  const sessionEmail = sessionRes.data.session?.user.email?.toLowerCase()
  return {
    role: candRes.data ? 'candidate' : empRes.data ? 'employer' : null,
    signedInSameUser: !!sessionEmail && sessionEmail === e.toLowerCase(),
  }
}

/**
 * Work out which auth user a new candidate/employer profile should attach to.
 *
 * - Already signed in as this same email → use that account (no new password).
 * - New email → sign up. With email confirmation on there's no session yet.
 * - Email already registered + the same password → sign in, so a second profile
 *   can be added to the SAME auth user.
 * - Email already registered + a different password → throws.
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
      'This email is already registered. Sign in to that account first, then add this profile.',
    )
  }
  return { userId: signIn.user.id, needsConfirm: false }
}
