import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useSession } from './useSession'

export type Role = 'candidate' | 'employer'

export type DisplayUser = {
  email: string
  name: string
  role: Role | null
  /** The candidates.id / employers.id row tied to this account, when one exists. */
  profileId: string | null
  /** Candidate photo / employer logo URL, when set. */
  avatarUrl: string | null
  dashboardPath: string
  /** This account has BOTH a candidate and an employer profile. */
  hasBothRoles: boolean
}

/** Which role a dual-role account is currently acting as (chosen at sign-in). */
const ACTIVE_ROLE_KEY = 'active-role'

export function getActiveRole(): Role | null {
  try {
    const v = localStorage.getItem(ACTIVE_ROLE_KEY)
    return v === 'candidate' || v === 'employer' ? v : null
  } catch {
    return null
  }
}

export function setActiveRole(role: Role | null) {
  try {
    if (role) localStorage.setItem(ACTIVE_ROLE_KEY, role)
    else localStorage.removeItem(ACTIVE_ROLE_KEY)
  } catch {
    /* storage unavailable */
  }
}

/**
 * A suspended account is banned at the Supabase Auth level (see
 * admin-suspend-account), which blocks sign-in outright -- but a session
 * issued just before the ban can stay valid for up to an hour. This is the
 * client-side backstop: every time the account is resolved (sign-in, page
 * load, tab focus) a suspended row signs the session out immediately instead
 * of letting a stale token through.
 */
const SUSPENDED_REASON_KEY = 'account-suspended-reason'

export class SuspendedAccountError extends Error {
  reason: string | null
  constructor(reason: string | null) {
    super(reason ?? 'Your account has been suspended.')
    this.name = 'SuspendedAccountError'
    this.reason = reason
  }
}

export function getSuspendedReason(): string | null {
  try {
    return sessionStorage.getItem(SUSPENDED_REASON_KEY)
  } catch {
    return null
  }
}

export function clearSuspendedReason() {
  try {
    sessionStorage.removeItem(SUSPENDED_REASON_KEY)
  } catch {
    /* storage unavailable */
  }
}

function setSuspendedReason(reason: string | null) {
  try {
    sessionStorage.setItem(SUSPENDED_REASON_KEY, reason ?? 'Your account has been suspended.')
  } catch {
    /* storage unavailable */
  }
}

/**
 * Process-wide cache of the resolved profile, keyed by auth user id. The header
 * mounts on every navigation; without this it would re-query candidates +
 * employers each time. Cleared on sign-out / user change.
 */
let cache: { userId: string; value: DisplayUser } | null = null

async function resolveDisplayUser(
  userId: string,
  email: string,
): Promise<DisplayUser> {
  const [{ data: candidate }, { data: employer }] = await Promise.all([
    supabase
      .from('candidates')
      .select('id, full_name, avatar_path, suspended, suspended_reason')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('employers')
      .select('id, company_name, logo_url, suspended, suspended_reason')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  // The Auth ban already blocks new sign-ins; this catches a session that was
  // still valid at the moment the ban took effect.
  if (candidate?.suspended || employer?.suspended) {
    const reason = candidate?.suspended_reason ?? employer?.suspended_reason ?? null
    setSuspendedReason(reason)
    await supabase.auth.signOut()
    throw new SuspendedAccountError(reason)
  }

  const hasBothRoles = !!candidate && !!employer
  const preferEmployer = getActiveRole() === 'employer'

  if (employer && (preferEmployer || !candidate)) {
    return {
      email,
      name: employer.company_name || email,
      role: 'employer',
      profileId: employer.id,
      avatarUrl: employer.logo_url ?? null,
      dashboardPath: '/employer/dashboard',
      hasBothRoles,
    }
  }

  if (candidate) {
    return {
      email,
      name: candidate.full_name || email,
      role: 'candidate',
      profileId: candidate.id,
      avatarUrl: candidate.avatar_path ?? null,
      dashboardPath: '/dashboard',
      hasBothRoles,
    }
  }

  return {
    email,
    name: email,
    role: null,
    profileId: null,
    avatarUrl: null,
    dashboardPath: '/dashboard',
    hasBothRoles: false,
  }
}

/**
 * The signed-in user's display name + where their dashboard lives, resolved
 * from whichever profile row (candidate or employer) is tied to the account.
 * Returns null when signed out (including when this call just found the
 * account suspended and signed it out itself).
 */
export function useDisplayUser(): { user: DisplayUser | null; loading: boolean } {
  const { session, loading: sessionLoading } = useSession()
  const cachedForSession =
    session && cache?.userId === session.user.id ? cache.value : null
  const [user, setUser] = useState<DisplayUser | null>(cachedForSession)
  const [loading, setLoading] = useState(!cachedForSession)

  useEffect(() => {
    if (sessionLoading) return
    if (!session) {
      cache = null
      setUser(null)
      setLoading(false)
      return
    }

    const userId = session.user.id
    if (cache?.userId === userId) {
      setUser(cache.value)
      setLoading(false)
      return
    }

    let alive = true
    setLoading(true)
    resolveDisplayUser(userId, session.user.email ?? '')
      .then((value) => {
        cache = { userId, value }
        if (!alive) return
        setUser(value)
        setLoading(false)
      })
      .catch(() => {
        cache = null
        if (!alive) return
        setUser(null)
        setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [session, sessionLoading])

  return { user, loading }
}

/** Call after a change that affects the header (e.g. the user edits their name). */
export function clearDisplayUserCache() {
  cache = null
}
