import type { MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { BookmarkIcon } from '@/components/icons'
import { useSavedJobs } from '@/lib/useSavedJobs'
import { useT } from '@/lib/i18n'

export function SaveJobButton({
  jobId,
  size = 'md',
  className = '',
}: {
  jobId: string
  size?: 'sm' | 'md'
  className?: string
}) {
  const t = useT()
  const { isSaved, toggle, canSave } = useSavedJobs()
  const navigate = useNavigate()
  const saved = isSaved(jobId)

  const pad = size === 'sm' ? 'p-2' : 'p-3'
  const icon = size === 'sm' ? 'size-5' : 'size-6'

  async function handleClick(e: MouseEvent) {
    // JobCard wraps its content in a <Link>; don't navigate on bookmark click.
    e.preventDefault()
    e.stopPropagation()
    if (!canSave) {
      toast.error(t('ui.sign_in_as_a_candidate_to'))
      navigate('/sign-in')
      return
    }
    const result = await toggle(jobId)
    if (result === 'saved') toast.success(t('ui.saved_to_favourites'))
    else if (result === 'removed') toast(t('ui.removed_from_favourites'))
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? t('ui.remove_bookmark') : t('ui.bookmark_this_job')}
      aria-pressed={saved}
      className={`grid shrink-0 place-items-center rounded-[5px] transition-colors ${pad} ${
        saved
          ? 'bg-brand text-white'
          : 'bg-brand-50 text-brand hover:bg-brand-100'
      } ${className}`}
    >
      <BookmarkIcon className={`${icon} ${saved ? 'fill-current' : ''}`} />
    </button>
  )
}
