import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Field, TextInput } from '@/components/dashboard/form'
import { LinkIcon, LinkedinIcon } from '@/components/icons'
import { Card, Notice, PrimaryButton, SecondaryButton } from '@/components/partly/ui'
import { updateMyCandidate } from '@/lib/candidateProfile'
import { useCandidate } from '@/lib/dashboard'
import { SITE_URL } from '@/lib/site'

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
  const { candidate, session, loading, reload } = useCandidate()
  const [slug, setSlug] = useState('')
  const [saving, setSaving] = useState(false)
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    if (candidate) setSlug(candidate.public_slug ?? slugify(candidate.full_name))
  }, [candidate])

  const profileUrl = candidate?.public_slug ? `${SITE_URL}/expert/${candidate.public_slug}` : null
  const svg = candidate ? badgeSvg(candidate.full_name) : ''
  const svgData = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  const embed = profileUrl
    ? `<a href="${profileUrl}" target="_blank" rel="noopener"><img src="${svgData}" alt="Hire me on partly.asia" width="240" height="56"></a>`
    : ''
  const shareText = candidate
    ? `I'm available for fractional and project work through partly.asia. Businesses can find and apply to work with me directly here: ${profileUrl ?? ''}`
    : ''

  async function enable() {
    if (!session || !slug.trim()) return
    setSaving(true)
    try {
      await updateMyCandidate(session.user.id, { public_slug: slugify(slug) })
      toast.success('Your public profile is live.')
      await reload()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save'
      toast.error(msg.includes('duplicate') ? 'That link is taken — try another.' : msg)
    } finally {
      setSaving(false)
    }
  }

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${what} copied.`)
    } catch {
      toast.error('Could not copy — select and copy it manually.')
    }
  }

  function shareLinkedIn() {
    if (!profileUrl) return
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`,
      '_blank',
      'noopener,width=600,height=600',
    )
  }

  return (
    <DashboardLayout>
      <div className="flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">"Hire me on partly.asia" badge</h1>
          <p className="mt-1 text-sm text-muted">
            Add this to your LinkedIn profile so businesses can find and apply to work with you directly.
          </p>
        </div>

        <Card className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Your public profile link</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field label="Profile address">
                <div className="flex items-center gap-0">
                  <span className="flex h-12 items-center rounded-l-md border border-r-0 border-line bg-surface-alt px-3 text-sm text-muted">
                    {SITE_URL.replace(/^https?:\/\//, '')}/expert/
                  </span>
                  <TextInput value={slug} onChange={(e) => setSlug(e.target.value)} className="rounded-l-none" />
                </div>
              </Field>
            </div>
            <PrimaryButton onClick={enable} disabled={saving || loading || !slug.trim()}>
              {saving ? 'Saving…' : profileUrl ? 'Update link' : 'Publish profile'}
            </PrimaryButton>
          </div>
          <p className="text-xs text-muted">
            Your public profile shows your name, headline, experience and verification marks — never your email or
            phone. Those are only exchanged after a business releases contact and you unlock it.
          </p>
        </Card>

        {profileUrl && candidate && (
          <>
            <Card className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Badge preview</h2>
              <a href={profileUrl} target="_blank" rel="noreferrer" className="w-fit">
                <img src={svgData} alt="Hire me on partly.asia" width={240} height={56} />
              </a>
              <div className="grid gap-3 sm:grid-cols-3">
                <SecondaryButton onClick={() => copy(profileUrl, 'Link')}>
                  <LinkIcon className="size-4" /> Copy link
                </SecondaryButton>
                <SecondaryButton onClick={() => copy(embed, 'Embed code')}>Copy embed code</SecondaryButton>
                <SecondaryButton onClick={shareLinkedIn} disabled={!agreed}>
                  <LinkedinIcon className="size-4" /> Add to LinkedIn
                </SecondaryButton>
              </div>
              <label className="flex items-start gap-2 text-xs text-muted">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
                I understand partly.asia never posts on my behalf — sharing opens LinkedIn in a new window where I
                post it myself. Only my public profile link is shared.
              </label>
            </Card>

            <Card className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Suggested post</h2>
              <textarea
                readOnly
                value={shareText}
                rows={3}
                className="w-full resize-none rounded-md border border-line bg-surface-alt/50 p-3 text-sm text-ink"
              />
              <SecondaryButton className="w-fit" onClick={() => copy(shareText, 'Post text')}>
                Copy text
              </SecondaryButton>
            </Card>

            <Notice tone="brand">
              Each badge link is unique to you, so we can show you how many profile views and applications come from
              it. It links to your public profile — never to a payment or contact screen.
            </Notice>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
