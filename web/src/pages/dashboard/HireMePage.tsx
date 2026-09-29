import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Field, TextInput } from '@/components/dashboard/form'
import { LinkIcon } from '@/components/icons'
import { Card, Notice, PrimaryButton, SecondaryButton } from '@/components/partly/ui'
import { updateMyCandidate } from '@/lib/candidateProfile'
import { useCandidate } from '@/lib/dashboard'
import { SITE_URL } from '@/lib/site'
import { supabase } from '@/lib/supabase'
import { useT } from '@/lib/i18n'

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

/** SVG badge the expert can embed anywhere. Links to their public profile only. */
function badgeSvg(name: string): string {
  const safe = name.replace(/[<>&"]/g, '')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="56" viewBox="0 0 240 56" role="img" aria-label="Hire ${safe} on partly.asia">
  <rect width="240" height="56" rx="10" fill="#1b2a4a"/>
  <circle cx="30" cy="28" r="14" fill="#d4a12a"/>
  <path d="M23.5 28.5l4.5 4.5 9-9" stroke="#1b2a4a" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="54" y="24" fill="#ffffff" font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="700">Hire me on partly.asia</text>
  <text x="54" y="41" fill="#d4a12a" font-family="Helvetica, Arial, sans-serif" font-size="11">Verified expert · ${safe}</text>
</svg>`
}

export function HireMePage() {
  const t = useT()
  const { candidate, session, loading, reload } = useCandidate()
  const [slug, setSlug] = useState('')
  const [saving, setSaving] = useState(false)
  const [views, setViews] = useState<{ total: number; badge: number; last30: number } | null>(null)

  useEffect(() => {
    if (!candidate?.public_slug) return
    supabase
      .from('expert_profile_views')
      .select('source, viewed_at')
      .eq('candidate_id', candidate.id)
      .then(({ data }) => {
        const rows = (data ?? []) as { source: string; viewed_at: string }[]
        const cutoff = Date.now() - 30 * 86_400_000
        setViews({
          total: rows.length,
          badge: rows.filter((r) => r.source === 'badge').length,
          last30: rows.filter((r) => new Date(r.viewed_at).getTime() > cutoff).length,
        })
      })
  }, [candidate])

  useEffect(() => {
    if (candidate) setSlug(candidate.public_slug ?? slugify(candidate.full_name))
  }, [candidate])

  const profileUrl = candidate?.public_slug ? `${SITE_URL}/expert/${candidate.public_slug}` : null
  const badgeUrl = profileUrl ? `${profileUrl}?src=badge` : null
  const shareUrl = profileUrl ? `${profileUrl}?src=share` : null
  const svg = candidate ? badgeSvg(candidate.full_name) : ''
  const svgData = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  const shareText = candidate
    ? `I'm available for fractional and project work through partly.asia. Businesses can find and apply to work with me directly here: ${shareUrl ?? ''}`
    : ''

  async function enable() {
    if (!session || !slug.trim()) return
    setSaving(true)
    try {
      await updateMyCandidate(session.user.id, { public_slug: slugify(slug) })
      toast.success(t('ui.your_public_profile_is_live'))
      await reload()
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('ui.could_not_save')
      toast.error(msg.includes('duplicate') ? t('ui.that_link_is_taken_try_another') : msg)
    } finally {
      setSaving(false)
    }
  }

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t('ui.copied', { what }))
    } catch {
      toast.error(t('ui.could_not_copy_select_and_copy_2'))
    }
  }

  return (
    <DashboardLayout>
      <div className="flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">{t('ui.hire_me_on_partly_asia_badge')}</h1>
          <p className="mt-1 text-sm text-muted">{t('ui.add_this_to_your_linkedin_profile')}</p>
        </div>

        <Card className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('ui.your_public_profile_link')}</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field label={t('ui.profile_address')}>
                <div className="flex items-center gap-0">
                  <span className="flex h-12 items-center rounded-l-md border border-r-0 border-line bg-surface-alt px-3 text-sm text-muted">{t('ui.expert_2', { v: SITE_URL.replace(/^https?:\/\//, '') })}</span>
                  <TextInput value={slug} onChange={(e) => setSlug(e.target.value)} className="rounded-l-none" />
                </div>
              </Field>
            </div>
            <PrimaryButton onClick={enable} disabled={saving || loading || !slug.trim()}>
              {saving ? t('ui.saving') : profileUrl ? t('ui.update_link') : t('ui.publish_profile')}
            </PrimaryButton>
          </div>
          <p className="text-xs text-muted">{t('ui.your_public_profile_shows_your_name')}</p>
        </Card>

        {profileUrl && candidate && (
          <>
            <Card className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('ui.badge_preview')}</h2>
              <a href={badgeUrl ?? profileUrl} target="_blank" rel="noreferrer" className="w-fit">
                <img src={svgData} alt={t('ui.hire_me_on_partly_asia')} width={240} height={56} />
              </a>
              {views && (
                <div className="grid grid-cols-3 gap-3 rounded-lg bg-surface-alt p-3 text-center">
                  {[
                    { label: t('ui.profile_views'), value: views.total },
                    { label: t('ui.from_your_badge'), value: views.badge },
                    { label: t('ui.last_30_days'), value: views.last30 },
                  ].map((v) => (
                    <div key={v.label}>
                      <p className="text-lg font-semibold text-ink">{v.value}</p>
                      <p className="text-xs text-muted">{v.label}</p>
                    </div>
                  ))}
                </div>
              )}
              <SecondaryButton className="w-fit" onClick={() => copy(profileUrl, 'Link')}>
                <LinkIcon className="size-4" />{' '}{t('ui.copy_link')}</SecondaryButton>
            </Card>

            <Card className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('ui.suggested_post')}</h2>
              <textarea
                readOnly
                value={shareText}
                rows={3}
                className="w-full resize-none rounded-md border border-line bg-surface-alt/50 p-3 text-sm text-ink"
              />
              <SecondaryButton className="w-fit" onClick={() => copy(shareText, t('hm.post_text'))}>{t('ui.copy_text')}</SecondaryButton>
            </Card>

            <Notice tone="brand">{t('ui.each_badge_link_is_unique_to')}</Notice>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
