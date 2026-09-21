import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Avatar, Card, EmptyState, Pill, PrimaryButton, VerifiedChips } from '@/components/partly/ui'
import { ReportButton } from '@/components/partly/ReportButton'
import { countryName } from '@/lib/partly'
import { supabase } from '@/lib/supabase'

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
}

/** The page a "Hire me on partly.asia" badge links to. Contact-free by design. */
export function ExpertProfilePage() {
  const { slug = '' } = useParams()
  const [params] = useSearchParams()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)

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
            <p className="mt-1 text-sm text-muted">
              {countryName(profile.country_code)}
              {profile.years_experience ? ` · ${profile.years_experience} experience` : ''}
            </p>
            <div className="mt-2">
              <VerifiedChips identity={profile.identity_verified} badge={profile.badge_verified} />
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

        <div className="flex justify-end">
          <ReportButton targetKind="candidate" targetId={profile.candidate_id} label="Report this profile" />
        </div>
      </Card>
    </div>
  )
}
