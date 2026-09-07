import { supabase } from './supabase'

export type AffiliateRow = {
  id: string
  user_id: string
  referral_code: string
  joined_at: string
}

const COLS = 'id, user_id, referral_code, joined_at'

/** The signed-in user's affiliate row, or null if they haven't joined. */
export async function fetchMyAffiliate(
  userId: string,
): Promise<AffiliateRow | null> {
  const { data, error } = await supabase
    .from('affiliates')
    .select(COLS)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return (data as AffiliateRow) ?? null
}

function makeCode(): string {
  // 8 chars, unambiguous alphabet (no 0/O/1/I).
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

/** Joins the affiliate program (idempotent — returns the existing row if the
 *  user already joined). Retries once on the unlikely referral-code collision. */
export async function joinAffiliate(userId: string): Promise<AffiliateRow> {
  const existing = await fetchMyAffiliate(userId)
  if (existing) return existing

  for (let attempt = 0; attempt < 2; attempt++) {
    const { data, error } = await supabase
      .from('affiliates')
      .insert({ user_id: userId, referral_code: makeCode() })
      .select(COLS)
      .single()
    if (!error) return data as AffiliateRow
    // 23505 = unique_violation: either another tab created the row, or the
    // referral code clashed. Re-check for our row before retrying.
    if (error.code === '23505') {
      const row = await fetchMyAffiliate(userId)
      if (row) return row
      continue
    }
    throw error
  }
  throw new Error('Could not join the affiliate program. Please try again.')
}

/** Full shareable referral URL for a code — always the trial site. */
export function referralLink(code: string): string {
  return `https://trial.partly.asia/?ref=${code}`
}

/* ---------- Referral attribution ---------- */

const REF_KEY = 'affiliate_ref'

/** Call once on app load: if the URL carries ?ref=CODE, remember it (it's
 *  consumed later, at registration) and strip it from the address bar. */
export function captureRefFromUrl(): void {
  try {
    const url = new URL(window.location.href)
    const code = url.searchParams.get('ref')
    if (!code) return
    localStorage.setItem(REF_KEY, code.trim().toUpperCase())
    url.searchParams.delete('ref')
    window.history.replaceState({}, '', url.toString())
  } catch {
    /* ignore */
  }
}

export function getStoredRef(): string | null {
  try {
    return localStorage.getItem(REF_KEY)
  } catch {
    return null
  }
}

export function clearStoredRef(): void {
  try {
    localStorage.removeItem(REF_KEY)
  } catch {
    /* ignore */
  }
}

async function resolveAffiliateByCode(
  code: string,
): Promise<{ id: string; user_id: string; joined_at: string } | null> {
  const { data } = await supabase
    .from('affiliates')
    .select('id, user_id, joined_at')
    .eq('referral_code', code)
    .maybeSingle()
  return (data as { id: string; user_id: string; joined_at: string }) ?? null
}

/** Claim a pending HR-invite referral for this email, if one exists and it
 *  wasn't sent by the new user themselves. Returns true when claimed. */
async function claimPendingReferral(
  newUserId: string,
  email: string,
  role: 'candidate' | 'employer',
): Promise<boolean> {
  const { data } = await supabase
    .from('affiliate_referrals')
    .select('id, affiliate:affiliates(user_id)')
    .is('referred_user_id', null)
    .ilike('invited_email', email)
    .maybeSingle()
  const row = data as
    | { id: string; affiliate: { user_id: string } | null }
    | null
  if (!row || row.affiliate?.user_id === newUserId) return false
  const { error } = await supabase
    .from('affiliate_referrals')
    .update({ referred_user_id: newUserId, referred_role: role })
    .eq('id', row.id)
    .is('referred_user_id', null)
  return !error
}

/**
 * Records affiliate attribution for a user who just registered:
 *  1. an HR-team invitation sent to this email by an enrolled affiliate, or
 *  2. a stored ?ref= code from an enrolled affiliate's link.
 * Self-referrals are ignored. Safe to call without a session; never throws —
 * attribution must not block registration.
 */
export async function recordReferralAtSignup(
  newUserId: string,
  role: 'candidate' | 'employer',
  email: string,
): Promise<void> {
  try {
    if (email && (await claimPendingReferral(newUserId, email, role))) {
      return
    }
    const code = getStoredRef()
    if (!code) return
    const affiliate = await resolveAffiliateByCode(code)
    const enrolledEarlier =
      !!affiliate && new Date(affiliate.joined_at).getTime() <= Date.now()
    if (affiliate && enrolledEarlier && affiliate.user_id !== newUserId) {
      await supabase.from('affiliate_referrals').insert({
        affiliate_id: affiliate.id,
        referred_user_id: newUserId,
        referred_role: role,
      })
    }
  } catch (err) {
    console.error('recordReferralAtSignup', err)
  } finally {
    clearStoredRef()
  }
}

/* ---------- Affiliate dashboard data ---------- */

export type ReferralRow = {
  id: string
  referred_user_id: string | null
  invited_email: string | null
  referred_role: string
  referred_at: string
  purchase_source: string | null
  purchase_ref: string | null
  commission_usd: number | null
  commission_status: string // 'pending' | 'earned' | 'paid'
  paid_at: string | null
}

export async function fetchMyReferrals(
  affiliateId: string,
): Promise<ReferralRow[]> {
  const { data, error } = await supabase
    .from('affiliate_referrals')
    .select(
      'id, referred_user_id, invited_email, referred_role, referred_at, purchase_source, purchase_ref, commission_usd, commission_status, paid_at',
    )
    .eq('affiliate_id', affiliateId)
    .order('referred_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ReferralRow[]
}

export type CommissionSummary = {
  /** Total commission that has been recognised (earned or already paid). */
  earned: number
  /** Total commission actually paid out to the affiliate. */
  paid: number
  /** earned − paid: what the affiliate is still owed. */
  balance: number
}

export function summariseCommission(rows: ReferralRow[]): CommissionSummary {
  let earned = 0
  let paid = 0
  for (const r of rows) {
    const amt = r.commission_usd ?? 0
    if (r.commission_status === 'earned' || r.commission_status === 'paid') {
      earned += amt
    }
    if (r.commission_status === 'paid') paid += amt
  }
  return { earned, paid, balance: earned - paid }
}
