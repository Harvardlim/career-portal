import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { StarIcon } from '@/components/icons'
import { PrimaryButton } from '@/components/partly/ui'
import { fetchMyRating, submitRating, type RatingKind } from '@/lib/partly'

/**
 * 1-5 star picker + optional comment for rating the counterpart on an
 * unlocked release. Submits via submit_rating(), which only accepts a rating
 * once the underlying lead was actually paid for — this widget assumes the
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
  /** e.g. "this business" / "this expert" — used in the prompt copy. */
  raterLabel: string
}) {
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
      toast.error('Pick a star rating first.')
      return
    }
    setSaving(true)
    try {
      await submitRating(releaseId, stars, comment)
      toast.success(existing ? 'Rating updated.' : 'Thanks for rating.')
      setExisting(true)
      setEditing(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save rating')
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
        <button type="button" onClick={() => setEditing(true)} className="shrink-0 text-xs font-medium text-brand hover:underline">
          Edit rating
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-line p-3">
      <p className="text-xs font-medium text-ink">Rate {raterLabel}</p>
      <div className="flex items-center gap-1" onMouseLeave={() => setHoverStars(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setStars(i)}
            onMouseEnter={() => setHoverStars(i)}
            aria-label={`${i} star${i === 1 ? '' : 's'}`}
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
        placeholder="Optional comment"
        className="w-full resize-none rounded-md border border-line bg-surface p-2 text-sm text-ink outline-none focus:border-brand placeholder:text-muted-400"
      />
      <div className="flex gap-2">
        <PrimaryButton className="h-9 px-4 text-xs" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : existing ? 'Update rating' : 'Submit rating'}
        </PrimaryButton>
        {existing && (
          <button type="button" onClick={() => setEditing(false)} className="text-xs text-muted hover:text-ink">
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
