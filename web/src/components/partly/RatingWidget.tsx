import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { StarIcon } from '@/components/icons'
import { PrimaryButton } from '@/components/partly/ui'
import { fetchMyRating, submitRating, type RatingKind } from '@/lib/partly'
import { useT } from '@/lib/i18n'

/**
 * 1-5 star picker + optional comment for rating the counterpart on an
 * unlocked release. Submits via submit_rating(), which only accepts a rating
 * once the underlying lead was actually paid for ,  this widget assumes the
 * caller only renders it in that state (see LeadUnlockPage / PostingMatchesPage).
 */
export function RatingWidget({
  releaseId,
  raterKind,
  raterLabel,
}: {
  releaseId: string
  /** Which side the current viewer is (so we know whose past rating to load). */
  raterKind: RatingKind
  /** e.g. "this business" / "this expert" ,  used in the prompt copy. */
  raterLabel: string
}) {
  const t = useT()
  const [stars, setStars] = useState(0)
  const [hoverStars, setHoverStars] = useState(0)
  const [comment, setComment] = useState('')
  const [existing, setExisting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    let alive = true
    fetchMyRating(releaseId, raterKind)
      .then((r) => {
        if (!alive || !r) return
        setStars(r.stars)
        setComment(r.comment ?? '')
        setExisting(true)
      })
      .catch((err) => console.error('rating', err))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [releaseId, raterKind])

  async function save() {
    if (stars < 1) {
      toast.error(t('ui.pick_a_star_rating_first'))
      return
    }
    setSaving(true)
    try {
      await submitRating(releaseId, stars, comment)
      toast.success(existing ? t('ui.rating_updated') : t('ui.thanks_for_rating'))
      setExisting(true)
      setEditing(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('ui.could_not_save_rating'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  if (existing && !editing) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md bg-surface-alt/60 px-3 py-2">
        <span className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <StarIcon key={i} className={`size-4 ${i <= stars ? 'text-amber-400' : 'text-line'}`} />
          ))}
          {comment && <span className="ml-2 truncate text-xs text-muted-600">"{comment}"</span>}
        </span>
        <button type="button" onClick={() => setEditing(true)} className="shrink-0 text-xs font-medium text-brand hover:underline">{t('ui.edit_rating')}</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-line p-3">
      <p className="text-xs font-medium text-ink">{t('ui.rate', { raterLabel })}</p>
      <div className="flex items-center gap-1" onMouseLeave={() => setHoverStars(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setStars(i)}
            onMouseEnter={() => setHoverStars(i)}
            aria-label={t(i === 1 ? 'rating.star' : 'rating.stars', { n: i })}
            className="p-0.5"
          >
            <StarIcon className={`size-6 transition-colors ${i <= (hoverStars || stars) ? 'text-amber-400' : 'text-line'}`} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder={t('ui.optional_comment')}
        className="w-full resize-none rounded-md border border-line bg-surface p-2 text-sm text-ink outline-none focus:border-brand placeholder:text-muted-400"
      />
      <div className="flex gap-2">
        <PrimaryButton className="h-9 px-4 text-xs" onClick={save} disabled={saving}>
          {saving ? t('ui.saving') : existing ? t('ui.update_rating') : t('ui.submit_rating')}
        </PrimaryButton>
        {existing && (
          <button type="button" onClick={() => setEditing(false)} className="text-xs text-muted hover:text-ink">{t('ui.cancel')}</button>
        )}
      </div>
    </div>
  )
}
