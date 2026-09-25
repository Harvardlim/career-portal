import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Avatar, Card, EmptyState, Pill, PrimaryButton, StarRating, VerifiedChips } from '@/components/partly/ui'
import { ReportButton } from '@/components/partly/ReportButton'
import { countryName, fetchRatingsFor, type RatingWithAuthor } from '@/lib/partly'
import { supabase } from '@/lib/supabase'
import { useSeo } from '@/lib/seo'

type PublicProfile = {
  candidate_id: string
  public_slug: string
  full_name: string
  headline: string | null
  title: string | null
  avatar_path: string | null
  biography: string | null
  years_experience: string | null
  expertise_field: string[] | null
  country_code: string | null
  portfolio_links: { label: string; url: string }[]
  identity_verified: boolean
  badge_verified: boolean
  rating_count: number
  avg_stars: number | null
  business_name: string | null
}

/** The page a "Hire me on partly.asia" badge links to. Contact-free by design. */
export function ExpertProfilePage() {
  const { slug = '' } = useParams()
  const [params] = useSearchParams()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [reviews, setReviews] = useState<RatingWithAuthor[]>([])
  const [loading, setLoading] = useState(true)

  useSeo({
    title: profile ? `${profile.full_name} — ${profile.headline ?? profile.title ?? 'Expert on partly.asia'}` : 'Expert profile',
    description: profile
      ? `${profile.full_name}${profile.business_name ? ` (${profile.business_name})` : ''} — ${(profile.expertise_field ?? []).join(', ') || 'verified expert'} based in ${countryName(profile.country_code)}. Hire through partly.asia.`
      : undefined,
    type: 'profile',
    image: profile?.avatar_path ?? undefined,
  })

  useEffect(() => {
    let alive = true
    supabase
      .from('expert_public_profiles')
      .select('*')
      .eq('public_slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        const p = (data as PublicProfile | null) ?? null
        if (!alive) return
        setProfile(p)
        // Badge traffic is measured per expert; the badge link carries ?src=badge.
        if (p) {
          void supabase.from('expert_profile_views').insert({
            candidate_id: p.candidate_id,
            source: params.get('src') === 'badge' ? 'badge' : params.get('src') === 'share' ? 'share' : 'direct',
            referrer: document.referrer ? document.referrer.slice(0, 500) : null,
          })
          fetchRatingsFor('candidate', p.candidate_id)
            .then((r) => alive && setReviews(r))
            .catch((err) => console.error('ratings', err))
        }
      })
      .then(() => alive && setLoading(false))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  if (loading) return <div className="px-6 py-16 text-center text-sm text-muted">Loading…</div>
  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <EmptyState>This expert profile isn't public.</EmptyState>
      </div>
    )
  }

  const links = Array.isArray(profile.portfolio_links) ? profile.portfolio_links : []

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <Card className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <Avatar name={profile.full_name} src={profile.avatar_path} size={72} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold text-ink">{profile.full_name}</h1>
            <p className="text-ink-600">{profile.headline ?? profile.title ?? 'Expert on partly.asia'}</p>
            {profile.business_name && <p className="text-sm text-ink-600">{profile.business_name}</p>}
            <p className="mt-1 text-sm text-muted">
              {countryName(profile.country_code)}
              {profile.years_experience ? ` · ${profile.years_experience} experience` : ''}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <VerifiedChips identity={profile.identity_verified} badge={profile.badge_verified} />
              <StarRating value={profile.avg_stars} count={profile.rating_count} />
            </div>
          </div>
        </div>

        {profile.expertise_field && profile.expertise_field.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.expertise_field.map((f) => (
              <Pill key={f}>{f}</Pill>
            ))}
          </div>
        )}

        {profile.biography && <p className="whitespace-pre-line text-sm text-ink-600">{profile.biography}</p>}

        {links.length > 0 && (
          <ul className="flex flex-wrap gap-3 text-sm">
            {links.map((l) => (
              <li key={l.url}>
                <a href={l.url} target="_blank" rel="noreferrer" className="text-brand underline">
                  {l.label || l.url}
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-lg bg-brand-50 p-4">
          <p className="font-medium text-brand-800">Want to work with {profile.full_name.split(' ')[0]}?</p>
          <p className="mt-1 text-sm text-ink-600">
            Post your need free on partly.asia. If {profile.full_name.split(' ')[0]} applies and you release contact,
            you'll be connected directly — no recruiter fees.
          </p>
          <Link to="/employer/post-need" className="mt-3 inline-block">
            <PrimaryButton>Post your project — it's free</PrimaryButton>
          </Link>
        </div>

        {reviews.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-line pt-5">
            <p className="text-sm font-semibold text-ink">Reviews from businesses</p>
            {reviews.map((r) => (
              <div key={r.id} className="flex flex-col gap-1 rounded-md bg-surface-alt/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink">{r.rater_name ?? 'A business'}</span>
                  <StarRating value={r.stars} showEmpty={false} />
                </div>
                {r.comment && <p className="text-sm text-ink-600">{r.comment}</p>}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted">{new Date(r.created_at).toLocaleDateString()}</p>
                  <ReportButton targetKind="rating" targetId={r.id} label="Report" />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <ReportButton targetKind="candidate" targetId={profile.candidate_id} label="Report this profile" />
        </div>
      </Card>
    </div>
  )
}
