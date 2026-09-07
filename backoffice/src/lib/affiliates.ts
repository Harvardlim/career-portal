import { supabase, isSupabaseConfigured } from './supabase'

export const affiliatesEnabled = isSupabaseConfigured

const client = () => {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

export type Affiliate = {
  id: string
  user_id: string
  referral_code: string
  joined_at: string
  name: string | null
  email: string | null
  referrals: number
  /** Commission recognised (earned + already paid). */
  earned: number
  /** Commission actually paid out. */
  paid: number
  /** earned − paid: still owed. */
  owed: number
}

export type AffiliateReferral = {
  id: string
  affiliate_id: string
  referred_role: string
  referred_at: string
  purchase_source: string | null
  purchase_ref: string | null
  commission_usd: number | null
  commission_status: string // 'pending' | 'earned' | 'paid'
  earned_at: string | null
  paid_at: string | null
  /** filled in by fetchReferrals for display */
  affiliate_name: string | null
  affiliate_code: string
}

export type AffiliateData = {
  affiliates: Affiliate[]
  referrals: AffiliateReferral[]
  totals: { affiliates: number; earned: number; paid: number; owed: number; pending: number }
}

export async function fetchAffiliateData(): Promise<AffiliateData> {
  const sb = client()
  const [aff, refs, cands, emps] = await Promise.all([
    sb.from('affiliates').select('id, user_id, referral_code, joined_at').order('joined_at', { ascending: false }),
    sb
      .from('affiliate_referrals')
      .select(
        'id, affiliate_id, referred_role, referred_at, purchase_source, purchase_ref, commission_usd, commission_status, earned_at, paid_at',
      )
      .order('referred_at', { ascending: false }),
    sb.from('candidates').select('user_id, full_name, email'),
    sb.from('employers').select('user_id, company_name, business_email'),
  ])
  for (const r of [aff, refs, cands, emps]) if (r.error) throw r.error

  const who = new Map<string, { name: string; email: string }>()
  for (const c of cands.data ?? [])
    who.set(c.user_id as string, { name: c.full_name as string, email: c.email as string })
  for (const e of emps.data ?? [])
    if (!who.has(e.user_id as string))
      who.set(e.user_id as string, { name: e.company_name as string, email: e.business_email as string })

  const affById = new Map((aff.data ?? []).map((a) => [a.id as string, a]))

  const agg = new Map<string, { count: number; earned: number; paid: number }>()
  for (const r of refs.data ?? []) {
    const k = r.affiliate_id as string
    const cur = agg.get(k) ?? { count: 0, earned: 0, paid: 0 }
    cur.count += 1
    const amt = Number(r.commission_usd ?? 0)
    if (r.commission_status === 'earned' || r.commission_status === 'paid') cur.earned += amt
    if (r.commission_status === 'paid') cur.paid += amt
    agg.set(k, cur)
  }

  const affiliates: Affiliate[] = (aff.data ?? []).map((a) => {
    const identity = who.get(a.user_id as string)
    const s = agg.get(a.id as string) ?? { count: 0, earned: 0, paid: 0 }
    return {
      id: a.id as string,
      user_id: a.user_id as string,
      referral_code: a.referral_code as string,
      joined_at: a.joined_at as string,
      name: identity?.name ?? null,
      email: identity?.email ?? null,
      referrals: s.count,
      earned: s.earned,
      paid: s.paid,
      owed: s.earned - s.paid,
    }
  })

  const referrals: AffiliateReferral[] = (refs.data ?? []).map((r) => {
    const a = affById.get(r.affiliate_id as string)
    const identity = a ? who.get(a.user_id as string) : undefined
    return {
      id: r.id as string,
      affiliate_id: r.affiliate_id as string,
      referred_role: r.referred_role as string,
      referred_at: r.referred_at as string,
      purchase_source: (r.purchase_source as string) ?? null,
      purchase_ref: (r.purchase_ref as string) ?? null,
      commission_usd: r.commission_usd == null ? null : Number(r.commission_usd),
      commission_status: r.commission_status as string,
      earned_at: (r.earned_at as string) ?? null,
      paid_at: (r.paid_at as string) ?? null,
      affiliate_name: identity?.name ?? null,
      affiliate_code: (a?.referral_code as string) ?? '—',
    }
  })

  const totals = affiliates.reduce(
    (t, a) => ({
      affiliates: t.affiliates + 1,
      earned: t.earned + a.earned,
      paid: t.paid + a.paid,
      owed: t.owed + a.owed,
      pending: t.pending,
    }),
    { affiliates: 0, earned: 0, paid: 0, owed: 0, pending: 0 },
  )
  totals.pending = referrals.filter((r) => r.commission_status === 'pending').length

  return { affiliates, referrals, totals }
}

export async function setCommissionPaid(id: string, paid: boolean): Promise<void> {
  const { error } = await client()
    .from('affiliate_referrals')
    .update(
      paid
        ? { commission_status: 'paid', paid_at: new Date().toISOString() }
        : { commission_status: 'earned', paid_at: null },
    )
    .eq('id', id)
  if (error) throw error
}
